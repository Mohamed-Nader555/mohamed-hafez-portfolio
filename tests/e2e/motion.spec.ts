import { expect, test } from '@playwright/test';

test('reduced motion removes shell and lens transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  const shell = page.locator('[data-shell]');
  const lensLink = page
    .getByRole('navigation', { name: 'Recruiter lens' })
    .getByRole('link', { name: 'Software Engineer', exact: true });

  await expect(shell).toBeVisible();
  await expect(lensLink).toBeVisible();

  const motion = await Promise.all(
    [shell, lensLink].map((element) =>
      element.evaluate((node) => {
        const styles = getComputedStyle(node);
        return {
          animationName: styles.animationName,
          animationDuration: styles.animationDuration,
          transitionDuration: styles.transitionDuration,
        };
      }),
    ),
  );

  expect(motion).toEqual([
    {
      animationName: 'none',
      animationDuration: '0s',
      transitionDuration: '0s',
    },
    {
      animationName: 'none',
      animationDuration: '0s',
      transitionDuration: '0s',
    },
  ]);
});

test('shell entrance keeps recruiter content at full opacity', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  const shell = page.locator('[data-shell]');
  await expect(shell).toBeVisible();
  expect(await shell.evaluate((node) => getComputedStyle(node).opacity)).toBe(
    '1',
  );
});
