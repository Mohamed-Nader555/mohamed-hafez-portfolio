import { useEffect, useRef, useState } from 'react';
import type { RoleId } from '@/types/content';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { CHAT_REQUEST_TIMEOUT_MS } from '@/lib/ai/timeouts';
import { submitChatTurn } from './chat-client';
import { ChatFailure, type ChatFailureCode } from './chat-errors';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import { DEFAULT_JOB_DESCRIPTION_QUESTION } from './job-description';
import { createSessionStore, type ThreadEntry } from './session-store';
import {
  requestTurnstileToken,
  resolveTurnstileSiteKey,
} from './turnstile-client';
import './assistant.css';

export function PortfolioAssistant({
  activeRole,
  initialSuggestions,
  turnstileSiteKey = '1x00000000000000000000AA',
}: {
  activeRole: RoleId;
  /** Overrides the per-focus starter questions (tests). */
  initialSuggestions?: string[];
  turnstileSiteKey?: string;
}) {
  const [selectedRole, setSelectedRole] = useState(activeRole);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  // A pasted job description lives only here, until it is sent: it is never
  // written to the session store.
  const [jobDescription, setJobDescription] = useState('');
  const [state, setState] = useState('ready');
  const [thread, setThread] = useState<ThreadEntry[]>([]);
  const [pendingQuestion, setPendingQuestion] = useState('');
  const [errorCode, setErrorCode] = useState<ChatFailureCode>();
  const [challengeVisible, setChallengeVisible] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const turnstileSlotRef = useRef<HTMLDivElement>(null);
  const controller = useRef<AbortController | undefined>(undefined);
  const verification = useRef<AbortController | undefined>(undefined);
  const runId = useRef(0);
  const closeRef = useRef<() => void>(() => {});
  const store = (() => {
    try {
      return typeof window === 'undefined'
        ? undefined
        : createSessionStore(window.sessionStorage);
    } catch {
      return undefined;
    }
  })();
  useEffect(() => {
    // Hydrate after mount: the page is server-rendered with an empty thread.
    setThread(store?.thread() ?? []);
  }, []);
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
    };
    document.addEventListener('keydown', close);
    return () => document.removeEventListener('keydown', close);
  }, []);
  useEffect(() => {
    const selectRole = (event: Event) => {
      setSelectedRole((event as CustomEvent<RoleId>).detail);
    };
    document.addEventListener('portfolio:role-change', selectRole);
    return () =>
      document.removeEventListener('portfolio:role-change', selectRole);
  }, []);
  useEffect(
    () => () => {
      runId.current += 1;
      verification.current?.abort();
      controller.current?.abort();
    },
    [],
  );
  const cancelPending = () => {
    runId.current += 1;
    verification.current?.abort();
    controller.current?.abort();
    setChallengeVisible(false);
  };
  const clear = () => {
    cancelPending();
    store?.clear();
    setDraft('');
    setJobDescription('');
    setThread([]);
    setPendingQuestion('');
    setErrorCode(undefined);
    setState('ready');
  };
  const closePanel = () => {
    // The human check renders inside the dialog, so it cannot finish once the
    // dialog is gone: hand the question back instead of waiting it out.
    if (state === 'verifying') {
      cancelPending();
      setDraft(pendingQuestion);
      setPendingQuestion('');
      setState('ready');
    }
    setOpen(false);
  };
  closeRef.current = closePanel;
  /**
   * Asks one question. A retry (after a fallback summary) sends the history
   * without the failed exchange and replaces that exchange when it succeeds;
   * when it fails the summary stays and the draft is left alone. A pasted job
   * description goes with the question and is emptied once its brief arrives;
   * if the request fails it stays, so the visitor can send it again.
   */
  const ask = async (
    question: string,
    isRetry = false,
    pastedJobDescription?: string,
  ) => {
    if (!store || !question || state === 'verifying' || state === 'submitting')
      return;
    cancelPending();
    const run = runId.current;
    const verify = new AbortController();
    const abort = new AbortController();
    verification.current = verify;
    controller.current = abort;
    let timeout: number | undefined;
    let timedOut = false;
    setState('verifying');
    setErrorCode(undefined);
    setPendingQuestion(question);
    if (!isRetry) setDraft('');
    try {
      const session = store.load();
      const turnstileToken = await requestTurnstileToken(
        resolveTurnstileSiteKey(turnstileSiteKey),
        {
          container: turnstileSlotRef.current,
          onInteractive: (active) => {
            setChallengeVisible(active);
            // Keyboard and screen-reader users land on the check, not behind it.
            if (active) turnstileSlotRef.current?.focus();
          },
          signal: verify.signal,
        },
      );
      if (run !== runId.current) return;
      setState('submitting');
      // The request clock starts once the token is in hand.
      timeout = window.setTimeout(() => {
        timedOut = true;
        abort.abort();
      }, CHAT_REQUEST_TIMEOUT_MS);
      const next = await submitChatTurn(
        {
          question,
          ...(pastedJobDescription
            ? { jobDescription: pastedJobDescription }
            : {}),
          activeRole: selectedRole,
          history: isRetry ? session.history.slice(0, -2) : session.history,
          sessionId: session.sessionId,
          turnstileToken,
        },
        abort.signal,
      );
      if (run !== runId.current) return;
      if (isRetry) store.dropLastExchange();
      store.append({ role: 'user', content: question });
      store.append({
        role: 'assistant',
        // A brief is remembered by its one-line summary only.
        content: next.brief
          ? `Job description brief. ${next.brief.summary?.text ?? ''}`.trim()
          : next.answer,
        citationIds: next.citations.map((citation) => citation.sourceId),
      });
      store.appendExchange({ question, response: next });
      setThread(store.thread());
      setPendingQuestion('');
      if (pastedJobDescription) setJobDescription('');
      setState(next.answerStatus);
    } catch (error) {
      // Cleared, closed or superseded: whoever cancelled already reset state.
      if (run !== runId.current) return;
      // Hand back what the visitor typed; a default question is not theirs.
      if (!isRetry && question !== DEFAULT_JOB_DESCRIPTION_QUESTION)
        setDraft(question);
      setPendingQuestion('');
      setErrorCode(
        error instanceof ChatFailure
          ? error.code
          : timedOut
            ? 'network'
            : 'request_failed',
      );
      setState('error');
    } finally {
      window.clearTimeout(timeout);
      if (run === runId.current) setChallengeVisible(false);
    }
  };
  const submit = (event: { preventDefault(): void }) => {
    event.preventDefault();
    const pasted = jobDescription.trim();
    const typed = draft.trim();
    void ask(
      typed || (pasted ? DEFAULT_JOB_DESCRIPTION_QUESTION : ''),
      false,
      pasted || undefined,
    );
  };
  const latest = thread[thread.length - 1]?.response;
  const suggestions = latest?.followUps.length
    ? latest.followUps
    : (initialSuggestions ?? starterSuggestions[selectedRole]);
  return (
    <aside className="portfolio-assistant" aria-label="Portfolio assistant">
      <ChatLauncher onOpen={() => setOpen(true)} />
      {open && (
        <ChatPanel
          inputRef={inputRef}
          draft={draft}
          setDraft={setDraft}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          close={closePanel}
          clear={clear}
          submit={submit}
          thread={thread}
          pendingQuestion={pendingQuestion}
          state={state}
          errorCode={errorCode}
          challengeVisible={challengeVisible}
          turnstileSlotRef={turnstileSlotRef}
          suggestions={suggestions}
          selectedRole={selectedRole}
          retry={(retried) => void ask(retried, true)}
        />
      )}
      <p className="sr-only" aria-live="polite">
        {state === 'answered'
          ? 'Evidence answer ready.'
          : state === 'refused'
            ? 'That question is outside the portfolio assistant’s scope.'
            : state === 'fallback'
              ? 'Grounded portfolio answer ready.'
              : ''}
      </p>
    </aside>
  );
}
