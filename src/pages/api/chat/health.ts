import type { APIRoute } from 'astro';
import { env as cloudflareEnv } from 'cloudflare:workers';
import { knowledgeChunkCount } from '@/lib/rag/retrieve';
import { parseExpectedHostnames } from '@/lib/security/turnstile';

export const prerender = false;

type Env = {
  AI?: unknown;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_EXPECTED_HOSTNAMES?: string;
  TURNSTILE_EXPECTED_HOSTNAME?: string;
};

// Configuration summary only: booleans and counts, never a key or hostname.
export const GET: APIRoute = async () => {
  const env = cloudflareEnv as Env;
  const verification = Boolean(env.TURNSTILE_SECRET_KEY);
  const hostnames = parseExpectedHostnames(env).length;
  return new Response(
    JSON.stringify({
      ok: verification && hostnames > 0,
      ai: Boolean(env.AI),
      verification,
      hostnames,
      knowledgeChunks: knowledgeChunkCount(),
    }),
    {
      status: 200,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store, max-age=0',
        'x-content-type-options': 'nosniff',
      },
    },
  );
};
