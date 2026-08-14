import { expect, test } from '@playwright/test';

test('home identifies Mohamed and the default role', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI');
  await expect(page.getByText('Mohamed Hafez', { exact: true })).toBeVisible();
});
