import { expect, test } from '@playwright/test';

test('home identifies Mohamed and the default role', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI');
  await expect(page.getByText('Mohamed Hafez', { exact: true })).toBeVisible();
});

test('home featured work introduces the projects in first person', async ({
  page,
}) => {
  await page.goto('/');

  const intro = page
    .getByRole('region', { name: 'Work I’m proud of' })
    .locator('.section-heading--split > p');
  await expect(intro).toContainText(/\bI\b/);
  await expect(intro).not.toContainText(/recruiter|evidence|verified/i);
});
