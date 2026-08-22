import type { AiProvider } from './types';

export const DEFAULT_WORKERS_AI_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast';
type WorkersAi = {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
};

const answerSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    answerStatus: { type: 'string', enum: ['answered', 'refused'] },
    citationIds: { type: 'array', items: { type: 'string' } },
    followUps: { type: 'array', items: { type: 'string' } },
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
        response_format: {
          type: 'json_schema',
          json_schema: answerSchema,
        },
      }),
  };
}
