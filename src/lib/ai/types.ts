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
export type ChatResponse = {
  requestId: string;
  answer: string;
  answerStatus: 'answered' | 'refused' | 'fallback';
  citations: Citation[];
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
