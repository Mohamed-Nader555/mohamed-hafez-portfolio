import { describe, expect, it } from 'vitest';
import {
  extractNumbers,
  firstJsonObject,
  parseModelOutput,
  ungroundedNumbers,
} from '@/lib/ai/answer-guards';
import { cutAtSentence } from '@/lib/rag/extractive-fallback';

describe('number guard', () => {
  it('reads numbers as written, ignoring commas and percent signs', () => {
    expect(extractNumbers('333,109 rows, 99.5% accuracy in 2026.')).toEqual([
      '333109',
      '99.5',
      '2026',
    ]);
  });

  it('flags numbers that the evidence does not contain', () => {
    const evidence = [
      'The split is 312,085 / 10,512 / 10,512.',
      'A 19-type schema.',
    ];
    expect(
      ungroundedNumbers('It has 19 types and 312,085 rows.', evidence),
    ).toEqual([]);
    expect(
      ungroundedNumbers('It has 20 types and 312,085 rows.', evidence),
    ).toEqual(['20']);
  });
});

describe('tolerant model output parser', () => {
  const answer = {
    answer: 'A.',
    answerStatus: 'answered',
    citationIds: [],
    followUps: [],
  };

  it('unwraps the provider envelope and JSON strings', () => {
    expect(parseModelOutput({ response: answer })).toEqual(answer);
    expect(parseModelOutput({ response: JSON.stringify(answer) })).toEqual(
      answer,
    );
    expect(parseModelOutput(JSON.stringify(answer))).toEqual(answer);
  });

  it('extracts the first JSON object from prose or a code fence', () => {
    const wrapped = `Sure! Here you go:\n\`\`\`json\n${JSON.stringify(answer)}\n\`\`\`\nHope that helps {not json}`;
    expect(parseModelOutput(wrapped)).toEqual(answer);
    expect(firstJsonObject('x {"a": "}"} y')).toBe('{"a": "}"}');
    expect(firstJsonObject('no object here')).toBeUndefined();
  });

  it('treats unparseable text as the answer itself', () => {
    expect(parseModelOutput('Dostava uses Firebase.')).toEqual({
      answer: 'Dostava uses Firebase.',
      answerStatus: 'answered',
      citationIds: [],
      followUps: [],
    });
  });
});

describe('fallback sentence cutting', () => {
  it('cuts at a sentence boundary, not mid-sentence', () => {
    const text =
      'First sentence is here. Second sentence is longer than the limit allows for.';
    expect(cutAtSentence(text, 40)).toBe('First sentence is here.');
    expect(cutAtSentence('short.', 40)).toBe('short.');
  });

  it('falls back to a word boundary with an ellipsis when there is no sentence end', () => {
    expect(cutAtSentence('one two three four five six seven', 15)).toBe(
      'one two three…',
    );
  });
});
