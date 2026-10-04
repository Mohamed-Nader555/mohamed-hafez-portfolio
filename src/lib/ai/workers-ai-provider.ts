import type { AiProvider } from './types';

export const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
type WorkersAi = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

/**
 * Models Cloudflare's JSON Mode page lists as supporting `response_format`
 * (checked 2026-10-04). `llama-3.1-8b-instruct-fast`, the default, is not on
 * the list, so it relies on the prompt-level JSON instruction and the
 * tolerant parser in `answer-guards.ts`. Setting `AI_MODEL` to a listed model
 * turns schema-constrained output on with no code change.
 */
const JSON_MODE_MODELS = new Set([
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-3-8b-instruct',
  '@cf/meta/llama-3.1-8b-instruct',
  '@hf/nousresearch/hermes-2-pro-mistral-7b',
  '@cf/deepseek-ai/deepseek-r1-distill-qwen-32b',
]);

const answerSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    answerStatus: { type: 'string', enum: ['answered', 'refused'] },
    citationIds: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    followUps: { type: 'array', items: { type: 'string' }, maxItems: 3 },
  },
  required: ['answer', 'answerStatus', 'citationIds', 'followUps'],
  additionalProperties: false,
};

export function createWorkersAiProvider(
  ai: WorkersAi,
  model = DEFAULT_WORKERS_AI_MODEL,
): AiProvider {
  return {
    generate: ({ messages, maxTokens, temperature }) =>
      ai.run(model, {
        messages,
        max_tokens: maxTokens,
        temperature,
        ...(JSON_MODE_MODELS.has(model)
          ? {
              response_format: {
                type: 'json_schema',
                json_schema: answerSchema,
              },
            }
          : {}),
      }),
  };
}
