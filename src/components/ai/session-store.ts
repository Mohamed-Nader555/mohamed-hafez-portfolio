import type { ConversationTurn } from '@/lib/rag/types';
export const SESSION_KEY = 'mh_portfolio_chat_session_v1';
export const HISTORY_KEY = 'mh_portfolio_chat_history_v1';
export type SessionStore = {
  load(): { sessionId: string; history: ConversationTurn[] };
  append(turn: ConversationTurn): void;
  clear(): void;
};
export function createSessionStore(storage: Storage): SessionStore {
  const sessionId = () => {
    const existing = storage.getItem(SESSION_KEY);
    if (existing) return existing;
    const value = crypto.randomUUID();
    storage.setItem(SESSION_KEY, value);
    return value;
  };
  const history = () => {
    try {
      const parsed = JSON.parse(storage.getItem(HISTORY_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.slice(-6) : [];
    } catch {
      return [];
    }
  };
  return {
    load: () => ({ sessionId: sessionId(), history: history() }),
    append: (turn) =>
      storage.setItem(
        HISTORY_KEY,
        JSON.stringify([...history(), turn].slice(-6)),
      ),
    clear: () => {
      storage.removeItem(SESSION_KEY);
      storage.removeItem(HISTORY_KEY);
    },
  };
}
