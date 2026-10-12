import { expect, test, type Page } from '@playwright/test';

const question = 'What technologies did Mohamed use in Dostava?';
const answered = {
  requestId: 'e2e-request',
  answer: 'Dostava is built on Firebase services.',
  answerStatus: 'answered',
  citations: [
    {
      sourceId: 'case-study-dostava',
      label: 'Dostava case study',
      href: '/work/dostava',
    },
  ],
  followUps: [],
  telemetry: { questionCategory: 'project', latencyBucket: 'lt-500ms' },
};

async function openAssistant(page: Page) {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page
    .getByRole('button', { name: /open Mohamed AI portfolio assistant/i })
    .click();
  return page.getByRole('textbox', { name: /your question/i });
}

async function ask(page: Page) {
  const textbox = await openAssistant(page);
  await textbox.fill(question);
  await page.getByRole('button', { name: /send question/i }).click();
  return textbox;
}

test('assistant opens, keeps keyboard focus, and closes with Escape', async ({
  page,
}) => {
  await page.goto('/');
  await page.waitForTimeout(1000);
  await page
    .getByRole('button', { name: /open Mohamed AI portfolio assistant/i })
    .click();
  await expect(
    page.getByRole('dialog', { name: /Mohamed AI portfolio assistant/i }),
  ).toBeVisible();
  await expect(page.getByText(/AI & ML context/i)).toBeVisible();
  await expect(
    page.getByRole('textbox', { name: /your question/i }),
  ).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('happy path works on localhost with Cloudflare test keys', async ({
  page,
}) => {
  let body: { turnstileToken?: string; question?: string } = {};
  await page.route('**/api/chat', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ json: answered });
  });
  await ask(page);
  await expect(page.getByText(answered.answer)).toBeVisible();
  // The sources sit inside a collapsed disclosure, so check the DOM.
  await expect(page.locator('.chat-citations a')).toHaveText([
    'Dostava case study',
  ]);
  expect(body.turnstileToken).toBe('XXXX.DUMMY.TOKEN.XXXX');
  expect(body.question).toBe(question);
});

const failures: Array<{
  name: string;
  respond: Parameters<Page['route']>[1];
  message: RegExp;
}> = [
  {
    name: '403 verification failed',
    respond: (route) => route.fulfill({ status: 403, json: {} }),
    message: /human check didn’t pass/i,
  },
  {
    name: '429 rate limited',
    respond: (route) =>
      route.fulfill({
        status: 429,
        json: { code: 'rate_limited', retryAfterSeconds: 60 },
      }),
    message: /wait a minute before trying another question/i,
  },
  {
    name: '503 offline',
    respond: (route) => route.fulfill({ status: 503, json: {} }),
    message: /assistant is offline right now/i,
  },
  {
    name: '500 generic failure',
    respond: (route) => route.fulfill({ status: 500, json: {} }),
    message: /request could not be completed/i,
  },
  {
    name: 'network failure',
    respond: (route) => route.abort('failed'),
    message: /couldn’t reach the server/i,
  },
];

for (const failure of failures) {
  test(`shows its own message and keeps the draft: ${failure.name}`, async ({
    page,
  }) => {
    await page.route('**/api/chat', failure.respond);
    const textbox = await ask(page);
    const alert = page.getByRole('alert');
    await expect(alert).toContainText(failure.message);
    await expect(textbox).toHaveValue(question);
  });
}

test('the human-check slot lives inside the dialog, above the composer', async ({
  page,
}) => {
  await openAssistant(page);
  const dialog = page.getByRole('dialog', {
    name: /Mohamed AI portfolio assistant/i,
  });
  const slot = dialog.locator('.chat-turnstile-slot');
  await expect(slot).toHaveCount(1);
  const aboveComposer = await slot.evaluate(
    (node) =>
      node.closest('.chat-turnstile')?.nextElementSibling?.className ===
      'chat-composer',
  );
  expect(aboveComposer).toBe(true);
});

test('on localhost with no .dev.vars, a real question returns an answer with sources', async ({
  page,
}) => {
  const textbox = await openAssistant(page);
  await textbox.fill('How was Northstar built?');
  await page.getByRole('button', { name: /send question/i }).click();
  const message = page.locator('.chat-message').first();
  await expect(message).toBeVisible({ timeout: 30_000 });
  await expect(message).toContainText(/Northstar/);
  expect(await page.locator('.chat-citations a').count()).toBeGreaterThan(0);
  // The whole session stays on screen: a second question adds to the thread.
  await page
    .getByRole('textbox', { name: /your question/i })
    .fill('Tell me about Mohamed');
  await page.getByRole('button', { name: /send question/i }).click();
  await expect(page.locator('.chat-message')).toHaveCount(2, {
    timeout: 30_000,
  });
  await expect(page.locator('.chat-turn--user')).toHaveCount(2);
});

