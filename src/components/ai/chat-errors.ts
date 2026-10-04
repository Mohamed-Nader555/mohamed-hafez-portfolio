export type ChatFailureCode =
  | 'verification_blocked'
  | 'verification_failed'
  | 'verification_timeout'
  | 'rate_limited'
  | 'temporarily_unavailable'
  | 'network'
  | 'request_failed';

export const CHAT_FAILURE_MESSAGES: Record<ChatFailureCode, string> = {
  verification_blocked:
    'The quick human check couldn’t load. A content blocker may be stopping it. Allow challenges.cloudflare.com for this site, then try again.',
  verification_failed: 'The quick human check didn’t pass. Please try again.',
  verification_timeout: 'The human check took too long. Please try again.',
  rate_limited: 'Please wait a minute before trying another question.',
  temporarily_unavailable:
    'The assistant is offline right now. Everything it knows is on the project pages.',
  network: 'I couldn’t reach the server. Check your connection and try again.',
  request_failed:
    'The request could not be completed. Your draft is still available to retry.',
};

export const chatFailureMessage = (code: ChatFailureCode): string =>
  CHAT_FAILURE_MESSAGES[code];

export class ChatFailure extends Error {
  constructor(
    public readonly code: ChatFailureCode,
    message: string = CHAT_FAILURE_MESSAGES[code],
    public readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'ChatFailure';
  }
}

/** Maps an API status (or a missing one) to the failure the panel reports. */
export function failureCodeForStatus(status: number): ChatFailureCode {
  if (status === 403) return 'verification_failed';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'temporarily_unavailable';
  return 'request_failed';
}

export const asChatFailure = (error: unknown): ChatFailure =>
  error instanceof ChatFailure ? error : new ChatFailure('request_failed');
