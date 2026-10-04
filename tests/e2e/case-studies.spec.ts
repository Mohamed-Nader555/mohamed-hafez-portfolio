import { expect, test } from '@playwright/test';

// Brief §4: 28 projects get a `/work` page (6 flagship + 11 story + 11
// brief). This is hardcoded rather than imported from `@/data/projects`
// because Playwright's default TS transform does not resolve this repo's
// `@/*` tsconfig path aliases (used throughout `src/data`), unlike Vitest's
// aliased config. Keep this in sync with `src/data/projects.ts`.
const FLAGSHIP_SLUGS = [
  'asc-pie',
  'sprint-pp',
  'northstar-rag',
  'minds-eye',
  'dive',
  'dostava',
] as const;
const STORY_SLUGS = [
  'applied-ml-portfolio',
  'cti-intrusion-detection',
  'search-for-eats',
  'mercato',
  'food-planner',
  'weather-checker',
  'shop-on-the-go',
  'documentum-workflows',
  'pdf-utilities',
  'rest-pocs',
  'this-portfolio',
] as const;
const BRIEF_SLUGS = [
  'your-life-is-my-life',
  'death-ninja',
  'cloud-backend',
  'restaurant-management',
  'online-tic-tac-toe',
  'gulf-arab-chat',
  'tourist-guide',
  'sams',
  'donation-app',
  'my-card',
  'top-notch',
] as const;
const ALL_PAGE_SLUGS = [...FLAGSHIP_SLUGS, ...STORY_SLUGS, ...BRIEF_SLUGS];

test('work index renders every flagship, story, and brief project as a card', async ({
  page,
}) => {
  await page.goto('/work');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    "Things I've built",
  );

  const links = page.locator('main a[href^="/work/"]:not([href="/work/"])');
  await expect(links).toHaveCount(ALL_PAGE_SLUGS.length);

  // Read each href individually rather than in one evaluateAll(): this page
  // renders 28 cards with `data-astro-prefetch`, and a single batched
  // evaluateAll() call has occasionally raced with the browser's viewport
  // prefetching and thrown "Execution context was destroyed" mid-read.
  const count = await links.count();
  const hrefs: (string | null)[] = [];
  for (let index = 0; index < count; index += 1) {
    hrefs.push(await links.nth(index).getAttribute('href'));
  }

  expect(hrefs.map((href) => href?.replace('/work/', '')).sort()).toEqual(
    [...ALL_PAGE_SLUGS].sort(),
  );
});

test.describe('focus filter', () => {
  test('clicking a chip toggles hidden cards, aria-pressed, the URL, and the live region', async ({
    page,
  }) => {
    await page.goto('/work');

    const androidChip = page.locator('[data-focus-chip="android"]');
    const allChip = page.locator('[data-focus-chip="all"]');
    await expect(allChip).toHaveAttribute('aria-pressed', 'true');

    const dostavaCard = page.locator(
      '[data-focus]:has(a[href="/work/dostava"])',
    );
    const ascPieCard = page.locator(
      '[data-focus]:has(a[href="/work/asc-pie"])',
    );
    await expect(dostavaCard).toBeVisible();
    await expect(ascPieCard).toBeVisible();

    await androidChip.click();

    await expect(androidChip).toHaveAttribute('aria-pressed', 'true');
    await expect(allChip).toHaveAttribute('aria-pressed', 'false');
    await expect(dostavaCard).toBeVisible();
    await expect(ascPieCard).toBeHidden();
    await expect(page).toHaveURL(/[?&]focus=android/);

    const liveRegion = page.locator('[data-focus-live]');
    await expect(liveRegion).toHaveText(/\d+ projects? shown\./);
  });

  test('loading /work?focus=android directly pre-filters the page', async ({
    page,
  }) => {
    await page.goto('/work?focus=android');

    await expect(page.locator('[data-focus-chip="android"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(
      page.locator('[data-focus]:has(a[href="/work/asc-pie"])'),
    ).toBeHidden();
    await expect(
      page.locator('[data-focus]:has(a[href="/work/dostava"])'),
    ).toBeVisible();
  });

  test('every card is visible and filtering has no effect without JavaScript', async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/work');

    const links = page.locator('main a[href^="/work/"]:not([href="/work/"])');
    await expect(links).toHaveCount(ALL_PAGE_SLUGS.length);

    // Cards are server-rendered without a `hidden` attribute; the filter
    // module that would apply it never executes without JavaScript.
    const hiddenCount = await page.locator('[data-focus][hidden]').count();
    expect(hiddenCount).toBe(0);
    await expect(
      page.locator('[data-focus]:has(a[href="/work/asc-pie"])'),
    ).toBeVisible();

    await context.close();
  });
});

