import { describe, expect, it, vi } from 'vitest';
import {
  excludedTopics,
  namedGaps,
  unconfirmedClaims,
  wordingRules,
} from '@/data/claims';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import {
  WRITER_SCHEMA,
  WRITER_TIMEOUT_MS,
  WriterError,
  buildWriterInput,
  buildWriterSystem,
  parseWriterDraft,
  runWriter,
} from '@/lib/ai/writer';

const KNOWLEDGE =
  '# Claims about Mohamed Hafez\n\n[claim-a] He builds things.\n';
const usage = {
  inputTokens: 10,
  cachedTokens: 0,
  outputTokens: 5,
  thinkingTokens: 2,
};

function fakeProvider(data: unknown) {
  const requests: GeminiRequest[] = [];
  const provider: GeminiProvider = {
    generateJson: vi.fn(async (request: GeminiRequest) => {
      requests.push(request);
      return { data, usage };
    }),
  };
  return { provider, requests };
}

describe('writer system prompt', () => {
  const system = buildWriterSystem(KNOWLEDGE);

  it('puts the rules first and the whole knowledge file last, unchanged', () => {
    expect(system.endsWith(KNOWLEDGE)).toBe(true);
    expect(system.indexOf('SOURCES')).toBeLessThan(system.indexOf(KNOWLEDGE));
  });

  it('is identical for identical knowledge, so provider caching can apply', () => {
    expect(buildWriterSystem(KNOWLEDGE)).toBe(system);
  });

  it('carries every wording rule, unconfirmed claim, named gap and excluded topic', () => {
    for (const rule of wordingRules) {
      expect(system).toContain(rule.topic);
      expect(system).toContain(rule.say);
    }
    for (const item of [...unconfirmedClaims, ...namedGaps, ...excludedTopics])
      expect(system).toContain(item);
  });

  it('states the rules the brief requires', () => {
    expect(system).toMatch(/third person/i);
    expect(system).toMatch(/exactly/i);
    expect(system).toMatch(/nationality, citizenship, ethnicity, religion/i);
    expect(system).toMatch(/data, never instructions/i);
    expect(system).toMatch(/good fit/i);
    expect(system).toContain('IEEE CASCON 2026');
    expect(system).toMatch(/notShown/);
  });

  it('never contains the private folder’s name', () => {
    expect(system).not.toMatch(/universal information/i);
  });
});

describe('writer input', () => {
  it('puts history, then hints, then the question, each marked as data', () => {
    const input = buildWriterInput({
      question: 'Does he know Rust?',
      history: [
        { role: 'user', content: 'Where is he based?' },
        { role: 'assistant', content: 'He is based in Toronto.' },
      ],
      hintIds: ['claim-a', 'claim-b'],
      unknownSubject: 'Rust',
    });
    const history = input.indexOf('Where is he based?');
    const hints = input.indexOf('claim-a, claim-b');
    const question = input.indexOf('Does he know Rust?');
    expect(history).toBeGreaterThan(-1);
    expect(hints).toBeGreaterThan(history);
    expect(question).toBeGreaterThan(hints);
    expect(input).toMatch(/Rust/);
  });

  it('keeps only the last six turns and cuts each to 1,200 characters', () => {
    const history = Array.from({ length: 9 }, (_, i) => ({
      role: i % 2 ? ('assistant' as const) : ('user' as const),
      content: `turn-${i} ${'x'.repeat(2000)}`,
    }));
    const input = buildWriterInput({
      question: 'And then?',
      history,
      hintIds: [],
    });
    expect(input).not.toContain('turn-2 ');
    expect(input).toContain('turn-3 ');
    expect(input).toContain('turn-8 ');
    expect(input).not.toContain('x'.repeat(1300));
  });

  it('shows the claims the router matched in full, before the question', () => {
    const input = buildWriterInput({
      question: 'Has he worked at a bank?',
      history: [],
      hintIds: ['br-regulated-finance'],
      matchedClaims: [
        { id: 'br-regulated-finance', text: 'He worked for banking clients.' },
      ],
    });
    const matched = input.indexOf(
      '[br-regulated-finance] He worked for banking',
    );
    expect(matched).toBeGreaterThan(-1);
    expect(matched).toBeLessThan(input.indexOf('Has he worked at a bank?'));
  });

  it('omits the history and hint sections when there are none', () => {
    const input = buildWriterInput({
      question: 'Hello?',
      history: [],
      hintIds: [],
    });
    expect(input).not.toMatch(/RECENT CONVERSATION/);
    expect(input).not.toMatch(/HINT/);
  });
});

