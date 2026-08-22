import { expect, it } from 'vitest';
import { validateTurnstile } from '@/lib/security/turnstile';

it('requires a successful verification and expected production hostname', async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        success: true,
        hostname: 'portfolio.example',
        action: 'portfolio_chat',
      }),
    );
  expect(
    await validateTurnstile({
      token: 'token',
      secret: 'secret',
      expectedHostname: 'portfolio.example',
      expectedAction: 'portfolio_chat',
      fetcher: fetcher as typeof fetch,
    }),
  ).toBe(true);
  expect(
    await validateTurnstile({
      token: 'token',
      secret: 'secret',
      expectedHostname: 'other.example',
      expectedAction: 'portfolio_chat',
      fetcher: fetcher as typeof fetch,
    }),
  ).toBe(false);
});

it('requires the expected action from a successful Turnstile response', async () => {
  const fetcher = async () =>
    new Response(
      JSON.stringify({
        success: true,
        hostname: 'portfolio.example',
        action: 'different_action',
      }),
    );

  expect(
    await validateTurnstile({
      token: 'token',
      secret: 'secret',
      expectedHostname: 'portfolio.example',
      expectedAction: 'portfolio_chat',
      fetcher: fetcher as typeof fetch,
    }),
  ).toBe(false);
});
