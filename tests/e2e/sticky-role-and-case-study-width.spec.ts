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

// The case-study body is a two-column layout from 64rem: a narrow sticky
// "On this page" sidebar on the left and the article on the right. A past bug
// left the article at its default `order`, which swapped the columns and put
// the prose in the 16rem track. Guard the intended geometry on one page per
// tier.
for (const slug of [
  'asc-pie',
  'northstar-rag',
  'minds-eye',
  'dive',
  'dostava',
]) {
  test(`${slug} puts the contents sidebar left of a wide reading column`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(`/work/${slug}`);

    const measurements = await page.evaluate(() => {
      const hero = document.querySelector('.case-study-hero');
      const toc = document.querySelector('.case-study-toc');
      const prose = document.querySelector('.case-study-prose');
      if (!hero || !toc || !prose) throw new Error('Layout target missing');
      const heroBox = hero.getBoundingClientRect();
      const heroStyle = getComputedStyle(hero);
      const tocBox = toc.getBoundingClientRect();
      const proseBox = prose.getBoundingClientRect();
      return {
        // Compare content edges: the header and the body are both
        // `shell-container`s, so they share the same side padding.
        heroLeft: heroBox.left + parseFloat(heroStyle.paddingLeft),
        heroRight: heroBox.right - parseFloat(heroStyle.paddingRight),
        tocLeft: tocBox.left,
        tocRight: tocBox.right,
        tocWidth: tocBox.width,
        tocPosition: getComputedStyle(toc).position,
        proseLeft: proseBox.left,
        proseRight: proseBox.right,
        proseWidth: proseBox.width,
      };
    });

    // Sidebar first and narrow, article second and wide.
    expect(measurements.tocLeft).toBeLessThan(measurements.proseLeft);
    expect(measurements.tocRight).toBeLessThanOrEqual(measurements.proseLeft);
    expect(measurements.tocWidth).toBeLessThanOrEqual(272);
    expect(measurements.proseWidth).toBeGreaterThanOrEqual(640);
    expect(measurements.proseWidth).toBeGreaterThan(
      measurements.tocWidth * 2.5,
    );
    expect(measurements.tocPosition).toBe('sticky');

    // Both columns line up with the page header.
    expect(Math.abs(measurements.heroLeft - measurements.tocLeft)).toBeLessThan(
      2,
    );
    expect(
      Math.abs(measurements.heroRight - measurements.proseRight),
    ).toBeLessThan(2);
  });
}

test('the contents list and the article share one full-width column below 64rem', async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto('/work/dive');

  const widths = await page.evaluate(() => {
    const toc = document.querySelector('.case-study-toc');
    const prose = document.querySelector('.case-study-prose');
    if (!toc || !prose) throw new Error('Layout target missing');
    return {
      tocWidth: toc.getBoundingClientRect().width,
      proseWidth: prose.getBoundingClientRect().width,
    };
  });

  expect(Math.abs(widths.tocWidth - widths.proseWidth)).toBeLessThan(2);
});
