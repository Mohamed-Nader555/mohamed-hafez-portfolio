import { expect, it } from 'vitest';
import { validateModelAnswer } from '@/lib/ai/response-schema';

it('rejects an answered response with unknown citations', () => {
  expect(() =>
    validateModelAnswer(
      {
        answer: 'Unsupported',
        answerStatus: 'answered',
        citationIds: ['made-up'],
        followUps: [],
      },
      new Set(['case-study-dostava']),
    ),
  ).toThrow(/citation/i);
});

it('allows a concise strict refusal without citations', () => {
  expect(
    validateModelAnswer(
      {
        answer: 'I do not have verified evidence for that.',
        answerStatus: 'refused',
        citationIds: [],
        followUps: [],
      },
      new Set(),
    ).answerStatus,
  ).toBe('refused');
});
