import { expect, test } from '@playwright/test';

test('assistant opens, keeps keyboard focus, and closes with Escape', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: /ask about Mohamed/i }).click();
  await expect(
    page.getByRole('dialog', { name: /portfolio evidence assistant/i }),
  ).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /your question/i }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
