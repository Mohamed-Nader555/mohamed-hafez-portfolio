import { expect, it, vi } from 'vitest';
import {
  createWorkersAiProvider,
  DEFAULT_WORKERS_AI_MODEL,
} from '@/lib/ai/workers-ai-provider';

const request = {
  messages: [{ role: 'user' as const, content: 'How was Northstar built?' }],
  maxTokens: 500,
  temperature: 0.1,
};

it('requests a schema-constrained answer from a model with JSON Mode', async () => {
  const run = vi.fn().mockResolvedValue({ response: {} });
  await createWorkersAiProvider(
    { run },
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  ).generate(request);

  expect(run).toHaveBeenCalledWith(
    '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
    expect.objectContaining({
      response_format: expect.objectContaining({
        type: 'json_schema',
        json_schema: expect.objectContaining({
          required: ['answer', 'answerStatus', 'citationIds', 'followUps'],
        }),
      }),
    }),
  );
});

it('relies on the prompt for JSON when the model is not on the JSON Mode list', async () => {
  const run = vi.fn().mockResolvedValue({ response: {} });
  await createWorkersAiProvider({ run }).generate(request);

  expect(DEFAULT_WORKERS_AI_MODEL).toBe('@cf/meta/llama-3.1-8b-instruct-fast');
  expect(run.mock.calls[0]![0]).toBe(DEFAULT_WORKERS_AI_MODEL);
  expect(run.mock.calls[0]![1]).not.toHaveProperty('response_format');
});

it('switches model through the model argument alone', async () => {
  const run = vi.fn().mockResolvedValue({});
  await createWorkersAiProvider({ run }, '@cf/example/other').generate(request);
  expect(run.mock.calls[0]![0]).toBe('@cf/example/other');
});
