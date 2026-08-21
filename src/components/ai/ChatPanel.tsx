import type { RefObject } from 'react';
import type { ChatResponse } from '@/lib/ai/types';
import { ChatMessage } from './ChatMessage';
import { ChatSuggestions } from './ChatSuggestions';
export function ChatPanel({
  inputRef,
  draft,
  setDraft,
  close,
  clear,
  submit,
  response,
  state,
  suggestions,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  setDraft(value: string): void;
  close(): void;
  clear(): void;
  submit(event: { preventDefault(): void }): void;
  response?: ChatResponse;
  state: string;
  suggestions: string[];
}) {
  return (
    <section
      className="chat-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Portfolio assistant"
    >
      <header>
        <div>
          <p className="eyebrow">Portfolio assistant</p>
          <h2>Ask about Mohamed’s work</h2>
        </div>
        <button type="button" onClick={close} aria-label="Close assistant">
          Close
        </button>
      </header>
      <p className="chat-privacy">
        Answers are grounded in the projects, résumés, research, and experience
        published here. Chat stays in this browser session.
      </p>
      <div className="chat-conversation">
        {response && <ChatMessage response={response} />}
        {state === 'error' && (
          <p className="chat-error">
            The request could not be completed. Your draft is still available to
            retry.
          </p>
        )}
        {state === 'rate-limited' && (
          <p className="chat-error">
            Please wait a minute before trying another question.
          </p>
        )}
      </div>
      <ChatSuggestions suggestions={suggestions} onChoose={setDraft} />
      <form onSubmit={submit}>
        <label htmlFor="portfolio-chat-question">Your question</label>
        <textarea
          ref={inputRef}
          id="portfolio-chat-question"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          maxLength={600}
          required
          rows={3}
          placeholder="For example: How was Northstar built?"
        />
        <div className="chat-actions">
          <button type="button" onClick={clear}>
            Clear conversation
          </button>
          <button type="submit" disabled={state === 'submitting'}>
            {state === 'submitting' ? 'Finding an answer…' : 'Ask question'}
          </button>
        </div>
      </form>
    </section>
  );
}
