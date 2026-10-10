import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setTestCloudflareEnv } from '../fixtures/cloudflare-workers';
vi.mock('@/lib/security/turnstile', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/security/turnstile')>()),
  validateTurnstile: vi.fn().mockResolvedValue(true),
}));
import { POST } from '@/pages/api/chat';
import { GET as health } from '@/pages/api/chat/health';
import { validateTurnstile } from '@/lib/security/turnstile';
import { HEALTH_VERSION } from '@/lib/health-version';

const payload = {
  question: 'How was Northstar built?',
  activeRole: 'aiml',
  history: [],
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
};
// Off localhost the API refuses to run without a hostname allowlist.
const configured = {
  TURNSTILE_SECRET_KEY: 'test',
  TURNSTILE_EXPECTED_HOSTNAMES: 'local.test',
};
beforeEach(() => {
  vi.clearAllMocks();
  setTestCloudflareEnv({});
});
it('returns a refused response without an AI call for unsupported questions', async () => {
  const run = vi.fn();
  setTestCloudflareEnv({ AI: { run }, ...configured });
  const response = await POST({
    request: new Request('http://local.test/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        question: 'What is Mohamed’s medical history?',
      }),
    }),
  } as never);
  expect(response.status).toBe(200);
  expect(
    ((await response.json()) as { answerStatus: string }).answerStatus,
  ).toBe('refused');
  expect(run).not.toHaveBeenCalled();
});
it('rejects oversized input before calling the provider', async () => {
  const run = vi.fn();
  setTestCloudflareEnv({ AI: { run }, ...configured });
  const response = await POST({
    request: new Request('http://local.test/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, question: 'x'.repeat(601) }),
    }),
  } as never);
  expect(response.status).toBe(400);
  expect(run).not.toHaveBeenCalled();
});

it('does not read the removed Astro locals runtime environment', async () => {
  const runtime = {} as { env?: unknown };
  Object.defineProperty(runtime, 'env', {
    get() {
      throw new Error('Astro.locals.runtime.env has been removed in Astro v6');
    },
  });

  await expect(
    POST({
      request: new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          question: 'What is Mohamed’s medical history?',
        }),
      }),
      locals: { runtime },
    } as never),
  ).resolves.toBeInstanceOf(Response);
});

it('uses the official test-key path locally without a network verification call', async () => {
  const response = await POST({
    request: new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        question: 'What is Mohamed’s medical history?',
      }),
    }),
  } as never);

  expect(response.status).toBe(200);
  expect(validateTurnstile).not.toHaveBeenCalled();
});