const HEADING_SPOT_CHECKS = [
  {
    slug: 'asc-pie',
    tier: 'flagship',
    title: 'ASC-PIE',
    headings: [
      'The problem',
      'Who it was for',
      'My role',
      'What I built',
      'How it works',
      'Decisions that mattered',
      'Hard problems I solved',
      'Tech stack',
      'Outcome',
      'What I learned',
      'What I’d do next',
      'Links',
    ],
  },
  {
    slug: 'food-planner',
    tier: 'story',
    title: 'Healthy Habit / Food Planner',
    headings: [
      'The problem',
      'Who it was for',
      'My role',
      'What I built',
      'How it works',
      'Decisions that mattered',
      'Tech stack',
      'Outcome',
      'What I learned',
    ],
  },
  {
    slug: 'gulf-arab-chat',
    tier: 'brief',
    title: 'Gulf Arab Chat',
    headings: ['The problem', 'What I built', 'Tech stack', 'What I learned'],
  },
] as const;

for (const study of HEADING_SPOT_CHECKS) {
  test(`${study.tier} case study (${study.slug}) has an H1, passport, technologies list, and ordered H2s`, async ({
    page,
  }) => {
    await page.goto(`/work/${study.slug}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      study.title,
    );

    const passport = page.locator('.project-passport');
    await expect(passport).toBeVisible();
    const passportLabels = await passport.locator('dt').allTextContents();
    expect(passportLabels).toEqual(
      expect.arrayContaining(['My role', 'Context', 'Status']),
    );

    await expect(
      page.getByRole('list', { name: `${study.title} technologies` }),
    ).toBeVisible();

    // `<RelatedProjects>` renders its own "Related projects" <h2> inside the
    // same `<article>`, after the page's own §5.3 section headings.
    expect(await page.locator('article h2').allTextContents()).toEqual([
      ...study.headings,
      'Related projects',
    ]);
  });
}

test('TOC links on a flagship page resolve to their section', async ({
  page,
}) => {
  await page.goto('/work/asc-pie');

  const tocLinks = page.locator('[data-toc-link]');
  await expect(tocLinks).toHaveCount(HEADING_SPOT_CHECKS[0].headings.length);

  const outcomeLink = page.getByRole('link', { name: 'Outcome', exact: true });
  const targetId = await outcomeLink.getAttribute('data-toc-target');
  expect(targetId).toBeTruthy();

  await outcomeLink.click();
  await expect(page).toHaveURL(new RegExp(`#${targetId}$`));
  await expect(page.locator(`#${targetId}`)).toBeAttached();
  await expect(
    page.locator(`#${targetId}`).getByText('Outcome', { exact: true }),
  ).toBeVisible();
});

const expectedEdges = {
  'asc-pie': [
    ['data-sources', 'schema-mapping'],
    ['schema-mapping', 'fixed-splits'],
    ['fixed-splits', 'synced-exports'],
    ['synced-exports', 'model-families'],
    ['model-families', 'canonical-parser'],
    ['canonical-parser', 'shared-evaluator'],
  ],
  'minds-eye': [
    ['wearable-input', 'android-client'],
    ['android-client', 'python-service'],
    ['android-client', 'cloud-vision'],
    ['python-service', 'speech-output'],
    ['cloud-vision', 'speech-output'],
    ['android-client', 'firebase'],
  ],
  dive: [
    ['android-client', 'model-api'],
    ['model-api', 'result'],
    ['result', 'recommend-loop'],
    ['recommend-loop', 'model-api'],
    ['android-client', 'erdpml'],
    ['android-client', 'firebase-services'],
    ['android-client', 'location-weather'],
  ],
  dostava: [
    ['android-interface', 'mvvm-presentation'],
    ['mvvm-presentation', 'firebase-auth'],
    ['mvvm-presentation', 'realtime-database'],
    ['realtime-database', 'order-status'],
    ['mvvm-presentation', 'firebase-storage'],
  ],
} as const;

// Brief §6.6: these four architectures deliberately changed from the old
// (pre-rewrite) test expectations. Verify the rendered edges match
// `src/data/architectures.ts` exactly.
for (const [slug, edges] of Object.entries(expectedEdges)) {
  test(`${slug} architecture renders exactly the edges in architectures.ts`, async ({
    page,
  }) => {
    await page.goto(`/work/${slug}`);

    const renderedEdges = await page
      .locator('.architecture-flow__edges [data-edge-from][data-edge-to]')
      .evaluateAll((items) =>
        items.map((item) => [
          item.getAttribute('data-edge-from'),
          item.getAttribute('data-edge-to'),
        ]),
      );

    expect(renderedEdges).toEqual(edges);
  });
}

// Regression: ArchitectureFlow once rendered as unstyled numbered lists on
// every diagram page because its class names matched no CSS. Check one linear
// (asc-pie) and one branched (dive) page, plus the research record.
for (const route of ['/work/asc-pie', '/work/dive', '/research/asc-pie']) {
  test(`${route} architecture diagram is styled and contained`, async ({
    page,
  }) => {
    await page.goto(route);

    const figure = page.locator('.architecture-flow').first();
    await expect(figure).toBeVisible();

    await expect(figure.locator('.architecture-flow__nodes')).toHaveCSS(
      'display',
      'grid',
    );
    await expect(figure.locator('.architecture-flow__nodes')).toHaveCSS(
      'list-style-type',
      'none',
    );
    await expect(figure.locator('.architecture-flow__pipeline')).toHaveCSS(
      'display',
      'flex',
    );
    await expect(figure).not.toHaveCSS('border-top-width', '0px');
    await expect(figure).not.toHaveCSS('border-top-style', 'none');

    const overflow = await figure.evaluate((el) => ({
      figure: el.scrollWidth - el.clientWidth,
      lists: [
        ...el.querySelectorAll(
          '.architecture-flow__pipeline, .architecture-flow__nodes, .architecture-flow__edges',
        ),
      ].map((list) => {
        const box = list.getBoundingClientRect();
        const outer = el.getBoundingClientRect();
        return (
          list.scrollWidth - list.clientWidth <= 0 &&
          box.left >= outer.left - 1 &&
          box.right <= outer.right + 1
        );
      }),
    }));
    expect(overflow.figure).toBeLessThanOrEqual(0);
    expect(overflow.lists).toEqual([true, true, true]);
  });
}

// Parent brief §5.8 / §9: the six required widths on the index, one page per
// tier (flagship, story, brief; the card tier has no page), and, in
// research-accuracy.spec.ts, the research record.
for (const path of [
  '/work',
  '/work/asc-pie',
  '/work/mercato',
  '/work/my-card',
]) {
  for (const width of [320, 360, 390, 768, 1024, 1440]) {
    test(`${path} has no horizontal overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width < 600 ? 1000 : 1180 });
      await page.goto(path);

      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(width);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });
  }
}

// Brief §5.7: dive and dostava have real screenshots today; minds-eye and
// death-ninja are still empty in `src/data/project-images.ts` pending a
// parallel media-pipeline pass, so they're intentionally not asserted here.
for (const slug of ['dive', 'dostava'] as const) {
  test(`${slug} gallery renders screenshots at the constrained device-row size`, async ({
    page,
  }) => {
    await page.goto(`/work/${slug}`);

    const gallery = page.locator('.project-gallery');
    const galleryCount = await gallery.count();
    expect(galleryCount).toBeGreaterThan(0);

    const pictures = gallery.locator('.project-screenshot picture');
    await expect(pictures.first()).toBeVisible();
    const maxWidths = await gallery
      .locator('.project-screenshot')
      .evaluateAll((items) =>
        items.map((item) => {
          const picture = item.querySelector('picture');
          return picture ? getComputedStyle(picture).maxInlineSize : null;
        }),
      );
    expect(maxWidths.every((value) => value && value !== 'none')).toBe(true);
  });
}

// Brief §5.7 / task brief: the Dive "Check → Recommend" ScreenFlow may land
// from a parallel media-pipeline pass. Assert it only if dive.mdx already
// references <ScreenFlow>, so this suite doesn't fail on a component that
// hasn't been wired in yet.
test('Dive ScreenFlow renders the check-to-recommend loop', async ({
  page,
}) => {
  await page.goto('/work/dive');

  const screenFlow = page.locator('.screen-flow');
  const screenFlowCount = await screenFlow.count();
  expect(screenFlowCount).toBeGreaterThan(0);

  await expect(screenFlow).toBeVisible();
  await expect(screenFlow.locator('li')).toHaveCount(3, { timeout: 1000 });
});

test('the work index counts case studies, and no label says "story"', async ({
  page,
}) => {
  await page.goto('/work');
  await expect(page.locator('.work-index__counter')).toContainText(
    '28 case studies',
  );
  await expect(page.locator('main')).not.toContainText(
    /read the story|project stories/i,
  );
  await page.goto('/');
  await expect(page.locator('main')).not.toContainText(/read the story/i);
  await expect(
    page.getByRole('link', { name: /^Explore the project: / }).first(),
  ).toBeVisible();
});
