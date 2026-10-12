import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ChatMessage } from '@/components/ai/ChatMessage';
import type { ChatResponse } from '@/lib/ai/types';

afterEach(cleanup);

const cite = {
  sourceId: 'case-study-dostava',
  label: 'Dostava case study',
  href: '/work/dostava',
};

const base: ChatResponse = {
  requestId: 'r',
  answer: 'Plain answer.',
  answerStatus: 'answered',
  citations: [cite],
  followUps: [],
  telemetry: { questionCategory: 'project', latencyBucket: 'lt-500ms' },
};

const labelled: ChatResponse = {
  ...base,
  answer: 'a b c d',
  segments: [
    {
      text: 'From the site text.',
      label: 'site',
      claimIds: ['x'],
      citations: [cite],
    },
    {
      text: 'From the notes text.',
      label: 'notes',
      claimIds: ['y'],
      citations: [cite],
    },
    {
      text: 'I am Mohamed.',
      label: 'own-words',
      claimIds: ['qb-x'],
      citations: [cite],
    },
    { text: 'My own reading.', label: 'reading', claimIds: [], citations: [] },
  ],
  actions: [
    { kind: 'case-study', label: 'Dostava case study', href: '/work/dostava' },
    {
      kind: 'resume',
      label: 'Résumé: Android Developer',
      href: '/resumes/a.pdf',
    },
    {
      kind: 'email',
      label: 'Email Mohamed about this',
      address: 'who@example.com',
    },
  ],
};

it('shows an answer without segments the way it always did', () => {
  render(<ChatMessage response={base} question="Q?" />);
  expect(screen.getByText('Plain answer.')).toBeVisible();
  expect(screen.getByText('Grounded answer')).toBeVisible();
  expect(screen.queryByRole('group', { name: /next steps/i })).toBeNull();
});

it('labels every segment by where it came from', () => {
  render(<ChatMessage response={labelled} question="Q?" />);
  const expected: Array<[string, string]> = [
    ['From the site text.', 'From the site'],
    ['From the notes text.', 'From Mohamed’s notes'],
    ['I am Mohamed.', 'Mohamed’s answer'],
    ['My own reading.', 'Assistant’s reading'],
  ];
  for (const [text, label] of expected) {
    const segment = screen.getByText(text).closest('[data-label]')!;
    expect(within(segment as HTMLElement).getByText(label)).toBeVisible();
  }
});

it('sets his own answer apart as a quotation', () => {
  render(<ChatMessage response={labelled} question="Q?" />);
  expect(
    screen.getByText('I am Mohamed.').closest('blockquote'),
  ).not.toBeNull();
  expect(
    screen.getByText('From the site text.').closest('blockquote'),
  ).toBeNull();
});

it('offers the case study, the résumé and an email link with the question in the body', () => {
  render(
    <ChatMessage response={labelled} question="Does he know Rust & Go?" />,
  );
  const group = screen.getByRole('group', { name: /next steps/i });
  expect(
    within(group).getByRole('link', { name: 'Dostava case study' }),
  ).toHaveAttribute('href', '/work/dostava');
  expect(
    within(group).getByRole('link', { name: /Résumé: Android Developer/ }),
  ).toHaveAttribute('href', '/resumes/a.pdf');
  const email = within(group).getByRole('link', {
    name: 'Email Mohamed about this',
  });
  const href = email.getAttribute('href')!;
  expect(href.startsWith('mailto:who@example.com?')).toBe(true);
  const params = new URLSearchParams(href.split('?')[1]);
  expect(params.get('body')).toContain('Does he know Rust & Go?');
  expect(params.get('subject')).toBeTruthy();
});

it('says plainly when the site does not cover the question', () => {
  render(
    <ChatMessage
      response={{ ...base, answerStatus: 'not_covered', answer: 'x' }}
      question="Q?"
    />,
  );
  expect(screen.getByText('Not on the site')).toBeVisible();
});

it('keeps the supporting-evidence list', () => {
  render(<ChatMessage response={labelled} question="Q?" />);
  expect(screen.getByText(/Supporting evidence/i)).toBeInTheDocument();
});

const fallback: ChatResponse = {
  ...base,
  answerStatus: 'fallback',
  answer: 'A summary of verified facts.',
};

it('says in one line that the full assistant was busy when it serves the fallback', () => {
  render(<ChatMessage response={fallback} question="Q?" />);
  expect(screen.getByRole('note')).toHaveTextContent(
    'The full assistant was busy, so this is a summary from the site.',
  );
  expect(screen.getAllByRole('note')).toHaveLength(1);
});

it('offers Try again on the fallback, among the next steps, and calls back when chosen', () => {
  const onRetry = vi.fn();
  render(<ChatMessage response={fallback} question="Q?" onRetry={onRetry} />);
  const steps = screen.getByRole('group', { name: /next steps/i });
  fireEvent.click(within(steps).getByRole('button', { name: 'Try again' }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});

it('has no Try again button without a retry handler, and none on a real answer', () => {
  const { unmount } = render(<ChatMessage response={fallback} question="Q?" />);
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  unmount();
  render(<ChatMessage response={labelled} question="Q?" onRetry={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  expect(screen.queryByRole('note')).toBeNull();
});

it('disables Try again while another question is running', () => {
  render(
    <ChatMessage
      response={fallback}
      question="Q?"
      onRetry={vi.fn()}
      retryDisabled
    />,
  );
  expect(screen.getByRole('button', { name: 'Try again' })).toBeDisabled();
});