describe('Turnstile hostname allowlist on the API', () => {
  const siteverify = (hostname: string) =>
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            success: true,
            hostname,
            action: 'portfolio_chat',
          }),
        ),
    );
  const ask = (url: string) =>
    POST({
      request: new Request(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...payload, turnstileToken: 'real-token' }),
      }),
    } as never);
  const useRealValidation = async () => {
    const actual = await vi.importActual<
      typeof import('@/lib/security/turnstile')
    >('@/lib/security/turnstile');
    vi.mocked(validateTurnstile).mockImplementation(actual.validateTurnstile);
  };
  const production = {
    TURNSTILE_SECRET_KEY: 'real-secret',
    TURNSTILE_EXPECTED_HOSTNAMES:
      'mohamednhafez.com,www.mohamednhafez.com,portfolio.example.workers.dev',
  };
  afterEach(() => vi.unstubAllGlobals());

  it('accepts a token issued for the custom domain', async () => {
    await useRealValidation();
    vi.stubGlobal('fetch', siteverify('mohamednhafez.com'));
    setTestCloudflareEnv(production);
    const response = await ask('https://mohamednhafez.com/api/chat');
    expect(response.status).toBe(200);
    expect(
      ((await response.json()) as { answerStatus: string }).answerStatus,
    ).not.toBe('refused');
  });

  it('accepts the workers.dev hostname from the same list', async () => {
    await useRealValidation();
    vi.stubGlobal('fetch', siteverify('portfolio.example.workers.dev'));
    setTestCloudflareEnv(production);
    expect(
      (await ask('https://portfolio.example.workers.dev/api/chat')).status,
    ).toBe(200);
  });

  it('rejects a token issued for an unlisted hostname with 403', async () => {
    await useRealValidation();
    vi.stubGlobal('fetch', siteverify('evil.example'));
    setTestCloudflareEnv(production);
    const response = await ask('https://mohamednhafez.com/api/chat');
    expect(response.status).toBe(403);
    expect(((await response.json()) as { code: string }).code).toBe(
      'verification_failed',
    );
  });

  it('still honours the old singular variable as a one-item list', async () => {
    await useRealValidation();
    vi.stubGlobal('fetch', siteverify('old.example'));
    setTestCloudflareEnv({
      TURNSTILE_SECRET_KEY: 'real-secret',
      TURNSTILE_EXPECTED_HOSTNAME: 'old.example',
    });
    expect((await ask('https://old.example/api/chat')).status).toBe(200);
  });

  it('fails closed off localhost when no hostname is configured', async () => {
    await useRealValidation();
    const fetcher = siteverify('mohamednhafez.com');
    vi.stubGlobal('fetch', fetcher);
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    setTestCloudflareEnv({ TURNSTILE_SECRET_KEY: 'real-secret' });
    const response = await ask('https://mohamednhafez.com/api/chat');
    expect(response.status).toBe(503);
    expect(((await response.json()) as { code: string }).code).toBe(
      'temporarily_unavailable',
    );
    expect(logged.mock.calls[0]![0]).toContain('TURNSTILE_EXPECTED_HOSTNAMES');
    expect(fetcher).not.toHaveBeenCalled();
    logged.mockRestore();
  });

  it('treats [::1] as local and accepts the test token without a network call', async () => {
    const response = await POST({
      request: new Request('http://[::1]:4321/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    } as never);
    expect(response.status).toBe(200);
    expect(validateTurnstile).not.toHaveBeenCalled();
  });

  it('answers locally from the evidence fallback when the AI binding is missing', async () => {
    const response = await POST({
      request: new Request('http://localhost:4321/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      }),
    } as never);
    const body = (await response.json()) as {
      answerStatus: string;
      citations: unknown[];
    };
    expect(response.status).toBe(200);
    expect(body.answerStatus).toBe('fallback');
    expect(body.citations.length).toBeGreaterThan(0);
  });
});

describe('GET /api/chat/health', () => {
  it('reports configuration without secrets and is not cacheable', async () => {
    setTestCloudflareEnv({
      AI: { run: vi.fn() },
      TURNSTILE_SECRET_KEY: 'super-secret-value',
      TURNSTILE_EXPECTED_HOSTNAMES: 'mohamednhafez.com, www.mohamednhafez.com',
    });
    const response = await health({} as never);
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toContain('no-store');
    const text = await response.text();
    expect(text).not.toContain('super-secret-value');
    expect(text).not.toContain('mohamednhafez');
    const body = JSON.parse(text) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual([
      'ai',
      'hostnames',
      'knowledgeChunks',
      'ok',
      'verification',
      'version',
    ]);
    expect(body).toMatchObject({
      ok: true,
      ai: true,
      verification: true,
      hostnames: 2,
    });
    expect(body.knowledgeChunks).toBeGreaterThan(50);
    // Each brief 3 stage bumps this so a deployment can be recognised.
    expect(body.version).toBe(HEALTH_VERSION);
    expect(HEALTH_VERSION).toMatch(/^brief3-[a-e]$/);
  });

  it('is not ok when verification or hostnames are missing', async () => {
    setTestCloudflareEnv({});
    const body = (await (await health({} as never)).json()) as Record<
      string,
      unknown
    >;
    expect(body).toMatchObject({
      ok: false,
      ai: false,
      verification: false,
      hostnames: 0,
    });
  });
});
