import { expect, it, vi } from 'vitest';
import { answerRecruiterQuestion } from '@/lib/ai/answer-service';

it('does not invoke generation for unsupported questions', async () => {
  const generate = vi.fn();
  const result = await answerRecruiterQuestion(
    { provider: { generate } },
    {
      question: 'What is Mohamed’s medical history?',
      history: [],
      activeRole: 'aiml',
      requestId: 'request-1',
    },
  );
  expect(result.answerStatus).toBe('refused');
  expect(generate).not.toHaveBeenCalled();
});

it('returns verified evidence fallback when the provider fails', async () => {
  const result = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockRejectedValue(new Error('quota exceeded')),
      },
    },
    {
      question: 'How was Northstar built?',
      history: [],
      activeRole: 'aiml',
      requestId: 'request-2',
    },
  );
  expect(result.answerStatus).toBe('fallback');
  expect(result.citations.length).toBeGreaterThan(0);
});

it('accepts a structured Workers AI response envelope', async () => {
  const result = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockResolvedValue({
          response: {
            answer:
              'Northstar combines retrieval, grounded generation, and strict scope controls.',
            answerStatus: 'answered',
            citationIds: ['case-study-northstar'],
            followUps: ['How is unsupported content handled?'],
          },
        }),
      },
    },
    {
      question: 'How was Northstar built?',
      history: [],
      activeRole: 'aiml',
      requestId: 'request-3',
    },
  );

  expect(result.answerStatus).toBe('answered');
  expect(result.answer).toMatch(/retrieval/i);
});

it('normalizes excessive model citations to verified retrieved sources', async () => {
  const result = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockResolvedValue({
          response: {
            answer:
              'Dostava uses Java with MVVM, Retrofit, Room, Firebase, and Google Maps.',
            answerStatus: 'answered',
            citationIds: Array.from({ length: 12 }, () => 'case-study-dostava'),
            followUps: [],
          },
        }),
      },
    },
    {
      question: 'What technologies did Mohamed use in Dostava?',
      history: [],
      activeRole: 'android',
      requestId: 'request-4',
    },
  );

  expect(result.answerStatus).toBe('answered');
  expect(result.citations.map((citation) => citation.sourceId)).toContain(
    'case-study-dostava',
  );
});

const dostava = {
  question: 'What technologies did Mohamed use in Dostava?',
  history: [],
  activeRole: 'android' as const,
  requestId: 'request-guard',
};

it('discards an answer with a number that is not in the evidence', async () => {
  const result = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockResolvedValue({
          response: {
            answer: 'Dostava reached 12345 downloads on Firebase.',
            answerStatus: 'answered',
            citationIds: ['case-study-dostava'],
            followUps: [],
          },
        }),
      },
    },
    dostava,
  );
  expect(result.answerStatus).toBe('fallback');
  expect(result.answer).not.toContain('12345');
});

it('keeps an answer whose numbers all appear in the evidence', async () => {
  const result = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockResolvedValue({
          response: {
            answer: 'Dostava was built with Firebase services.',
            answerStatus: 'answered',
            citationIds: ['case-study-dostava'],
            followUps: [],
          },
        }),
      },
    },
    dostava,
  );
  expect(result.answerStatus).toBe('answered');
});

it('accepts JSON wrapped in prose and plain text, citing the retrieved sources', async () => {
  const wrapped = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi
          .fn()
          .mockResolvedValue(
            'Here you go: {"answer":"Dostava uses Firebase.","answerStatus":"answered","citationIds":["case-study-dostava"],"followUps":[]}',
          ),
      },
    },
    dostava,
  );
  expect(wrapped.answerStatus).toBe('answered');
  expect(wrapped.answer).toBe('Dostava uses Firebase.');

  const plain = await answerRecruiterQuestion(
    {
      provider: {
        generate: vi.fn().mockResolvedValue('Dostava is built on Firebase.'),
      },
    },
    dostava,
  );
  expect(plain.answerStatus).toBe('answered');
  expect(plain.answer).toBe('Dostava is built on Firebase.');
  expect(plain.citations.map((c) => c.sourceId)).toContain(
    'case-study-dostava',
  );
});

it('falls back with an answer that reads like one, with citations', async () => {
  const result = await answerRecruiterQuestion(
    { provider: { generate: vi.fn().mockRejectedValue(new Error('down')) } },
    dostava,
  );
  expect(result.answerStatus).toBe('fallback');
  expect(result.answer).toMatch(/^Here is what the portfolio says: /);
  expect(result.answer).not.toMatch(
    /temporarily unavailable|Generated synthesis/i,
  );
  expect(result.answer.length).toBeLessThan(1700);
  expect(result.citations.length).toBeGreaterThan(0);
  expect(result.followUps.length).toBeGreaterThan(0);
});

it('answers about a technology the portfolio does not show honestly, with suggestions', async () => {
  const generate = vi.fn();
  const result = await answerRecruiterQuestion(
    { provider: { generate } },
    { ...dostava, question: 'Has he used Rust?' },
  );
  expect(result.answerStatus).toBe('refused');
  expect(result.answer).toContain('doesn’t show experience with Rust');
  expect(result.followUps.length).toBeGreaterThan(0);
  expect(generate).not.toHaveBeenCalled();
});
