import type { ChatResponse } from '@/lib/ai/types';
import type { ConversationTurn } from '@/lib/rag/types';
export const SESSION_KEY = 'mh_portfolio_chat_session_v1';
export const HISTORY_KEY = 'mh_portfolio_chat_history_v1';
export const THREAD_KEY = 'mh_portfolio_chat_thread_v1';
const THREAD_LIMIT = 20;

/** One question and the full answer, as rendered in the panel. */
export type ThreadEntry = { question: string; response: ChatResponse };
export type SessionStore = {
  load(): { sessionId: string; history: ConversationTurn[] };
  append(turn: ConversationTurn): void;
  thread(): ThreadEntry[];
  appendExchange(entry: ThreadEntry): void;
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
  const thread = (): ThreadEntry[] => {
    try {
      const parsed = JSON.parse(storage.getItem(THREAD_KEY) ?? '[]');
      return Array.isArray(parsed) ? parsed.slice(-THREAD_LIMIT) : [];
    } catch {
      return [];
    }
  };
  return {
    thread,
    appendExchange: (entry) =>
      storage.setItem(
        THREAD_KEY,
        JSON.stringify([...thread(), entry].slice(-THREAD_LIMIT)),
      ),
    load: () => ({ sessionId: sessionId(), history: history() }),
    append: (turn) =>
      storage.setItem(
        HISTORY_KEY,
        JSON.stringify([...history(), turn].slice(-6)),
      ),
    clear: () => {
      storage.removeItem(SESSION_KEY);
      storage.removeItem(HISTORY_KEY);
      storage.removeItem(THREAD_KEY);
    },
  };
}
