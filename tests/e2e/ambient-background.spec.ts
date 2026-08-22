import { expect, test } from '@playwright/test';

test('ambient neural field moves without overriding reduced-motion preferences', async ({
  page,
}) => {
  await page.goto('/');

  const ambient = page.locator('.ambient-background');
  await expect(ambient).toHaveAttribute('aria-hidden', 'true');

  const activeMotion = await ambient.evaluate(
    (element) => getComputedStyle(element, '::before').animationDuration,
  );
  expect(activeMotion).not.toBe('0s');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  const reducedMotion = await ambient.evaluate(
    (element) => getComputedStyle(element, '::before').animationDuration,
  );
  expect(reducedMotion).toBe('0s');
});
