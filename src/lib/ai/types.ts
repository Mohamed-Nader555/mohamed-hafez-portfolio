import { z } from 'zod';
import { roleIdSchema } from '@/types/content';
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
/** How an answer was made, for the "How this answer was made" note. No text. */
export type ChatTrace = {
  path: 'ledger' | 'fallback';
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
  /** Terms the visitor asked about that the site does not show. */
  notShown?: string[];
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
  history: ConversationTurn[];
  activeRole: z.infer<typeof roleIdSchema>;
  requestId: string;
};
