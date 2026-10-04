import { randomBytes } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { auditJavaScriptBudgets } from '../../scripts/verify-javascript-budgets';

const temporaryDirectories: string[] = [];

async function createClientFixture(
  route: string,
  scriptBytes: number,
  includeScript = true,
) {
  const clientDir = await mkdtemp(join(tmpdir(), 'portfolio-js-budget-'));
  temporaryDirectories.push(clientDir);
  const routeDirectory =
    route === '/' ? clientDir : join(clientDir, ...route.slice(1).split('/'));
  await mkdir(join(clientDir, '_astro'), { recursive: true });
  await mkdir(routeDirectory, { recursive: true });
  const script = randomBytes(scriptBytes).toString('base64');
  await writeFile(join(clientDir, '_astro', 'entry.js'), script);
  await writeFile(
    join(routeDirectory, 'index.html'),
    [
      '<!doctype html><html><head>',
      '<script type="application/ld+json">{"name":"ignored"}</script>',
      includeScript ? '<script src="/_astro/entry.js"></script>' : '',
      '</head><body></body></html>',
    ].join(''),
  );
  return clientDir;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('route JavaScript gzip budgets', () => {
  it('rejects a normal content route above 120 KB gzip', async () => {
    const clientDir = await createClientFixture('/', 150 * 1024);

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/', assistant: false }],
      }),
    ).rejects.toThrow(/\/.*120 KB.*exceeded/i);
  });

  it('allows an assistant route below its separate 180 KB gzip budget', async () => {
    const clientDir = await createClientFixture('/assistant', 140 * 1024);

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/assistant', assistant: true }],
      }),
    ).resolves.toMatchObject({
      routes: [
        expect.objectContaining({
          path: '/assistant',
          budgetBytes: 180 * 1024,
          passed: true,
        }),
      ],
    });
  });

  it('counts only executable scripts referenced by each built route', async () => {
    const clientDir = await createClientFixture('/about', 150 * 1024, false);

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/about', assistant: false }],
      }),
    ).resolves.toEqual({
      routes: [
        {
          path: '/about',
          assistant: false,
          gzipBytes: 0,
          budgetBytes: 120 * 1024,
          passed: true,
          scripts: [],
        },
      ],
    });
  });
});

describe('server-rendered routes and framework islands', () => {
  async function createServerClient(files: Record<string, string>) {
    const clientDir = await mkdtemp(join(tmpdir(), 'portfolio-js-budget-'));
    temporaryDirectories.push(clientDir);
    await mkdir(join(clientDir, '_astro'), { recursive: true });
    for (const [name, contents] of Object.entries(files)) {
      await writeFile(join(clientDir, '_astro', name), contents);
    }
    return clientDir;
  }

  const islandHtml = (component: string, renderer: string) =>
    `<!doctype html><html><body><astro-island uid="x" component-url="/_astro/${component}" renderer-url="/_astro/${renderer}" client="load"></astro-island></body></html>`;

  it('measures a route with no prerendered file through the supplied renderer', async () => {
    // `/` is server-rendered, so there is no dist/client/index.html to read.
    const clientDir = await createServerClient({});
    const rendered: string[] = [];

    const report = await auditJavaScriptBudgets({
      clientDir,
      routes: [{ path: '/', assistant: true }],
      renderRoute: async (route) => {
        rendered.push(route);
        return '<!doctype html><html><body><script>console.log(1)</script></body></html>';
      },
    });

    expect(rendered).toEqual(['/']);
    expect(report.routes[0]).toMatchObject({
      path: '/',
      passed: true,
      scripts: ['<inline:1>'],
    });
    expect(report.routes[0]?.gzipBytes).toBeGreaterThan(0);
  });

  it('explains how to measure a route that has no file and no renderer', async () => {
    const clientDir = await createServerClient({});

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/', assistant: true }],
      }),
    ).rejects.toThrow(/no prerendered HTML.*no server renderer/i);
  });

  it('counts island component and renderer chunks and the chunks they import statically', async () => {
    // A dynamic import() is lazy, so lazy.js must not be counted.
    const clientDir = await createServerClient({
      'Component.js':
        'import{r as a}from"./shared.js";export const later=()=>import("./lazy.js");export default a;',
      'client.js': 'export const render=1;',
      'shared.js': 'export const r=2;',
      'lazy.js': 'export const lazy=3;',
    });

    const report = await auditJavaScriptBudgets({
      clientDir,
      routes: [{ path: '/', assistant: true }],
      renderRoute: async () => islandHtml('Component.js', 'client.js'),
    });

    expect(report.routes[0]?.scripts).toEqual([
      '/_astro/Component.js',
      '/_astro/shared.js',
      '/_astro/client.js',
    ]);
  });

  it('fails a server-rendered assistant route that exceeds 180 KB through its island chunks', async () => {
    const clientDir = await createServerClient({
      'Component.js': randomBytes(150 * 1024).toString('base64'),
      'client.js': randomBytes(60 * 1024).toString('base64'),
    });

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/', assistant: true }],
        renderRoute: async () => islandHtml('Component.js', 'client.js'),
      }),
    ).rejects.toThrow(/\/ 180 KB.*exceeded/i);
  });

  it('holds a server-rendered route without the assistant to 120 KB', async () => {
    const clientDir = await createServerClient({
      'Component.js': randomBytes(130 * 1024).toString('base64'),
    });

    await expect(
      auditJavaScriptBudgets({
        clientDir,
        routes: [{ path: '/plain', assistant: false }],
        renderRoute: async () => islandHtml('Component.js', 'Component.js'),
      }),
    ).rejects.toThrow(/\/plain 120 KB.*exceeded/i);
  });
});
