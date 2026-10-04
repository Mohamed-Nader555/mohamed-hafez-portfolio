import type { ChatResponse } from '@/lib/ai/types';
import { ChatFailure, failureCodeForStatus } from './chat-errors';

export async function submitChatTurn(
  request: Record<string, unknown>,
  signal: AbortSignal,
): Promise<ChatResponse> {
  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(request),
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    // Aborts are classified by the caller (it knows whether its own timer
    // fired); everything else is a connection problem.
    if (error instanceof DOMException && error.name === 'AbortError')
      throw error;
    throw new ChatFailure('network');
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    body = undefined;
  }
  if (!response.ok) {
    const retryAfter =
      body && typeof body === 'object' && 'retryAfterSeconds' in body
        ? Number((body as { retryAfterSeconds: unknown }).retryAfterSeconds)
        : undefined;
    throw new ChatFailure(
      failureCodeForStatus(response.status),
      undefined,
      Number.isFinite(retryAfter) ? retryAfter : undefined,
    );
  }
  if (!body || typeof body !== 'object' || !('answer' in body))
    throw new ChatFailure('request_failed');
  return body as ChatResponse;
}
