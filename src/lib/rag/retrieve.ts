import { chunkEvidence } from './chunk-evidence';
import { meaningfulTerms, normalizeQuery } from './normalize-query';
import type { KnowledgeChunk, RetrievalInput, RetrievalResult } from './types';

export const SUPPORT_SCORE_THRESHOLD = 7;
const chunks = chunkEvidence();
export const knowledgeChunkCount = () => chunks.length;
const unsupportedPattern =
  /\b(medical|doctor|health history|salary|compensation|political|politics|private|hidden document|reveal|ignore previous|weather|contact (his|a) |former manager)\b/i;

function scoreChunk(
  chunk: KnowledgeChunk,
  terms: string[],
  query: string,
  activeRole: string,
): { score: number; exact: boolean; overlap: number } {
  const title = normalizeQuery(chunk.title);
  const text = normalizeQuery(chunk.text);
  const aliases = chunk.aliases.map(normalizeQuery);
  const topics = chunk.topics.map(normalizeQuery);
  let score = chunk.roles.includes(activeRole as never) ? 0.25 : 0;
  let overlap = 0;
  let exact = false;
  for (const term of terms) {
    const aliasHit = aliases.some(
      (alias) => alias === term || alias.includes(term),
    );
    const titleHit = title.includes(term);
    const topicHit = topics.some((topic) => topic.includes(term));
    const textHit = text.includes(term);
    if (aliasHit) {
      score += 7;
      exact = true;
      overlap += 1;
    } else if (titleHit) {
      score += 4;
      overlap += 1;
      if (title.split(' ').includes(term)) exact = true;
    } else if (topicHit) {
      score += 3;
      overlap += 1;
      if (topics.some((topic) => topic === term)) exact = true;
    } else if (textHit) {
      score += 1;
      overlap += 1;
    }
  }
  if (
    chunk.projectId &&
    (query.includes(normalizeQuery(chunk.projectId)) ||
      query.includes(normalizeQuery(chunk.title)))
  ) {
    score += 8;
    exact = true;
  }
  return { score, exact, overlap };
}

export function retrieveEvidence(input: RetrievalInput): RetrievalResult {
  if (
    unsupportedPattern.test(input.question) ||
    (/\bwork for\b/i.test(input.question) &&
      !/\b(bass)\b/i.test(input.question))
  )
    return {
      query: input.question,
      chunks: [],
      topScore: 0,
      supported: false,
      category: 'unknown',
    };
  const question = normalizeQuery(input.question);
  const carriedIds = new Set(
    input.history.flatMap((turn) => turn.citationIds ?? []),
  );
  const priorUsers = input.history
    .filter((turn) => turn.role === 'user')
    .slice(-2)
    .map((turn) => turn.content);
  const query = [input.question, ...priorUsers].join(' ');
  const terms = meaningfulTerms(query);
  const ranked = chunks
    .map((chunk) => ({
      chunk,
      ...scoreChunk(chunk, terms, question, input.activeRole),
    }))
    .sort((a, b) => b.score - a.score);
  const carry = ranked.filter(({ chunk }) =>
    chunk.citations.some((citation) => carriedIds.has(citation.sourceId)),
  );
  const selected = [...carry, ...ranked]
    .filter(
      (item, index, values) =>
        values.findIndex(
          (candidate) => candidate.chunk.id === item.chunk.id,
        ) === index,
    )
    .slice(0, Math.max(1, input.limit));
  const top = selected[0];
  const carriesContext =
    carry.length > 0 && meaningfulTerms(input.question).length <= 4;
  const supported = Boolean(
    top &&
    (top.exact ||
      (top.score >= SUPPORT_SCORE_THRESHOLD && top.overlap >= 2) ||
      carriesContext),
  );
  return {
    query,
    chunks: supported ? selected.map(({ chunk }) => chunk) : [],
    topScore: top?.score ?? 0,
    supported,
    category: supported ? top.chunk.category : 'unknown',
  };
}
