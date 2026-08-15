import type { RoleId } from '@/types/content';

export type Citation = { sourceId: string; label: string; href: string };
export type KnowledgeCategory =
  'project' | 'experience' | 'research' | 'teaching' | 'screening' | 'skills';
export type KnowledgeChunk = {
  id: string;
  title: string;
  text: string;
  topics: string[];
  aliases: string[];
  roles: RoleId[];
  projectId?: string;
  category: KnowledgeCategory;
  citations: Citation[];
};
export type KnowledgeIndexArtifact = {
  version: 1;
  generatedAt: string;
  chunks: KnowledgeChunk[];
  miniSearch: Record<string, unknown>;
};
export type ConversationTurn = {
  role: 'user' | 'assistant';
  content: string;
  citationIds?: string[];
};
export type RetrievalInput = {
  question: string;
  history: ConversationTurn[];
  activeRole: RoleId;
  limit: number;
};
export type RetrievalResult = {
  query: string;
  chunks: KnowledgeChunk[];
  topScore: number;
  supported: boolean;
  category: KnowledgeCategory | 'unknown';
};
