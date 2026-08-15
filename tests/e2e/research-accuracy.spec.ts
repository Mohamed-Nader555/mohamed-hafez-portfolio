import { expect, test } from '@playwright/test';

test('thesis page states official and under-review statuses accurately', async ({
  page,
}) => {
  await page.goto('/research/asc-pie');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition',
  );
  await expect(page.getByText(/completed and awarded/i)).toBeVisible();
  await expect(
    page.getByText(/submitted and (currently )?under review/i),
  ).toBeVisible();
  const sprintStatus = page.getByRole('group', {
    name: 'SPRINT-PP status and source',
  });
  await expect(sprintStatus).toContainText(
    'SPRINT-PP is a research paper submitted and under review.',
  );
  await expect(
    sprintStatus.getByRole('link', { name: 'Source · AI/ML Engineer résumé' }),
  ).toHaveAttribute('href', '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf');
  await expect(sprintStatus.locator('a[href="/research/asc-pie"]')).toHaveCount(
    0,
  );
  await expect(page.getByRole('link', { name: /YorkSpace/i })).toHaveAttribute(
    'href',
    /yorku\.ca/,
  );
  await expect(page.locator('body')).not.toContainText(
    /published SPRINT-PP|accepted SPRINT-PP|CEH certified/i,
  );
});

test('experience is responsibility-led and keeps CEH status accurate', async ({
  page,
}) => {
  await page.goto('/experience');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Responsibility across systems, products, and classrooms',
  );
  await expect(
    page.getByText(/developed Java and Spring Boot services/i),
  ).toBeVisible();
  await expect(
    page.getByText(/planned and delivered tutorials/i),
  ).toBeVisible();
  await expect(page.getByText(/completed CEH training/i)).toBeVisible();
  await expect(page.locator('body')).not.toContainText(/CEH certified/i);
});

test('about publishes validated screening facts and direct contact', async ({
  page,
}) => {
  await page.goto('/about');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Engineering breadth, one evidence standard',
  );
  await expect(page.getByText('Toronto, Ontario, Canada.')).toBeVisible();
  await expect(page.getByText('Immediately available.')).toBeVisible();
  await expect(
    page.getByText('Open PGWP valid through June 2029.'),
  ).toBeVisible();
  await expect(page.getByText(/onsite, hybrid, and remote/i)).toBeVisible();
  await expect(
    page.getByText(/relocation within Canada and the GTA/i),
  ).toBeVisible();
  await expect(
    page.getByText(/M\.A\. in Information Systems & Technology/i),
  ).toBeVisible();
  await expect(
    page.getByRole('link', { name: 'Email Mohamed', exact: true }),
  ).toHaveAttribute('href', 'mailto:mohamed.m.nader555@gmail.com');
});

test('desktop responsibility statements keep an editorial reading measure', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/experience');

  const statement = page.locator('.responsibility-groups article p').first();
  const box = await statement.boundingBox();

  expect(box).not.toBeNull();
  expect(box?.width).toBeLessThanOrEqual(704);
});
