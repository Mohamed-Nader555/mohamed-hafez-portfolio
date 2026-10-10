import { afterEach, expect, it, vi } from 'vitest';
import {
  createGeminiProvider,
  GeminiError,
  GEMINI_ENDPOINT,
} from '@/lib/ai/gemini-provider';

const SECRET_KEY = 'test-key-not-real-123';
const schema = {
  type: 'object',
  properties: { answer: { type: 'string' } },
  required: ['answer'],
};
const request = {
  system: 'Answer only from the ledger.',
  input: 'PRIVATE-QUESTION-TEXT about Northstar',
  schema,
  thinkingLevel: 'low' as const,
  maxOutputTokens: 4000,
  timeoutMs: 5000,
};

function interaction(overrides: Record<string, unknown> = {}) {
  return {
    id: 'int_1',
    object: 'interaction',
    status: 'completed',
    steps: [
      { type: 'thought' },
      {
        type: 'model_output',
        content: [{ type: 'text', text: '{"answer":"PRIVATE-ANSWER-TEXT"}' }],
      },
    ],
    usage: {
      total_input_tokens: 52000,
      total_cached_tokens: 40000,
      total_output_tokens: 120,
      total_thought_tokens: 300,
      total_tokens: 52420,
    },
    ...overrides,
  };
}

function okFetcher(body: unknown = interaction()) {
  return vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(
    async () => new Response(JSON.stringify(body), { status: 200 }),
  );
}

function textReply(text: string) {
  return interaction({
    steps: [{ type: 'model_output', content: [{ type: 'text', text }] }],
  });
}

afterEach(() => vi.restoreAllMocks());

it('posts to the Interactions endpoint with the key in a header, never in the URL', async () => {
  const fetcher = okFetcher();
  await createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'gemini-3.8-flash',
    fetcher,
  }).generateJson(request);

  const [url, init] = fetcher.mock.calls[0]!;
  expect(url).toBe(GEMINI_ENDPOINT);
  expect(url).not.toContain(SECRET_KEY);
  expect(url).not.toContain('key=');
  expect(init?.method).toBe('POST');
  const headers = init?.headers as Record<string, string>;
  expect(headers['x-goog-api-key']).toBe(SECRET_KEY);
  expect(headers['Content-Type']).toBe('application/json');
  expect(String(init?.body)).not.toContain(SECRET_KEY);
});

it('sends the model, schema, thinking level and output limit, and opts out of storage', async () => {
  const fetcher = okFetcher();
  await createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'gemini-3.5-flash-lite',
    fetcher,
  }).generateJson(request);

  const body = JSON.parse(String(fetcher.mock.calls[0]![1]?.body));
  expect(body.model).toBe('gemini-3.5-flash-lite');
  expect(body.input).toBe(request.input);
  expect(body.system_instruction).toBe(request.system);
  expect(body.response_format).toEqual({
    type: 'text',
    mime_type: 'application/json',
    schema,
  });
  expect(body.generation_config).toEqual({
    thinking_level: 'low',
    max_output_tokens: 4000,
  });
  expect(body.store).toBe(false);
});

it('returns the parsed JSON and the token usage, including cached and thinking tokens', async () => {
  const result = await createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'gemini-3.8-flash',
    fetcher: okFetcher(),
  }).generateJson(request);

  expect(result.data).toEqual({ answer: 'PRIVATE-ANSWER-TEXT' });
  expect(result.usage).toEqual({
    inputTokens: 52000,
    cachedTokens: 40000,
    outputTokens: 120,
    thinkingTokens: 300,
  });
});

it('reports zero for usage fields the reply leaves out', async () => {
  const result = await createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'm',
    fetcher: okFetcher(interaction({ usage: { total_input_tokens: 10 } })),
  }).generateJson(request);
  expect(result.usage).toEqual({
    inputTokens: 10,
    cachedTokens: 0,
    outputTokens: 0,
    thinkingTokens: 0,
  });
});

it('aborts the request when the timeout passes', async () => {
  vi.useFakeTimers();
  try {
    const fetcher = vi.fn(
      (_url: string, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const pending = createGeminiProvider({
      apiKey: SECRET_KEY,
      model: 'm',
      fetcher,
    }).generateJson({ ...request, timeoutMs: 1000 });
    const assertion = expect(pending).rejects.toMatchObject({
      name: 'GeminiError',
      kind: 'timeout',
    });
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
  } finally {
    vi.useRealTimers();
  }
});

it.each([
  ['a non-200 reply', () => new Response('{"errors":[]}', { status: 503 })],
  ['a reply that is not JSON', () => new Response('<html>', { status: 200 })],
  [
    'an incomplete reply (limit reached while thinking)',
    () =>
      new Response(
        JSON.stringify(
          interaction({ status: 'incomplete', steps: [{ type: 'thought' }] }),
        ),
        { status: 200 },
      ),
  ],
  [
    'a completed reply with no text',
    () =>
      new Response(
        JSON.stringify(
          interaction({ steps: [{ type: 'model_output', content: [] }] }),
        ),
        { status: 200 },
      ),
  ],
  [
    'a completed reply whose text is blank',
    () => new Response(JSON.stringify(textReply('   ')), { status: 200 }),
  ],
  [
    'model text that is not JSON',
    () => new Response(JSON.stringify(textReply('not json')), { status: 200 }),
  ],
])('throws a GeminiError for %s', async (_label, makeResponse) => {
  const provider = createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'm',
    fetcher: vi.fn(async () => makeResponse()),
  });
  await expect(provider.generateJson(request)).rejects.toBeInstanceOf(
    GeminiError,
  );
});

it('throws a GeminiError when the network call itself fails', async () => {
  const provider = createGeminiProvider({
    apiKey: SECRET_KEY,
    model: 'm',
    fetcher: vi.fn(async () => {
      throw new TypeError('network down');
    }),
  });
  await expect(provider.generateJson(request)).rejects.toMatchObject({
    kind: 'network',
  });
});

it('never logs or throws prompt text, answer text, or the key', async () => {
  const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(
    (level) => vi.spyOn(console, level).mockImplementation(() => {}),
  );
  // The first reply echoes the prompt and the key, as an upstream error might.
  const failures = [
    () =>
      new Response(`bad request: PRIVATE-QUESTION-TEXT ${SECRET_KEY}`, {
        status: 400,
      }),
    () =>
      new Response(JSON.stringify(textReply('PRIVATE-ANSWER-TEXT {')), {
        status: 200,
      }),
  ];
  for (const makeResponse of failures) {
    const provider = createGeminiProvider({
      apiKey: SECRET_KEY,
      model: 'm',
      fetcher: vi.fn(async () => makeResponse()),
    });
    const error = await provider.generateJson(request).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GeminiError);
    const text = `${(error as Error).message} ${(error as Error).stack ?? ''}`;
    expect(text).not.toContain('PRIVATE-QUESTION-TEXT');
    expect(text).not.toContain('PRIVATE-ANSWER-TEXT');
    expect(text).not.toContain(SECRET_KEY);
  }
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
});

it('rejects an empty key or model when the provider is created', () => {
  expect(() =>
    createGeminiProvider({ apiKey: '', model: 'm', fetcher: okFetcher() }),
  ).toThrow(GeminiError);
  expect(() =>
    createGeminiProvider({
      apiKey: SECRET_KEY,
      model: ' ',
      fetcher: okFetcher(),
    }),
  ).toThrow(GeminiError);
});
