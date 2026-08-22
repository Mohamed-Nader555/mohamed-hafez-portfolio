import { useEffect, useRef, useState } from 'react';
import type { RoleId } from '@/types/content';
import type { ChatResponse } from '@/lib/ai/types';
import { ChatClientError, submitChatTurn } from './chat-client';
import { ChatLauncher } from './ChatLauncher';
import { ChatPanel } from './ChatPanel';
import { createSessionStore } from './session-store';
import { requestTurnstileToken } from './turnstile-client';
import './assistant.css';

export function PortfolioAssistant({
  activeRole,
  initialSuggestions,
  turnstileSiteKey = '1x00000000000000000000AA',
}: {
  activeRole: RoleId;
  initialSuggestions: string[];
  turnstileSiteKey?: string;
}) {
  const [selectedRole, setSelectedRole] = useState(activeRole);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState('ready');
  const [response, setResponse] = useState<ChatResponse>();
  const [lastQuestion, setLastQuestion] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const controller = useRef<AbortController | undefined>(undefined);
  const store =
    typeof window === 'undefined'
      ? undefined
      : createSessionStore(window.sessionStorage);
  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
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
  useEffect(() => () => controller.current?.abort(), []);
  const clear = () => {
    controller.current?.abort();
    store?.clear();
    setDraft('');
    setResponse(undefined);
    setLastQuestion('');
    setState('ready');
  };
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    const question = draft.trim();
    if (!store || !question || state === 'submitting') return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 20_000);
    setState('submitting');
    setLastQuestion(question);
    setResponse(undefined);
    try {
      const session = store.load();
      const turnstileToken = await requestTurnstileToken(turnstileSiteKey);
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
      store.append({ role: 'user', content: question });
      store.append({
        role: 'assistant',
        content: next.answer,
        citationIds: next.citations.map((citation) => citation.sourceId),
      });
      setResponse(next);
      setState(next.answerStatus);
      setDraft('');
    } catch (error) {
      setState(
        error instanceof ChatClientError && error.code === 'rate_limited'
          ? 'rate-limited'
          : 'error',
      );
    } finally {
      window.clearTimeout(timeout);
    }
  };
  const suggestions = response?.followUps.length
    ? response.followUps
    : initialSuggestions;
  return (
    <aside className="portfolio-assistant" aria-label="Portfolio assistant">
      <ChatLauncher onOpen={() => setOpen(true)} />
      {open && (
        <ChatPanel
          inputRef={inputRef}
          draft={draft}
          setDraft={setDraft}
          close={() => setOpen(false)}
          clear={clear}
          submit={submit}
          response={response}
          state={state}
          suggestions={suggestions}
          selectedRole={selectedRole}
          lastQuestion={lastQuestion}
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
