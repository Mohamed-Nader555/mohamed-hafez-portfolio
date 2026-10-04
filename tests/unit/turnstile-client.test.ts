import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  requestTurnstileToken,
  resolveTurnstileSiteKey,
  TURNSTILE_HOSTNAME_HINT,
  TURNSTILE_TEST_SITEKEY,
} from '@/components/ai/turnstile-client';

type RenderOptions = Parameters<
  NonNullable<typeof window.turnstile>['render']
>[1];

function installTurnstile(
  onExecute: (options: RenderOptions) => void = (options) =>
    options.callback('verified-token'),
) {
  let options: RenderOptions | undefined;
  const remove = vi.fn();
  const render = vi.fn((_target: HTMLElement, next: RenderOptions) => {
    options = next;
    return 'portfolio-chat-widget';
  });
  window.turnstile = {
    render,
    execute: () => onExecute(options!),
    remove,
    reset: vi.fn(),
  };
  return { remove, render, options: () => options! };
}

beforeEach(() => {
  delete window.turnstile;
  document.head.querySelectorAll('script').forEach((node) => node.remove());
});
afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete window.turnstile;
});

describe('resolveTurnstileSiteKey', () => {
  it.each(['localhost', '127.0.0.1', '[::1]'])(
    'uses the test key on %s whatever key was passed in',
    (hostname) => {
      expect(resolveTurnstileSiteKey('0xPRODUCTION', hostname)).toBe(
        TURNSTILE_TEST_SITEKEY,
      );
    },
  );

  it('keeps the configured key on the real site', () => {
    expect(resolveTurnstileSiteKey('0xPRODUCTION', 'mohamednhafez.com')).toBe(
      '0xPRODUCTION',
    );
    expect(
      resolveTurnstileSiteKey('0xPRODUCTION', 'mohamed-hafez-portfolio.x.dev'),
    ).toBe('0xPRODUCTION');
  });
});

describe('requestTurnstileToken', () => {
  it('returns the dummy token for the test key without loading anything', async () => {
    await expect(requestTurnstileToken(TURNSTILE_TEST_SITEKEY)).resolves.toBe(
      'XXXX.DUMMY.TOKEN.XXXX',
    );
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('renders into the supplied slot with the stable portfolio action', async () => {
    const turnstile = installTurnstile();
    const container = document.createElement('div');
    document.body.append(container);

    await expect(
      requestTurnstileToken('production-site-key', { container }),
    ).resolves.toBe('verified-token');

    expect(turnstile.render.mock.calls[0]![0]).toBe(container);
    expect(turnstile.options().action).toBe('portfolio_chat');
    expect(turnstile.options().appearance).toBe('interaction-only');
    expect(turnstile.remove).toHaveBeenCalledWith('portfolio-chat-widget');
    container.remove();
  });

  it('falls back to a temporary body element and removes it', async () => {
    const turnstile = installTurnstile(() => {
      const target = turnstile.render.mock.calls[0]![0];
      expect(target.isConnected).toBe(true);
      turnstile.options().callback('verified-token');
    });
    await requestTurnstileToken('production-site-key');
    expect(turnstile.render.mock.calls[0]![0].isConnected).toBe(false);
  });

  it('reports interaction start and end around the visible challenge', async () => {
    const turnstile = installTurnstile((options) => {
      options['before-interactive-callback']?.();
      options['after-interactive-callback']?.();
      options.callback('verified-token');
    });
    const onInteractive = vi.fn();
    await requestTurnstileToken('production-site-key', {
      container: document.createElement('div'),
      onInteractive,
    });
    expect(onInteractive.mock.calls.map(([active]) => active)).toEqual([
      true,
      false,
      false,
    ]);
    expect(turnstile.remove).toHaveBeenCalledTimes(1);
  });

  it('rejects with verification_blocked when the script cannot load', async () => {
    const pending = requestTurnstileToken('production-site-key');
    const script = document.head.querySelector('script');
    expect(script?.src).toContain('challenges.cloudflare.com/turnstile');
    script!.dispatchEvent(new Event('error'));
    await expect(pending).rejects.toMatchObject({
      code: 'verification_blocked',
    });
    // The failed tag is removed so a retry can load the script again.
    expect(document.head.querySelector('script')).toBeNull();
  });

  it('rejects with verification_failed and warns once on a widget error', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const turnstile = installTurnstile((options) => {
      options['error-callback'](110200);
      options['error-callback'](110200);
    });
    await expect(
      requestTurnstileToken('production-site-key', {
        container: document.createElement('div'),
      }),
    ).rejects.toMatchObject({ code: 'verification_failed' });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]![0]).toContain('110200');
    expect(warn.mock.calls[0]![0]).toContain(TURNSTILE_HOSTNAME_HINT);
    expect(turnstile.remove).toHaveBeenCalledTimes(1);
  });

  it('does not add the hostname hint to unrelated error codes', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    installTurnstile((options) => options['error-callback']('300030'));
    await expect(
      requestTurnstileToken('production-site-key', {
        container: document.createElement('div'),
      }),
    ).rejects.toMatchObject({ code: 'verification_failed' });
    expect(warn.mock.calls[0]![0]).not.toContain(TURNSTILE_HOSTNAME_HINT);
  });

  it('rejects with verification_timeout and removes the widget', async () => {
    vi.useFakeTimers();
    const turnstile = installTurnstile(() => {
      // Never produces a token.
    });
    const onInteractive = vi.fn();
    const pending = requestTurnstileToken('production-site-key', {
      container: document.createElement('div'),
      onInteractive,
    });
    const assertion = expect(pending).rejects.toMatchObject({
      code: 'verification_timeout',
    });
    await vi.advanceTimersByTimeAsync(29_999);
    expect(turnstile.remove).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await assertion;
    expect(turnstile.remove).toHaveBeenCalledWith('portfolio-chat-widget');
    expect(onInteractive).toHaveBeenLastCalledWith(false);
  });

  it('removes the widget when the caller aborts (component unmount)', async () => {
    const turnstile = installTurnstile(() => {
      // Waiting for the visitor.
    });
    const abort = new AbortController();
    const pending = requestTurnstileToken('production-site-key', {
      container: document.createElement('div'),
      signal: abort.signal,
    });
    await Promise.resolve();
    await Promise.resolve();
    abort.abort();
    await expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    expect(turnstile.remove).toHaveBeenCalledWith('portfolio-chat-widget');
  });
});
