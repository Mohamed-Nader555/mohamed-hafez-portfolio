import { z } from 'zod';
import { roleIdSchema } from '@/types/content';
import type { BriefCardData } from './brief-types';
import type {
  Citation,
  ConversationTurn,
  KnowledgeCategory,
} from '@/lib/rag/types';

export const chatRequestSchema = z.object({
  question: z.string().trim().min(2).max(600),
  activeRole: roleIdSchema,
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().max(1200),
        citationIds: z.array(z.string()).max(8).optional(),
      }),
    )
    .max(6),
  /**
   * A job description the visitor pasted, up to 6,000 characters. It is data,
   * never instructions, and is never stored or logged. A blank one is none.
   */
  jobDescription: z
    .string()
    .trim()
    .max(6000)
    .optional()
    .transform((value) => value || undefined),
  turnstileToken: z.string().min(1).max(2048),
  sessionId: z.uuid(),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type AiMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
/** Where a part of an answer came from; set by code from the claims it cites. */
export type ChatLabel = 'site' | 'notes' | 'own-words' | 'reading';
export type ChatSegment = {
  text: string;
  label: ChatLabel;
  /** Public ids of the claims behind the text; empty for the assistant's own reading. */
  claimIds: string[];
  citations: Citation[];
};
/**
 * A next step offered under an answer. The email action carries only the
 * address; the browser builds the `mailto:` link with the visitor's question.
 */
export type ChatAction =
  | { kind: 'case-study'; label: string; href: string }
  | { kind: 'resume'; label: string; href: string }
  | { kind: 'email'; label: string; address: string };
/** How an answer was made, for the "How this answer was made" note. No text. */
export type ChatTrace = {
  /** fit: a pasted job description, matched to the claims. */
  path: 'ledger' | 'fit' | 'fallback';
  writerModel?: string;
  checkerModel?: string;
  checker: 'passed' | 'unchecked' | 'skipped';
  /** Segments the writer drafted, and how many code or the checker dropped. */
  drafted: number;
  dropped: number;
};
export type ChatResponse = {
  requestId: string;
  /** The segments joined; kept so stored threads and older code still work. */
  answer: string;
  answerStatus: 'answered' | 'not_covered' | 'refused' | 'fallback';
  citations: Citation[];
  segments?: ChatSegment[];
  actions?: ChatAction[];
  /** Terms the visitor asked about that the site does not show. */
  notShown?: string[];
  /** A job-description brief; the panel shows it as a card instead of segments. */
  brief?: BriefCardData;
  trace?: ChatTrace;
  followUps: string[];
  telemetry: {
    questionCategory: KnowledgeCategory | 'unknown';
    latencyBucket: 'lt-500ms' | '500ms-2s' | '2s-5s' | 'gt-5s';
    modelId?: string;
  };
};
export interface AiProvider {
  generate(input: {
    messages: AiMessage[];
    maxTokens: number;
    temperature: number;
  }): Promise<unknown>;
}
export type AnswerInput = {
  question: string;
  /** A pasted job description (data only); present means fit mode. */
  jobDescription?: string;
  history: ConversationTurn[];
  activeRole: z.infer<typeof roleIdSchema>;
  requestId: string;
};