test('"Hiring for a role?" shows a stored brief at once and sends nothing', async ({
  page,
}) => {
  let requests = 0;
  await page.route('**/api/chat', async (route) => {
    requests += 1;
    await route.fulfill({ json: answered });
  });
  await openAssistant(page);
  await page.getByRole('button', { name: 'Hiring for a role?' }).click();
  const picker = page.getByRole('region', { name: /hiring for a role/i });
  await picker.getByRole('button', { name: 'NLP Engineer' }).click();

  const card = page.getByRole('article', { name: 'NLP Engineer' });
  await expect(card).toBeVisible();
  await expect(card.getByText('Mohamed’s answer')).toBeVisible();
  await expect(
    card.getByRole('heading', { name: 'Direct experience' }),
  ).toBeVisible();
  await expect(
    card.getByRole('link', { name: /open the full page/i }),
  ).toHaveAttribute('href', '/hiring/nlp-engineer');
  // The card fits the panel on any screen width.
  const overflow = await card.evaluate(
    (node) => node.scrollWidth - node.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);

  await page.getByRole('button', { name: /back to chat/i }).click();
  await expect(
    page.getByRole('textbox', { name: /your question/i }),
  ).toBeVisible();
  expect(requests).toBe(0);
});

test('a fallback answer says the full assistant was busy, and Try again asks again', async ({
  page,
}) => {
  const fallback = {
    ...answered,
    answer: 'A summary of verified facts.',
    answerStatus: 'fallback',
  };
  let calls = 0;
  await page.route('**/api/chat', async (route) => {
    calls += 1;
    await route.fulfill({ json: calls === 1 ? fallback : answered });
  });
  await ask(page);
  await expect(page.getByRole('note')).toHaveText(
    'The full assistant was busy, so this is a summary from the site.',
  );
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText(answered.answer)).toBeVisible();
  await expect(page.getByRole('note')).toHaveCount(0);
  expect(calls).toBe(2);
});

test('a pasted job description comes back as a brief card, and the field empties', async ({
  page,
}) => {
  const pasted =
    'Backend Engineer. Requirements: Java, Spring Boot, REST APIs.';
  let sent: { jobDescription?: string; question?: string } = {};
  await page.route('**/api/chat', async (route) => {
    sent = route.request().postDataJSON();
    await route.fulfill({
      json: {
        ...answered,
        answer: 'Job description brief',
        citations: [],
        brief: {
          title: 'Job description brief',
          summary: {
            label: 'Summary',
            text: '2 requirements in the posting: 1 direct, 0 related, 1 not shown on the site.',
          },
          groups: [
            {
              id: 'direct',
              label: 'Direct experience',
              items: [{ text: 'Java', detail: ['He built Java services.'] }],
            },
            {
              id: 'not-shown',
              label: 'Not shown on the site',
              items: [{ text: 'The site doesn’t show REST APIs.', detail: [] }],
            },
          ],
          askHim: [],
        },
      },
    });
  });
  await openAssistant(page);
  await page.getByRole('button', { name: /paste a job description/i }).click();
  await page.getByRole('textbox', { name: /job description/i }).fill(pasted);
  await page.getByRole('button', { name: /send question/i }).click();

  const card = page.getByRole('article', { name: 'Job description brief' });
  await expect(card).toBeVisible();
  await expect(card.getByText('He built Java services.')).toBeVisible();
  await expect(card.getByRole('button', { name: 'Copy brief' })).toBeVisible();
  expect(sent.jobDescription).toBe(pasted);
  expect(sent.question).toMatch(/job description/i);
  await expect(
    page.getByRole('textbox', { name: /job description/i }),
  ).toHaveValue('');
  // It is not kept in the browser's session storage.
  const stored = await page.evaluate(() =>
    JSON.stringify({ ...sessionStorage }),
  );
  expect(stored).not.toContain('Spring Boot');
  expect(stored).not.toContain('Backend Engineer');
});

test('printing shows the brief card alone', async ({ page }) => {
  await openAssistant(page);
  await page.getByRole('button', { name: 'Hiring for a role?' }).click();
  await page
    .getByRole('region', { name: /hiring for a role/i })
    .getByRole('button', { name: 'NLP Engineer' })
    .click();
  const card = page.getByRole('article', { name: 'NLP Engineer' });
  await expect(card).toBeVisible();

  await page.emulateMedia({ media: 'print' });
  await expect(card).toBeVisible();
  await expect(
    page.locator('.site-main > :not(:has(.portfolio-assistant))').first(),
  ).toBeHidden();
  await expect(
    page.locator('.site-header, header.site-header, .site-footer').first(),
  ).toBeHidden();
  await expect(page.locator('.chat-composer')).toBeHidden();
  await expect(card.locator('.brief-card-actions')).toBeHidden();
});
