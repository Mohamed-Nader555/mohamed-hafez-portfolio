import type { RetrievalResult } from '@/lib/rag/types';
import type { ChatResponse } from './types';

export const OUT_OF_SCOPE =
  'I do not have verified public evidence for that. I can help with Mohamed’s projects, experience, education, availability, or work authorization.';

export const PROFESSIONAL_ONLY =
  'The site covers Mohamed’s professional background only. I can help with his projects, experience, education, availability, or work authorization.';

export const refusal = (
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

/** The writer judged the question outside his professional background. */
export const professionalOnly = (
  requestId: string,
  followUps: string[] = [],
): ChatResponse => ({
  requestId,
  answer: PROFESSIONAL_ONLY,
  answerStatus: 'refused',
  citations: [],
  followUps: followUps.slice(0, 3),
  telemetry: { questionCategory: 'unknown', latencyBucket: 'lt-500ms' },
});
