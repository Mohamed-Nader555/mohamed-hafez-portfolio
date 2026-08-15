import { expect, test } from '@playwright/test';

import { existingPublicRoutes, publicRoutes } from './public-routes';

const testOrigin = 'https://portfolio.test';

test('the audit matrix contains all 13 pre-privacy public routes', () => {
  expect(existingPublicRoutes).toHaveLength(13);
});

for (const route of publicRoutes) {
  test(`${route.path} publishes complete canonical metadata and structured data`, async ({
    page,
  }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);

    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page).toHaveTitle(route.title);

    const description = page.locator('meta[name="description"]');
    await expect(description).toHaveCount(1);
    await expect(description).toHaveAttribute('content', /^.{50,}$/);

    const canonical = `${testOrigin}${route.path}`;
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      canonical,
    );
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      'content',
      'Mohamed Hafez',
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      route.title,
    );
    await expect(
      page.locator('meta[property="og:description"]'),
    ).toHaveAttribute('content', /^.{50,}$/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
      'content',
      canonical,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      'content',
      `${testOrigin}/og/mohamed-hafez-portfolio.svg`,
    );
    await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute(
      'content',
      /Mohamed Hafez.*portfolio/i,
    );

    const scripts = page.locator('script[type="application/ld+json"]');
    await expect(scripts).toHaveCount(1);
    const rawStructuredData = await scripts.textContent();
    expect(() => JSON.parse(rawStructuredData ?? '')).not.toThrow();
    const structuredData = JSON.parse(rawStructuredData ?? '{}') as {
      '@context'?: string;
      '@graph'?: Array<Record<string, unknown>>;
    };
    expect(structuredData['@context']).toBe('https://schema.org');
    expect(structuredData['@graph']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          '@type': 'Person',
          name: 'Mohamed Hafez',
          url: `${testOrigin}/`,
        }),
      ]),
    );

    if (route.structuredType) {
      expect(structuredData['@graph']).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            '@type': route.structuredType,
            url: canonical,
          }),
        ]),
      );
    }

    const serialized = JSON.stringify(structuredData);
    expect(serialized).not.toMatch(
      /SPRINT-PP[^}]{0,120}(published|accepted)|published[^}]{0,120}SPRINT-PP|accepted[^}]{0,120}SPRINT-PP/i,
    );
  });
}

test('robots allows general and AI crawlers and points at the canonical sitemap', async ({
  request,
}) => {
  const response = await request.get('/robots.txt');
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('text/plain');
  const body = await response.text();

  expect(body).toContain('User-agent: *');
  expect(body).toContain('Allow: /');
  expect(body).not.toMatch(/^Disallow:/im);
  expect(body).toContain(`Sitemap: ${testOrigin}/sitemap-index.xml`);
  expect(body).not.toMatch(/private|source-dumps|analytics-exports|\.env/i);
});

test('the privacy page distinguishes active aggregate analytics from the future custom-event hook', async ({
  page,
}) => {
  await page.goto('/privacy');

  await expect(page.getByText(/Cloudflare Web Analytics/i)).toBeVisible();
  await expect(page.getByText(/30 days/i)).toBeVisible();
  await expect(page.getByText(/180 days/i)).toBeVisible();
  await expect(page.getByText(/Global Privacy Control/i)).toBeVisible();
  await expect(page.getByText(/Do Not Track/i)).toBeVisible();
  await expect(page.getByText(/raw chat questions or answers/i)).toBeVisible();
  await expect(page.locator('[data-analytics-opt-out-mount]')).toContainText(
    /not active|future/i,
  );
});
