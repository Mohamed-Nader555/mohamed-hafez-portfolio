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

  await expect(
    page.locator('.case-study-card__ownership').first(),
  ).toContainText(/^Owned: Mohamed/);
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

test('case-study architecture exposes the same directed relationships visually and accessibly', async ({
  page,
}) => {
  await page.goto('/work/northstar-rag');

  const diagram = page.getByRole('figure', {
    name: /Northstar RAG System architecture/i,
  });
  await expect(diagram).toContainText('Document sources');
  await expect(diagram).toContainText('Grounded answer');
  await expect(diagram).toContainText(
    'Relationships: Document sources to Ingest and chunk; Ingest and chunk to Local embeddings; Local embeddings to Chroma retrieval; Chroma retrieval to Grounded answer.',
  );
  await expect(
    diagram.locator(
      '[data-edge-from="document-sources"][data-edge-to="ingest-chunk"]',
    ),
  ).toHaveCount(1);
  await expect(page.locator('body')).not.toContainText(
    /github-northstar-rag|github-dostava/i,
  );
  await expect(page.locator('a[href*="Northstar"]')).toHaveCount(0);
});

const expectedEdges = {
  'asc-pie': [
    ['privacy-datasets', 'preprocessing'],
    ['preprocessing', 'shared-pii-labels'],
    ['shared-pii-labels', 'model-training'],
    ['model-training', 'ner-evaluation'],
  ],
  'northstar-rag': [
    ['document-sources', 'ingest-chunk'],
    ['ingest-chunk', 'local-embeddings'],
    ['local-embeddings', 'chroma-retrieval'],
    ['chroma-retrieval', 'grounded-answer'],
  ],
  'minds-eye': [
    ['wearable-input', 'android-client'],
    ['android-client', 'recognition-services'],
    ['recognition-services', 'ocr-vision-result'],
    ['ocr-vision-result', 'speech-output'],
  ],
  dive: [
    ['android-client', 'retrofit-api'],
    ['retrofit-api', 'safety-classifier'],
    ['android-client', 'firebase-services'],
    ['android-client', 'location-services'],
  ],
  dostava: [
    ['android-interface', 'mvvm-presentation'],
    ['mvvm-presentation', 'retrofit-services'],
    ['android-interface', 'room-persistence'],
    ['delivery-workflows', 'firebase-notifications'],
    ['delivery-workflows', 'maps-tracking'],
  ],
} as const;

for (const [slug, edges] of Object.entries(expectedEdges)) {
  test(`${slug} architecture renders only its documented directed edges`, async ({
    page,
  }) => {
    await page.goto(`/work/${slug}`);

    const renderedEdges = await page
      .locator('.architecture-diagram [data-edge-from][data-edge-to]')
      .evaluateAll((items) =>
        items.map((item) => [
          item.getAttribute('data-edge-from'),
          item.getAttribute('data-edge-to'),
        ]),
      );

    expect(renderedEdges).toEqual(edges);
  });
}

for (const slug of ['dive', 'dostava'] as const) {
  for (const width of [320, 360, 720, 820, 1440]) {
    test(`${slug} branched architecture remains readable without overflow at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width < 600 ? 1000 : 1180 });
      await page.goto(`/work/${slug}`);

      const diagram = page.locator('.architecture-diagram');
      await expect(diagram).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(width);

      const edgeBoxes = await diagram
        .locator('[data-edge-from][data-edge-to]')
        .evaluateAll((items) =>
          items.map((item) => {
            const box = item.getBoundingClientRect();
            return { left: box.left, right: box.right, width: box.width };
          }),
        );
      expect(edgeBoxes).toHaveLength(expectedEdges[slug].length);
      expect(
        edgeBoxes.every(
          ({ left, right, width: edgeWidth }) =>
            left >= 0 && right <= width && edgeWidth > 0,
        ),
      ).toBe(true);
    });
  }
}

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
