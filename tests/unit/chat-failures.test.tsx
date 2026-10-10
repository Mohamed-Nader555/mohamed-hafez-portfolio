import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHAT_FAILURE_MESSAGES,
  ChatFailure,
  type ChatFailureCode,
} from '@/components/ai/chat-errors';

const mocks = vi.hoisted(() => ({ requestTurnstileToken: vi.fn() }));
vi.mock('@/components/ai/turnstile-client', async (importOriginal) => ({
  ...(await importOriginal<
    typeof import('@/components/ai/turnstile-client')
  >()),
  requestTurnstileToken: mocks.requestTurnstileToken,
}));
import { PortfolioAssistant } from '@/components/ai/PortfolioAssistant';

const question = 'What technologies did Mohamed use in Dostava?';
const apiResponse = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status });

function openAndAsk() {
  render(
    <PortfolioAssistant
      activeRole="android"
      initialSuggestions={['What did he build in Dostava?']}
    />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
  const textbox = screen.getByRole('textbox', { name: /your question/i });
  fireEvent.change(textbox, { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: /send question/i }));
  return textbox;
}

async function expectFailure(code: ChatFailureCode, textbox: HTMLElement) {
  const alert = await screen.findByRole('alert');
  expect(alert).toHaveTextContent(CHAT_FAILURE_MESSAGES[code]);
  expect(alert).toHaveAttribute('data-error', code);
  // The draft is handed back on every error.
  expect(textbox).toHaveValue(question);
}

beforeEach(() => {
  sessionStorage.clear();
  mocks.requestTurnstileToken.mockResolvedValue('verified-token');
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('every failure shows its own message and keeps the draft', () => {
  it.each([
    'verification_blocked',
    'verification_failed',
    'verification_timeout',
    'temporarily_unavailable',
  ] as const)('%s from the human check', async (code) => {
    mocks.requestTurnstileToken.mockRejectedValue(new ChatFailure(code));
    vi.stubGlobal('fetch', vi.fn());
    const textbox = openAndAsk();
    await expectFailure(code, textbox);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [403, 'verification_failed'],
    [429, 'rate_limited'],
    [503, 'temporarily_unavailable'],
    [500, 'request_failed'],
    [400, 'request_failed'],
  ] as const)('API status %i maps to %s', async (status, code) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(apiResponse(status)));
    const textbox = openAndAsk();
    await expectFailure(code, textbox);
  });

  it('maps a rejected fetch to the network message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const textbox = openAndAsk();
    await expectFailure('network', textbox);
  });

  it('treats a malformed success body as a generic failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(apiResponse(200, {})));
    const textbox = openAndAsk();
    await expectFailure('request_failed', textbox);
  });

  it('shows the checking line while the token is pending, then Retrieving evidence', async () => {
    let release: (token: string) => void = () => {};
    mocks.requestTurnstileToken.mockReturnValue(
      new Promise<string>((resolve) => (release = resolve)),
    );
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    openAndAsk();
    expect(await screen.findByText('Checking you’re human…')).toBeVisible();
    await act(async () => release('verified-token'));
    expect(await screen.findByText('Retrieving evidence')).toBeVisible();
    expect(screen.queryByText('Checking you’re human…')).toBeNull();
  });
});

describe('request timer', () => {
  it('starts after the token arrives and reports a network failure after 20 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
    let release: (token: string) => void = () => {};
    mocks.requestTurnstileToken.mockReturnValue(
      new Promise<string>((resolve) => (release = resolve)),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise((_resolve, reject) =>
            init.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            ),
          ),
      ),
    );
    const textbox = openAndAsk();
    // 25 s waiting for the human check must not consume the request budget.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(25_000);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    await act(async () => release('verified-token'));
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(19_999);
    });
    expect(screen.queryByRole('alert')).toBeNull();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    // waitFor polls with timers, which are faked here: flush microtasks instead.
    await act(async () => {});
    expect(screen.getByRole('alert')).toHaveTextContent(
      CHAT_FAILURE_MESSAGES.network,
    );
    expect(textbox).toHaveValue(question);
  });
});

describe('the human check lives inside the dialog', () => {
  it('passes a slot inside the dialog, directly above the composer', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    openAndAsk();
    await waitFor(() => expect(mocks.requestTurnstileToken).toHaveBeenCalled());
    const options = mocks.requestTurnstileToken.mock.calls[0]![1] as {
      container: HTMLElement;
    };
    const dialog = screen.getByRole('dialog');
    expect(dialog.contains(options.container)).toBe(true);
    const composer = dialog.querySelector('form.chat-composer')!;
    expect(options.container.parentElement?.nextElementSibling).toBe(composer);
  });

  it('shows the one-line prompt only while Turnstile asks for interaction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(new Promise(() => {})));
    mocks.requestTurnstileToken.mockImplementation(
      (_key: string, options: { onInteractive(active: boolean): void }) => {
        options.onInteractive(true);
        return new Promise(() => {});
      },
    );
    openAndAsk();
    expect(
      await screen.findByText('One quick check before I answer.'),
    ).toBeVisible();
  });

  it('aborts the pending check and restores the draft when the dialog closes', async () => {
    mocks.requestTurnstileToken.mockImplementation(
      (_key: string, options: { signal: AbortSignal }) =>
        new Promise((_resolve, reject) =>
          options.signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          ),
        ),
    );
    vi.stubGlobal('fetch', vi.fn());
    openAndAsk();
    await screen.findByText('Checking you’re human…');
    fireEvent.keyDown(document, { key: 'Escape' });
    const signal = (
      mocks.requestTurnstileToken.mock.calls[0]![1] as { signal: AbortSignal }
    ).signal;
    expect(signal.aborted).toBe(true);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: /open Mohamed AI portfolio assistant/i,
      }),
    );
    expect(screen.getByRole('textbox', { name: /your question/i })).toHaveValue(
      question,
    );
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
