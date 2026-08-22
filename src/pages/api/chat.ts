import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { answerRecruiterQuestion } from '@/lib/ai/answer-service';
import {
  createWorkersAiProvider,
  DEFAULT_WORKERS_AI_MODEL,
} from '@/lib/ai/workers-ai-provider';
import { chatRequestSchema } from '@/lib/ai/types';
import { allowChatRequest } from '@/lib/security/chat-rate-limit';
import {
  PORTFOLIO_CHAT_TURNSTILE_ACTION,
  validateTurnstile,
} from '@/lib/security/turnstile';

export const prerender = false;
const TEST_SECRET = '1x0000000000000000000000000000000AA';
const TEST_TOKEN = 'XXXX.DUMMY.TOKEN.XXXX';
const headers = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store, max-age=0',
  'x-content-type-options': 'nosniff',
};
const error = (
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
) =>
  new Response(
    JSON.stringify({
      code,
      message,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    }),
    { status, headers },
  );
type Env = {
  AI?: { run(model: string, input: Record<string, unknown>): Promise<unknown> };
  TURNSTILE_SECRET_KEY?: string;
  RATE_LIMIT_HASH_SECRET?: string;
  CHAT_SESSION_RATE_LIMITER?: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
  CHAT_GLOBAL_RATE_LIMITER?: {
    limit(input: { key: string }): Promise<{ success: boolean }>;
  };
  AI_MODEL?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
};

export const POST: APIRoute = async ({ request }) => {
  if (
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    return error(400, 'invalid_request', 'Invalid request.');
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    return error(400, 'invalid_request', 'Invalid request.');
  }
  const requestBody = chatRequestSchema.safeParse(parsed);
  if (!requestBody.success)
    return error(400, 'invalid_request', 'Invalid request.');
  const env = cloudflareEnv as Env;
  const local =
    new URL(request.url).hostname === 'localhost' ||
    new URL(request.url).hostname === '127.0.0.1';
  if (!env.TURNSTILE_SECRET_KEY && !local)
    return error(
      503,
      'temporarily_unavailable',
      'The assistant is temporarily unavailable.',
    );
  const secret = env.TURNSTILE_SECRET_KEY ?? TEST_SECRET;
  const usesLocalTestKeys =
    local &&
    secret === TEST_SECRET &&
    requestBody.data.turnstileToken === TEST_TOKEN;
  const human = usesLocalTestKeys
    ? true
    : await validateTurnstile({
        token: requestBody.data.turnstileToken,
        secret,
        expectedHostname: env.TURNSTILE_EXPECTED_HOSTNAME,
        expectedAction: PORTFOLIO_CHAT_TURNSTILE_ACTION,
      });
  if (!human)
    return error(
      403,
      'verification_failed',
      'Verification failed. Please try again.',
    );
  const allowed = await allowChatRequest({
    sessionId: requestBody.data.sessionId,
    secret: env.RATE_LIMIT_HASH_SECRET ?? 'local-test-rate-limit-secret',
    sessionLimiter: env.CHAT_SESSION_RATE_LIMITER,
    globalLimiter: env.CHAT_GLOBAL_RATE_LIMITER,
  });
  if (!allowed)
    return error(429, 'rate_limited', 'Please wait before trying again.', 60);
  const requestId = crypto.randomUUID();
  const provider = env.AI
    ? createWorkersAiProvider(env.AI, env.AI_MODEL ?? DEFAULT_WORKERS_AI_MODEL)
    : {
        generate: async () => {
          throw new Error('AI unavailable');
        },
      };
  const response = await answerRecruiterQuestion(
    { provider, modelId: env.AI_MODEL ?? DEFAULT_WORKERS_AI_MODEL },
    { ...requestBody.data, requestId },
  );
  return new Response(JSON.stringify(response), { status: 200, headers });
};
export const ALL: APIRoute = async () =>
  error(405, 'method_not_allowed', 'Method not allowed.');
