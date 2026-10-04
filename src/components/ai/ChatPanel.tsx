import type { RefObject } from 'react';
import type { RoleId } from '@/types/content';
import type { ChatResponse } from '@/lib/ai/types';
import { chatFailureMessage, type ChatFailureCode } from './chat-errors';
import { ChatMessage } from './ChatMessage';
import { ChatSuggestions } from './ChatSuggestions';
import { NeuralGlyph } from './NeuralGlyph';

const roleLabels: Record<RoleId, string> = {
  aiml: 'AI & ML',
  software: 'Software',
  android: 'Android',
  teaching: 'Teaching',
};

export function ChatPanel({
  inputRef,
  draft,
  setDraft,
  close,
  clear,
  submit,
  response,
  state,
  errorCode,
  challengeVisible,
  turnstileSlotRef,
  suggestions,
  selectedRole,
  lastQuestion,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  setDraft(value: string): void;
  close(): void;
  clear(): void;
  submit(event: { preventDefault(): void }): void;
  response?: ChatResponse;
  state: string;
  errorCode?: ChatFailureCode;
  challengeVisible: boolean;
  turnstileSlotRef: RefObject<HTMLDivElement | null>;
  suggestions: string[];
  selectedRole: RoleId;
  lastQuestion: string;
}) {
  const busy = state === 'verifying' || state === 'submitting';
  return (
    <>
      <div className="chat-backdrop" aria-hidden="true" onMouseDown={close} />
      <section
        className="chat-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Mohamed AI portfolio assistant"
      >
        <div className="chat-neural-field" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <header className="chat-header">
          <div className="chat-identity">
            <span className="chat-mark" aria-hidden="true">
              <NeuralGlyph />
            </span>
            <div>
              <p className="chat-product-name">MOHAMED.AI</p>
              <h2>Grounded portfolio intelligence</h2>
            </div>
          </div>
          <button
            className="chat-icon-button"
            type="button"
            onClick={close}
            aria-label="Close assistant"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="chat-context-bar">
          <span className="chat-evidence-state">
            <span aria-hidden="true" />
            Verified portfolio evidence
          </span>
          <span className="chat-role-context">
            {roleLabels[selectedRole]} context
          </span>
        </div>

        <div className="chat-panel-body">
          <p className="chat-privacy">
            Answers use only published projects, résumés, research, and
            experience. This conversation stays in your browser session.
          </p>

          <div className="chat-conversation" aria-live="polite">
            {!lastQuestion && !response && state === 'ready' && (
              <div className="chat-welcome">
                <p className="chat-query-label">QUERY PORTFOLIO</p>
                <h3>What would you like to understand?</h3>
                <p>
                  Explore how I build, the decisions behind my projects, or the
                  experience I would bring to a team.
                </p>
              </div>
            )}

            {lastQuestion && (
              <div className="chat-turn chat-turn--user">
                <span className="chat-turn-label">You</span>
                <p>{lastQuestion}</p>
              </div>
            )}

            {(state === 'verifying' || state === 'submitting') && (
              <div className="chat-inference" role="status">
                <span className="inference-nodes" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </span>
                <span>
                  <strong>
                    {state === 'verifying'
                      ? 'Checking you’re human…'
                      : 'Retrieving evidence'}
                  </strong>
                  <small>
                    {state === 'verifying'
                      ? 'A quick check before I answer'
                      : 'Searching the verified knowledge base'}
                  </small>
                </span>
              </div>
            )}

            {response && <ChatMessage response={response} />}
            {state === 'error' && errorCode && (
              <p className="chat-error" role="alert" data-error={errorCode}>
                {chatFailureMessage(errorCode)}
              </p>
            )}
          </div>

          <ChatSuggestions suggestions={suggestions} onChoose={setDraft} />
        </div>

        <div className="chat-turnstile" data-active={challengeVisible}>
          <p className="chat-turnstile-hint" role="status">
            {challengeVisible ? 'One quick check before I answer.' : ''}
          </p>
          <div
            ref={turnstileSlotRef}
            className="chat-turnstile-slot"
            tabIndex={-1}
          />
        </div>

        <form className="chat-composer" onSubmit={submit}>
          <label className="sr-only" htmlFor="portfolio-chat-question">
            Your question
          </label>
          <div className="chat-input-shell">
            <textarea
              ref={inputRef}
              id="portfolio-chat-question"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing
                ) {
                  event.preventDefault();
                  submit(event);
                }
              }}
              maxLength={600}
              required
              rows={2}
              placeholder="Ask about a project, technology, or experience…"
            />
            <button
              className="chat-send"
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label={
                state === 'verifying'
                  ? 'Checking you’re human'
                  : state === 'submitting'
                    ? 'Retrieving evidence'
                    : 'Send question'
              }
            >
              <span>{busy ? '···' : 'Send'}</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
          <div className="chat-composer-meta">
            <button type="button" onClick={clear}>
              Clear session
            </button>
            <span>
              <span className="chat-keyboard-hint">
                Enter to send · Shift + Enter for a new line
              </span>
              <span className="chat-character-count">{draft.length}/600</span>
            </span>
          </div>
        </form>
      </section>
    </>
  );
}
