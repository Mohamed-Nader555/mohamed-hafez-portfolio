import { buildEvidenceFallback } from '@/lib/rag/extractive-fallback';
import { retrieveEvidence } from '@/lib/rag/retrieve';
import { buildGroundedMessages } from './prompt';
import { validateModelAnswer } from './response-schema';
import type { AiProvider, AnswerInput, ChatResponse } from './types';

const refusal = (requestId: string): ChatResponse => ({
  requestId,
  answer:
    'I do not have verified public evidence for that. I can help with Mohamed’s projects, experience, education, availability, or work authorization.',
  answerStatus: 'refused',
  citations: [],
  followUps: [
    'Ask about a project.',
    'Ask about availability or work authorization.',
  ],
  telemetry: { questionCategory: 'unknown', latencyBucket: 'lt-500ms' },
});

function parsed(raw: unknown): unknown {
  if (typeof raw === 'string') return JSON.parse(raw);
  if (raw && typeof raw === 'object' && 'response' in raw)
    return parsed(raw.response);
  return raw;
}

export async function answerRecruiterQuestion(
  deps: { provider: AiProvider; modelId?: string },
  input: AnswerInput,
): Promise<ChatResponse> {
  const started = Date.now();
  const retrieval = retrieveEvidence({ ...input, limit: 5 });
  if (!retrieval.supported) return refusal(input.requestId);
  try {
    const raw = await deps.provider.generate({
      messages: buildGroundedMessages({
        question: input.question,
        chunks: retrieval.chunks,
      }),
      maxTokens: 500,
      temperature: 0.1,
    });
    const allowed = new Set(
      retrieval.chunks.flatMap((chunk) =>
        chunk.citations.map((citation) => citation.sourceId),
      ),
    );
    const answer = validateModelAnswer(parsed(raw), allowed);
    if (answer.answerStatus === 'refused') return refusal(input.requestId);
    const citations = retrieval.chunks
      .flatMap((chunk) => chunk.citations)
      .filter(
        (citation, index, all) =>
          answer.citationIds.includes(citation.sourceId) &&
          all.findIndex((other) => other.sourceId === citation.sourceId) ===
            index,
      );
    if (!citations.length) throw new Error('No valid public citations');
    const elapsed = Date.now() - started;
    return {
      requestId: input.requestId,
      answer: answer.answer,
      answerStatus: 'answered',
      citations,
      followUps: answer.followUps,
      telemetry: {
        questionCategory: retrieval.category,
        latencyBucket:
          elapsed < 500
            ? 'lt-500ms'
            : elapsed < 2000
              ? '500ms-2s'
              : elapsed < 5000
                ? '2s-5s'
                : 'gt-5s',
        modelId: deps.modelId,
      },
    };
  } catch (error) {
    console.error(
      'Workers AI synthesis failed; serving verified evidence fallback.',
      error instanceof Error ? error.message : 'Unknown synthesis error',
    );
    return buildEvidenceFallback(retrieval, input.requestId);
  }
}
