// The checks and choices behind `npm run claims:apply`. They hold no file or
// model access, so the script stays a thin reader and writer around them.
import type {
  BankAnswer,
  Bridge,
  SkillTierGroup,
  SkillTierName,
  WordingRule,
} from '@/data/claims/types';
import type { RoleId } from '@/types/content';
import {
  findNeverPhrases,
  findVerdictPhrases,
  numeralsIn,
} from './claim-checks';
import type { LedgerEntry } from './ledger';
import { matchKey, meaningfulTerms } from './normalize-query';

/** The site writes its apostrophes as ’; the committed text follows it. */
export function typographic(text: string): string {
  return text.replace(/(?<=[A-Za-z])'(?=[A-Za-z])/g, '’');
}

const siteClaims = (ledger: LedgerEntry[]) =>
  ledger.filter((claim) => claim.origin === 'site');

/** Site claims a hint names: a project id, a category, a claim id or an id prefix. */
export function resolveHint(
  hint: string,
  ledger: LedgerEntry[],
): LedgerEntry[] {
  return siteClaims(ledger).filter(
    (claim) =>
      claim.projectId === hint ||
      claim.category === hint ||
      claim.id === hint ||
      claim.id.startsWith(`${hint}-`),
  );
}

export type Basis = { basisIds: string[] } | { heldBack: string };

/** A number in a statement is worth more than any single word. */
const NUMBER_WEIGHT = 6;
/** What a third (or later) claim must add to be worth citing. */
const EXTRA_CLAIM_GAIN = 4;
/** The share of a statement's site wording its supporting claims must contain. */
const MIN_COVERAGE = 0.4;
/** A claim named by a bridge's hints counts this much more than one outside them. */
const HINT_PREFERENCE = 1.5;

/**
 * Chooses the site claims that support a statement. Claims are added while
 * they cover words or numbers the statement still needs (rarer words and numbers count more),
 * between `min` and `max` of them. The statement is held back when nothing
 * supports it or when a number in it appears in none of the chosen claims.
 */
export function chooseBasis(
  statement: string,
  hints: string[],
  ledger: LedgerEntry[],
  {
    min = 2,
    max = 6,
    minCoverage = MIN_COVERAGE,
  }: { min?: number; max?: number; minCoverage?: number } = {},
): Basis {
  // Every site claim can be one of the first `min`; the hints tip that choice and
  // are the only source of any further claim.
  const pool = siteClaims(ledger);
  const hinted = new Set(
    hints.flatMap((hint) => resolveHint(hint, ledger)).map((c) => c.id),
  );
  const wanted = new Set(meaningfulTerms(statement));
  const wantedNumbers = new Set(numeralsIn(statement));
  const features = new Map(
    pool.map((claim) => [
      claim.id,
      {
        terms: new Set(
          meaningfulTerms(claim.text).filter((term) => wanted.has(term)),
        ),
        numbers: new Set(
          numeralsIn(claim.text).filter((n) => wantedNumbers.has(n)),
        ),
      },
    ]),
  );
  // A word that few claims use says more about support than a common one.
  const site = siteClaims(ledger);
  const documentFrequency = new Map<string, number>();
  for (const claim of site)
    for (const term of new Set(meaningfulTerms(claim.text)))
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
  const weight = (term: string) =>
    0.5 +
    Math.log((site.length + 1) / ((documentFrequency.get(term) ?? 0) + 1));

  const coveredTerms = new Set<string>();
  const coveredNumbers = new Set<string>();
  const picked: LedgerEntry[] = [];
  const sum = (terms: Iterable<string>) =>
    [...terms].reduce((total, term) => total + weight(term), 0);
  const preference = (claim: LedgerEntry) =>
    hinted.has(claim.id) ? HINT_PREFERENCE : 1;
  const gain = (claim: LedgerEntry) => {
    const { terms, numbers } = features.get(claim.id)!;
    return (
      preference(claim) *
      (sum([...terms].filter((t) => !coveredTerms.has(t))) +
        NUMBER_WEIGHT *
          [...numbers].filter((n) => !coveredNumbers.has(n)).length)
    );
  };
  const overlap = (claim: LedgerEntry) => {
    const { terms, numbers } = features.get(claim.id)!;
    return preference(claim) * (sum(terms) + NUMBER_WEIGHT * numbers.size);
  };
  const take = (claim: LedgerEntry) => {
    picked.push(claim);
    const { terms, numbers } = features.get(claim.id)!;
    terms.forEach((t) => coveredTerms.add(t));
    numbers.forEach((n) => coveredNumbers.add(n));
  };

  // Greedy: the claim that adds the most, a shorter one winning a tie.
  while (picked.length < max) {
    const best = pool
      .filter(
        (claim) =>
          !picked.includes(claim) &&
          (picked.length < min || hinted.has(claim.id)),
      )
      .map((claim) => ({ claim, value: gain(claim) }))
      .sort(
        (a, b) =>
          b.value - a.value || a.claim.text.length - b.claim.text.length,
      )[0];
    if (!best || best.value < (picked.length < min ? 0.5 : EXTRA_CLAIM_GAIN))
      break;
    take(best.claim);
  }
  // Too few: add the remaining claims that share the most with the statement.
  while (picked.length < min) {
    const next = pool
      .filter((claim) => !picked.includes(claim) && overlap(claim) > 0)
      .sort((a, b) => overlap(b) - overlap(a))[0];
    if (!next) break;
    take(next);
  }
  if (picked.length < min)
    return { heldBack: 'fewer than two site claims support it' };

  const missing = [...wantedNumbers].filter((n) => !coveredNumbers.has(n));
  if (missing.length > 0)
    return {
      heldBack: `the number ${missing.join(', ')} is in none of its supporting claims`,
    };

  // Words that no claim on the site uses are the statement's own phrasing; the
  // rest should mostly be found in the claims it will cite.
  const shared = [...wanted].filter((term) => documentFrequency.has(term));
  const sharedWeight = sum(shared);
  const coverage =
    sharedWeight === 0
      ? 1
      : sum(shared.filter((term) => coveredTerms.has(term))) / sharedWeight;
  if (coverage < minCoverage)
    return {
      heldBack: `its supporting claims cover only ${Math.round(coverage * 100)}% of its wording`,
    };
  return { basisIds: picked.map((claim) => claim.id) };
}

/**
 * Stemmed words for comparing a phrase with site text, reading "ML" as machine
 * learning, "15+" as 15 and a hyphen as a space.
 */
const looseKey = (text: string) =>
  matchKey(
    text
      .replace(/(\d)\+/g, '$1')
      .replace(/\bML\b/g, 'machine learning')
      .replace(/(?<=\w)-(?=\w)/g, ' '),
  );

/** Phrases that no site claim contains. */
export function missingOnSite(
  phrases: string[],
  ledger: LedgerEntry[],
): string[] {
  const site = ` ${looseKey(
    siteClaims(ledger)
      .map((claim) => claim.text)
      .join(' '),
  )} `;
  return phrases.filter((phrase) => !site.includes(` ${looseKey(phrase)} `));
}

/** Names to look for: the whole name, then each part of a slash name of three letters or more. */
function skillVariants(skill: string): string[] {
  const parts = skill.includes('/')
    ? skill.split('/').filter((part) => part.trim().length >= 3)
    : [];
  return [skill, ...parts].map(matchKey).filter(Boolean);
}

/** `haystackKey` is `matchKey` of the text to search. */
export function skillMentioned(skill: string, haystackKey: string): boolean {
  const haystack = ` ${haystackKey} `;
  return skillVariants(skill).some((variant) =>
    haystack.includes(` ${variant} `),
  );
}

export type RawSkillTiers = Record<
  string,
  Partial<Record<SkillTierName, string[]>>
>;

const TIERS: SkillTierName[] = ['core', 'working', 'exposure'];

/**
 * Keeps a skill only when a site claim or a public résumé mentions it. A tier
 * never adds a technology to a project; it only sets how strongly a skill may
 * be worded.
 */
export function buildSkillTiers(
  raw: RawSkillTiers,
  ledger: LedgerEntry[],
  resumes: Array<{ sourceId: string; text: string }>,
): {
  groups: SkillTierGroup[];
  heldBack: Array<{ area: string; tier: SkillTierName; skill: string }>;
} {
  const claims = siteClaims(ledger).map((claim) => ({
    id: claim.id,
    key: matchKey(claim.text),
  }));
  const resumeKeys = resumes.map((resume) => ({
    sourceId: resume.sourceId,
    key: matchKey(resume.text),
  }));
  const groups: SkillTierGroup[] = [];
  const heldBack: Array<{ area: string; tier: SkillTierName; skill: string }> =
    [];

  for (const [area, tiers] of Object.entries(raw)) {
    for (const tier of TIERS) {
      const kept: string[] = [];
      const basisIds = new Set<string>();
      const resumeSourceIds = new Set<string>();
      for (const skill of tiers[tier] ?? []) {
        const claim = claims.find((c) => skillMentioned(skill, c.key));
        const inResumes = resumeKeys.filter((r) =>
          skillMentioned(skill, r.key),
        );
        if (!claim && inResumes.length === 0) {
          heldBack.push({ area, tier, skill });
          continue;
        }
        kept.push(skill);
        if (claim) basisIds.add(claim.id);
        inResumes.forEach((r) => resumeSourceIds.add(r.sourceId));
      }
      if (kept.length > 0)
        groups.push({
          id: `skills-${area.replace(/_/g, '-')}-${tier}`,
          area,
          tier,
          skills: kept,
          basisIds: [...basisIds],
          resumeSourceIds: [...resumeSourceIds],
        });
    }
  }
  return { groups, heldBack };
}

export type HeldBack = { id: string; reason: string };

/** Wording that must not become a claim: a never-phrase or a verdict on fit. */
function wordingProblem(text: string): string | undefined {
  const never = findNeverPhrases(text);
  if (never.length > 0) return `contains the never-phrase "${never[0]}"`;
  const verdict = findVerdictPhrases(text);
  if (verdict.length > 0) return `contains the verdict phrase "${verdict[0]}"`;
  return undefined;
}

export type RawBridge = {
  id: string;
  phrases: string[];
  strength: 'direct' | 'related';
  statement: string;
  not_this?: string;
  basis_hint: string[];
};

/** Each bridge rests on two to six site claims; one with no support is held back. */
export function importBridges(
  raw: RawBridge[],
  ledger: LedgerEntry[],
): { bridges: Bridge[]; heldBack: HeldBack[] } {
  const bridges: Bridge[] = [];
  const heldBack: HeldBack[] = [];
  for (const item of raw) {
    const statement = typographic(item.statement.trim());
    const limit = item.not_this ? typographic(item.not_this.trim()) : undefined;
    const problem = wordingProblem(`${statement} ${limit ?? ''}`);
    if (problem) {
      heldBack.push({ id: item.id, reason: problem });
      continue;
    }
    const basis = chooseBasis(statement, item.basis_hint, ledger);
    if ('heldBack' in basis) {
      heldBack.push({ id: item.id, reason: basis.heldBack });
      continue;
    }
    bridges.push({
      id: item.id,
      phrases: item.phrases,
      strength: item.strength,
      statement,
      ...(limit ? { limit } : {}),
      basisIds: basis.basisIds,
    });
  }
  return { bridges, heldBack };
}

export type RawAnswer = {
  id: string;
  group: string;
  question: string;
  also_asked_as?: string[];
  answer: string;
  lens?: string;
  gap?: boolean;
  triggers?: string[];
  basis_hint?: string[];
  verify_against_site?: string[];
};

/**
 * Imports his answers only once he has approved them. An answer is held back
 * when a phrase it must match on the site is not there, when it carries a
 * never-phrase or a verdict, or (for a gap answer) when no site claim backs it.
 */
export function importQuestionBank(
  raw: { approved: boolean; answers: RawAnswer[] },
  ledger: LedgerEntry[],
): { answers: BankAnswer[]; heldBack: HeldBack[] } {
  const answers: BankAnswer[] = [];
  const heldBack: HeldBack[] = [];
  if (!raw.approved) return { answers, heldBack };
  for (const item of raw.answers) {
    const answer = typographic(item.answer.trim());
    const missing = missingOnSite(item.verify_against_site ?? [], ledger);
    if (missing.length > 0) {
      heldBack.push({
        id: item.id,
        reason: `the site does not confirm ${missing.map((m) => `"${m}"`).join(', ')}`,
      });
      continue;
    }
    const problem = wordingProblem(answer);
    if (problem) {
      heldBack.push({ id: item.id, reason: problem });
      continue;
    }
    let basisIds: string[] = [];
    if (item.gap) {
      // A gap answer mostly says what he has not done, so its supporting
      // claims are the nearby evidence and need not cover its wording.
      const basis = chooseBasis(answer, item.basis_hint ?? [], ledger, {
        minCoverage: 0,
      });
      if ('heldBack' in basis) {
        heldBack.push({ id: item.id, reason: basis.heldBack });
        continue;
      }
      basisIds = basis.basisIds;
    }
    answers.push({
      id: item.id,
      group: typographic(item.group),
      question: typographic(item.question.trim()),
      alsoAskedAs: (item.also_asked_as ?? []).map(typographic),
      answer,
      ...(item.lens ? { lens: item.lens as RoleId } : {}),
      gap: item.gap === true,
      triggers: (item.triggers ?? []).map(typographic),
      basisIds,
    });
  }
  return { answers, heldBack };
}

export type RawWordingRule = { topic: string; say: string; never?: string };

/** The pack's rules for the writer, kept as the pack words them. */
export function importWordingRules(raw: RawWordingRule[]): WordingRule[] {
  return raw.map((rule) => ({
    topic: typographic(rule.topic),
    say: typographic(rule.say.trim()),
    never: rule.never ? [typographic(rule.never.trim())] : [],
  }));
}
