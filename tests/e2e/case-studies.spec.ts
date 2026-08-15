import { expect, test } from '@playwright/test';

const caseStudies = [
  {
    slug: 'asc-pie',
    title: 'ASC-PIE',
    ownership: /Mohamed designed and built/i,
    technology: 'PyTorch',
    evidence: /YorkSpace thesis record/i,
  },
  {
    slug: 'northstar-rag',
    title: 'Northstar RAG System',
    ownership: /Mohamed independently built/i,
    technology: 'Chroma',
    evidence: /AI\/ML Engineer résumé/i,
  },
  {
    slug: 'minds-eye',
    title: "Mind's Eye",
    ownership: /Mohamed delivered more than 80%/i,
    technology: 'Tesseract OCR',
    evidence: /Android Developer résumé/i,
  },
  {
    slug: 'dive',
    title: 'Dive Simulation & Safety Profile Planner',
    ownership: /Mohamed owned and implemented.*end to end/i,
    technology: 'scikit-learn',
    evidence: /Dive Simulation repository/i,
  },
  {
    slug: 'dostava',
    title: 'Dostava Delivery',
    ownership: /Mohamed delivered the Android application/i,
    technology: 'MVVM',
    evidence: /Android Developer résumé/i,
  },
] as const;

test('work index publishes exactly the five curated detailed case studies', async ({
  page,
}) => {
  await page.goto('/work');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Evidence-led work',
  );
  const links = page.locator('main a[href^="/work/"]');
  await expect(links).toHaveCount(5);
  expect(
    (
      await links.evaluateAll((items) =>
        items.map((item) => item.getAttribute('href')),
      )
    ).sort(),
  ).toEqual(caseStudies.map(({ slug }) => `/work/${slug}`).sort());
});

for (const study of caseStudies) {
  test(`${study.title} exposes ownership, technology, evidence, and ordered narrative`, async ({
    page,
  }) => {
    await page.goto(`/work/${study.slug}`);

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      study.title,
    );
    await expect(page.getByText(study.ownership).first()).toBeVisible();
    await expect(
      page.getByRole('list', { name: `${study.title} technologies` }),
    ).toContainText(study.technology);
    await expect(
      page.getByRole('region', { name: 'Public evidence' }).getByRole('link', {
        name: study.evidence,
      }),
    ).toBeVisible();

    expect(await page.locator('article h2').allTextContents()).toEqual([
      'Context',
      'Ownership',
      'Constraints',
      'Architecture',
      'Implementation',
      'Outcome',
      'Evidence',
      'Reflection',
    ]);
  });
}

test('case-study architecture is accessible and suppressed repositories stay private', async ({
  page,
}) => {
  await page.goto('/work/northstar-rag');

  const diagram = page.getByRole('figure', {
    name: /Northstar RAG System architecture/i,
  });
  await expect(diagram).toContainText('Document sources');
  await expect(diagram).toContainText('Grounded answer');
  await expect(page.locator('body')).not.toContainText(
    /github-northstar-rag|github-dostava/i,
  );
  await expect(page.locator('a[href*="Northstar"]')).toHaveCount(0);
});

test('tablet keeps the architecture sequence readable from left to right', async ({
  page,
}) => {
  await page.setViewportSize({ width: 820, height: 1180 });
  await page.goto('/work/northstar-rag');

  const steps = page.locator('.architecture-diagram li');
  const first = await steps.first().boundingBox();
  const last = await steps.last().boundingBox();

  expect(first).not.toBeNull();
  expect(last).not.toBeNull();
  expect(Math.abs((first?.y ?? 0) - (last?.y ?? 0))).toBeLessThan(8);
  expect(first?.x).toBeLessThan(last?.x ?? 0);
});

test('desktop long-form content remains usable at 200% zoom', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/work/northstar-rag');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '200%';
  });

  expect(
    await page.evaluate(
      () =>
        document.documentElement.scrollWidth <=
        document.documentElement.clientWidth,
    ),
  ).toBe(true);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Public evidence' }),
  ).toBeAttached();
});

for (const width of [320, 360, 820, 1440]) {
  test(`long-form routes have no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: width < 600 ? 900 : 1100 });
    await page.goto('/work/northstar-rag');

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Public evidence' }),
    ).toBeVisible();
  });
}
