import { expect, test } from '@playwright/test';

test('thesis page states the official degree and the accepted-paper status accurately', async ({
  page,
}) => {
  await page.goto('/research/asc-pie');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition',
  );
  await expect(page.getByText(/officially awarded in 2026/i)).toBeVisible();

  const sprintStatus = page.getByRole('group', { name: 'SPRINT-PP status' });
  await expect(sprintStatus).toContainText(/accepted to IEEE CASCON 2026/i);
  await expect(page.getByRole('link', { name: /YorkSpace/i })).toHaveAttribute(
    'href',
    /yorku\.ca/,
  );
  await expect(page.locator('body')).not.toContainText(
    /published SPRINT-PP|under review|CEH certified|BERT-base-cased/i,
  );
});

test('thesis page shows the supervisor and the paper line without an author list', async ({
  page,
}) => {
  await page.goto('/research/asc-pie');

  const meta = page.locator('.research-meta');
  await expect(meta).toContainText('Prof. Marin Litoiu');
  await expect(meta).toContainText('CERAS Lab');
  await expect(meta).toContainText(
    'ASC-PIE and SPRINT-PP: Evaluating Privacy-Safe Continual Learning for PII Extraction',
  );
  await expect(meta).toContainText(/accepted to IEEE CASCON 2026/i);
  // The paper line carries a title and a status, never names.
  await expect(meta.locator('dd').nth(1)).not.toContainText(/Hafez|Litoiu/);
});

test('thesis page quotes the abstract and answers all four research questions', async ({
  page,
}) => {
  await page.goto('/research/asc-pie');

  const abstract = page.locator('.research-abstract blockquote');
  await expect(abstract).toContainText(
    'The robust extraction of Personally Identifiable Information (PII)',
  );
  await expect(abstract).toContainText('knowledge retention.');

  const answers = page.getByRole('region', {
    name: 'Answers to the four research questions',
  });
  await expect(answers.locator('article.research-answer')).toHaveCount(4);
  for (const label of ['RQ1', 'RQ2', 'RQ3', 'RQ4']) {
    await expect(
      answers.getByRole('heading', { level: 3, name: new RegExp(label) }),
    ).toBeVisible();
  }
  await expect(page.locator('#rq3')).toContainText('83.5%');
  await expect(page.locator('#rq3')).toContainText('25.6%');
});

test('thesis page charts carry the deck numbers, including validity', async ({
  page,
}) => {
  await page.goto('/research/asc-pie');

  // Prompting vs. fine-tuning (CompareTable).
  const prompting = page.getByRole('table', {
    name: /fine-tuned versus in-context prompting/i,
  });
  await expect(prompting.getByRole('row')).toHaveCount(7);
  const qwenKv = prompting.getByRole('row', {
    name: /Qwen2\.5-7B · key-value, 3-shot/,
  });
  await expect(qwenKv).toContainText('0.778');
  await expect(qwenKv).toContainText('0.950');
  await expect(
    prompting.getByRole('row', { name: /Qwen2\.5-7B · fine-tuned/ }),
  ).toContainText('0.400');
  await expect(
    prompting.getByRole('row', { name: /Llama3\.1-8B · JSON, 5-shot/ }),
  ).toContainText('0.705');

  // Corpus ablation (grouped ResultBars), via its text fallback table.
  const ablation = page
    .locator('figure.result-bars')
    .filter({ hasText: 'Public-only vs. full ASC-PIE' });
  await expect(ablation.locator('table tbody tr')).toHaveText([
    /Precision\s*0\.640\s*0\.989/,
    /Recall\s*0\.307\s*0\.995/,
    /F1\s*0\.415\s*0\.992/,
  ]);

  // Per-type gains (CompareTable) with the small-support caveat.
  const perType = page.getByRole('table', {
    name: /Selected per-type strict F1/,
  });
  await expect(perType.getByRole('row')).toHaveCount(14);
  await expect(
    perType.locator('tbody tr').filter({ hasText: 'JOBTITLE' }),
  ).toContainText('+0.9982');
  await expect(page.locator('#rq4')).toContainText(
    /5 TIME mentions and 3 TAXNUM mentions/,
  );

  // Validity column on the model-family chart.
  const families = page.locator('.bar-chart--validity > div');
  await expect(families).toHaveCount(7);
  const validity = await families.evaluateAll((rows) =>
    rows.map((row) => [
      row.querySelector('span')?.textContent,
      row.querySelector('small')?.textContent,
    ]),
  );
  expect(validity).toEqual([
    ['RoBERTa-large', 'validity 1.000'],
    ['FLAN-T5-base', 'validity 1.000'],
    ['ModernBERT-large', 'validity 1.000'],
    ['BERT-large-cased', 'validity 1.000'],
    ['Llama 3.1 8B', 'validity 0.814'],
    ['Qwen 2.5 7B', 'validity 0.543'],
    ['BART-base', 'validity 0.561'],
  ]);
});

for (const width of [320, 360, 390, 768, 1440]) {
  test(`thesis page has no horizontal overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/research/asc-pie');

    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  });
}

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
