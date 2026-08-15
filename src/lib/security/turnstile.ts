type TurnstileResult = { success: boolean; hostname?: string };
export async function validateTurnstile(input: {
  token: string;
  secret: string;
  expectedHostname?: string;
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
      result.success &&
      (!input.expectedHostname || result.hostname === input.expectedHostname)
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}
