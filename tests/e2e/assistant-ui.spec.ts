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
