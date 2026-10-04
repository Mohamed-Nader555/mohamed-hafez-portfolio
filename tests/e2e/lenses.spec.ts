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
        .getByRole('region', { name: 'Work I’m proud of' })
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

test('AI/ML depth exposes ASC-PIE and SPRINT-PP with official-first sourcing', async ({
  page,
}) => {
  await page.goto('/');

  const depth = page.getByRole('region', { name: 'Research & teaching depth' });
  await expect(depth).toContainText('ASC-PIE');
  await expect(depth).toContainText(
    'SPRINT-PP is a research paper submitted and under review.',
  );
  await expect(
    depth.getByRole('link', { name: 'Source · YorkSpace thesis record' }),
  ).toHaveAttribute(
    'href',
    'https://yorkspace.library.yorku.ca/items/379ae5c1-63dc-4036-bd47-f27a01cd195e',
  );
  const sprintStatus = depth
    .getByRole('article')
    .filter({ hasText: 'SPRINT-PP research status' });
  await expect(
    sprintStatus.getByRole('link', { name: 'Source · AI/ML Engineer résumé' }),
  ).toHaveAttribute('href', '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf');
  await expect(sprintStatus.locator('a[href="/research/asc-pie"]')).toHaveCount(
    0,
  );
  await expect(page.locator('body')).not.toContainText(
    /published SPRINT-PP|accepted SPRINT-PP/i,
  );
});

test('teaching depth exposes CEH as training with the matching resume source', async ({
  page,
}) => {
  await page.goto('/teaching');

  const depth = page.getByRole('region', { name: 'Research & teaching depth' });
  await expect(depth).toContainText(
    'Mohamed completed CEH training; he did not receive an official CEH certification.',
  );
  const ceh = depth
    .getByRole('article')
    .filter({ hasText: 'CEH training status' });
  await expect(
    ceh.getByRole('link', { name: 'Source · TA / Instructor résumé' }),
  ).toHaveAttribute('href', '/resumes/Mohamed-Hafez-TA-Instructor.pdf');
  await expect(page.locator('body')).not.toContainText(/CEH certified/i);
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

  const featured = page.getByRole('region', { name: 'Work I’m proud of' });
  await expect(
    featured.getByRole('link', {
      name: 'Read the story: Northstar RAG System',
    }),
  ).toHaveAttribute('href', '/work/northstar-rag');
  await expect(
    featured.getByRole('link', {
      name: 'Read the story: Dive Simulation & Safety Profile Planner',
    }),
  ).toHaveAttribute('href', '/work/dive');

  await context.close();
});

// The four featured cards use the story-card look: kicker, title, hook, up to
// three chips, a status badge (when the project has one), and one link to the
// project's story. Teaching has no page, so its card links to the teaching
// section on the same page.
const featuredCards = {
  '/': [
    ['ASC-PIE', '/work/asc-pie'],
    ['SPRINT-PP', '/work/sprint-pp'],
    ['Northstar RAG System', '/work/northstar-rag'],
    ['Applied Machine Learning Portfolio', '/work/applied-ml-portfolio'],
  ],
  '/software': [
    ['Northstar RAG System', '/work/northstar-rag'],
    [
      'Documentum Workflow & Lifecycle Optimization',
      '/work/documentum-workflows',
    ],
    ['This Portfolio', '/work/this-portfolio'],
    ['Internal REST Endpoints & Client Proofs of Concept', '/work/rest-pocs'],
  ],
  '/android': [
    ['Mind’s Eye', '/work/minds-eye'],
    ['Dive Simulation & Safety Profile Planner', '/work/dive'],
    ['Dostava Delivery', '/work/dostava'],
    ['Healthy Habit / Food Planner', '/work/food-planner'],
  ],
  '/teaching': [
    ['Teaching & Technical Instruction', '#teaching-portfolio'],
    ['ASC-PIE', '/work/asc-pie'],
    ['Mind’s Eye', '/work/minds-eye'],
    [
      'Documentum Workflow & Lifecycle Optimization',
      '/work/documentum-workflows',
    ],
  ],
} as const;

for (const [path, cards] of Object.entries(featuredCards)) {
  test(`${path} featured work shows four story cards that link to their stories`, async ({
    page,
  }) => {
    await page.goto(path);

    const featured = page.getByRole('region', { name: 'Work I’m proud of' });
    const articles = featured.locator('article.story-card');
    await expect(articles).toHaveCount(4);

    for (const [index, [title, href]] of cards.entries()) {
      const card = articles.nth(index);
      await expect(card.getByRole('heading', { level: 3 })).toHaveText(title);
      // One link per card, pointing at the story (or the teaching anchor).
      await expect(card.getByRole('link')).toHaveCount(1);
      await expect(card.getByRole('link')).toHaveAttribute('href', href);
      // The hook, not the old summary/ownership pair.
      await expect(card.locator('.story-card__hook')).not.toBeEmpty();
      await expect(card.locator('.project-card__ownership')).toHaveCount(0);
      expect(
        await card.locator('.technology-list li').count(),
      ).toBeLessThanOrEqual(3);
    }

    // Projects with a page carry a status badge; the teaching record has none.
    const badges = featured.locator('.status-badge__pill');
    await expect(badges).toHaveCount(path === '/teaching' ? 3 : 4);
  });
}

test('the ASC-PIE card opens the story page, not the research record', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const link = page
    .getByRole('region', { name: 'Work I’m proud of' })
    .getByRole('link', { name: 'Read the story: ASC-PIE' });
  await expect(link).toHaveAttribute('href', '/work/asc-pie');
  await link.click();
  // The first visit compiles the case-study page in the dev server.
  await expect(page).toHaveURL(/\/work\/asc-pie$/, { timeout: 30_000 });
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
      page.getByRole('region', { name: 'Work I’m proud of' }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Direct contact' }),
    ).toBeAttached();
  });
}
