import type { ChatResponse } from '@/lib/ai/types';
export class ChatClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}
export async function submitChatTurn(
  request: Record<string, unknown>,
  signal: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
    signal,
    cache: 'no-store',
  });
  const body = (await response.json()) as
    | ChatResponse
    | { code?: string; message?: string; retryAfterSeconds?: number };
  if (!response.ok)
    throw new ChatClientError(
      'code' in body ? (body.code ?? 'request_failed') : 'request_failed',
      'message' in body
        ? (body.message ?? 'The request could not be completed.')
        : 'The request could not be completed.',
      'retryAfterSeconds' in body ? body.retryAfterSeconds : undefined,
    );
  return body as ChatResponse;
}
