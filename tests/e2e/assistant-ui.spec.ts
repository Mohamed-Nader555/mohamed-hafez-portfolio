import { expect, test } from '@playwright/test';

test('assistant opens, keeps keyboard focus, and closes with Escape', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page
    .getByRole('button', { name: /open Mohamed AI portfolio assistant/i })
    .click();
  await expect(
    page.getByRole('dialog', { name: /Mohamed AI portfolio assistant/i }),
  ).toBeVisible();
  await expect(page.getByText(/AI & ML context/i)).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /your question/i }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
