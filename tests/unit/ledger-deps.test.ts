import { describe, expect, it, vi } from 'vitest';
import { createLedgerDeps } from '@/lib/ai/ledger-deps';

const reply = () =>
  new Response(
    JSON.stringify({
      status: 'completed',
      steps: [
        {
          type: 'model_output',
          content: [{ type: 'text', text: '{"verdicts":[]}' }],
        },
      ],
      usage: {},
    }),
    { status: 200 },
  );

describe('createLedgerDeps', () => {
  it('loads the whole ledger and the knowledge file', () => {
    const deps = createLedgerDeps({ GEMINI_API_KEY: 'k' });
    expect(deps.claims.length).toBeGreaterThan(500);
    expect(deps.knowledge).toMatch(/^# Claims about Mohamed Hafez/);
    expect(deps.knowledge).toContain('[qb-ceh]');
  });

  it('sends the writer and the checker to their own configured models', async () => {
    const fetcher = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => reply());
    const deps = createLedgerDeps(
      {
        GEMINI_API_KEY: 'k',
        GEMINI_WRITER_MODEL: 'writer-x',
        GEMINI_CHECKER_MODEL: 'checker-y',
      },
      fetcher,
    );
    const request = {
      input: 'q',
      schema: {},
      thinkingLevel: 'low' as const,
      maxOutputTokens: 100,
      timeoutMs: 1000,
    };
    await deps.writer.generateJson(request);
    await deps.checker.generateJson(request);
    const models = fetcher.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)).model,
    );
    expect(models).toEqual(['writer-x', 'checker-y']);
    expect(deps.writerModel).toBe('writer-x');
    expect(deps.checkerModel).toBe('checker-y');
  });

  it('sends the key in a header, never in the URL', async () => {
    const fetcher = vi.fn<
      (url: string, init?: RequestInit) => Promise<Response>
    >(async () => reply());
    const deps = createLedgerDeps({ GEMINI_API_KEY: 'top-secret' }, fetcher);
    await deps.writer.generateJson({
      input: 'q',
      schema: {},
      thinkingLevel: 'low',
      maxOutputTokens: 100,
      timeoutMs: 1000,
    });
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).not.toContain('top-secret');
    expect((init?.headers as Record<string, string>)['x-goog-api-key']).toBe(
      'top-secret',
    );
  });
});
