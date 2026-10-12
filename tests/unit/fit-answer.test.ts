import { describe, expect, it, vi } from 'vitest';
import ledger from '@/generated/ledger.json';
import { questionBank } from '@/data/claims';
import { answerFit } from '@/lib/ai/fit-answer';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import type { LedgerDeps } from '@/lib/ai/ledger-answer';
import type { AnswerInput } from '@/lib/ai/types';
import type { LedgerEntry } from '@/lib/rag/ledger';

const claims = ledger as LedgerEntry[];
const usage = {
  inputTokens: 100,
  cachedTokens: 50,
  outputTokens: 20,
  thinkingTokens: 5,
};
const JD =
  'NLP Engineer. Requirements: Python, PyTorch, named-entity recognition, banking environments, Kubernetes, 3+ years of production NLP, REST APIs.';
const gap = questionBank.find((a) => a.id === 'qb-gap-kubernetes')!;

type Req = {
  requirement: string;
  group: 'direct' | 'related' | 'not_shown';
  claimIds: string[];
  note: string;
};
const req = (over: Partial<Req> & { requirement: string }): Req => ({
  group: 'direct',
  claimIds: [],
  note: '',
  ...over,
});

function writerReturning(data: unknown | Error) {
  const requests: GeminiRequest[] = [];
  const provider: GeminiProvider = {
    generateJson: vi.fn(async (request: GeminiRequest) => {
      requests.push(request);
      if (data instanceof Error) throw data;
      return { data, usage };
    }),
  };
  return { provider, requests };
}

/** A checker that flags the listed segment numbers and passes the rest. */
function checkerFlagging(flagged: number[] = [], fail = false) {
  const requests: GeminiRequest[] = [];
  const provider: GeminiProvider = {
    generateJson: vi.fn(async (request: GeminiRequest) => {
      requests.push(request);
      if (fail) throw new Error('checker down');
      const indices = [...request.input.matchAll(/SEGMENT (\d+):/g)].map((m) =>
        Number(m[1]),
      );
      return {
        data: {
          verdicts: indices.map((index) => ({
            index,
            verdict: flagged.includes(index) ? 'overstated' : 'supported',
          })),
        },
        usage,
      };
    }),
  };
  return { provider, requests };
}

function setup(
  draft: unknown | Error,
  checker = checkerFlagging(),
  logs: Array<Record<string, unknown>> = [],
) {
  const writer = writerReturning(draft);
  const deps: LedgerDeps = {
    writer: writer.provider,
    checker: checker.provider,
    writerModel: 'writer-model',
    checkerModel: 'checker-model',
    claims,
    knowledge: '# Claims about Mohamed Hafez\n',
    log: (event) => logs.push(event),
  };
  const input: AnswerInput = {
    question: 'How does his background line up with this job description?',
    jobDescription: JD,
    history: [],
    activeRole: 'aiml',
    requestId: 'r1',
  };
  return { deps, input, writer, checker, logs };
}

const itemsOf = (
  response: Awaited<ReturnType<typeof answerFit>>,
  id: 'direct' | 'related' | 'not-shown',
) => response?.brief?.groups.find((g) => g.id === id)?.items ?? [];

