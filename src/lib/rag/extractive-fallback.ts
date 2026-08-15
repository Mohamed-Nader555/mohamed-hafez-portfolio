import type { ChatResponse } from '@/lib/ai/types';
import type { RetrievalResult } from './types';

export function buildEvidenceFallback(
  retrieval: RetrievalResult,
  requestId: string,
): ChatResponse {
  const chunks = retrieval.chunks.slice(0, 3);
  const answer = `Generated synthesis is temporarily unavailable. Verified facts: ${chunks
    .map((chunk) => chunk.text)
    .join(' ')
    .slice(0, 1580)}`;
  const citations = chunks
    .flatMap((chunk) => chunk.citations)
    .filter(
      (citation, index, all) =>
        all.findIndex(
          (candidate) => candidate.sourceId === citation.sourceId,
        ) === index,
    );
  return {
    requestId,
    answer,
    answerStatus: 'fallback',
    citations,
    followUps: [],
    telemetry: {
      questionCategory: retrieval.category,
      latencyBucket: 'lt-500ms',
    },
  };
}
