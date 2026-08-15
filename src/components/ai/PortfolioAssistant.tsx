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
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [state, setState] = useState('ready');
  const [response, setResponse] = useState<ChatResponse>();
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
  useEffect(() => () => controller.current?.abort(), []);
  const clear = () => {
    controller.current?.abort();
    store?.clear();
    setDraft('');
    setResponse(undefined);
    setState('ready');
  };
  const submit = async (event: { preventDefault(): void }) => {
    event.preventDefault();
    if (!store || !draft.trim() || state === 'submitting') return;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timeout = window.setTimeout(() => abort.abort(), 20_000);
    setState('submitting');
    try {
      const session = store.load();
      const turnstileToken = await requestTurnstileToken(turnstileSiteKey);
      const next = await submitChatTurn(
        {
          question: draft.trim(),
          activeRole,
          history: session.history,
          sessionId: session.sessionId,
          turnstileToken,
        },
        abort.signal,
      );
      store.append({ role: 'user', content: draft.trim() });
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
    <aside
      className="portfolio-assistant"
      aria-label="Portfolio evidence assistant"
    >
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
        />
      )}
      <p className="sr-only" aria-live="polite">
        {state === 'answered'
          ? 'Evidence answer ready.'
          : state === 'refused'
            ? 'The question was not supported by public evidence.'
            : state === 'fallback'
              ? 'Verified evidence fallback ready.'
              : ''}
      </p>
    </aside>
  );
}
