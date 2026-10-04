import { buildEvidenceFallback } from '@/lib/rag/extractive-fallback';
import { followUpsFor, retrieveEvidence } from '@/lib/rag/retrieve';
import type { RetrievalResult } from '@/lib/rag/types';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { parseModelOutput, ungroundedNumbers } from './answer-guards';
import { buildGroundedMessages } from './prompt';
import { validateModelAnswer } from './response-schema';
import type { AiProvider, AnswerInput, ChatResponse } from './types';

const OUT_OF_SCOPE =
  'I do not have verified public evidence for that. I can help with Mohamed’s projects, experience, education, availability, or work authorization.';

const refusal = (
  requestId: string,
  retrieval?: RetrievalResult,
  fallbackSuggestions: string[] = [],
): ChatResponse => ({
  requestId,
  answer:
    retrieval?.refusalReason === 'unknown-technology'
      ? `The portfolio doesn’t show experience with ${retrieval.unknownSubject}. I can tell you which technologies Mohamed has used in his published projects.`
      : retrieval?.refusalReason === 'unknown-employer'
        ? `The portfolio doesn’t list ${retrieval.unknownSubject} among Mohamed’s employers. I can tell you where he has worked.`
        : OUT_OF_SCOPE,
  answerStatus: 'refused',
  citations: [],
  followUps: (retrieval?.suggestions?.length
    ? retrieval.suggestions
    : fallbackSuggestions
  ).slice(0, 3),
  telemetry: { questionCategory: 'unknown', latencyBucket: 'lt-500ms' },
});

function normalizeModelAnswer(raw: unknown, allowed: Set<string>): unknown {
  const value = parseModelOutput(raw);
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  const citationIds = Array.isArray(record.citationIds)
    ? [
        ...new Set(
          record.citationIds.filter(
            (id): id is string => typeof id === 'string' && allowed.has(id),
          ),
        ),
      ].slice(0, 8)
    : [];
  const safeCitationIds =
    record.answerStatus === 'refused'
      ? []
      : citationIds.length
        ? citationIds
        : [...allowed].slice(0, 3);
  // Follow-ups come from templates the evaluation proves answerable.
  return { ...record, citationIds: safeCitationIds, followUps: [] };
}

export async function answerRecruiterQuestion(
  deps: { provider: AiProvider; modelId?: string },
  input: AnswerInput,
): Promise<ChatResponse> {
  const started = Date.now();
  const retrieval = retrieveEvidence({ ...input, limit: 8 });
  if (!retrieval.supported)
    return refusal(
      input.requestId,
      retrieval,
      starterSuggestions[input.activeRole],
    );
  const followUps = followUpsFor(retrieval, input.activeRole);
  try {
    const raw = await deps.provider.generate({
      messages: buildGroundedMessages({
        question: input.question,
        chunks: retrieval.chunks,
      }),
      maxTokens: 600,
      temperature: 0.1,
    });
    const allowed = new Set(
      retrieval.chunks.flatMap((chunk) =>
        chunk.citations.map((citation) => citation.sourceId),
      ),
    );
    const answer = validateModelAnswer(
      normalizeModelAnswer(raw, allowed),
      allowed,
    );
    if (answer.answerStatus === 'refused')
      return refusal(input.requestId, undefined, followUps);
    const stray = ungroundedNumbers(
      answer.answer,
      retrieval.chunks.flatMap((chunk) => [chunk.title, chunk.text]),
    );
    if (stray.length)
      throw new Error(
        `Answer contains ungrounded numbers: ${stray.join(', ')}`,
      );
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
      followUps,
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
      'Workers AI synthesis was not usable; serving the evidence answer.',
      error instanceof Error ? error.message : 'Unknown synthesis error',
    );
    return buildEvidenceFallback(retrieval, input.requestId, followUps);
  }
}
