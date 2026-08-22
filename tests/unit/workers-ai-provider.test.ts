import { expect, it, vi } from 'vitest';
import { createWorkersAiProvider } from '@/lib/ai/workers-ai-provider';

it('requests a schema-constrained answer from Workers AI', async () => {
  const run = vi.fn().mockResolvedValue({ response: {} });
  const provider = createWorkersAiProvider({ run });

  await provider.generate({
    messages: [{ role: 'user', content: 'How was Northstar built?' }],
    maxTokens: 500,
    temperature: 0.1,
  });

  expect(run).toHaveBeenCalledWith(
    expect.any(String),
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