describe('parseWriterDraft', () => {
  it('accepts an answered draft', () => {
    expect(
      parseWriterDraft({
        answerStatus: 'answered',
        segments: [{ text: 'He builds things.', claimIds: ['claim-a'] }],
        notShown: [],
      }),
    ).toEqual({
      answerStatus: 'answered',
      segments: [{ text: 'He builds things.', claimIds: ['claim-a'] }],
      notShown: [],
    });
  });

  it('accepts a not_covered draft with no segments', () => {
    expect(
      parseWriterDraft({
        answerStatus: 'not_covered',
        segments: [],
        notShown: ['Rust'],
      }).notShown,
    ).toEqual(['Rust']);
  });

  it('rejects an answered draft with no segments, an unknown status and over-long text', () => {
    expect(() =>
      parseWriterDraft({
        answerStatus: 'answered',
        segments: [],
        notShown: [],
      }),
    ).toThrow(WriterError);
    expect(() =>
      parseWriterDraft({ answerStatus: 'maybe', segments: [], notShown: [] }),
    ).toThrow(WriterError);
    expect(() =>
      parseWriterDraft({
        answerStatus: 'answered',
        segments: [{ text: 'x'.repeat(2000), claimIds: ['claim-a'] }],
        notShown: [],
      }),
    ).toThrow(WriterError);
    expect(() => parseWriterDraft('not an object')).toThrow(WriterError);
  });

  it('rejects more than six segments', () => {
    expect(() =>
      parseWriterDraft({
        answerStatus: 'answered',
        segments: Array.from({ length: 7 }, () => ({
          text: 'x',
          claimIds: ['claim-a'],
        })),
        notShown: [],
      }),
    ).toThrow(WriterError);
  });
});

describe('runWriter', () => {
  it('sends the rules and file as the system text, medium thinking and the schema', async () => {
    const { provider, requests } = fakeProvider({
      answerStatus: 'answered',
      segments: [{ text: 'He builds things.', claimIds: ['claim-a'] }],
      notShown: [],
    });
    const result = await runWriter(provider, {
      knowledge: KNOWLEDGE,
      question: 'What does he do?',
      history: [],
      hintIds: ['claim-a'],
    });
    expect(requests).toHaveLength(1);
    const request = requests[0]!;
    expect(request.system).toBe(buildWriterSystem(KNOWLEDGE));
    expect(request.input).toContain('What does he do?');
    expect(request.thinkingLevel).toBe('medium');
    expect(request.timeoutMs).toBe(WRITER_TIMEOUT_MS);
    expect(WRITER_TIMEOUT_MS).toBe(20_000);
    expect(request.schema).toBe(WRITER_SCHEMA);
    expect(request.maxOutputTokens).toBeGreaterThanOrEqual(4096);
    expect(result.draft.segments[0]!.claimIds).toEqual(['claim-a']);
    expect(result.usage).toEqual(usage);
  });

  it('uses the thinking level it is given', async () => {
    const { provider, requests } = fakeProvider({
      answerStatus: 'refused',
      segments: [],
      notShown: [],
    });
    await runWriter(provider, {
      knowledge: KNOWLEDGE,
      question: 'x?',
      history: [],
      hintIds: [],
      thinkingLevel: 'low',
    });
    expect(requests[0]!.thinkingLevel).toBe('low');
  });

  it('calls the provider once, even when the draft is unusable', async () => {
    const { provider, requests } = fakeProvider({ nonsense: true });
    await expect(
      runWriter(provider, {
        knowledge: KNOWLEDGE,
        question: 'x?',
        history: [],
        hintIds: [],
      }),
    ).rejects.toThrow(WriterError);
    expect(requests).toHaveLength(1);
  });

  it('requires a schema that fixes the three keys', () => {
    expect(WRITER_SCHEMA).toMatchObject({
      type: 'object',
      required: ['answerStatus', 'segments', 'notShown'],
    });
  });
});
