import { buildEvidenceFallback } from '@/lib/rag/extractive-fallback';
import {
  followUpsFor,
  guardRefuses,
  retrieveEvidence,
} from '@/lib/rag/retrieve';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { parseModelOutput, ungroundedNumbers } from './answer-guards';
import { answerFromLedger, type LedgerDeps } from './ledger-answer';
import { buildGroundedMessages } from './prompt';
import { refusal } from './refusal';
import { validateModelAnswer } from './response-schema';
import type { AiProvider, AnswerInput, ChatResponse } from './types';

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

/**
 * The router. In order: the hard guard refuses (unchanged); everything else
 * goes to the writer when the ledger pipeline is on, and to today's pipeline
 * when it is not. A question the guard refuses never reaches a model.
 */
export async function answerRecruiterQuestion(
  deps: { provider: AiProvider; modelId?: string; ledger?: LedgerDeps },
  input: AnswerInput,
): Promise<ChatResponse> {
  if (deps.ledger && !guardRefuses(input.question))
    return answerFromLedger(deps.ledger, input);
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