describe('answerFit', () => {
  it('builds a brief in three groups from one writer call and one checker call', async () => {
    const { deps, input, writer, checker } = setup({
      requirements: [
        req({
          requirement: 'Named-entity recognition',
          group: 'direct',
          claimIds: ['asc-pie-evaluation-framework'],
        }),
        req({
          requirement: 'Banking environments',
          group: 'related',
          claimIds: ['br-regulated-finance'],
        }),
        req({ requirement: 'REST APIs', group: 'not_shown' }),
      ],
      askHimIds: ['qb-pitch-ml', 'qb-thesis'],
    });
    const response = await answerFit(deps, input);
    expect(writer.requests).toHaveLength(1);
    expect(checker.requests).toHaveLength(1);
    expect(response?.answerStatus).toBe('answered');
    expect(itemsOf(response, 'direct').map((i) => i.text)).toEqual([
      'Named-entity recognition',
    ]);
    expect(itemsOf(response, 'direct')[0]!.detail[0]).toBe(
      claims.find((c) => c.id === 'asc-pie-evaluation-framework')!.text,
    );
    expect(itemsOf(response, 'related').map((i) => i.text)).toEqual([
      'Banking environments',
    ]);
    expect(itemsOf(response, 'not-shown').map((i) => i.text)).toEqual([
      'The site doesn’t show REST APIs.',
    ]);
    expect(response?.brief?.summary?.text).toBe(
      '3 requirements in the posting: 1 direct, 1 related, 1 not shown on the site.',
    );
    expect(response?.brief?.askHim).toEqual([
      questionBank.find((a) => a.id === 'qb-pitch-ml')!.question,
      questionBank.find((a) => a.id === 'qb-thesis')!.question,
    ]);
    expect(response?.trace?.path).toBe('fit');
    expect(response?.notShown).toEqual(['REST APIs']);
  });

  it('keeps the old answer fields working: joined text, segments with claim ids, citations, actions', async () => {
    const { deps, input } = setup({
      requirements: [
        req({
          requirement: 'Named-entity recognition',
          claimIds: ['asc-pie-evaluation-framework'],
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(response?.answer).toContain('Named-entity recognition');
    expect(response?.segments?.[0]?.claimIds).toEqual([
      'asc-pie-evaluation-framework',
    ]);
    expect(response?.citations.length).toBeGreaterThan(0);
    expect(response?.actions?.some((a) => a.kind === 'email')).toBe(true);
  });

  it('answers a requirement that names a named gap with his own gap answer, whatever the model said', async () => {
    const { deps, input } = setup({
      requirements: [
        req({
          requirement: 'Kubernetes',
          group: 'direct',
          claimIds: ['br-containers-ci'],
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct')).toEqual([]);
    const item = itemsOf(response, 'not-shown')[0]!;
    expect(item.text).toBe('The site doesn’t show Kubernetes.');
    expect(item.detail).toEqual([gap.answer]);
    expect(item.detailLabel).toBe('Mohamed’s answer');
    expect(response?.segments?.[0]?.claimIds).toEqual([gap.id]);
    expect(response?.segments?.[0]?.label).toBe('own-words');
  });

  it('puts a requirement under related when the model said direct but the claims are only related evidence', async () => {
    const { deps, input } = setup({
      requirements: [
        req({
          requirement: 'Banking environments',
          group: 'direct',
          claimIds: ['br-cloud'],
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct')).toEqual([]);
    expect(itemsOf(response, 'related')).toHaveLength(1);
  });

  it('drops unknown claim ids, and a requirement left with no claim', async () => {
    const { deps, input } = setup({
      requirements: [
        req({ requirement: 'PyTorch', claimIds: ['invented-claim'] }),
        req({
          requirement: 'Python',
          claimIds: ['invented-claim', 'asc-pie-experiment-stack'],
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct').map((i) => i.text)).toEqual(['Python']);
  });

  it('drops a requirement with a number the posting does not have, verdict wording, and a duplicate', async () => {
    const { deps, input } = setup({
      requirements: [
        req({
          requirement: '9 years of NLP',
          claimIds: ['asc-pie-evaluation-framework'],
        }),
        req({
          requirement: 'A perfect fit for the team',
          claimIds: ['asc-pie-evaluation-framework'],
        }),
        req({
          requirement: 'Python',
          claimIds: ['asc-pie-experiment-stack'],
        }),
        req({
          requirement: 'python',
          claimIds: ['asc-pie-experiment-stack'],
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct').map((i) => i.text)).toEqual(['Python']);
    expect(response?.trace?.drafted).toBe(4);
    expect(response?.trace?.dropped).toBe(3);
  });

  it('keeps a "not shown" requirement only when the posting says it, so the model cannot invent a gap', async () => {
    const { deps, input } = setup({
      requirements: [
        req({ requirement: 'Terraform', group: 'not_shown' }),
        req({ requirement: 'REST APIs', group: 'not_shown' }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'not-shown').map((i) => i.text)).toEqual([
      'The site doesn’t show REST APIs.',
    ]);
  });

  it('keeps the model’s note only when it passes the code checks', async () => {
    const { deps, input } = setup({
      requirements: [
        req({
          requirement: 'Python',
          claimIds: ['asc-pie-experiment-stack'],
          note: 'The research pipeline is written in Python.',
        }),
        req({
          requirement: 'PyTorch',
          claimIds: ['asc-pie-experiment-stack'],
          note: 'He has used PyTorch for 12 years.',
        }),
      ],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    const [python, torch] = itemsOf(response, 'direct');
    expect(python!.note).toBe('The research pipeline is written in Python.');
    expect(torch!.note).toBeUndefined();
  });

  it('drops what the checker flags', async () => {
    const { deps, input } = setup(
      {
        requirements: [
          req({
            requirement: 'Python',
            claimIds: ['asc-pie-experiment-stack'],
          }),
          req({
            requirement: 'PyTorch',
            claimIds: ['asc-pie-experiment-stack'],
          }),
        ],
        askHimIds: [],
      },
      checkerFlagging([1]),
    );
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct').map((i) => i.text)).toEqual(['Python']);
    expect(response?.trace?.checker).toBe('passed');
  });

  it('moves direct requirements to related, marked unchecked, when the checker is down', async () => {
    const { deps, input } = setup(
      {
        requirements: [
          req({
            requirement: 'Python',
            claimIds: ['asc-pie-experiment-stack'],
          }),
        ],
        askHimIds: [],
      },
      checkerFlagging([], true),
    );
    const response = await answerFit(deps, input);
    expect(itemsOf(response, 'direct')).toEqual([]);
    expect(itemsOf(response, 'related').map((i) => i.text)).toEqual(['Python']);
    expect(response?.trace?.checker).toBe('unchecked');
  });

  it('ignores prompts that are unknown or gap answers, and keeps at most three', async () => {
    const { deps, input } = setup({
      requirements: [
        req({ requirement: 'Python', claimIds: ['asc-pie-experiment-stack'] }),
      ],
      askHimIds: ['qb-gap-kubernetes', 'qb-nope', 'qb-pitch-ml'],
    });
    const response = await answerFit(deps, input);
    expect(response?.brief?.askHim).toEqual([
      questionBank.find((a) => a.id === 'qb-pitch-ml')!.question,
    ]);
  });

  it('says it found no requirements, instead of making some up, and calls no checker', async () => {
    const { deps, input, checker } = setup({
      requirements: [],
      askHimIds: [],
    });
    const response = await answerFit(deps, input);
    expect(response?.answerStatus).toBe('not_covered');
    expect(response?.brief).toBeUndefined();
    expect(response?.answer).toMatch(/couldn.t find/i);
    expect(checker.requests).toHaveLength(0);
  });

  it('returns nothing, never calling the writer twice, when the writer fails', async () => {
    const { deps, input, writer, checker } = setup(new Error('timeout'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await answerFit(deps, input);
    const logged = JSON.stringify(spy.mock.calls);
    spy.mockRestore();
    expect(response).toBeUndefined();
    expect(writer.requests).toHaveLength(1);
    expect(checker.requests).toHaveLength(0);
    expect(logged).not.toContain('Kubernetes');
    expect(logged).not.toContain(JD.slice(0, 30));
  });

  it('logs token counts and timings only, never the job description or any text', async () => {
    const logs: Array<Record<string, unknown>> = [];
    const { deps, input } = setup(
      {
        requirements: [
          req({
            requirement: 'Python',
            claimIds: ['asc-pie-experiment-stack'],
          }),
        ],
        askHimIds: [],
      },
      checkerFlagging(),
      logs,
    );
    await answerFit(deps, input);
    const text = JSON.stringify(logs);
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ event: 'assistant_answer', path: 'fit' });
    expect(text).not.toContain('Python');
    expect(text).not.toContain(JD.slice(0, 30));
  });

  it('sends the job description only to the writer, as data inside the fence', async () => {
    const { deps, input, writer, checker } = setup({
      requirements: [
        req({ requirement: 'Python', claimIds: ['asc-pie-experiment-stack'] }),
      ],
      askHimIds: [],
    });
    await answerFit(deps, input);
    expect(writer.requests[0]!.input).toContain(JD);
    expect(checker.requests[0]!.input).not.toContain(JD);
  });
});
