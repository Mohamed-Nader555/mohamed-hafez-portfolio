import { CitationList } from './CitationList';
import type { ChatAction, ChatLabel, ChatResponse } from '@/lib/ai/types';

const LABELS: Record<ChatLabel, string> = {
  site: 'From the site',
  notes: 'From Mohamed’s notes',
  'own-words': 'Mohamed’s answer',
  reading: 'Assistant’s reading',
};

/** The browser builds the link, so the visitor's question goes into the email body and nowhere else. */
function emailHref(address: string, question: string) {
  const subject = 'A question from your portfolio assistant';
  const body = `I asked your portfolio assistant:\n\n${question}\n`;
  return `mailto:${address}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Action({
  action,
  question,
}: {
  action: ChatAction;
  question: string;
}) {
  const href =
    action.kind === 'email' ? emailHref(action.address, question) : action.href;
  return (
    <a className={`chat-action chat-action--${action.kind}`} href={href}>
      {action.label}
    </a>
  );
}

/** Shown on every fallback answer; the words are fixed, never model-written. */
export const FALLBACK_NOTICE =
  'The full assistant was busy, so this is a summary from the site.';

export function ChatMessage({
  response,
  question = '',
  onRetry,
  retryDisabled = false,
}: {
  response: ChatResponse;
  question?: string;
  /** Given only to the newest exchange; asks the same question again. */
  onRetry?: () => void;
  retryDisabled?: boolean;
}) {
  const retry = response.answerStatus === 'fallback' ? onRetry : undefined;
  const statusLabel =
    response.answerStatus === 'fallback'
      ? 'From the portfolio'
      : response.answerStatus === 'refused'
        ? 'Outside evidence scope'
        : response.answerStatus === 'not_covered'
          ? 'Not on the site'
          : 'Grounded answer';

  return (
    <article className={`chat-message chat-message--${response.answerStatus}`}>
      <header className="chat-message-header">
        <span className="chat-turn-label">Mohamed.AI</span>
        <span className="chat-answer-status">{statusLabel}</span>
      </header>
      {response.answerStatus === 'fallback' && (
        <p className="chat-notice" role="note">
          {FALLBACK_NOTICE}
        </p>
      )}
      {response.segments?.length ? (
        response.segments.map((segment, index) => (
          <div
            className={`chat-segment chat-segment--${segment.label}`}
            data-label={segment.label}
            key={`${index}-${segment.claimIds.join(',')}`}
          >
            <span className="chat-segment-label">{LABELS[segment.label]}</span>
            {segment.label === 'own-words' ? (
              <blockquote>
                <p>{segment.text}</p>
              </blockquote>
            ) : (
              <p>{segment.text}</p>
            )}
          </div>
        ))
      ) : (
        <p>{response.answer}</p>
      )}
      {response.citations.length > 0 && (
        <CitationList citations={response.citations} />
      )}
      {response.actions?.length || retry ? (
        <div className="chat-actions" role="group" aria-label="Next steps">
          {retry && (
            <button
              type="button"
              className="chat-action chat-action--retry"
              onClick={retry}
              disabled={retryDisabled}
            >
              Try again
            </button>
          )}
          {response.actions?.map((action) => (
            <Action key={action.kind} action={action} question={question} />
          ))}
        </div>
      ) : null}
    </article>
  );
}
