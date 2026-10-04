export const PORTFOLIO_CHAT_TURNSTILE_ACTION = 'portfolio_chat';
export const PORTFOLIO_TURNSTILE_SITEKEY = '0x4AAAAAAEYpXcGcmRdA3lPr';

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  action?: string;
};

const normalizeHostname = (value: string) => value.trim().toLowerCase();

/**
 * Reads the allowed Turnstile hostnames from the Worker environment.
 * `TURNSTILE_EXPECTED_HOSTNAMES` is a comma-separated list; the older
 * singular `TURNSTILE_EXPECTED_HOSTNAME` is still honoured as a one-item list
 * so an old deployment configuration keeps working.
 */
export function parseExpectedHostnames(env: {
  TURNSTILE_EXPECTED_HOSTNAMES?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
}): string[] {
  const raw = env.TURNSTILE_EXPECTED_HOSTNAMES?.trim()
    ? env.TURNSTILE_EXPECTED_HOSTNAMES
    : (env.TURNSTILE_EXPECTED_HOSTNAME ?? '');
  return [...new Set(raw.split(',').map(normalizeHostname).filter(Boolean))];
}

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);
export const isLocalHostname = (hostname: string) =>
  LOCAL_HOSTNAMES.has(normalizeHostname(hostname));

export async function validateTurnstile(input: {
  token: string;
  secret: string;
  expectedHostnames: readonly string[];
  expectedAction: string;
  fetcher?: typeof fetch;
}): Promise<boolean> {
  const allowed = input.expectedHostnames
    .map(normalizeHostname)
    .filter(Boolean);
  // Fail closed: with nothing to compare against, no token is acceptable.
  if (!allowed.length) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await (input.fetcher ?? fetch)(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          response: input.token,
          secret: input.secret,
        }),
        signal: controller.signal,
      },
    );
    const result = (await response.json()) as TurnstileResult;
    return (
      response.ok &&
      result.success &&
      result.action === input.expectedAction &&
      typeof result.hostname === 'string' &&
      allowed.includes(normalizeHostname(result.hostname))
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
