import { CitationList } from './CitationList';
import type { ChatResponse } from '@/lib/ai/types';
export function ChatMessage({ response }: { response: ChatResponse }) {
  return (
    <article className={`chat-message chat-message--${response.answerStatus}`}>
      <p>{response.answer}</p>
      {response.answerStatus === 'fallback' && (
        <strong>Verified evidence fallback</strong>
      )}
      {response.citations.length > 0 && (
        <CitationList citations={response.citations} />
      )}
    </article>
  );
}
