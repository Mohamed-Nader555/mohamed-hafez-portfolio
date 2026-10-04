import { useEffect, useRef, useState } from 'react';
import type { RoleId } from '@/types/content';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { submitChatTurn } from './chat-client';
import { ChatFailure, type ChatFailureCode } from './chat-errors';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
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
  const store =
    typeof window === 'undefined'
      ? undefined
      : createSessionStore(window.sessionStorage);
  useEffect(() => {
    // Hydrate after mount: the page is server-rendered with an empty thread.
    setThread(createSessionStore(window.sessionStorage).thread());
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
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    const question = draft.trim();
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
    setDraft('');
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
      }, 20_000);
      const next = await submitChatTurn(
        {
          question,
          activeRole: selectedRole,
          history: session.history,
          sessionId: session.sessionId,
          turnstileToken,
        },
        abort.signal,
      );
      if (run !== runId.current) return;
      store.append({ role: 'user', content: question });
      store.append({
        role: 'assistant',
        content: next.answer,
        citationIds: next.citations.map((citation) => citation.sourceId),
      });
      store.appendExchange({ question, response: next });
      setThread(store.thread());
      setPendingQuestion('');
      setState(next.answerStatus);
    } catch (error) {
      // Cleared, closed or superseded: whoever cancelled already reset state.
      if (run !== runId.current) return;
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
