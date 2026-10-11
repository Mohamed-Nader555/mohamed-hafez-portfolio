import { describe, expect, it, vi } from 'vitest';
import ledgerJson from '@/generated/ledger.json';
import { questionBank } from '@/data/claims';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import { answerFromLedger, type LedgerDeps } from '@/lib/ai/ledger-answer';
import type { AnswerInput } from '@/lib/ai/types';
import type { LedgerEntry } from '@/lib/rag/ledger';

const claims = ledgerJson as LedgerEntry[];
const byId = (id: string) => claims.find((c) => c.id === id)!;
const firstSentence = (id: string) => byId(id).text.split(/(?<=\.)\s/)[0]!;
const usage = {
  inputTokens: 100,
  cachedTokens: 0,
  outputTokens: 20,
  thinkingTokens: 5,
};

function fakeProvider(reply: unknown | (() => unknown)) {
  const requests: GeminiRequest[] = [];
  const impl: GeminiProvider = {
    generateJson: vi.fn(async (request: GeminiRequest) => {
      requests.push(request);
      const data =
        typeof reply === 'function' ? (reply as () => unknown)() : reply;
      if (data instanceof Error) throw data;
      return { data, usage };
    }),
  };
  return { impl, requests };
}

const supported = (n: number) => ({
  verdicts: Array.from({ length: n }, (_, index) => ({
    index,
    verdict: 'supported',
  })),
});

function setup(writerReply: unknown, checkerReply: unknown = supported(9)) {
  const writer = fakeProvider(writerReply);
  const checker = fakeProvider(checkerReply);
  const log = vi.fn();
  const deps: LedgerDeps = {
    writer: writer.impl,
    checker: checker.impl,
    writerModel: 'writer-model',
    checkerModel: 'checker-model',
    claims,
    knowledge: '# Claims about Mohamed Hafez\n',
    log,
  };
  return { deps, writer, checker, log };
}

const input = (
  question: string,
  extra: Partial<AnswerInput> = {},
): AnswerInput => ({
  question,
  history: [],
  activeRole: 'aiml',
  requestId: 'req-1',
  ...extra,
});

