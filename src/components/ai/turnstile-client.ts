declare global {
  interface Window {
    turnstile?: {
      execute(widgetId: string): void;
      reset(widgetId?: string): void;
      render(
        target: HTMLElement,
        options: {
          sitekey: string;
          execution: 'execute';
          callback(token: string): void;
          'error-callback'(): void;
          'expired-callback'(): void;
        },
      ): string;
    };
  }
}
export function testTurnstileToken(): string {
  return 'XXXX.DUMMY.TOKEN.XXXX';
}
function loaded(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src =
      'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile could not load.'));
    document.head.append(script);
  });
}
export async function requestTurnstileToken(siteKey: string): Promise<string> {
  if (siteKey === '1x00000000000000000000AA') return testTurnstileToken();
  await loaded();
  if (!window.turnstile) throw new Error('Turnstile unavailable.');
  const turnstile = window.turnstile;
  if (!turnstile) throw new Error('Turnstile unavailable.');
  return new Promise((resolve, reject) => {
    const target = document.createElement('div');
    target.hidden = true;
    document.body.append(target);
    const finish = (value?: string) => {
      target.remove();
      turnstile.reset(widgetId);
      if (value) resolve(value);
      else reject(new Error('Turnstile verification failed.'));
    };
    const widgetId = turnstile.render(target, {
      sitekey: siteKey,
      execution: 'execute',
      callback: (token) => finish(token),
      'error-callback': () => finish(),
      'expired-callback': () => finish(),
    });
    turnstile.execute(widgetId);
  });
}
