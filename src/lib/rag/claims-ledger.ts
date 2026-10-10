// Turns the committed data from Mohamed's notes into ledger claims. Each claim
// cites the same public sources as the site claims it rests on.
import { bridges } from '@/data/claims/bridges';
import { questionBank } from '@/data/claims/question-bank';
import { skillTierGroups } from '@/data/claims/skill-tiers';
import type { SkillTierName } from '@/data/claims/types';
import { citationsFor } from './chunk-helpers';
import type { LedgerEntry } from './ledger';
import type { Citation, KnowledgeCategory } from './types';

/** The public section of the About page that shows his answers. */
export const ANSWERS_SOURCE_ID = 'public-about-questions';

const AREA_LABELS: Record<string, string> = {
  languages: 'programming languages',
  machine_learning: 'machine learning',
  nlp_and_llm: 'NLP and LLM work',
  rag_stack: 'the RAG stack',
  vision_and_ocr: 'vision and OCR',
  data_and_mlops: 'data work and MLOps',
  backend: 'backend development',
  ecm_and_documents: 'enterprise content and documents',
  android: 'Android development',
  testing_and_build: 'testing and build tools',
  data_platforms: 'data platforms',
  visualisation: 'data visualisation',
  teaching: 'teaching',
};

const TIER_TEXT: Record<SkillTierName, (area: string, list: string) => string> =
  {
    core: (area, list) =>
      `Core skills in ${area}, with direct experience: ${list}.`,
    working: (area, list) =>
      `Working skills in ${area}, which he has used in real work but less deeply than his core skills: ${list}.`,
    exposure: (area, list) =>
      `Exposure only, in ${area}: ${list}. Not direct experience.`,
  };

const ANSWER_CATEGORY: Record<string, KnowledgeCategory> = {
  'Projects and how I work': 'project',
  'Gaps (chat only, never on a page)': 'skills',
};

function mergeCitations(lists: Citation[][]): Citation[] {
  const seen = new Map<string, Citation>();
  for (const citation of lists.flat())
    if (!seen.has(citation.sourceId)) seen.set(citation.sourceId, citation);
  return [...seen.values()];
}

/** The category most of the supporting claims share; the first one wins a tie. */
function commonCategory(claims: LedgerEntry[]): KnowledgeCategory {
  const counts = new Map<KnowledgeCategory, number>();
  for (const claim of claims)
    counts.set(claim.category, (counts.get(claim.category) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
}

/**
 * Claims from his notes (bridges and skill tiers) and from his own answers,
 * resting on the site claims in `site`. A basis claim that no longer exists
 * stops the build.
 */
export function claimLedgerEntries(site: LedgerEntry[]): LedgerEntry[] {
  const byId = new Map(site.map((claim) => [claim.id, claim]));
  const basis = (ownerId: string, ids: readonly string[]) =>
    ids.map((id) => {
      const claim = byId.get(id);
      if (!claim)
        throw new Error(
          `Claim ${ownerId} rests on ${id}, which is not on the site.`,
        );
      return claim;
    });

  const fromBridges = bridges.map((bridge): LedgerEntry => {
    const supporting = basis(bridge.id, bridge.basisIds);
    return {
      id: bridge.id,
      text: bridge.limit
        ? `${bridge.statement} ${bridge.limit}`
        : bridge.statement,
      strength: bridge.strength,
      origin: 'notes',
      citations: mergeCitations(supporting.map((claim) => claim.citations)),
      category: commonCategory(supporting),
      basisIds: [...bridge.basisIds],
    };
  });

  const fromTiers = skillTierGroups.map((group): LedgerEntry => {
    const supporting = basis(group.id, group.basisIds);
    const area = AREA_LABELS[group.area] ?? group.area.replace(/_/g, ' ');
    return {
      id: group.id,
      text: TIER_TEXT[group.tier](area, group.skills.join(', ')),
      strength: group.tier === 'exposure' ? 'related' : 'direct',
      origin: 'notes',
      citations: mergeCitations([
        ...supporting.map((claim) => claim.citations),
        citationsFor(group.resumeSourceIds),
      ]),
      category: 'skills',
      basisIds: [...group.basisIds],
    };
  });

  const fromAnswers = questionBank.map((answer): LedgerEntry => {
    const supporting = basis(answer.id, answer.basisIds);
    const text = `Q: ${answer.question} A: ${answer.answer}`;
    return {
      id: answer.id,
      text: answer.gap
        ? `${text} (A gap answer: give it only when the visitor asks about this.)`
        : text,
      strength: 'direct',
      origin: 'own-words',
      citations: answer.gap
        ? mergeCitations(supporting.map((claim) => claim.citations))
        : citationsFor([ANSWERS_SOURCE_ID]),
      category: ANSWER_CATEGORY[answer.group] ?? 'experience',
      ...(answer.gap ? { basisIds: [...answer.basisIds] } : {}),
    };
  });

  return [...fromBridges, ...fromTiers, ...fromAnswers];
}
