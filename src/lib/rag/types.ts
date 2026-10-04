import type { RoleId } from '@/types/content';

export type Citation = { sourceId: string; label: string; href: string };
export type KnowledgeCategory =
  'project' | 'experience' | 'research' | 'teaching' | 'screening' | 'skills';
/**
 * evidence: verified statements and curated records; page: case-study body
 * text and frontmatter; data: architecture, repositories, research record;
 * overview: generated answers to broad questions.
 */
export type ChunkFamily = 'evidence' | 'page' | 'data' | 'overview';
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
  family: ChunkFamily;
};
/** A named thing a question can mention: a project or a verified technology. */
export type KnowledgeEntity = {
  kind: 'project' | 'tech';
  /** Normalized primary name; a phrase equal to it outranks variant matches. */
  key: string;
  /** Normalized phrases that name it. */
  terms: string[];
  /** Phrases that must match case-sensitively (one-letter names such as "C"). */
  exactCase?: string[];
  /** Project id, or the id of the technology's overview chunk. */
  projectId?: string;
  chunkId?: string;
  label: string;
};
export type KnowledgeIndexArtifact = {
  version: 2;
  generatedAt: string;
  chunks: KnowledgeChunk[];
  entities: KnowledgeEntity[];
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
export type RefusalReason =
  'out-of-scope' | 'unknown-technology' | 'unknown-employer';
export type RetrievalResult = {
  query: string;
  chunks: KnowledgeChunk[];
  topScore: number;
  supported: boolean;
  category: KnowledgeCategory | 'unknown';
  /** How the chunks were found: an overview route or plain search. */
  route?: string;
  refusalReason?: RefusalReason;
  /** The technology or employer asked about that the portfolio does not show. */
  unknownSubject?: string;
  /** Answerable questions near the topic, offered with a refusal. */
  suggestions?: string[];
};
