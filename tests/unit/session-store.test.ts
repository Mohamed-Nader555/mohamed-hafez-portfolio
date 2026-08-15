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
