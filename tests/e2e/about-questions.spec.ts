import { expect, test } from '@playwright/test';
import { questionBank } from '../../src/data/claims';

const published = questionBank.filter((answer) => !answer.gap);
const gapAnswers = questionBank.filter((answer) => answer.gap);
const groups = [...new Set(published.map((answer) => answer.group))];

test('About shows his published answers under their group headings', async ({
  page,
}) => {
  await page.goto('/about#questions');

  const section = page.locator('#questions');
  await expect(
    section.getByRole('heading', {
      level: 2,
      name: 'Questions I’m often asked',
    }),
  ).toBeVisible();
  await expect(section.locator('article')).toHaveCount(published.length);

  for (const group of groups)
    await expect(
      section.getByRole('heading', { level: 3, name: group, exact: true }),
    ).toBeVisible();

  const first = published[0]!;
  await expect(
    section.getByRole('heading', { level: 4, name: first.question }),
  ).toBeVisible();
  await expect(section).toContainText(first.answer.slice(0, 60));
});

test('gap answers never appear on the page', async ({ page }) => {
  await page.goto('/about');
  const text = await page.locator('body').innerText();

  expect(gapAnswers.length).toBeGreaterThan(0);
  for (const gap of gapAnswers) {
    expect(text).not.toContain(gap.question);
    expect(text).not.toContain(gap.answer.slice(0, 50));
  }
});

test('the section keeps the current role and the paper status accurate', async ({
  page,
}) => {
  await page.goto('/about');
  const section = page.locator('#questions');

  await expect(section).toContainText('Founding AI Engineer at Eklan');
  await expect(section).toContainText('one week');
  await expect(section).not.toContainText(
    /immediately available|published SPRINT-PP|CEH certified|under review/i,
  );
});

test('About fits a 360px screen with the new section', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/about');

  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    360,
  );
  await expect(page.locator('#questions article').first()).toBeVisible();
});
