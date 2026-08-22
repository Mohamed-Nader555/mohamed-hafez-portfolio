import { expect, it, vi } from 'vitest';
import { requestTurnstileToken } from '@/components/ai/turnstile-client';

it('labels AI verification tokens with the stable portfolio chat action', async () => {
  let renderOptions:
    | {
        action?: string;
        appearance?: string;
        callback(token: string): void;
      }
    | undefined;
  let targetWasHidden = true;
  const remove = vi.fn();

  window.turnstile = {
    render: (_target, options) => {
      targetWasHidden =
        typeof _target === 'string' ? true : Boolean(_target.hidden);
      renderOptions = options;
      return 'portfolio-chat-widget';
    },
    execute: () => renderOptions?.callback('verified-token'),
    remove,
    reset: vi.fn(),
  };

  await expect(requestTurnstileToken('production-site-key')).resolves.toBe(
    'verified-token',
  );
  expect(renderOptions?.action).toBe('portfolio_chat');
  expect(renderOptions?.appearance).toBe('interaction-only');
  expect(targetWasHidden).toBe(false);
  expect(remove).toHaveBeenCalledWith('portfolio-chat-widget');
});
