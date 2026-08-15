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
