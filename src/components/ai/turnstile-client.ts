import {
  isLocalHostname,
  PORTFOLIO_CHAT_TURNSTILE_ACTION,
} from '@/lib/security/turnstile';
import { ChatFailure, type ChatFailureCode } from './chat-errors';

declare global {
  interface Window {
    turnstile?: {
      execute(widgetId: string): void;
      remove(widgetId: string): void;
      reset(widgetId?: string): void;
      render(
        target: HTMLElement,
        options: {
          sitekey: string;
          execution: 'execute';
          action: string;
          appearance: 'interaction-only';
          retry: 'never';
          callback(token: string): void;
          'error-callback'(errorCode?: string | number): void;
          'expired-callback'(): void;
          'timeout-callback'?(): void;
          'before-interactive-callback'?(): void;
          'after-interactive-callback'?(): void;
        },
      ): string;
    };
  }
}

/** Cloudflare's always-passes test site key, used on every local host. */
export const TURNSTILE_TEST_SITEKEY = '1x00000000000000000000AA';
export const TURNSTILE_TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
export const TURNSTILE_TIMEOUT_MS = 30_000;
const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_HOSTNAME_HINT =
  'This hostname is not allowed for the Turnstile widget. Add it under the widget’s hostname settings in the Cloudflare dashboard.';

/**
 * Codes 1101xx (bad site key) and 1102xx (hostname not authorised) are faults
 * in our own configuration, not a visitor failing the check, so the panel
 * shows the offline message instead of asking the visitor to try again.
 */
export function turnstileErrorFailureCode(
  errorCode?: string | number,
): ChatFailureCode {
  const code = String(errorCode ?? '');
  return code.startsWith('1101') || code.startsWith('1102')
    ? 'temporarily_unavailable'
    : 'verification_failed';
}

export function testTurnstileToken(): string {
  return TURNSTILE_TEST_TOKEN;
}

/**
 * The site key is chosen in the browser because a prerendered page cannot see
 * the request host at render time: on a local host the test key always wins.
 */
export function resolveTurnstileSiteKey(
  siteKey: string,
  hostname: string = typeof window === 'undefined'
    ? ''
    : window.location.hostname,
): string {
  return isLocalHostname(hostname) ? TURNSTILE_TEST_SITEKEY : siteKey;
}

let scriptLoad: Promise<void> | undefined;
function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoad) return scriptLoad;
  scriptLoad = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    const fail = () => {
      script.remove();
      scriptLoad = undefined;
      reject(new Error('Turnstile could not load.'));
    };
    script.onload = () => (window.turnstile ? resolve() : fail());
    script.onerror = fail;
    document.head.append(script);
  });
  return scriptLoad;
}

export type TurnstileRequestOptions = {
  /** Slot inside the chat dialog the widget renders into. */
  container?: HTMLElement | null;
  /** Called with true while Turnstile needs the visitor to interact. */
  onInteractive?(active: boolean): void;
  timeoutMs?: number;
  signal?: AbortSignal;
};

export async function requestTurnstileToken(
  siteKey: string,
  options: TurnstileRequestOptions = {},
): Promise<string> {
  if (siteKey === TURNSTILE_TEST_SITEKEY) return TURNSTILE_TEST_TOKEN;
  return new Promise<string>((resolve, reject) => {
    let widgetId: string | undefined;
    let fallbackTarget: HTMLElement | undefined;
    let settled = false;
    let warned = false;
    const timer = window.setTimeout(
      () => fail('verification_timeout'),
      options.timeoutMs ?? TURNSTILE_TIMEOUT_MS,
    );
    const onAbort = () =>
      settle(() => reject(new DOMException('Aborted', 'AbortError')));
    const settle = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      options.signal?.removeEventListener('abort', onAbort);
      if (widgetId !== undefined) {
        try {
          window.turnstile?.remove(widgetId);
        } catch {
          // The widget may already be gone with its container.
        }
        widgetId = undefined;
      }
      fallbackTarget?.remove();
      options.onInteractive?.(false);
      action();
    };
    const fail = (code: ChatFailureCode) =>
      settle(() => reject(new ChatFailure(code)));
    if (options.signal?.aborted) return onAbort();
    options.signal?.addEventListener('abort', onAbort, { once: true });

    loadTurnstile().then(
      () => {
        if (settled || !window.turnstile) return;
        let target = options.container ?? undefined;
        if (!target) {
          // Only reached when no dialog slot was supplied.
          target = fallbackTarget = document.createElement('div');
          document.body.append(target);
        }
        try {
          widgetId = window.turnstile.render(target, {
            sitekey: siteKey,
            execution: 'execute',
            action: PORTFOLIO_CHAT_TURNSTILE_ACTION,
            appearance: 'interaction-only',
            // An automatic retry can fire after settle() removed the widget
            // and surface as an uncaught "Nothing to reset found" error.
            retry: 'never',
            callback: (token) => settle(() => resolve(token)),
            'error-callback': (errorCode) => {
              if (!warned) {
                warned = true;
                const code = String(errorCode ?? '');
                console.warn(
                  `[portfolio-chat] Turnstile error ${code || 'unknown'}.` +
                    (code.startsWith('1102')
                      ? ` ${TURNSTILE_HOSTNAME_HINT}`
                      : ''),
                );
              }
              fail(turnstileErrorFailureCode(errorCode));
            },
            'expired-callback': () => fail('verification_failed'),
            'timeout-callback': () => fail('verification_timeout'),
            'before-interactive-callback': () => options.onInteractive?.(true),
            'after-interactive-callback': () => options.onInteractive?.(false),
          });
          window.turnstile.execute(widgetId);
        } catch {
          fail('verification_failed');
        }
      },
      () => fail('verification_blocked'),
    );
  });
}
