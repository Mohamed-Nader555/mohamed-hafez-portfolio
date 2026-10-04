import { describe, expect, it } from 'vitest';
import {
  isLocalHostname,
  parseExpectedHostnames,
  validateTurnstile,
} from '@/lib/security/turnstile';

const siteverify = (hostname: string | undefined, action = 'portfolio_chat') =>
  (async () =>
    new Response(
      JSON.stringify({ success: true, hostname, action }),
    )) as unknown as typeof fetch;

const check = (
  expectedHostnames: readonly string[],
  hostname: string | undefined,
  action?: string,
) =>
  validateTurnstile({
    token: 'token',
    secret: 'secret',
    expectedHostnames,
    expectedAction: 'portfolio_chat',
    fetcher: siteverify(hostname, action),
  });

describe('Turnstile hostname allowlist', () => {
  it('accepts any listed hostname and rejects an unlisted one', async () => {
    const allowed = ['mohamednhafez.com', 'portfolio.workers.dev'];
    expect(await check(allowed, 'mohamednhafez.com')).toBe(true);
    expect(await check(allowed, 'portfolio.workers.dev')).toBe(true);
    expect(await check(allowed, 'other.example')).toBe(false);
    expect(await check(allowed, undefined)).toBe(false);
  });

  it('compares case-insensitively and ignores surrounding whitespace', async () => {
    expect(await check([' MohamedNHafez.com '], 'mohamednhafez.COM')).toBe(
      true,
    );
  });

  it('fails closed when the list is empty', async () => {
    expect(await check([], 'mohamednhafez.com')).toBe(false);
    expect(await check(['  ', ''], 'mohamednhafez.com')).toBe(false);
  });

  it('still requires the expected action', async () => {
    expect(
      await check(['mohamednhafez.com'], 'mohamednhafez.com', 'different'),
    ).toBe(false);
  });

  it('rejects an unsuccessful siteverify response', async () => {
    const fetcher = (async () =>
      new Response(
        JSON.stringify({
          success: false,
          hostname: 'mohamednhafez.com',
          action: 'portfolio_chat',
        }),
      )) as unknown as typeof fetch;
    expect(
      await validateTurnstile({
        token: 'token',
        secret: 'secret',
        expectedHostnames: ['mohamednhafez.com'],
        expectedAction: 'portfolio_chat',
        fetcher,
      }),
    ).toBe(false);
  });
});

describe('parseExpectedHostnames', () => {
  it('splits, trims, lowercases and de-duplicates the comma-separated list', () => {
    expect(
      parseExpectedHostnames({
        TURNSTILE_EXPECTED_HOSTNAMES: ' A.example, b.example ,,a.EXAMPLE ',
      }),
    ).toEqual(['a.example', 'b.example']);
  });

  it('falls back to the singular variable as a one-item list', () => {
    expect(
      parseExpectedHostnames({ TURNSTILE_EXPECTED_HOSTNAME: 'Old.example' }),
    ).toEqual(['old.example']);
  });

  it('prefers the plural variable when both are set', () => {
    expect(
      parseExpectedHostnames({
        TURNSTILE_EXPECTED_HOSTNAMES: 'new.example',
        TURNSTILE_EXPECTED_HOSTNAME: 'old.example',
      }),
    ).toEqual(['new.example']);
  });

  it('returns an empty list when nothing is configured', () => {
    expect(parseExpectedHostnames({})).toEqual([]);
    expect(
      parseExpectedHostnames({ TURNSTILE_EXPECTED_HOSTNAMES: ' ' }),
    ).toEqual([]);
  });
});

describe('isLocalHostname', () => {
  it.each(['localhost', '127.0.0.1', '[::1]', 'LOCALHOST'])(
    'treats %s as local',
    (hostname) => expect(isLocalHostname(hostname)).toBe(true),
  );
  it.each(['mohamednhafez.com', 'localhost.evil.example', ''])(
    'does not treat %j as local',
    (hostname) => expect(isLocalHostname(hostname)).toBe(false),
  );
});
