import { CitationList } from './CitationList';
import type { ChatResponse } from '@/lib/ai/types';
export function ChatMessage({ response }: { response: ChatResponse }) {
  const statusLabel =
    response.answerStatus === 'fallback'
      ? 'From the portfolio'
      : response.answerStatus === 'refused'
        ? 'Outside evidence scope'
        : 'Grounded answer';

  return (
    <article className={`chat-message chat-message--${response.answerStatus}`}>
      <header className="chat-message-header">
        <span className="chat-turn-label">Mohamed.AI</span>
        <span className="chat-answer-status">{statusLabel}</span>
      </header>
      <p>{response.answer}</p>
      {response.citations.length > 0 && (
        <CitationList citations={response.citations} />
      )}
    </article>
  );
}
