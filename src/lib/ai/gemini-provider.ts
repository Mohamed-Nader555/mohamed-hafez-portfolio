/**
 * Client for Google's Gemini Interactions API
 * (https://ai.google.dev/gemini-api/docs/structured-output, checked 2026-10-10):
 * `POST /v1beta/interactions`, key in the `x-goog-api-key` header, structured
 * output through `response_format`, `thinking_level` and `max_output_tokens`
 * inside `generation_config`, and token counts in `usage.total_*_tokens`.
 *
 * Thinking tokens count against `max_output_tokens`. A reply that reaches the
 * limit while thinking comes back `incomplete` or empty and is still billed, so
 * callers set the limit generously and every empty reply here is an error.
 *
 * Nothing in this file logs, and no error message carries prompt text, answer
 * text, an upstream response body or the key.
 */

export const GEMINI_ENDPOINT =
  'https://generativelanguage.googleapis.com/v1beta/interactions';

export type GeminiThinkingLevel = 'minimal' | 'low' | 'medium' | 'high';

export type GeminiUsage = {
  inputTokens: number;
  cachedTokens: number;
  outputTokens: number;
  thinkingTokens: number;
};

export type GeminiRequest = {
  system?: string;
  input: string;
  /** JSON Schema the reply must follow. */
  schema: Record<string, unknown>;
  thinkingLevel: GeminiThinkingLevel;
  maxOutputTokens: number;
  timeoutMs: number;
};

export type GeminiResult = { data: unknown; usage: GeminiUsage };

export type GeminiErrorKind =
  | 'config'
  | 'timeout'
  | 'network'
  | 'http'
  | 'incomplete'
  | 'empty'
  | 'malformed';

export class GeminiError extends Error {
  readonly kind: GeminiErrorKind;
  readonly status?: number;

  constructor(kind: GeminiErrorKind, status?: number) {
    super(
      status
        ? `Gemini request failed: ${kind} (${status})`
        : `Gemini request failed: ${kind}`,
    );
    this.name = 'GeminiError';
    this.kind = kind;
    this.status = status;
  }
}

export interface GeminiProvider {
  generateJson(request: GeminiRequest): Promise<GeminiResult>;
}

type Fetcher = (url: string, init?: RequestInit) => Promise<Response>;

function isAbort(error: unknown): boolean {
  return (error as { name?: string } | null)?.name === 'AbortError';
}

function count(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function readUsage(usage: unknown): GeminiUsage {
  const u = (usage ?? {}) as Record<string, unknown>;
  return {
    inputTokens: count(u.total_input_tokens),
    cachedTokens: count(u.total_cached_tokens),
    outputTokens: count(u.total_output_tokens),
    thinkingTokens: count(u.total_thought_tokens),
  };
}

function readText(steps: unknown): string {
  if (!Array.isArray(steps)) return '';
  return steps
    .filter((step) => step?.type === 'model_output')
    .flatMap((step) => (Array.isArray(step.content) ? step.content : []))
    .filter((block) => block?.type === 'text' && typeof block.text === 'string')
    .map((block) => block.text as string)
    .join('');
}

export function createGeminiProvider({
  apiKey,
  model,
  fetcher = fetch,
}: {
  apiKey: string;
  model: string;
  fetcher?: Fetcher;
}): GeminiProvider {
  if (!apiKey.trim() || !model.trim()) throw new GeminiError('config');

  return {
    async generateJson(request) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), request.timeoutMs);
      try {
        let response: Response;
        try {
          response = await fetcher(GEMINI_ENDPOINT, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': apiKey,
            },
            body: JSON.stringify({
              model,
              input: request.input,
              ...(request.system ? { system_instruction: request.system } : {}),
              response_format: {
                type: 'text',
                mime_type: 'application/json',
                schema: request.schema,
              },
              generation_config: {
                thinking_level: request.thinkingLevel,
                max_output_tokens: request.maxOutputTokens,
              },
              // Chat text is never stored, here or at the provider.
              store: false,
            }),
            signal: controller.signal,
          });
        } catch (error) {
          throw new GeminiError(isAbort(error) ? 'timeout' : 'network');
        }

        if (!response.ok) throw new GeminiError('http', response.status);
        let body: Record<string, unknown>;
        try {
          body = (await response.json()) as Record<string, unknown>;
        } catch (error) {
          throw new GeminiError(isAbort(error) ? 'timeout' : 'malformed');
        }
        if (body?.status !== 'completed') throw new GeminiError('incomplete');
        const text = readText(body.steps).trim();
        if (!text) throw new GeminiError('empty');
        let data: unknown;
        try {
          data = JSON.parse(text);
        } catch {
          throw new GeminiError('malformed');
        }
        return { data, usage: readUsage(body.usage) };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
