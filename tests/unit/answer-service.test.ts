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
