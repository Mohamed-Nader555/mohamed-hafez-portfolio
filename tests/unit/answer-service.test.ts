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
