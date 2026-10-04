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

  // Scope to the hero switcher: once the page scrolls, the persistent switcher
  // becomes available to assistive tech too and the bare name matches twice.
  const android = page.locator('.lens-hero').getByRole('link', {
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

test('featured story cards swap instantly with the role and stay one document', async ({
  page,
}) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.evaluate(() =>
    Object.assign(window, { __portfolioDocumentMarker: 'same-document' }),
  );

  const expectations = [
    ['aiml', 'AI/ML Engineer', 'ASC-PIE', '/work/asc-pie'],
    [
      'software',
      'Software Engineer',
      'Northstar RAG System',
      '/work/northstar-rag',
    ],
    ['android', 'Android Developer', 'Mind’s Eye', '/work/minds-eye'],
    [
      'teaching',
      'TA / Instructor',
      'Teaching & Technical Instruction',
      '#teaching-portfolio',
    ],
  ] as const;

  for (const [role, label, firstTitle, firstHref] of expectations) {
    await page.getByRole('link', { name: label, exact: true }).first().click();
    await expect(page.locator('[data-role-content]')).toHaveAttribute(
      'data-role',
      role,
    );

    const cards = page
      .getByRole('region', { name: 'Work I’m proud of' })
      .locator('article.story-card');
    await expect(cards).toHaveCount(4);
    await expect(cards.first().getByRole('heading', { level: 3 })).toHaveText(
      firstTitle,
    );
    await expect(cards.first().getByRole('link')).toHaveAttribute(
      'href',
      firstHref,
    );
  }

  expect(
    await page.evaluate(
      () =>
        (window as Window & { __portfolioDocumentMarker?: string })
          .__portfolioDocumentMarker,
    ),
  ).toBe('same-document');
  expect(runtimeErrors).toEqual([]);
});

test('two quick role switches end on the last role, in both the content and the URL', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  // Click the second role before the first switch's exit animation finishes.
  const hero = page.locator('.lens-hero');
  await hero
    .getByRole('link', { name: 'Android Developer', exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Software Engineer', exact: true })
    .first()
    .click();

  await expect(page.locator('[data-role-content]')).toHaveAttribute(
    'data-role',
    'software',
  );
  await expect(page).toHaveURL(/\?role=software$/);
  await expect(page).toHaveTitle('Mohamed Hafez — Software Engineer');
});
