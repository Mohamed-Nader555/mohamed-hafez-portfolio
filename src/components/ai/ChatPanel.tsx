import { useEffect, useRef, useState, type RefObject } from 'react';
import type { RoleId } from '@/types/content';
import { chatFailureMessage, type ChatFailureCode } from './chat-errors';
import { ChatMessage } from './ChatMessage';
import { MAX_JOB_DESCRIPTION_CHARS } from './job-description';
import { ChatSuggestions } from './ChatSuggestions';
import { NeuralGlyph } from './NeuralGlyph';
import { RolePicker } from './RolePicker';
import type { ThreadEntry } from './session-store';

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
  jobDescription,
  setJobDescription,
  close,
  clear,
  submit,
  thread,
  pendingQuestion,
  state,
  errorCode,
  challengeVisible,
  turnstileSlotRef,
  suggestions,
  selectedRole,
  retry,
}: {
  inputRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  setDraft(value: string): void;
  jobDescription: string;
  setJobDescription(value: string): void;
  close(): void;
  clear(): void;
  submit(event: { preventDefault(): void }): void;
  thread: ThreadEntry[];
  pendingQuestion: string;
  state: string;
  errorCode?: ChatFailureCode;
  challengeVisible: boolean;
  turnstileSlotRef: RefObject<HTMLDivElement | null>;
  suggestions: string[];
  selectedRole: RoleId;
  /** Asks the newest question again, in place of its fallback summary. */
  retry(question: string): void;
}) {
  const end = useRef<HTMLDivElement>(null);
  const [rolesOpen, setRolesOpen] = useState(false);
  const [jdOpen, setJdOpen] = useState(false);
  useEffect(() => {
    // Newest at the bottom, kept in view.
    const reduced = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    end.current?.scrollIntoView?.({
      block: 'end',
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [thread.length, pendingQuestion, state]);
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
            Answers come only from what’s published on this site: projects,
            research, experience, teaching and education. This conversation
            stays in your browser session.
          </p>

          {rolesOpen && <RolePicker onClose={() => setRolesOpen(false)} />}

          <div
            className="chat-conversation"
            aria-live="polite"
            hidden={rolesOpen}
          >
            {!thread.length && !pendingQuestion && state === 'ready' && (
              <div className="chat-welcome">
                <p className="chat-query-label">QUERY PORTFOLIO</p>
                <h3>What would you like to understand?</h3>
                <p>
                  Explore how I build, the decisions behind my projects, or the
                  experience I would bring to a team.
                </p>
              </div>
            )}

            {thread.map((entry, index) => (
              <div
                className="chat-exchange"
                key={`${index}-${entry.response.requestId}`}
              >
                <div className="chat-turn chat-turn--user">
                  <span className="chat-turn-label">You</span>
                  <p>{entry.question}</p>
                </div>
                <ChatMessage
                  response={entry.response}
                  question={entry.question}
                  onRetry={
                    index === thread.length - 1
                      ? () => retry(entry.question)
                      : undefined
                  }
                  retryDisabled={busy}
                />
              </div>
            ))}

            {pendingQuestion && (
              <div className="chat-turn chat-turn--user">
                <span className="chat-turn-label">You</span>
                <p>{pendingQuestion}</p>
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

            {state === 'error' && errorCode && (
              <p className="chat-error" role="alert" data-error={errorCode}>
                {chatFailureMessage(errorCode)}
              </p>
            )}
            <div ref={end} aria-hidden="true" />
          </div>

          <div hidden={rolesOpen}>
            <ChatSuggestions suggestions={suggestions} onChoose={setDraft} />
            <button
              type="button"
              className="chat-role-entry"
              onClick={() => setRolesOpen(true)}
            >
              <span>Hiring for a role?</span>
              <span aria-hidden="true">↗</span>
            </button>
          </div>
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
          {jdOpen && (
            <div className="chat-jd">
              <label htmlFor="portfolio-chat-job-description">
                Job description
              </label>
              <textarea
                id="portfolio-chat-job-description"
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                maxLength={MAX_JOB_DESCRIPTION_CHARS}
                rows={5}
                placeholder="Paste the posting here. It is only used to write your brief and is never stored."
              />
              <span className="chat-character-count">
                {jobDescription.length}/{MAX_JOB_DESCRIPTION_CHARS}
              </span>
            </div>
          )}
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
              required={!jobDescription.trim()}
              rows={2}
              placeholder="Ask about a project, technology, or experience…"
            />
            <button
              className="chat-send"
              type="submit"
              disabled={busy || (!draft.trim() && !jobDescription.trim())}
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
            <button
              type="button"
              aria-expanded={jdOpen}
              onClick={() => setJdOpen((open) => !open)}
            >
              {jdOpen ? 'Hide job description' : 'Paste a job description'}
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
