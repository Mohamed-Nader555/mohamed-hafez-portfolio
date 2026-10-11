import { expect, it } from 'vitest';
import { createSessionStore } from '@/components/ai/session-store';

it('keeps only six messages in session storage and clears both keys', () => {
  const store = createSessionStore(sessionStorage);
  store.clear();
  for (let index = 0; index < 7; index += 1)
    store.append({ role: 'user', content: `question ${index}` });
  expect(store.load().history).toHaveLength(6);
  expect(localStorage.getItem('mh_portfolio_chat_history_v1')).toBeNull();
  store.clear();
  expect(sessionStorage.getItem('mh_portfolio_chat_history_v1')).toBeNull();
});

it('drops the last exchange: its thread entry and its two history turns', () => {
  const store = createSessionStore(sessionStorage);
  store.clear();
  for (const n of [1, 2]) {
    store.append({ role: 'user', content: `q${n}` });
    store.append({ role: 'assistant', content: `a${n}` });
    store.appendExchange({
      question: `q${n}`,
      response: { answer: `a${n}` } as never,
    });
  }
  store.dropLastExchange();
  expect(store.load().history.map((turn) => turn.content)).toEqual([
    'q1',
    'a1',
  ]);
  expect(store.thread().map((entry) => entry.question)).toEqual(['q1']);
  store.dropLastExchange();
  store.dropLastExchange();
  expect(store.load().history).toEqual([]);
  expect(store.thread()).toEqual([]);
});

it('clamps stored turns under the API limit and survives a blocked storage', () => {
  const store = createSessionStore(sessionStorage);
  store.clear();
  store.append({ role: 'assistant', content: 'x'.repeat(2000) });
  expect(store.load().history[0]!.content.length).toBeLessThanOrEqual(1000);

  const blocked = {
    getItem: () => {
      throw new Error('blocked');
    },
    setItem: () => {
      throw new Error('quota');
    },
    removeItem: () => {},
  } as unknown as Storage;
  const safe = createSessionStore(blocked);
  expect(() => safe.append({ role: 'user', content: 'hi' })).not.toThrow();
  expect(() =>
    safe.appendExchange({ question: 'q', response: {} as never }),
  ).not.toThrow();
  expect(() => safe.dropLastExchange()).not.toThrow();
  expect(safe.load().sessionId).toMatch(/[0-9a-f-]{36}/);
});
