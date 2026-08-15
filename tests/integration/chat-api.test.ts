import { beforeEach, expect, it, vi } from 'vitest';
vi.mock('@/lib/security/turnstile', () => ({
  validateTurnstile: vi.fn().mockResolvedValue(true),
}));
import { POST } from '@/pages/api/chat';

const payload = {
  question: 'How was Northstar built?',
  activeRole: 'aiml',
  history: [],
  turnstileToken: 'XXXX.DUMMY.TOKEN.XXXX',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
};
beforeEach(() => vi.clearAllMocks());
it('returns a refused response without an AI call for unsupported questions', async () => {
  const run = vi.fn();
  const response = await POST({
    request: new Request('http://local.test/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        question: 'What is Mohamed’s medical history?',
      }),
    }),
    locals: { runtime: { env: { AI: { run }, TURNSTILE_SECRET_KEY: 'test' } } },
  } as never);
  expect(response.status).toBe(200);
  expect((await response.json()).answerStatus).toBe('refused');
  expect(run).not.toHaveBeenCalled();
});
it('rejects oversized input before calling the provider', async () => {
  const run = vi.fn();
  const response = await POST({
    request: new Request('http://local.test/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...payload, question: 'x'.repeat(601) }),
    }),
    locals: { runtime: { env: { AI: { run }, TURNSTILE_SECRET_KEY: 'test' } } },
  } as never);
  expect(response.status).toBe(400);
  expect(run).not.toHaveBeenCalled();
});
