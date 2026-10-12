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

const JD = 'Backend Engineer. Requirements: Java, Spring Boot, REST APIs.';
const DEFAULT_QUESTION =
  'How does his background line up with this job description?';

const briefResponse: ChatResponse = {
  requestId: 'jd-1',
  answer: 'Job description brief',
  answerStatus: 'answered',
  citations: [],
  followUps: [],
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
      { id: 'related', label: 'Related experience', items: [] },
      {
        id: 'not-shown',
        label: 'Not shown on the site',
        items: [
          {
            text: 'The site doesn’t show REST APIs.',
            detail: [],
            note: 'Nearby work is listed above.',
          },
        ],
      },
    ],
    askHim: ['What did you build?'],
  },
  telemetry: { questionCategory: 'unknown', latencyBucket: 'lt-500ms' },
};
const ok = (body: ChatResponse) =>
  new Response(JSON.stringify(body), { status: 200 });

const fetchMock = vi.fn();
const body = (call = 0) =>
  JSON.parse((fetchMock.mock.calls[call]![1] as RequestInit).body as string);

function openPanel() {
  render(
    <PortfolioAssistant activeRole="software" initialSuggestions={['Hi?']} />,
  );
  fireEvent.click(
    screen.getByRole('button', {
      name: /open Mohamed AI portfolio assistant/i,
    }),
  );
}
const jdField = () => screen.getByRole('textbox', { name: /job description/i });

beforeEach(() => {
  sessionStorage.clear();
  mocks.requestTurnstileToken.mockResolvedValue('verified-token');
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('pasting a job description in the chat panel', () => {
  it('hides the field until asked, then offers up to 6,000 characters with a count', () => {
    openPanel();
    expect(
      screen.queryByRole('textbox', { name: /job description/i }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', { name: /paste a job description/i }),
    );
    const field = jdField();
    expect(field).toHaveAttribute('maxlength', '6000');
    fireEvent.change(field, { target: { value: JD } });
    expect(screen.getByText(`${JD.length}/6000`)).toBeVisible();
    expect(
      screen.getByRole('button', { name: /hide job description/i }),
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('sends the job description with a default question, and shows the brief as a card with Copy brief', async () => {
    fetchMock.mockResolvedValueOnce(ok(briefResponse));
    openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: /paste a job description/i }),
    );
    fireEvent.change(jdField(), { target: { value: JD } });
    // The visitor typed no question; the job description alone is enough.
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));

    const card = await screen.findByRole('article', {
      name: 'Job description brief',
    });
    expect(body().jobDescription).toBe(JD);
    expect(body().question).toBe(DEFAULT_QUESTION);
    expect(
      within(card).getByText(/2 requirements in the posting/),
    ).toBeVisible();
    expect(
      within(card).getByRole('heading', { name: 'Direct experience' }),
    ).toBeVisible();
    expect(
      within(card).getByRole('heading', { name: 'Not shown on the site' }),
    ).toBeVisible();
    // The empty related group is not listed.
    expect(
      within(card).queryByRole('heading', { name: 'Related experience' }),
    ).toBeNull();
    expect(within(card).getByText('Assistant’s reading')).toBeVisible();
    expect(
      within(card).getByRole('button', { name: 'Copy brief' }),
    ).toBeVisible();
    // No page link: a job description has no page of its own.
    expect(
      within(card).queryByRole('link', { name: /open the full page/i }),
    ).toBeNull();
  });

  it('empties the field after the brief arrives and never stores the job description in the browser', async () => {
    fetchMock.mockResolvedValueOnce(ok(briefResponse));
    openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: /paste a job description/i }),
    );
    fireEvent.change(jdField(), { target: { value: JD } });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));
    await screen.findByRole('article', { name: 'Job description brief' });

    const stored = JSON.stringify({ ...sessionStorage, ...localStorage });
    expect(stored).not.toContain('Spring Boot');
    expect(stored).not.toContain('Backend Engineer');
    await waitFor(() => expect(jdField()).toHaveValue(''));
  });

  it('keeps the job description and the question when the assistant is unavailable', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ code: 'temporarily_unavailable' }), {
        status: 503,
      }),
    );
    openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: /paste a job description/i }),
    );
    fireEvent.change(jdField(), { target: { value: JD } });
    fireEvent.change(screen.getByRole('textbox', { name: /your question/i }), {
      target: { value: 'Does he fit?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));
    expect(await screen.findByRole('alert')).toBeVisible();
    expect(jdField()).toHaveValue(JD);
    expect(screen.getByRole('textbox', { name: /your question/i })).toHaveValue(
      'Does he fit?',
    );
  });

  it('is cleared with the session', async () => {
    openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: /paste a job description/i }),
    );
    fireEvent.change(jdField(), { target: { value: JD } });
    fireEvent.click(screen.getByRole('button', { name: /clear session/i }));
    expect(jdField()).toHaveValue('');
  });

  it('does not send a job description when none was pasted', async () => {
    fetchMock.mockResolvedValueOnce(ok({ ...briefResponse, brief: undefined }));
    openPanel();
    fireEvent.change(screen.getByRole('textbox', { name: /your question/i }), {
      target: { value: 'What is ASC-PIE?' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send question/i }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(body()).not.toHaveProperty('jobDescription');
  });
});
