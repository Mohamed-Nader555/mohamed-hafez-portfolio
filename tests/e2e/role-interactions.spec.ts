import { expect, test } from '@playwright/test';

test('switches roles through the query without reloading the browser document', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/');
  await page.evaluate(() => {
    Object.assign(window, {
      __portfolioDocumentMarker: 'same-document',
      __portfolioSelectedRole: undefined,
    });
    document.addEventListener('portfolio:role-change', (event) => {
      Object.assign(window, {
        __portfolioSelectedRole: (event as CustomEvent<string>).detail,
      });
    });
  });

  const android = page.getByRole('link', {
    name: 'Android Developer',
    exact: true,
  });
  await expect(android).toHaveAttribute('href', '/?role=android');
  await android.click();

  await expect(page).toHaveURL(/\/?\?role=android$/);
  await expect(page).toHaveTitle('Mohamed Hafez — Android Developer');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Android products',
  );
  await expect(android).toHaveAttribute('aria-current', 'page');
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __portfolioDocumentMarker?: string })
          .__portfolioDocumentMarker,
    ),
  ).toBe('same-document');
  expect(
    await page.evaluate(
      () =>
        (window as Window & { __portfolioSelectedRole?: string })
          .__portfolioSelectedRole,
    ),
  ).toBe('android');
  expect(runtimeErrors).toEqual([]);
});

test('exposes a blurred role transition and a visible pointer-following glow', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('[data-role-content]')).toHaveCSS(
    'view-transition-name',
    'role-content',
  );

  const glow = page.locator('.ambient-background');
  await expect(glow).toBeVisible();
  await expect(glow).toHaveCSS('z-index', '0');

  await page.mouse.move(137, 211);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        x: getComputedStyle(document.documentElement)
          .getPropertyValue('--pointer-x')
          .trim(),
        y: getComputedStyle(document.documentElement)
          .getPropertyValue('--pointer-y')
          .trim(),
      })),
    )
    .toEqual({ x: '137px', y: '211px' });

  const background = await glow.evaluate(
    (element) => getComputedStyle(element).backgroundImage,
  );
  expect(background.match(/radial-gradient/g)?.length).toBeGreaterThanOrEqual(
    2,
  );
});
