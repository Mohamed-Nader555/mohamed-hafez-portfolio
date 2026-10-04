import type { ChatResponse } from '@/lib/ai/types';
import type { RetrievalResult } from './types';

const PREFIX = 'Here is what the portfolio says:';

/** Cuts at the last sentence (or clause) end that fits, never mid-sentence. */
export function cutAtSentence(text: string, max: number): string {
  if (text.length <= max) return text;
  const head = text.slice(0, max);
  const end = Math.max(
    head.lastIndexOf('. '),
    head.lastIndexOf('; '),
    head.lastIndexOf('! '),
    head.lastIndexOf('? '),
  );
  if (end > max * 0.4) return head.slice(0, end + 1);
  const space = head.lastIndexOf(' ');
  return `${head.slice(0, space > 0 ? space : max).replace(/[,;:\s]+$/, '')}…`;
}

/**
 * Used when the model fails or its answer cannot be trusted. It reads as an
 * answer: the best one to three retrieved chunks, cut at sentence
 * boundaries, with their citations.
 */
export function buildEvidenceFallback(
  retrieval: RetrievalResult,
  requestId: string,
  followUps: string[] = [],
): ChatResponse {
  const chunks = retrieval.chunks.slice(0, 3);
  const body = chunks
    .map((chunk) => cutAtSentence(chunk.text.trim(), 420))
    .join(' ');
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
    answer: `${PREFIX} ${body}`,
    answerStatus: 'fallback',
    citations,
    followUps,
    telemetry: {
      questionCategory: retrieval.category,
      latencyBucket: 'lt-500ms',
    },
  };
}
