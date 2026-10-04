import { spawnSync } from 'node:child_process';
import { access, readFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

export interface RouteJavaScriptBudget {
  path: string;
  assistant: boolean;
}

export interface JavaScriptBudgetResult extends RouteJavaScriptBudget {
  gzipBytes: number;
  budgetBytes: number;
  passed: boolean;
  scripts: string[];
}

export interface JavaScriptBudgetReport {
  routes: JavaScriptBudgetResult[];
}

/** Returns the rendered HTML for a route that has no prerendered file. */
export type RenderRoute = (route: string) => Promise<string>;

export const NORMAL_ROUTE_JAVASCRIPT_BUDGET_BYTES = 120 * 1024;
export const ASSISTANT_ROUTE_JAVASCRIPT_BUDGET_BYTES = 180 * 1024;

const BASE_ORIGIN = 'https://portfolio.test';

function routeHtmlPath(clientDir: string, route: string) {
  if (!route.startsWith('/') || route.includes('..')) {
    throw new Error(`Invalid public route for JavaScript budget: ${route}`);
  }
  const segments = route.split('/').filter(Boolean);
  return join(clientDir, ...segments, 'index.html');
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prerendered routes have an `index.html` in the client output. Server-rendered
 * routes (such as `/`, which reads the role from the query string) do not, so
 * they are rendered by the supplied `renderRoute`.
 */
async function loadRouteHtml(
  clientDir: string,
  route: string,
  renderRoute?: RenderRoute,
) {
  const file = routeHtmlPath(clientDir, route);
  if (await exists(file)) return readFile(file, 'utf8');
  if (!renderRoute) {
    throw new Error(
      `${route} has no prerendered HTML in ${clientDir} and no server renderer was provided to measure it.`,
    );
  }
  return renderRoute(route);
}

function isExecutableScript(attributes: string) {
  const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  return (
    !type ||
    ['module', 'text/javascript', 'application/javascript'].includes(type)
  );
}

function publicPathFor(source: string, route: string) {
  const parsed = new URL(source, BASE_ORIGIN);
  if (parsed.origin !== BASE_ORIGIN) {
    throw new Error(
      `Cannot verify remote JavaScript budget for ${route}: ${parsed.origin}`,
    );
  }
  return decodeURIComponent(parsed.pathname);
}

// Static imports that load with a module: `import x from './a.js'`,
// `import './a.js'`, and `export * from './a.js'`. Dynamic `import()` is lazy
// and deliberately not followed.
const STATIC_IMPORT =
  /(?:^|[;\n}])\s*(?:import|export)\s*(?:[^'"()]*?\bfrom\s*)?["'](\.{1,2}\/[^"']+)["']/g;

async function measureRouteJavaScript(
  clientDir: string,
  route: string,
  html: string,
) {
  const counted = new Set<string>();
  const scripts: string[] = [];
  let gzipBytes = 0;
  let inlineIndex = 0;

  async function countFile(publicPath: string) {
    if (counted.has(publicPath)) return;
    counted.add(publicPath);
    const data = await readFile(
      resolve(clientDir, ...publicPath.split('/').filter(Boolean)),
    );
    gzipBytes += gzipSync(data).byteLength;
    scripts.push(publicPath);

    if (!publicPath.endsWith('.js')) return;
    const code = data.toString('utf8');
    for (const match of code.matchAll(STATIC_IMPORT)) {
      const imported = join(dirname(publicPath), match[1]).replaceAll(
        '\\',
        '/',
      );
      if (imported.endsWith('.js')) await countFile(imported);
    }
  }

  for (const match of html.matchAll(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  )) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    if (!isExecutableScript(attributes)) continue;

    const source = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (source) {
      await countFile(publicPathFor(source, route));
      continue;
    }

    if (body.trim()) {
      inlineIndex += 1;
      gzipBytes += gzipSync(body).byteLength;
      scripts.push(`<inline:${inlineIndex}>`);
    }
  }

  // Framework islands (`client:load` and friends) are not <script src> tags:
  // the island element names the component and renderer chunks it will import.
  for (const match of html.matchAll(/<astro-island\b([^>]*)>/gi)) {
    for (const attribute of [
      'component-url',
      'renderer-url',
      'before-hydration-url',
    ]) {
      const url = match[1]?.match(new RegExp(`\\b${attribute}="([^"]+)"`))?.[1];
      if (url) await countFile(publicPathFor(url, route));
    }
  }

  return { gzipBytes, scripts };
}

export async function auditJavaScriptBudgets(options: {
  clientDir: string;
  routes: readonly RouteJavaScriptBudget[];
  renderRoute?: RenderRoute;
}): Promise<JavaScriptBudgetReport> {
  const routes: JavaScriptBudgetResult[] = [];

  for (const route of options.routes) {
    const html = await loadRouteHtml(
      options.clientDir,
      route.path,
      options.renderRoute,
    );
    const measurement = await measureRouteJavaScript(
      options.clientDir,
      route.path,
      html,
    );
    const budgetBytes = route.assistant
      ? ASSISTANT_ROUTE_JAVASCRIPT_BUDGET_BYTES
      : NORMAL_ROUTE_JAVASCRIPT_BUDGET_BYTES;
    routes.push({
      ...route,
      ...measurement,
      budgetBytes,
      passed: measurement.gzipBytes <= budgetBytes,
    });
  }

  const failures = routes.filter((route) => !route.passed);
  if (failures.length > 0) {
    throw new Error(
      failures
        .map(
          (route) =>
            `${route.path} ${route.budgetBytes / 1024} KB JavaScript gzip budget exceeded (${Math.ceil(route.gzipBytes / 1024)} KB).`,
        )
        .join('\n'),
    );
  }

  return { routes };
}

function freePort() {
  return new Promise<number>((resolvePort, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      server.close(() => resolvePort(port));
    });
  });
}

async function waitForServer(baseUrl: string) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch {
      // Not listening yet.
    }
    await new Promise((done) => setTimeout(done, 500));
  }
  throw new Error(`The preview server did not respond at ${baseUrl}.`);
}

