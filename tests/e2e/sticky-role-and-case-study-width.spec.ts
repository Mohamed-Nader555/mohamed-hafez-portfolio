import { expect, test } from '@playwright/test';

test('keeps an accessible role switcher available after the hero leaves view', async ({
  page,
}) => {
  await page.goto('/');

  const persistentSwitcher = page.locator('[data-persistent-role-switcher]');
  await expect(persistentSwitcher).toBeAttached();
  await expect(persistentSwitcher).toHaveAttribute('aria-hidden', 'true');

  await page
    .getByRole('heading', { name: /Experience across/ })
    .scrollIntoViewIfNeeded();
  await expect(persistentSwitcher).toHaveAttribute('aria-hidden', 'false');
  const switcherGeometry = await persistentSwitcher.evaluate((element) => ({
    width: element.getBoundingClientRect().width,
    listWidth: element.querySelector('ul')?.getBoundingClientRect().width ?? 0,
    linkWidths: Array.from(element.querySelectorAll('a')).map(
      (link) => link.getBoundingClientRect().width,
    ),
  }));
  expect(switcherGeometry.listWidth).toBeGreaterThan(
    switcherGeometry.width * 0.95,
  );
  expect(Math.min(...switcherGeometry.linkWidths)).toBeGreaterThan(150);

  await persistentSwitcher
    .getByRole('link', { name: 'Android Developer', exact: true })
    .click();
  await expect(page).toHaveURL(/\?role=android$/);
  await expect(
    persistentSwitcher.getByRole('link', {
      name: 'Android Developer',
      exact: true,
    }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Android products',
  );

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await expect(persistentSwitcher).toHaveAttribute('aria-hidden', 'true');
});

for (const slug of [
  'asc-pie',
  'northstar-rag',
  'minds-eye',
  'dive',
  'dostava',
]) {
  test(`${slug} uses the wider case-study reading layout`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/work/${slug}`);

    const measurements = await page.evaluate(() => {
      const hero = document.querySelector('.longform-hero');
      const prose = document.querySelector('.case-study-prose');
      const overview = Array.from(document.querySelectorAll('h2')).find(
        (heading) => heading.textContent?.trim() === 'Overview',
      )?.nextElementSibling;
      if (!hero || !prose || !overview)
        throw new Error('Layout target missing');
      const heroBox = hero.getBoundingClientRect();
      const proseBox = prose.getBoundingClientRect();
      const overviewBox = overview.getBoundingClientRect();
      return {
        heroLeft: heroBox.left,
        proseLeft: proseBox.left,
        heroWidth: heroBox.width,
        proseWidth: proseBox.width,
        overviewWidth: overviewBox.width,
      };
    });

    expect(
      Math.abs(measurements.heroLeft - measurements.proseLeft),
    ).toBeLessThan(2);
    expect(
      Math.abs(measurements.heroWidth - measurements.proseWidth),
    ).toBeLessThan(2);
    expect(measurements.overviewWidth).toBeGreaterThanOrEqual(900);
  });
}
