import { expect, test } from '@playwright/test';

const lensDestinations = [
  { name: 'AI/ML Engineer', href: '/?role=aiml' },
  { name: 'Software Engineer', href: '/?role=software' },
  { name: 'Android Developer', href: '/?role=android' },
  { name: 'TA / Instructor', href: '/?role=teaching' },
] as const;

const primaryDestinations = [
  { name: 'Work', href: '/work' },
  { name: 'Research', href: '/research/asc-pie' },
  { name: 'Experience', href: '/#career-title' },
  { name: 'About', href: '/#profile-summary-title' },
  { name: 'Contact', href: 'mailto:mohamed.m.nader555@gmail.com' },
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
      name: 'Professional focus',
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

for (const viewport of [
  { width: 360, height: 800 },
  { width: 820, height: 1180 },
]) {
  test(`compact menu links remain actionable and focus-exposed at ${viewport.width}px`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize(viewport);
    await page.goto('/');

    const disclosure = page.locator('details.site-menu');
    const summary = disclosure.getByText('Explore', { exact: true });
    const navigation = disclosure.getByRole('navigation', { name: 'Primary' });

    await summary.click();
    await expect(disclosure).toHaveAttribute('open', '');

    for (const destination of primaryDestinations) {
      const link = navigation.getByRole('link', {
        name: destination.name,
        exact: true,
      });
      await expect(link).toHaveAttribute('href', destination.href);

      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect(box?.y ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(
        viewport.width,
      );
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height,
      );

      const hitLinkText = await page.evaluate(({ x, y, width, height }) => {
        const hit = document.elementFromPoint(x + width / 2, y + height / 2);
        return hit?.closest('a')?.textContent?.trim() ?? null;
      }, box!);
      expect(hitLinkText).toBe(destination.name);
      await link.click({ trial: true });
    }

    await summary.focus();
    for (const destination of primaryDestinations) {
      await page.keyboard.press('Tab');
      const link = navigation.getByRole('link', {
        name: destination.name,
        exact: true,
      });
      await expect(link).toBeFocused();

      const focusState = await link.evaluate((node) => {
        const box = node.getBoundingClientRect();
        return {
          boxShadow: getComputedStyle(node).boxShadow,
          withinViewport:
            box.top >= 0 &&
            box.left >= 0 &&
            box.bottom <= window.innerHeight &&
            box.right <= window.innerWidth,
        };
      });
      expect(focusState.withinViewport).toBe(true);
      expect(focusState.boxShadow).not.toBe('none');
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(viewport.width);
  });
}

for (const fontMode of ['loaded', 'blocked'] as const) {
  test(`320px identity and compact actions fit with first-party fonts ${fontMode}`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 320, height: 800 });

    if (fontMode === 'blocked') {
      await page.route('**/*.woff2', (route) => route.abort());
    }

    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);

    const identity = page.getByText('Mohamed Hafez', { exact: true });
    await expect(identity).toBeVisible();
    const identityFit = await identity.evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      visibleText: (node as HTMLElement).innerText,
    }));
    expect(identityFit.visibleText).toBe('Mohamed Hafez');
    expect(identityFit.scrollWidth).toBeLessThanOrEqual(
      identityFit.clientWidth,
    );

    const disclosure = page.locator('details.site-menu');
    const summary = disclosure.getByText('Explore', { exact: true });
    const summaryBox = await summary.boundingBox();
    expect(summaryBox).not.toBeNull();
    expect(summaryBox?.width ?? 0).toBeGreaterThanOrEqual(44);
    expect(summaryBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);

    await summary.click();
    await expect(disclosure).toHaveAttribute('open', '');
    const navigation = disclosure.getByRole('navigation', { name: 'Primary' });

    for (const destination of primaryDestinations) {
      const link = navigation.getByRole('link', {
        name: destination.name,
        exact: true,
      });
      const box = await link.boundingBox();
      expect(box).not.toBeNull();
      expect(box?.x ?? -1).toBeGreaterThanOrEqual(0);
      expect((box?.x ?? 0) + (box?.width ?? 0)).toBeLessThanOrEqual(320);

      const hitLinkText = await page.evaluate(({ x, y, width, height }) => {
        const hit = document.elementFromPoint(x + width / 2, y + height / 2);
        return hit?.closest('a')?.textContent?.trim() ?? null;
      }, box!);
      expect(hitLinkText).toBe(destination.name);
      await link.click({ trial: true });
    }

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
  });
}

test('skip link and the focus switcher work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });
  await expect(skipLink).toHaveAttribute('href', '#main-content');

  const lensNavigation = page.getByRole('navigation', {
    name: 'Professional focus',
  });
  await expect(
    lensNavigation.getByRole('link', { name: 'AI/ML Engineer', exact: true }),
  ).toHaveAttribute('aria-current', 'page');
  await expect(
    lensNavigation.getByRole('link', {
      name: 'Software Engineer',
      exact: true,
    }),
  ).toHaveAttribute('href', '/?role=software');

  const disclosure = page.locator('details.site-menu');
  await disclosure.getByText('Explore', { exact: true }).click();
  await expect(disclosure).toHaveAttribute('open', '');
  await disclosure
    .getByRole('link', { name: 'Work', exact: true })
    .click({ trial: true });

  await context.close();
});

test('base metadata describes the canonical page', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://portfolio.test/',
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    /Mohamed Hafez/,
  );
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
    'content',
    /privacy-aware NLP/i,
  );
});
