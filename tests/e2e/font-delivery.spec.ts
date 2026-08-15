import { expect, test } from '@playwright/test';

const fontPaths = [
  '/fonts/familjen-grotesk-latin-wght-normal.woff2',
  '/fonts/source-sans-3-latin-wght-normal.woff2',
] as const;

test('display and body fonts load as reasonable first-party WOFF2 assets', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);

  const typography = await page.evaluate(() => ({
    bodyFamily: getComputedStyle(document.body).fontFamily,
    displayFamily: getComputedStyle(document.querySelector('h1')!).fontFamily,
    familjenReady: document.fonts.check('1rem "Familjen Grotesk"'),
    sourceSansReady: document.fonts.check('1rem "Source Sans 3"'),
    fontResources: performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => name.endsWith('.woff2')),
  }));

  expect(typography.displayFamily).toContain('Familjen Grotesk');
  expect(typography.bodyFamily).toContain('Source Sans 3');
  expect(typography.familjenReady).toBe(true);
  expect(typography.sourceSansReady).toBe(true);

  const expectedUrls = fontPaths.map((path) => `http://127.0.0.1:4321${path}`);
  expect(typography.fontResources.sort()).toEqual(expectedUrls.sort());
  expect(
    typography.fontResources.every(
      (url) => new URL(url).origin === 'http://127.0.0.1:4321',
    ),
  ).toBe(true);

  for (const path of fontPaths) {
    const asset = await page.evaluate(async (fontPath) => {
      const response = await fetch(fontPath);
      return {
        contentType: response.headers.get('content-type'),
        ok: response.ok,
        size: (await response.arrayBuffer()).byteLength,
      };
    }, path);

    expect(asset.ok).toBe(true);
    expect(asset.contentType).toContain('font/woff2');
    expect(asset.size).toBeGreaterThan(10_000);
    expect(asset.size).toBeLessThan(200_000);
  }
});
