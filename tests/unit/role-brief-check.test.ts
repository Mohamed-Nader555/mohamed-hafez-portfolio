import { describe, expect, it, vi } from 'vitest';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import type { RoleBrief } from '@/data/claims/types';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { checkRoleBrief } from '../../scripts/role-brief-check';

const usage = {
  inputTokens: 5,
  cachedTokens: 0,
  outputTokens: 3,
  thinkingTokens: 0,
};
const claim = (id: string, text: string): LedgerEntry => ({
  id,
  text,
  strength: 'direct',
  origin: 'site',
  citations: [{ sourceId: `s-${id}`, label: 'S', href: '/s' }],
  category: 'project',
});
const claims = [
  claim('a', 'He built Java services.'),
  claim('b', 'He taught.'),
];
const requirement = (text: string, id: string) => ({
  text,
  evidence: [{ claimId: id, text: claims.find((c) => c.id === id)!.text }],
  citations: [],
});
const brief: RoleBrief = {
  slug: 'role',
  title: 'Role',
  alsoCalled: [],
  lens: 'software',
  summary: { answerId: 'qb', text: 'x' },
  direct: [requirement('Build services', 'a')],
  related: [requirement('Explain things', 'b')],
  askHim: [],
};

function fake(data: unknown | Error) {
  const requests: GeminiRequest[] = [];
  const impl: GeminiProvider = {
    generateJson: vi.fn(async (request: GeminiRequest) => {
      requests.push(request);
      if (data instanceof Error) throw data;
      return { data, usage };
    }),
  };
  return { impl, requests };
}

describe('checkRoleBrief', () => {
  it('sends the brief to the checker once, each requirement beside the claims behind it', async () => {
    const { impl, requests } = fake({
      verdicts: [
        { index: 0, verdict: 'supported' },
        { index: 1, verdict: 'supported' },
      ],
    });
    const result = await checkRoleBrief(impl, brief, claims);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.input).toContain('SEGMENT 0: Build services');
    expect(requests[0]!.input).toContain('He built Java services.');
    expect(requests[0]!.input).toContain('SEGMENT 1: Explain things');
    expect(result).toEqual({
      slug: 'role',
      status: 'checked',
      flagged: [],
      usage,
    });
  });

  it('names the requirements the checker flags', async () => {
    const { impl } = fake({
      verdicts: [
        { index: 0, verdict: 'overstated' },
        { index: 1, verdict: 'supported' },
      ],
    });
    const result = await checkRoleBrief(impl, brief, claims);
    expect(result.flagged).toEqual(['Build services']);
  });

  it('reports a failed call without throwing', async () => {
    const { impl } = fake(new Error('timeout'));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await checkRoleBrief(impl, brief, claims);
    spy.mockRestore();
    expect(result.status).toBe('failed');
    expect(result.flagged).toEqual([]);
  });
});