/**
 * Serves the built worker with `astro preview` so server-rendered routes can
 * be fetched and measured exactly as a visitor receives them.
 */
export async function withPreviewServer<T>(
  work: (renderRoute: RenderRoute) => Promise<T>,
): Promise<T> {
  const astro = resolve('node_modules/astro/bin/astro.mjs');
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const started = spawnSync(
    process.execPath,
    [astro, 'preview', '--host', '127.0.0.1', '--port', String(port)],
    { encoding: 'utf8' },
  );
  if (started.status !== 0) {
    throw new Error(
      `Could not start astro preview to measure server-rendered routes (run npm run build first):\n${started.stdout}${started.stderr}`,
    );
  }

  try {
    await waitForServer(baseUrl);
    return await work(async (route) => {
      const response = await fetch(new URL(route, baseUrl));
      if (!response.ok) {
        throw new Error(
          `${route} returned ${response.status} from the preview server.`,
        );
      }
      return response.text();
    });
  } finally {
    spawnSync(process.execPath, [astro, 'preview', 'stop'], {
      encoding: 'utf8',
    });
  }
}

const contentRoutes: readonly RouteJavaScriptBudget[] = [
  '/',
  '/software',
  '/android',
  '/teaching',
  '/work',
  '/work/asc-pie',
  '/work/northstar-rag',
  '/work/minds-eye',
  '/work/dive',
  '/work/dostava',
  '/research/asc-pie',
  '/experience',
  '/about',
  '/privacy',
].map((path) => ({
  path,
  assistant: ['/', '/software', '/android', '/teaching'].includes(path),
}));

async function auditBuiltSite(clientDir: string) {
  const needsServer: string[] = [];
  for (const route of contentRoutes) {
    if (!(await exists(routeHtmlPath(clientDir, route.path)))) {
      needsServer.push(route.path);
    }
  }

  if (needsServer.length === 0) {
    return auditJavaScriptBudgets({ clientDir, routes: contentRoutes });
  }

  process.stdout.write(
    `Measuring server-rendered routes through astro preview: ${needsServer.join(', ')}\n`,
  );
  return withPreviewServer((renderRoute) =>
    auditJavaScriptBudgets({ clientDir, routes: contentRoutes, renderRoute }),
  );
}

const invokedScript = process.argv[1];
if (invokedScript && import.meta.url === pathToFileURL(invokedScript).href) {
  auditBuiltSite(resolve('dist/client'))
    .then((report) => {
      for (const route of report.routes) {
        process.stdout.write(
          `${route.path.padEnd(22)} ${String(Math.ceil(route.gzipBytes / 1024)).padStart(4)} KB / ${route.budgetBytes / 1024} KB\n`,
        );
      }
      const maximum = Math.max(
        ...report.routes.map((route) => route.gzipBytes),
      );
      process.stdout.write(
        `Verified ${report.routes.length} content routes: maximum JavaScript ${Math.ceil(maximum / 1024)} KB gzip; the four role routes use the 180 KB assistant budget and all other routes use the 120 KB budget.\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
