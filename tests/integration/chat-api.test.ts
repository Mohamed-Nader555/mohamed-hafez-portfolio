import { beforeEach, expect, it, vi } from 'vitest';
import { setTestCloudflareEnv } from '../fixtures/cloudflare-workers';
vi.mock('@/lib/security/turnstile', () => ({
  validateTurnstile: vi.fn().mockResolvedValue(true),
}));
import { POST } from '@/pages/api/chat';
import { validateTurnstile } from '@/lib/security/turnstile';

const payload = {
  question: 'How was Northstar built?',
  activeRole: 'aiml',
  history: [],
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
};
beforeEach(() => {
  vi.clearAllMocks();
  setTestCloudflareEnv({});
});
it('returns a refused response without an AI call for unsupported questions', async () => {
  const run = vi.fn();
  setTestCloudflareEnv({ AI: { run }, TURNSTILE_SECRET_KEY: 'test' });
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
  setTestCloudflareEnv({ AI: { run }, TURNSTILE_SECRET_KEY: 'test' });
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