describe('answerFromLedger', () => {
  it('writes, checks and labels an answer from the site', async () => {
    const sentence = firstSentence('northstar-chunking');
    const { deps, writer, checker } = setup({
      answerStatus: 'answered',
      segments: [{ text: sentence, claimIds: ['northstar-chunking'] }],
      notShown: [],
    });
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.answerStatus).toBe('answered');
    expect(response.answer).toBe(sentence);
    expect(response.segments).toHaveLength(1);
    expect(response.segments![0]).toMatchObject({
      text: sentence,
      label: 'site',
      claimIds: ['northstar-chunking'],
    });
    expect(response.segments![0]!.citations.length).toBeGreaterThan(0);
    expect(response.citations.length).toBeGreaterThan(0);
    expect(response.actions?.map((action) => action.kind)).toEqual(
      expect.arrayContaining(['resume', 'email']),
    );
    expect(response.trace).toMatchObject({
      path: 'ledger',
      writerModel: 'writer-model',
      checkerModel: 'checker-model',
      checker: 'passed',
      drafted: 1,
      dropped: 0,
    });
    expect(writer.requests).toHaveLength(1);
    expect(checker.requests).toHaveLength(1);
  });

  it('labels a quote of his answer and a bridge from his notes from the claims’ origins', async () => {
    const stored = questionBank.find((a) => a.id === 'qb-ceh')!.answer;
    const bridge = firstSentence('br-rag');
    const { deps } = setup({
      answerStatus: 'answered',
      segments: [
        { text: stored, claimIds: ['qb-ceh'] },
        { text: bridge, claimIds: ['br-rag'] },
      ],
      notShown: [],
    });
    const response = await answerFromLedger(
      deps,
      input('Is he a Certified Ethical Hacker?'),
    );
    expect(response.segments!.map((s) => s.label)).toEqual([
      'own-words',
      'notes',
    ]);
  });

  it('labels the one own-reading segment as the assistant’s reading', async () => {
    const { deps } = setup(
      {
        answerStatus: 'answered',
        segments: [
          {
            text: firstSentence('northstar-chunking'),
            claimIds: ['northstar-chunking'],
          },
          { text: 'Together these show care with documents.', claimIds: [] },
        ],
        notShown: [],
      },
      supported(2),
    );
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.segments![1]).toMatchObject({
      label: 'reading',
      claimIds: [],
      citations: [],
    });
  });

  it('drops a segment that fails a code check and still uses the rest', async () => {
    const { deps } = setup({
      answerStatus: 'answered',
      segments: [
        {
          text: firstSentence('northstar-chunking'),
          claimIds: ['northstar-chunking'],
        },
        { text: 'It handled 987654 users.', claimIds: ['northstar-chunking'] },
      ],
      notShown: [],
    });
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.segments).toHaveLength(1);
    expect(response.trace).toMatchObject({ drafted: 2, dropped: 1 });
  });

  it('serves the evidence fallback when every segment fails a check, without calling the checker', async () => {
    const { deps, checker } = setup({
      answerStatus: 'answered',
      segments: [
        { text: 'It served 987654 users.', claimIds: ['northstar-chunking'] },
      ],
      notShown: [],
    });
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.answerStatus).toBe('fallback');
    expect(response.trace?.path).toBe('fallback');
    expect(checker.requests).toHaveLength(0);
  });

  it('drops the segments the checker flags', async () => {
    const { deps } = setup(
      {
        answerStatus: 'answered',
        segments: [
          {
            text: firstSentence('northstar-chunking'),
            claimIds: ['northstar-chunking'],
          },
          {
            text: firstSentence('northstar-citations'),
            claimIds: ['northstar-citations'],
          },
        ],
        notShown: [],
      },
      {
        verdicts: [
          { index: 0, verdict: 'supported' },
          { index: 1, verdict: 'overstated' },
        ],
      },
    );
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.segments).toHaveLength(1);
    expect(response.segments![0]!.claimIds).toEqual(['northstar-chunking']);
    expect(response.trace).toMatchObject({ checker: 'passed', dropped: 1 });
  });

  it('when the checker fails, drops the own reading, keeps the rest and marks the answer unchecked', async () => {
    const { deps, writer, checker } = setup(
      {
        answerStatus: 'answered',
        segments: [
          {
            text: firstSentence('northstar-chunking'),
            claimIds: ['northstar-chunking'],
          },
          { text: 'Together these show care.', claimIds: [] },
        ],
        notShown: [],
      },
      new Error('timeout'),
    );
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.segments).toHaveLength(1);
    expect(response.trace).toMatchObject({ checker: 'unchecked', dropped: 1 });
    expect(writer.requests).toHaveLength(1);
    expect(checker.requests).toHaveLength(1);
  });

  it('serves the verified-facts fallback when the writer fails, and never calls it twice', async () => {
    const { deps, writer, checker } = setup(new Error('quota'));
    const response = await answerFromLedger(
      deps,
      input('How does Northstar chunk documents?'),
    );
    expect(response.answerStatus).toBe('fallback');
    expect(response.citations.length).toBeGreaterThan(0);
    expect(writer.requests).toHaveLength(1);
    expect(checker.requests).toHaveLength(0);
  });

  it('turns a writer refusal into the professional-background-only message', async () => {
    const { deps } = setup({
      answerStatus: 'refused',
      segments: [],
      notShown: [],
    });
    const response = await answerFromLedger(
      deps,
      input('What is his nationality?'),
    );
    expect(response.answerStatus).toBe('refused');
    expect(response.answer).toMatch(/professional background/i);
    expect(response.segments ?? []).toEqual([]);
  });

  it('writes the “site doesn’t show” sentence in code from notShown', async () => {
    const { deps, writer } = setup({
      answerStatus: 'not_covered',
      segments: [],
      notShown: ['Rust'],
    });
    const response = await answerFromLedger(deps, input('Does he know Rust?'));
    expect(writer.requests).toHaveLength(1);
    expect(response.answerStatus).toBe('not_covered');
    expect(response.answer).toBe('The site doesn’t show Rust.');
    expect(response.notShown).toEqual(['Rust']);
  });

  it('ignores a not-shown term the visitor never wrote', async () => {
    const { deps } = setup({
      answerStatus: 'not_covered',
      segments: [],
      notShown: ['Rust', 'Haskell'],
    });
    const response = await answerFromLedger(deps, input('Does he know Rust?'));
    expect(response.notShown).toEqual(['Rust']);
    expect(response.answer).not.toMatch(/Haskell/);
  });

  it('adds related evidence after the not-shown sentence', async () => {
    const { deps } = setup(
      {
        answerStatus: 'not_covered',
        segments: [
          {
            text: firstSentence('skills-languages-core'),
            claimIds: ['skills-languages-core'],
          },
        ],
        notShown: ['Rust'],
      },
      supported(1),
    );
    const response = await answerFromLedger(deps, input('Does he know Rust?'));
    expect(response.answerStatus).toBe('not_covered');
    expect(response.segments![0]!.text).toBe('The site doesn’t show Rust.');
    expect(response.segments!.length).toBe(2);
  });

  it('uses the extractive fallback or a refusal when nothing usable comes back', async () => {
    const { deps } = setup({
      answerStatus: 'not_covered',
      segments: [],
      notShown: [],
    });
    const response = await answerFromLedger(deps, input('Does he know Rust?'));
    expect(['fallback', 'refused']).toContain(response.answerStatus);
  });

  it('sends the unknown technology to the writer as a hint', async () => {
    const { deps, writer } = setup({
      answerStatus: 'not_covered',
      segments: [],
      notShown: ['Rust'],
    });
    await answerFromLedger(deps, input('Does he know Rust?'));
    expect(writer.requests[0]!.input).toMatch(/Rust/);
  });

  it('logs token usage and latency per question, never any text', async () => {
    const question = 'How does Northstar chunk documents?';
    const sentence = firstSentence('northstar-chunking');
    const { deps, log } = setup({
      answerStatus: 'answered',
      segments: [{ text: sentence, claimIds: ['northstar-chunking'] }],
      notShown: [],
    });
    await answerFromLedger(deps, input(question));
    expect(log).toHaveBeenCalledTimes(1);
    const line = JSON.stringify(log.mock.calls[0]);
    expect(line).toContain('inputTokens');
    expect(line).toContain('latencyMs');
    expect(line).not.toContain('Northstar');
    expect(line).not.toContain(sentence.slice(0, 30));
  });

  it('sends only claim ids from the ledger as hints', async () => {
    const { deps, writer } = setup({
      answerStatus: 'answered',
      segments: [
        {
          text: firstSentence('northstar-chunking'),
          claimIds: ['northstar-chunking'],
        },
      ],
      notShown: [],
    });
    await answerFromLedger(deps, input('Does he have Kubernetes experience?'));
    expect(writer.requests[0]!.input).toContain('qb-gap-kubernetes');
  });
});
