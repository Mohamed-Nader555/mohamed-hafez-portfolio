import { expect, test } from '@playwright/test';

const lenses = [
  {
    path: '/',
    label: 'AI/ML Engineer',
    title: 'Mohamed Hafez — AI/ML Engineer',
    resume: '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
    firstProject: 'ASC-PIE',
  },
  {
    path: '/software',
    label: 'Software Engineer',
    title: 'Mohamed Hafez — Software Engineer',
    resume: '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
    firstProject: 'Northstar RAG System',
  },
  {
    path: '/android',
    label: 'Android Developer',
    title: 'Mohamed Hafez — Android Developer',
    resume: '/resumes/Mohamed-Hafez-Android-Developer.pdf',
    firstProject: 'Mind’s Eye',
  },
  {
    path: '/teaching',
    label: 'TA / Instructor',
    title: 'Mohamed Hafez — TA / Instructor',
    resume: '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    firstProject: 'Teaching & Technical Instruction',
  },
] as const;

for (const lens of lenses) {
  test(`${lens.label} route exposes role-specific evidence and metadata`, async ({
    page,
  }) => {
    await page.goto(lens.path);

    await expect(page).toHaveTitle(lens.title);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      lens.label,
    );
    await expect(
      page
        .getByRole('navigation', { name: 'Recruiter lens' })
        .getByRole('link', { name: lens.label, exact: true }),
    ).toHaveAttribute('aria-current', 'page');
    await expect(
      page.getByRole('link', { name: /résumé/i }).first(),
    ).toHaveAttribute('href', lens.resume);
    await expect(
      page
        .getByRole('region', { name: 'Featured work' })
        .getByRole('heading', { level: 3 })
        .first(),
    ).toHaveText(lens.firstProject);
  });
}

test('the default AI/ML hierarchy makes the full engineering and teaching breadth explicit', async ({
  page,
}) => {
  await page.goto('/');

  const hero = page.getByRole('region', { name: 'AI/ML Engineer overview' });
  await expect(hero).toContainText('Software Engineer');
  await expect(hero).toContainText('Android Developer');
  await expect(hero).toContainText('TA / Instructor');

  const headings = await page.locator('main h2').allTextContents();
  expect(headings).toEqual([
    '60-second evidence',
    'Featured work',
    'Experience & capabilities',
    'Research & teaching depth',
    'Start a direct conversation',
  ]);
});

test('lens, contact, resume, and case-study links remain real without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();

  await page.goto('/');

  const lensNavigation = page.getByRole('navigation', {
    name: 'Recruiter lens',
  });
  await expect(
    lensNavigation.getByRole('link', {
      name: 'Software Engineer',
      exact: true,
    }),
  ).toHaveAttribute('href', '/software');
  await lensNavigation
    .getByRole('link', { name: 'Software Engineer', exact: true })
    .click();
  await expect(page).toHaveURL(/\/software$/);

  await expect(
    page.getByRole('link', { name: 'Email Mohamed', exact: true }).first(),
  ).toHaveAttribute('href', 'mailto:mohamed.m.nader555@gmail.com');
  await expect(
    page.getByRole('link', { name: /Software Engineer résumé/i }).first(),
  ).toHaveAttribute('href', '/resumes/Mohamed-Hafez-Software-Engineer.pdf');

  const featured = page.getByRole('region', { name: 'Featured work' });
  await expect(
    featured.getByRole('link', { name: 'View Northstar RAG System evidence' }),
  ).toHaveAttribute('href', '/work/northstar-rag');
  await expect(
    featured.getByRole('link', {
      name: 'View Dive Simulation & Safety Profile Planner evidence',
    }),
  ).toHaveAttribute('href', '/work/dive');

  await context.close();
});

for (const width of [320, 360, 820, 1440]) {
  test(`lens hierarchy has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 600 ? 900 : 1100 });
    await page.goto('/android');

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await expect(
      page.getByRole('region', { name: 'Featured work' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Direct contact' }),
    ).toBeAttached();
  });
}
