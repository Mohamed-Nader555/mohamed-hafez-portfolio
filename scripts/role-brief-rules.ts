// The rules that turn a role spec into a stored brief (brief 3, task D1).
// Pure functions: `npm run briefs:build` feeds them the real ledger, and the
// unit tests feed them small made-up ones. Nothing here calls a model.
import type {
  BankAnswer,
  RoleBrief,
  RoleRequirement,
  SkillTierGroup,
  SkillTierName,
} from '../src/data/claims/types.ts';
import { findVerdictPhrases } from '../src/lib/rag/claim-checks.ts';
import type { LedgerEntry } from '../src/lib/rag/ledger.ts';
import type { Citation } from '../src/lib/rag/types.ts';
import type { RoleId } from '../src/types/content.ts';

/** One thing a role asks for, and the ledger claims that answer it. */
export type RequirementSpec = {
  /** What the role asks for, in plain words. It names no technology that no cited claim names. */
  text: string;
  /** Ledger claim ids; the first two are shown as evidence. */
  claims: string[];
  /** Skills the requirement leans on; each must have a tier in the skill tiers. */
  skills?: string[];
  /** The author's statement that the evidence is adjacent, not the thing itself. */
  adjacent?: boolean;
};

export type RoleSpec = {
  slug: string;
  title: string;
  alsoCalled: string[];
  lens: RoleId;
  /** The question-bank answer quoted as the summary. */
  answerId: string;
  requirements: RequirementSpec[];
  /** Three question-bank ids that lead into his strengths. */
  askHim: string[];
};

export type BuildContext = {
  claims: readonly LedgerEntry[];
  tiers: readonly SkillTierGroup[];
  namedGaps: readonly string[];
  bank: readonly BankAnswer[];
};

export class RoleBriefError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RoleBriefError';
  }
}

const MIN_REQUIREMENTS = 6;
const MAX_REQUIREMENTS = 10;
const EVIDENCE_PER_REQUIREMENT = 2;
const CITATIONS_PER_REQUIREMENT = 4;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const norm = (value: string) => value.trim().toLowerCase();

/** The tier a skill sits in, matched without regard to case. */
export function skillTier(
  skill: string,
  tiers: readonly SkillTierGroup[],
): SkillTierName | undefined {
  const wanted = norm(skill);
  return tiers.find((group) => group.skills.some((s) => norm(s) === wanted))
    ?.tier;
}

/** The named gaps as searchable terms ("Kubernetes", "A/B testing", "PhD", …). */
export function gapTerms(namedGaps: readonly string[]): string[] {
  const terms = new Set<string>();
  for (const gap of namedGaps)
    for (const part of gap.split(/,|\s+or\s+/)) {
      const term = part
        .replace(/\s+in production$/i, '')
        .replace(/^(?:an?|delivered)\s+/i, '')
        .trim();
      if (term) terms.add(term);
    }
  return [...terms];
}

const namesTerm = (text: string, term: string) =>
  new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(term)}(?![A-Za-z0-9])`, 'i').test(
    text,
  );

const fail = (slug: string, message: string): never => {
  throw new RoleBriefError(`${slug}: ${message}`);
};

function mergeCitations(claims: readonly LedgerEntry[]): Citation[] {
  const seen = new Map<string, Citation>();
  for (const claim of claims)
    for (const citation of claim.citations)
      if (!seen.has(citation.sourceId)) seen.set(citation.sourceId, citation);
  return [...seen.values()].slice(0, CITATIONS_PER_REQUIREMENT);
}

function buildRequirement(
  slug: string,
  spec: RequirementSpec,
  ctx: BuildContext,
  terms: readonly string[],
): { requirement: RoleRequirement; group: 'direct' | 'related' } {
  const label = `"${spec.text}"`;
  if (!spec.claims.length) fail(slug, `${label} cites no claim.`);
  const byId = new Map(ctx.claims.map((claim) => [claim.id, claim]));
  const cited = spec.claims.map((id) => {
    const claim = byId.get(id);
    return claim ?? fail(slug, `${label} cites unknown claim ${id}.`);
  });

  const tiersUsed = (spec.skills ?? []).map((skill) => {
    const tier = skillTier(skill, ctx.tiers);
    return tier ?? fail(slug, `${label} uses skill "${skill}" with no tier.`);
  });

  const shown = [spec.text, ...(spec.skills ?? [])]
    .concat(cited.slice(0, EVIDENCE_PER_REQUIREMENT).map((c) => c.text))
    .join('\n');
  const gap = terms.find((term) => namesTerm(shown, term));
  if (gap) fail(slug, `${label} names a named gap ("${gap}").`);
  const verdict = findVerdictPhrases(shown);
  if (verdict.length)
    fail(slug, `${label} uses verdict wording ("${verdict[0]}").`);

  const direct =
    !spec.adjacent &&
    cited.some((claim) => claim.origin === 'site') &&
    cited.every((claim) => claim.strength === 'direct') &&
    tiersUsed.every((tier) => tier === 'core' || tier === 'working');

  return {
    group: direct ? 'direct' : 'related',
    requirement: {
      text: spec.text,
      evidence: cited
        .slice(0, EVIDENCE_PER_REQUIREMENT)
        .map((claim) => ({ claimId: claim.id, text: claim.text })),
      citations: mergeCitations(cited),
    },
  };
}

/** Builds one brief, or throws a `RoleBriefError` that names the rule it broke. */
export function buildRoleBrief(spec: RoleSpec, ctx: BuildContext): RoleBrief {
  const { slug } = spec;
  if (
    spec.requirements.length < MIN_REQUIREMENTS ||
    spec.requirements.length > MAX_REQUIREMENTS
  )
    fail(
      slug,
      `needs six to ten requirements, has ${spec.requirements.length}.`,
    );

  const terms = gapTerms(ctx.namedGaps);
  const direct: RoleRequirement[] = [];
  const related: RoleRequirement[] = [];
  for (const requirementSpec of spec.requirements) {
    const { requirement, group } = buildRequirement(
      slug,
      requirementSpec,
      ctx,
      terms,
    );
    (group === 'direct' ? direct : related).push(requirement);
  }

  const answer = (id: string) => {
    const found = ctx.bank.find((entry) => entry.id === id);
    if (!found) return fail(slug, `question-bank answer ${id} does not exist.`);
    if (found.gap)
      return fail(slug, `${id} is a gap answer and may not be on a page.`);
    return found;
  };
  const summary = answer(spec.answerId);
  if (new Set(spec.askHim).size !== 3 || spec.askHim.length !== 3)
    fail(slug, 'needs exactly three different "ask him about" prompts.');
  const askHim = spec.askHim.map((id) => {
    const entry = answer(id);
    return { answerId: entry.id, question: entry.question };
  });

  return {
    slug,
    title: spec.title,
    alsoCalled: spec.alsoCalled,
    lens: spec.lens,
    summary: { answerId: summary.id, text: summary.answer },
    direct,
    related,
    askHim,
  };
}
