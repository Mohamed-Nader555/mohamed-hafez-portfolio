import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatResponse } from '@/lib/ai/types';

const mocks = vi.hoisted(() => ({ requestTurnstileToken: vi.fn() }));
vi.mock('@/components/ai/turnstile-client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/ai/turnstile-client')
  >()),
  requestTurnstileToken: mocks.requestTurnstileToken,
}));
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

const question = 'Would he be a good fit for an NLP engineer role at a bank?';
const NOTE = 'The full assistant was busy, so this is a summary from the site.';

const reply = (
  answerStatus: ChatResponse['answerStatus'],
  answer: string,
): ChatResponse => ({
  requestId: `r-${answer}`,
  answer,
  answerStatus,
  citations: [],
  followUps: [],
  telemetry: { questionCategory: 'project', latencyBucket: 'lt-500ms' },
});
const ok = (body: ChatResponse) =>
  new Response(JSON.stringify(body), { status: 200 });

function openAndAsk(text = question) {
  render(
    <PortfolioAssistant
      activeRole="aiml"
      initialSuggestions={['What did he build?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  ask(text);
}
function ask(text: string) {
  fireEvent.change(screen.getByRole('textbox', { name: /your question/i }), {
    target: { value: text },
  });
  fireEvent.click(screen.getByRole('button', { name: /send question/i }));
}
const sentBody = (fetchMock: ReturnType<typeof vi.fn>, call: number) =>
  JSON.parse((fetchMock.mock.calls[call]![1] as RequestInit).body as string);

beforeEach(() => {
  sessionStorage.clear();
  mocks.requestTurnstileToken.mockResolvedValue('verified-token');
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Try again after a fallback answer', () => {
  it('shows the busy line, resends the same question without the fallback in its history, and replaces it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(reply('fallback', 'A summary.')))
      .mockResolvedValueOnce(ok(reply('answered', 'The full answer.')));
    vi.stubGlobal('fetch', fetchMock);
    openAndAsk();

    expect(await screen.findByText('A summary.')).toBeVisible();
    expect(screen.getByRole('note')).toHaveTextContent(NOTE);

    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('The full answer.')).toBeVisible();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retried = sentBody(fetchMock, 1);
    expect(retried.question).toBe(question);
    expect(retried.history).toEqual([]);
    // The summary and its notice are gone; one exchange remains.
    expect(screen.queryByText('A summary.')).toBeNull();
    expect(screen.queryByRole('note')).toBeNull();
    expect(screen.getAllByText(question)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('offers Try again on the latest answer only', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(reply('fallback', 'First summary.')))
      .mockResolvedValueOnce(ok(reply('fallback', 'Second summary.')));
    vi.stubGlobal('fetch', fetchMock);
    openAndAsk('First question?');
    await screen.findByText('First summary.');
    ask('Second question?');
    await screen.findByText('Second summary.');
    expect(screen.getAllByRole('note')).toHaveLength(2);
    expect(screen.getAllByRole('button', { name: 'Try again' })).toHaveLength(
      1,
    );
    const second = screen.getByText('Second summary.').closest('article')!;
    expect(
      within(second).getByRole('button', { name: 'Try again' }),
    ).toBeVisible();
  });

  it('keeps the summary and shows the error when the retry fails, and leaves the draft empty', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(ok(reply('fallback', 'A summary.')))
      .mockResolvedValueOnce(new Response('{}', { status: 503 }));
    vi.stubGlobal('fetch', fetchMock);
    openAndAsk();
    await screen.findByText('A summary.');
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(screen.getByText('A summary.')).toBeVisible();
    expect(screen.getByRole('textbox', { name: /your question/i })).toHaveValue(
      '',
    );
    // The visitor can try again once more.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Try again' }),
      ).not.toBeDisabled(),
    );
  });
});
