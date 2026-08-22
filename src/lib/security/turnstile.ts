export const PORTFOLIO_CHAT_TURNSTILE_ACTION = 'portfolio_chat';
export const PORTFOLIO_TURNSTILE_SITEKEY = '0x4AAAAAAEYpXcGcmRdA3lPr';

type TurnstileResult = {
  success: boolean;
  hostname?: string;
  action?: string;
};
export async function validateTurnstile(input: {
  token: string;
  secret: string;
  expectedHostname?: string;
  expectedAction: string;
  fetcher?: typeof fetch;
}): Promise<boolean> {
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
      (!input.expectedHostname || result.hostname === input.expectedHostname)
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
