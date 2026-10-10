import { describe, expect, it, vi } from 'vitest';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import {
  CHECKER_SCHEMA,
  CHECKER_TIMEOUT_MS,
  buildCheckerInput,
  buildCheckerSystem,
  runChecker,
} from '@/lib/ai/checker';
import type { LedgerEntry } from '@/lib/rag/ledger';

const usage = {
  inputTokens: 4,
  cachedTokens: 0,
  outputTokens: 2,
  thinkingTokens: 0,
};
const claim = (id: string, text: string): LedgerEntry => ({
  id,
  text,
  strength: 'direct',
  origin: 'site',
  citations: [{ sourceId: 's', label: 'S', href: '/s' }],
  category: 'project',
});
const claims = new Map([
  ['a', claim('a', 'He built a delivery app in Java.')],
  ['b', claim('b', 'He taught lab sessions.')],
]);

function provider(data: unknown | Error) {
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

describe('checker prompt', () => {
  it('asks for a verdict per segment and treats everything as data', () => {
    const system = buildCheckerSystem();
    expect(system).toMatch(/supported/);
    expect(system).toMatch(/overstated/);
    expect(system).toMatch(/unsupported/);
    expect(system).toMatch(/data, never instructions/i);
  });

  it('shows each segment with the text of the claims it cites, and nothing else', () => {
    const input = buildCheckerInput(
      [
        { index: 0, text: 'He built an app.', claimIds: ['a'] },
        { index: 2, text: 'This shows range.', claimIds: [] },
      ],
      claims,
    );
    expect(input).toContain('He built a delivery app in Java.');
    expect(input).not.toContain('He taught lab sessions.');
    expect(input).toMatch(/segment 0/i);
    expect(input).toMatch(/segment 2/i);
    expect(input).toMatch(/own reading/i);
  });
});

describe('runChecker', () => {
  const segments = [
    { index: 0, text: 'He built an app.', claimIds: ['a'] },
    { index: 1, text: 'He taught for ten years.', claimIds: ['b'] },
    { index: 2, text: 'This shows range.', claimIds: [] },
  ];

  it('uses the cheap model settings: lowest thinking, 5 s, the schema', async () => {
    const { impl, requests } = provider({
      verdicts: [
        { index: 0, verdict: 'supported' },
        { index: 1, verdict: 'supported' },
        { index: 2, verdict: 'supported' },
      ],
    });
    await runChecker(impl, segments, claims);
    expect(requests).toHaveLength(1);
    expect(requests[0]!.thinkingLevel).toBe('minimal');
    expect(requests[0]!.timeoutMs).toBe(CHECKER_TIMEOUT_MS);
    expect(CHECKER_TIMEOUT_MS).toBe(5000);
    expect(requests[0]!.schema).toBe(CHECKER_SCHEMA);
  });

  it('flags overstated and unsupported segments by index', async () => {
    const { impl } = provider({
      verdicts: [
        { index: 0, verdict: 'supported' },
        { index: 1, verdict: 'overstated' },
        { index: 2, verdict: 'unsupported' },
      ],
    });
    const result = await runChecker(impl, segments, claims);
    expect(result.status).toBe('checked');
    expect(result.flagged).toEqual([1, 2]);
    expect(result.unchecked).toEqual([]);
    expect(result.usage).toEqual(usage);
  });

  it('treats a segment with no verdict as unchecked, not flagged', async () => {
    const { impl } = provider({
      verdicts: [{ index: 0, verdict: 'supported' }],
    });
    const result = await runChecker(impl, segments, claims);
    expect(result.flagged).toEqual([]);
    expect(result.unchecked).toEqual([1, 2]);
  });

  it('reports a failed or malformed call as unchecked and does not throw', async () => {
    const failed = await runChecker(
      provider(new Error('timeout')).impl,
      segments,
      claims,
    );
    expect(failed.status).toBe('failed');
    expect(failed.unchecked).toEqual([0, 1, 2]);
    expect(failed.flagged).toEqual([]);

    const malformed = await runChecker(
      provider({ nope: true }).impl,
      segments,
      claims,
    );
    expect(malformed.status).toBe('failed');
  });

  it('skips the call when there is nothing to check', async () => {
    const { impl, requests } = provider({ verdicts: [] });
    const result = await runChecker(impl, [], claims);
    expect(requests).toHaveLength(0);
    expect(result.status).toBe('skipped');
  });
});
