import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'northstar-independent-delivery',
    title: 'Independent RAG delivery',
    statement:
      'Northstar is an independently built, end-to-end hands-on RAG engineering project.',
    topics: ['Northstar', 'RAG', 'ownership'],
    aliases: ['Northstar RAG', 'retrieval-augmented generation'],
    roleWeights: { aiml: 5, software: 5, android: 1, teaching: 2 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'github-northstar-rag',
      'case-study-northstar',
    ],
    public: true,
  },
  {
    id: 'northstar-ingestion-formats',
    title: 'Document ingestion',
    statement: 'Northstar ingests PDF, plain-text, and Markdown documents.',
    topics: ['Northstar', 'ingestion', 'PDF', 'Markdown'],
    aliases: ['document loader', 'supported document formats'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 2 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-chunking',
    title: 'Retrieval chunking',
    statement:
      'Northstar uses recursive 700-character chunks with 100-character overlap.',
    topics: ['Northstar', 'chunking', 'retrieval'],
    aliases: ['chunk size', 'chunk overlap', 'text splitting'],
    roleWeights: { aiml: 5, software: 4, android: 0, teaching: 2 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-vector-retrieval',
    title: 'Vector retrieval',
    statement:
      'Northstar embeds chunks locally with all-MiniLM-L6-v2 and stores them in a persistent Chroma collection using cosine distance.',
    topics: ['Northstar', 'sentence-transformers', 'Chroma', 'embeddings'],
    aliases: ['all MiniLM L6 v2', 'vector store', 'cosine distance'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 2 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-refusal-threshold',
    title: 'Grounding threshold',
    statement:
      'Northstar filters retrieved chunks by a configurable cosine-distance threshold and returns a fixed refusal when no chunk passes.',
    topics: ['Northstar', 'refusal behavior', 'retrieval threshold'],
    aliases: ['unsupported question', 'distance filter', 'strict refusal'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 3 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-citations',
    title: 'Citation-backed answers',
    statement:
      'Northstar returns cited document, page, and chunk details with grounded answers.',
    topics: ['Northstar', 'citations', 'grounded generation'],
    aliases: ['source attribution', 'cited answer'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 3 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-api-deployment',
    title: 'API and deployment',
    statement:
      'Northstar exposes FastAPI health and question-answering endpoints and packages the service with Docker and Docker Compose.',
    topics: ['FastAPI', 'Docker', 'Docker Compose', 'API'],
    aliases: ['Northstar deployment', 'health endpoint', 'ask endpoint'],
    roleWeights: { aiml: 4, software: 5, android: 0, teaching: 2 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
  {
    id: 'northstar-evaluation-testing',
    title: 'RAG evaluation and tests',
    statement:
      'Northstar includes pytest coverage and a RAGAS evaluation pipeline for faithfulness, answer relevancy, context precision, and context recall.',
    topics: ['pytest', 'RAGAS', 'evaluation', 'testing'],
    aliases: ['RAG metrics', 'Northstar tests'],
    roleWeights: { aiml: 5, software: 5, android: 0, teaching: 3 },
    sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const northstarEvidence = evidenceRecordSchema.array().parse(records);
