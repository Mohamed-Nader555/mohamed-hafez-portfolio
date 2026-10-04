import { expect, test } from '@playwright/test';

const lenses = [
  {
    path: '/',
    label: 'AI/ML Engineer',
    title: 'Mohamed Hafez — AI/ML Engineer',
    resume: '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
    firstProject: 'ASC-PIE',
    heroPhrase: 'privacy-aware NLP',
  },
  {
    path: '/software',
    label: 'Software Engineer',
    title: 'Mohamed Hafez — Software Engineer',
    resume: '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
    firstProject: 'Northstar RAG System',
    heroPhrase: 'reliable services',
  },
  {
    path: '/android',
    label: 'Android Developer',
    title: 'Mohamed Hafez — Android Developer',
    resume: '/resumes/Mohamed-Hafez-Android-Developer.pdf',
    firstProject: 'Mind’s Eye',
    heroPhrase: 'Android products',
  },
  {
    path: '/teaching',
    label: 'TA / Instructor',
    title: 'Mohamed Hafez — TA / Instructor',
    resume: '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    firstProject: 'Teaching & Technical Instruction',
    heroPhrase: 'practical labs',
  },
] as const;

for (const lens of lenses) {
  test(`${lens.label} route exposes its hero, metadata, and featured work`, async ({
    page,
  }) => {
    await page.goto(lens.path);

    await expect(page).toHaveTitle(lens.title);
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('I’m Mohamed Hafez');
    await expect(heading).toContainText(lens.heroPhrase);
    await expect(
      page.getByRole('region', { name: `${lens.label} overview` }),
    ).toBeVisible();
    await expect(
      page
        .getByRole('navigation', { name: 'Professional focus' })
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
  // The first h2 is the project spotlight; the rest are the page sections.
  expect(headings.slice(1)).toEqual([
    'A focused view of my work',
    'Work I’m proud of',
    'Experience across research, products, and teaching',
    'Skills organized by how I use them',
    'How I help people learn',
    'The foundation behind my work',
    'Start a direct conversation',
  ]);
});

test('each lens spotlights its own project and never claims an unpublished SPRINT-PP', async ({
  page,
}) => {
  const spotlights = [
    ['/', 'ASC-PIE', '/research/asc-pie'],
    ['/software', 'Northstar RAG System', '/work/northstar-rag'],
    ['/android', 'Mind’s Eye', '/work/minds-eye'],
    [
      '/teaching',
      'Teaching & Technical Instruction',
      '/experience#teaching-and-communication-title',
    ],
  ] as const;

  for (const [path, title, href] of spotlights) {
    await page.goto(path);
    const spotlight = page.getByRole('complementary', {
      name: 'Project spotlight',
    });
    await expect(spotlight).toContainText(title);
    await expect(spotlight.getByRole('link')).toHaveAttribute('href', href);
    await expect(page.locator('body')).not.toContainText(
      /published SPRINT-PP|accepted SPRINT-PP|under review/i,
    );
  }
});

test('certificates list CEH as a training programme, never a certification', async ({
  page,
}) => {
  await page.goto('/teaching');

  const credentials = page.getByRole('region', {
    name: 'Certificates and training',
  });
  await expect(
    credentials.getByText('Certified Ethical Hacker (CEH)'),
  ).toBeVisible();
  await expect(credentials).toContainText(/training programme only/i);
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
    name: 'Professional focus',
  });
  await expect(
    lensNavigation.getByRole('link', {
      name: 'Software Engineer',
      exact: true,
    }),
  ).toHaveAttribute('href', '/?role=software');
  await lensNavigation
    .getByRole('link', { name: 'Software Engineer', exact: true })
    .click();
  await expect(page).toHaveURL(/\?role=software$/);

  await expect(
    page.getByRole('link', { name: 'Email Mohamed', exact: true }).first(),
  ).toHaveAttribute('href', 'mailto:mohamed.m.nader555@gmail.com');
  await expect(
    page.getByRole('link', { name: /Software Engineer résumé/i }).first(),
  ).toHaveAttribute('href', '/resumes/Mohamed-Hafez-Software-Engineer.pdf');

  const featured = page.getByRole('region', { name: 'Work I’m proud of' });
  await expect(
    featured.getByRole('link', {
      name: 'Explore the project: Northstar RAG System',
    }),
  ).toHaveAttribute('href', '/work/northstar-rag');
  await expect(
    featured.getByRole('link', {
      name: 'Explore the project: Documentum Workflow & Lifecycle Optimization',
    }),
  ).toHaveAttribute('href', '/work/documentum-workflows');

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
  test(`${path} featured work shows four project cards that link to their case studies`, async ({
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
      ).toBeLessThanOrEqual(5);
      // The richer anatomy: decorative cover, full summary, and a role line.
      await expect(card.locator('.story-card__cover')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      await expect(card.locator('.story-card__summary')).not.toBeEmpty();
      await expect(card.locator('.story-card__role')).toContainText('My role');
      if (href !== '#teaching-portfolio')
        await expect(card.locator('.story-card__context')).not.toBeEmpty();
    }

    // Projects with a page carry a status badge; the teaching record has none.
    const badges = featured.locator('.status-badge__pill');
    await expect(badges).toHaveCount(path === '/teaching' ? 3 : 4);
  });
}

test('the ASC-PIE card opens the case study, not the research record', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');

  const link = page
    .getByRole('region', { name: 'Work I’m proud of' })
    .getByRole('link', { name: 'Explore the project: ASC-PIE' });
  await expect(link).toHaveAttribute('href', '/work/asc-pie');
  await link.click();
  // The first visit compiles the case-study page in the dev server.
  await expect(page).toHaveURL(/\/work\/asc-pie$/, { timeout: 30_000 });
});

for (const width of [320, 360, 390, 768, 820, 1024, 1440]) {
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

test('the whole home card is clickable through its single link', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const card = page
    .getByRole('region', { name: 'Work I’m proud of' })
    .locator('article.story-card')
    .first();
  await expect(card.getByRole('link')).toHaveCount(1);
  // Click the summary, not the link: the link's ::after covers the card.
  await card.scrollIntoViewIfNeeded();
  const box = (await card.locator('.story-card__summary').boundingBox())!;
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page).toHaveURL(/\/work\/asc-pie$/, { timeout: 30_000 });
});

test('cards show allowlisted key facts only where a number exists', async ({
  page,
}) => {
  await page.goto('/android');
  const cards = page
    .getByRole('region', { name: 'Work I’m proud of' })
    .locator('article.story-card');
  // Mind's Eye and Dive and Dostava carry facts; Food Planner has none.
  await expect(cards.nth(0).locator('.story-card__facts li')).not.toHaveCount(
    0,
  );
  await expect(cards.nth(3).locator('.story-card__facts')).toHaveCount(0);
});
