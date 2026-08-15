import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
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

export const NORMAL_ROUTE_JAVASCRIPT_BUDGET_BYTES = 120 * 1024;
export const ASSISTANT_ROUTE_JAVASCRIPT_BUDGET_BYTES = 180 * 1024;

function routeHtmlPath(clientDir: string, route: string) {
  if (!route.startsWith('/') || route.includes('..')) {
    throw new Error(`Invalid public route for JavaScript budget: ${route}`);
  }
  const segments = route.split('/').filter(Boolean);
  return join(clientDir, ...segments, 'index.html');
}

function isExecutableScript(attributes: string) {
  const type = attributes.match(/\btype=["']([^"']+)["']/i)?.[1]?.toLowerCase();
  return (
    !type ||
    ['module', 'text/javascript', 'application/javascript'].includes(type)
  );
}

async function measureRouteJavaScript(clientDir: string, route: string) {
  const html = await readFile(routeHtmlPath(clientDir, route), 'utf8');
  const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  const scripts: string[] = [];
  const referencedSources = new Set<string>();
  let gzipBytes = 0;
  let inlineIndex = 0;

  for (const match of html.matchAll(scriptPattern)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    if (!isExecutableScript(attributes)) continue;

    const source = attributes.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    if (source) {
      const parsed = new URL(source, 'https://portfolio.test');
      if (parsed.origin !== 'https://portfolio.test') {
        throw new Error(
          `Cannot verify remote JavaScript budget for ${route}: ${parsed.origin}`,
        );
      }
      const publicPath = decodeURIComponent(parsed.pathname);
      if (referencedSources.has(publicPath)) continue;
      referencedSources.add(publicPath);
      const absolutePath = resolve(
        clientDir,
        ...publicPath.split('/').filter(Boolean),
      );
      const data = await readFile(absolutePath);
      gzipBytes += gzipSync(data).byteLength;
      scripts.push(publicPath);
      continue;
    }

    if (body.trim()) {
      inlineIndex += 1;
      gzipBytes += gzipSync(body).byteLength;
      scripts.push(`<inline:${inlineIndex}>`);
    }
  }

  return { gzipBytes, scripts };
}

export async function auditJavaScriptBudgets(options: {
  clientDir: string;
  routes: readonly RouteJavaScriptBudget[];
}): Promise<JavaScriptBudgetReport> {
  const routes: JavaScriptBudgetResult[] = [];

  for (const route of options.routes) {
    const measurement = await measureRouteJavaScript(
      options.clientDir,
      route.path,
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

const invokedScript = process.argv[1];
if (invokedScript && import.meta.url === pathToFileURL(invokedScript).href) {
  auditJavaScriptBudgets({
    clientDir: resolve('dist/client'),
    routes: contentRoutes,
  })
    .then((report) => {
      const maximum = Math.max(
        ...report.routes.map((route) => route.gzipBytes),
      );
      process.stdout.write(
        `Verified ${report.routes.length} content routes: maximum JavaScript ${Math.ceil(maximum / 1024)} KB gzip; recruiter lens routes use the 180 KB assistant budget and all other routes use the 120 KB budget.\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
