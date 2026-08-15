import { expect, test } from '@playwright/test';

const lensDestinations = [
  { name: 'AI/ML Engineer', href: '/' },
  { name: 'Software Engineer', href: '/software' },
  { name: 'Android Developer', href: '/android' },
  { name: 'TA / Instructor', href: '/teaching' },
] as const;

for (const viewport of [
  { width: 360, height: 800 },
  { width: 820, height: 1180 },
  { width: 1440, height: 900 },
]) {
  test(`semantic shell fits ${viewport.width}px`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(viewport);
    await page.goto('/');

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.getByRole('main')).toHaveAttribute('id', 'main-content');
    await expect(page.getByRole('contentinfo')).toBeVisible();

    const lensNavigation = page.getByRole('navigation', {
      name: 'Recruiter lens',
    });
    await expect(lensNavigation).toBeVisible();

    for (const destination of lensDestinations) {
      const link = lensNavigation.getByRole('link', {
        name: destination.name,
        exact: true,
      });
      await expect(link).toHaveAttribute('href', destination.href);
      const size = await link.boundingBox();
      expect(size?.height).toBeGreaterThanOrEqual(44);
    }

    const firstLens = await lensNavigation
      .getByRole('link', { name: 'AI/ML Engineer', exact: true })
      .boundingBox();
    const thirdLens = await lensNavigation
      .getByRole('link', { name: 'Android Developer', exact: true })
      .boundingBox();

    if (viewport.width === 1440) {
      expect(thirdLens?.y).toBe(firstLens?.y);
    } else {
      expect(thirdLens?.y ?? 0).toBeGreaterThan(firstLens?.y ?? 0);
    }

    const compactMenu = page.getByText('Explore', { exact: true });
    const primaryNavigation = page.getByRole('navigation', { name: 'Primary' });

    if (viewport.width === 1440) {
      await expect(compactMenu).toBeHidden();
      await expect(primaryNavigation).toBeVisible();
    } else {
      await expect(compactMenu).toBeVisible();
      await expect(primaryNavigation).toBeHidden();
      await compactMenu.click();
      await expect(primaryNavigation).toBeVisible();
    }
  });
}

test('skip link and recruiter lenses work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toHaveAttribute('href', '#main-content');

  const lensNavigation = page.getByRole('navigation', {
    name: 'Recruiter lens',
  });
  await expect(
    lensNavigation.getByRole('link', { name: 'AI/ML Engineer', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    lensNavigation.getByRole('link', {
      name: 'Software Engineer',
      exact: true,
    }),
  ).toHaveAttribute('href', '/software');

  await context.close();
});

test('base metadata describes the canonical page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'http://127.0.0.1:4321/',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /Mohamed Hafez/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    /AI\/ML/i,
  );
});
