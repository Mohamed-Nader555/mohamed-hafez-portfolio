import { expect, it } from 'vitest';
import { validateTurnstile } from '@/lib/security/turnstile';

it('requires a successful verification and expected production hostname', async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({ success: true, hostname: 'portfolio.example' }),
    );
  expect(
    await validateTurnstile({
      token: 'token',
      secret: 'secret',
      expectedHostname: 'portfolio.example',
      fetcher: fetcher as typeof fetch,
    }),
  ).toBe(true);
  expect(
    await validateTurnstile({
      token: 'token',
      secret: 'secret',
      expectedHostname: 'other.example',
      fetcher: fetcher as typeof fetch,
    }),
  ).toBe(false);
});
