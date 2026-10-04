import { expect, test } from '@playwright/test';

test('hero presents a meaningful project spotlight for each selected role', async ({
  page,
}) => {
  await page.goto('/');

  const spotlight = page.getByRole('complementary', {
    name: 'Project spotlight',
  });
  await expect(spotlight).toContainText('ASC-PIE');
  await expect(spotlight.getByRole('link')).toHaveAttribute(
    'href',
    '/work/asc-pie',
  );

  await page
    .getByRole('link', { name: 'Software Engineer', exact: true })
    .click();
  await expect(spotlight).toContainText('Northstar RAG System');
  await expect(spotlight.getByRole('link')).toHaveAttribute(
    'href',
    '/work/northstar-rag',
  );

  await page
    .getByRole('link', { name: 'Android Developer', exact: true })
    .click();
  await expect(spotlight).toContainText('Mind’s Eye');
  await expect(spotlight.getByRole('link')).toHaveAttribute(
    'href',
    '/work/minds-eye',
  );
});

test('section introductions describe the work instead of explaining interface ordering', async ({
  page,
}) => {
  await page.goto('/');

  await expect(page.locator('body')).not.toContainText(
    'Every role stays visible; the order changes',
  );
  await expect(page.locator('body')).not.toContainText(
    'The most relevant groups appear first. Nothing is hidden.',
  );
  await expect(page.locator('body')).not.toContainText(
    'Projects are ordered for the professional focus you selected.',
  );
  await expect(page.locator('body')).toContainText(
    'Hands-on experience across graduate research, enterprise systems, client delivery, and technical instruction.',
  );
});
