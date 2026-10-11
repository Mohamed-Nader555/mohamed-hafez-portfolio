import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_CAP,
  assistantConfig,
  chooseAssistant,
  parseCap,
  resetConfigWarning,
  takeBudget,
  type KvLike,
} from '@/lib/ai/assistant-runtime';

function memoryKv(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const kv: KvLike = {
    get: vi.fn(async (key: string) => store.get(key) ?? null),
    put: vi.fn(async (key: string, value: string) => {
      store.set(key, value);
    }),
  };
  return { kv, store };
}
const day = new Date('2026-10-10T23:59:00Z');

describe('parseCap', () => {
  it('reads a positive whole number and falls back otherwise', () => {
    expect(parseCap('50')).toBe(50);
    expect(parseCap(undefined)).toBe(DEFAULT_CAP);
    expect(parseCap('')).toBe(DEFAULT_CAP);
    expect(parseCap('abc')).toBe(DEFAULT_CAP);
    expect(parseCap('-3')).toBe(DEFAULT_CAP);
    expect(parseCap('0')).toBe(DEFAULT_CAP);
    expect(DEFAULT_CAP).toBe(200);
  });
});

describe('takeBudget', () => {
  it('counts questions per UTC day in one key and refuses at the cap', async () => {
    const { kv, store } = memoryKv();
    expect(await takeBudget(kv, 2, day)).toBe(true);
    expect(await takeBudget(kv, 2, day)).toBe(true);
    expect(await takeBudget(kv, 2, day)).toBe(false);
    expect(store.get('model-questions:2026-10-10')).toBe('2');
    expect([...store.keys()]).toHaveLength(1);
  });

  it('starts a new count on the next UTC day', async () => {
    const { kv } = memoryKv({ 'model-questions:2026-10-10': '2' });
    expect(await takeBudget(kv, 2, day)).toBe(false);
    expect(await takeBudget(kv, 2, new Date('2026-10-11T00:00:01Z'))).toBe(
      true,
    );
  });

  it('lets the key expire after the day', async () => {
    const { kv } = memoryKv();
    await takeBudget(kv, 5, day);
    expect(kv.put).toHaveBeenCalledWith(
      'model-questions:2026-10-10',
      '1',
      expect.objectContaining({ expirationTtl: expect.any(Number) }),
    );
  });

  it('does not block questions when the store is missing or fails', async () => {
    expect(await takeBudget(undefined, 2, day)).toBe(true);
    const broken: KvLike = {
      get: vi.fn().mockRejectedValue(new Error('kv down')),
      put: vi.fn(),
    };
    expect(await takeBudget(broken, 2, day)).toBe(true);
  });
});

describe('assistantConfig', () => {
  it('defaults to the models in the brief', () => {
    expect(assistantConfig({})).toMatchObject({
      writerModel: 'gemini-3.8-flash',
      checkerModel: 'gemini-3.5-flash-lite',
      cap: 200,
    });
    expect(
      assistantConfig({ GEMINI_WRITER_MODEL: 'w', GEMINI_CHECKER_MODEL: 'c' }),
    ).toMatchObject({ writerModel: 'w', checkerModel: 'c' });
  });

  it('reports booleans only: the mode and whether the key is present', () => {
    expect(
      assistantConfig({ ASSISTANT_MODE: 'ledger', GEMINI_API_KEY: 'k' }),
    ).toMatchObject({ mode: 'ledger', keyPresent: true });
    expect(assistantConfig({ ASSISTANT_MODE: 'classic' })).toMatchObject({
      mode: 'classic',
      keyPresent: false,
    });
    expect(
      JSON.stringify(assistantConfig({ GEMINI_API_KEY: 'secret-1' })),
    ).not.toContain('secret-1');
  });

  it('reads the writer’s thinking level, medium unless told otherwise', () => {
    expect(assistantConfig({}).writerThinking).toBe('medium');
    expect(
      assistantConfig({ GEMINI_WRITER_THINKING: 'low' }).writerThinking,
    ).toBe('low');
    expect(
      assistantConfig({ GEMINI_WRITER_THINKING: 'minimal' }).writerThinking,
    ).toBe('medium');
  });

  it('treats an unknown or missing mode as classic', () => {
    expect(assistantConfig({}).mode).toBe('classic');
    expect(assistantConfig({ ASSISTANT_MODE: 'turbo' }).mode).toBe('classic');
  });
});

describe('chooseAssistant', () => {
  beforeEach(() => resetConfigWarning());

  it('runs classic when the mode says so', async () => {
    expect(
      await chooseAssistant({ ASSISTANT_MODE: 'classic', GEMINI_API_KEY: 'k' }),
    ).toBe('classic');
  });

  it('runs the ledger pipeline with the key and budget left', async () => {
    const { kv } = memoryKv();
    expect(
      await chooseAssistant(
        { ASSISTANT_MODE: 'ledger', GEMINI_API_KEY: 'k', CHAT_BUDGET: kv },
        day,
      ),
    ).toBe('ledger');
  });

  it('falls back to classic for the rest of the day above the cap', async () => {
    const { kv } = memoryKv({ 'model-questions:2026-10-10': '3' });
    expect(
      await chooseAssistant(
        {
          ASSISTANT_MODE: 'ledger',
          GEMINI_API_KEY: 'k',
          CHAT_BUDGET: kv,
          DAILY_MODEL_QUESTION_CAP: '3',
        },
        day,
      ),
    ).toBe('classic');
  });

  it('logs one configuration message, once, and runs classic when the key is missing', async () => {
    const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = { ASSISTANT_MODE: 'ledger' };
    expect(await chooseAssistant(env, day)).toBe('classic');
    expect(await chooseAssistant(env, day)).toBe('classic');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toMatch(/GEMINI_API_KEY/);
    warn.mockRestore();
  });
});
