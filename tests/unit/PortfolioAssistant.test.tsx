import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requestTurnstileToken: vi.fn(),
  submitChatTurn: vi.fn(),
}));

vi.mock('@/components/ai/turnstile-client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/ai/turnstile-client')
  >()),
  requestTurnstileToken: mocks.requestTurnstileToken,
}));
vi.mock('@/components/ai/chat-client', () => ({
  submitChatTurn: mocks.submitChatTurn,
}));
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

beforeEach(() => {
  sessionStorage.clear();
  mocks.requestTurnstileToken.mockResolvedValue('verified-token');
  mocks.submitChatTurn.mockReset();
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it('opens an accessible assistant dialog and closes it with Escape', () => {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  expect(
    screen.getByRole('dialog', { name: /Mohamed AI portfolio assistant/i }),
  ).toBeVisible();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('presents a grounded AI console with role context and usable prompts', () => {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );

  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );

  const dialog = screen.getByRole('dialog', {
    name: /Mohamed AI portfolio assistant/i,
  });
  expect(
    within(dialog).getByRole('heading', {
      name: /grounded portfolio intelligence/i,
    }),
  ).toBeVisible();
  expect(within(dialog).getByText(/AI & ML context/i)).toBeVisible();
  expect(
    within(dialog).getByText(/verified portfolio evidence/i),
  ).toBeVisible();

  fireEvent.click(
    within(dialog).getByRole('button', { name: 'How was Northstar built?' }),
  );
  expect(
    within(dialog).getByRole('textbox', { name: /your question/i }),
  ).toHaveValue('How was Northstar built?');
});

it('clears the composer as soon as a question is submitted', async () => {
  mocks.submitChatTurn.mockReturnValue(new Promise(() => {}));
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['How was Northstar built?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  const textbox = screen.getByRole('textbox', { name: /your question/i });
  fireEvent.change(textbox, {
    target: { value: 'What technologies did Mohamed use in Dostava?' },
  });
  fireEvent.click(screen.getByRole('button', { name: /send question/i }));

  await waitFor(() => expect(textbox).toHaveValue(''));
});

const reply = (answer: string, followUps: string[] = []) => ({
  requestId: `id-${answer}`,
  answer,
  answerStatus: 'answered' as const,
  citations: [
    {
      sourceId: 'case-study-dostava',
      label: 'Dostava case study',
      href: '/work/dostava',
    },
  ],
  followUps,
  telemetry: {
    questionCategory: 'project' as const,
    latencyBucket: 'lt-500ms' as const,
  },
});

async function ask(question: string) {
  const textbox = screen.getByRole('textbox', { name: /your question/i });
  fireEvent.change(textbox, { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: /send question/i }));
  await screen.findByText(question);
}

it('shows the whole session as a thread, oldest first, and clears it', async () => {
  mocks.submitChatTurn
    .mockResolvedValueOnce(reply('First answer.'))
    .mockResolvedValueOnce(reply('Second answer.'));
  render(<PortfolioAssistant activeRole="android" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  await ask('First question?');
  await screen.findByText('First answer.');
  await ask('Second question?');
  await screen.findByText('Second answer.');

  const text = screen.getByRole('dialog').textContent ?? '';
  expect(text.indexOf('First question?')).toBeLessThan(
    text.indexOf('First answer.'),
  );
  expect(text.indexOf('First answer.')).toBeLessThan(
    text.indexOf('Second question?'),
  );
  expect(text.indexOf('Second question?')).toBeLessThan(
    text.indexOf('Second answer.'),
  );

  fireEvent.click(screen.getByRole('button', { name: /clear session/i }));
  expect(screen.queryByText('First answer.')).toBeNull();
  expect(screen.queryByText('Second answer.')).toBeNull();
  expect(sessionStorage.getItem('mh_portfolio_chat_thread_v1')).toBeNull();
});

it('restores the stored thread when the page loads again', async () => {
  mocks.submitChatTurn.mockResolvedValueOnce(reply('Remembered answer.'));
  const first = render(<PortfolioAssistant activeRole="android" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  await ask('Remember me?');
  await screen.findByText('Remembered answer.');
  first.unmount();

  render(<PortfolioAssistant activeRole="android" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  expect(await screen.findByText('Remembered answer.')).toBeVisible();
});

it('uses the published privacy line and the starter questions for the focus', () => {
  render(<PortfolioAssistant activeRole="android" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveTextContent(
    'Answers come only from what’s published on this site: projects, research, experience, teaching and education. This conversation stays in your browser session.',
  );
  for (const question of [
    'Which Android apps has Mohamed shipped?',
    'How does Mind’s Eye talk to its wearable?',
    'What did he build in Dostava?',
  ])
    expect(
      within(dialog).getByRole('button', { name: question }),
    ).toBeVisible();
});

it('offers the follow-ups that came with a refusal', async () => {
  mocks.submitChatTurn.mockResolvedValueOnce({
    ...reply('I do not have verified public evidence for that.', [
      'What is Weather Checker?',
      'Which technologies does Weather Checker use?',
    ]),
    answerStatus: 'refused',
    citations: [],
  });
  render(<PortfolioAssistant activeRole="android" />);
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  await ask('What is the weather in Toronto?');
  expect(
    await screen.findByRole('button', { name: 'What is Weather Checker?' }),
  ).toBeVisible();
});
