type RateLimiter = {
  limit(input: { key: string }): Promise<{ success: boolean }>;
};
export async function hashedRateLimitKey(
  sessionId: string,
  secret: string,
): Promise<string> {
  const bytes = new TextEncoder().encode(`${secret}:${sessionId}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
export async function allowChatRequest(input: {
  sessionId: string;
  secret: string;
  sessionLimiter?: RateLimiter;
  globalLimiter?: RateLimiter;
}): Promise<boolean> {
  const key = await hashedRateLimitKey(input.sessionId, input.secret);
  const [session, global] = await Promise.all([
    input.sessionLimiter?.limit({ key }) ?? Promise.resolve({ success: true }),
    input.globalLimiter?.limit({ key: 'chat-global' }) ??
      Promise.resolve({ success: true }),
  ]);
  return session.success && global.success;
}
