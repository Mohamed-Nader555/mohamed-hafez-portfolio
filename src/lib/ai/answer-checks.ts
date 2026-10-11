// Checks in code on every writer answer. They cost nothing and run before the
// checker model: a segment that fails one is dropped.
import { questionBank } from '@/data/claims/question-bank';
import type { BankAnswer } from '@/data/claims/types';
import { findNeverPhrases, findVerdictPhrases } from '@/lib/rag/claim-checks';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { matchKey } from '@/lib/rag/normalize-query';
import { entitiesNamedIn } from '@/lib/rag/retrieve';
import { extractNumbers } from './answer-guards';
import { triggerMatches } from './hints';

export type DraftSegment = { text: string; claimIds: string[] };
export type Dropped = { index: number; reason: string; kind: DropKind };

/** What kind of check failed; safe to log, unlike the reason, which can name things. */
export type DropKind =
  | 'unknown-claim'
  | 'wording'
  | 'own-reading'
  | 'number'
  | 'entity'
  | 'quote'
  | 'gap';

function kindOf(reason: string): DropKind {
  if (reason.startsWith('unknown claim')) return 'unknown-claim';
  if (reason.startsWith('verdict') || reason.startsWith('wording'))
    return 'wording';
  if (/own reading/.test(reason)) return 'own-reading';
  if (reason.startsWith('number')) return 'number';
  if (reason.startsWith('a quote')) return 'quote';
  if (reason.startsWith('names a named gap')) return 'gap';
  return 'entity';
}

/** An entity named in some text: its key, and the project it stands for. */
export type NamedEntity = { key: string; projectId?: string };

export type CheckContext = {
  claims: ReadonlyMap<string, LedgerEntry>;
  bank: readonly BankAnswer[];
  entitiesIn: (text: string) => NamedEntity[];
  /** The visitor's question and any pasted job description. */
  askedText: string;
};

/** Employers the site names; a segment may name one only if a cited claim does. */
const EMPLOYERS = ['Eklan', 'BASS', 'DotPy', 'York University'] as const;

const MAX_NOT_SHOWN = 6;

const normalise = (text: string) =>
  text.replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();

const sentencesOf = (text: string) =>
  normalise(text)
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const employersIn = (text: string) =>
  EMPLOYERS.filter((name) =>
    new RegExp(`(?<![A-Za-z])${escapeRegExp(name)}(?![A-Za-z])`, 'i').test(
      text,
    ),
  );

export function createCheckContext(
  claims: readonly LedgerEntry[],
  askedText: string,
): CheckContext {
  return {
    claims: new Map(claims.map((claim) => [claim.id, claim])),
    bank: questionBank,
    askedText,
    entitiesIn: (text) =>
      entitiesNamedIn(text).map((entity) => ({
        key: entity.key,
        ...(entity.kind === 'project' && entity.projectId
          ? { projectId: entity.projectId }
          : {}),
      })),
  };
}

/** The reason a segment fails, or undefined when it passes. */
function problemWith(
  segment: DraftSegment,
  ctx: CheckContext,
  ownReadingTaken: boolean,
): string | undefined {
  const cited: LedgerEntry[] = [];
  for (const id of segment.claimIds) {
    const claim = ctx.claims.get(id);
    if (!claim) return `unknown claim id ${id}`;
    cited.push(claim);
  }

  const verdicts = findVerdictPhrases(segment.text);
  if (verdicts.length) return `verdict wording: ${verdicts.join(', ')}`;
  const never = findNeverPhrases(segment.text);
  if (never.length) return `wording the notes forbid: ${never.join(', ')}`;

  const segmentEntities = ctx.entitiesIn(segment.text);
  const segmentEmployers = employersIn(segment.text);

  if (cited.length === 0) {
    if (ownReadingTaken) return 'a second own reading';
    if (extractNumbers(segment.text).length)
      return 'an own reading with a number';
    const named = segmentEntities[0]?.key ?? segmentEmployers[0];
    if (named) return `an own reading that names ${named}`;
    return undefined;
  }

  const citedText = cited.map((claim) => claim.text).join(' ');

  const shown = new Set(extractNumbers(citedText));
  const stray = extractNumbers(segment.text).filter((n) => !shown.has(n));
  if (stray.length)
    return `number ${stray.join(', ')} is not in the cited claims`;

  const citedKeys = new Set(ctx.entitiesIn(citedText).map((e) => e.key));
  const citedProjects = new Set(
    cited.map((claim) => claim.projectId).filter(Boolean),
  );
  const unnamed = segmentEntities.find(
    (entity) =>
      !citedKeys.has(entity.key) &&
      !(entity.projectId && citedProjects.has(entity.projectId)),
  );
  if (unnamed) return `${unnamed.key} is not named in the cited claims`;
  const citedEmployers = new Set(employersIn(citedText));
  const employer = segmentEmployers.find((name) => !citedEmployers.has(name));
  if (employer) return `${employer} is not named in the cited claims`;

  const own = cited.filter((claim) => claim.origin === 'own-words');
  if (own.length) {
    const stored = own.map((claim) => {
      const answer = ctx.bank.find((a) => a.id === claim.id)?.answer;
      return answer ? normalise(answer) : '';
    });
    for (const sentence of sentencesOf(segment.text))
      if (!stored.some((answer) => answer && answer.includes(sentence)))
        return 'a quote of his answer must be verbatim';
  }

  const citedIds = new Set(segment.claimIds);
  for (const answer of ctx.bank)
    if (
      answer.gap &&
      !citedIds.has(answer.id) &&
      answer.triggers.some((trigger) => triggerMatches(segment.text, trigger))
    )
      return `names a named gap without citing ${answer.id}`;

  return undefined;
}

export function checkDraft(
  segments: readonly DraftSegment[],
  ctx: CheckContext,
): { kept: DraftSegment[]; dropped: Dropped[] } {
  const kept: DraftSegment[] = [];
  const dropped: Dropped[] = [];
  let ownReadingTaken = false;
  segments.forEach((segment, index) => {
    const reason = problemWith(segment, ctx, ownReadingTaken);
    if (reason) {
      dropped.push({ index, reason, kind: kindOf(reason) });
      return;
    }
    if (segment.claimIds.length === 0) ownReadingTaken = true;
    kept.push(segment);
  });
  return { kept, dropped };
}

/** The "not on the site" terms that the visitor really wrote, once each. */
export function filterNotShown(terms: readonly string[], askedText: string) {
  const asked = ` ${matchKey(askedText)} `;
  const seen = new Set<string>();
  const result: string[] = [];
  for (const term of terms) {
    const key = matchKey(term);
    if (!key || seen.has(key) || !asked.includes(` ${key} `)) continue;
    seen.add(key);
    result.push(term.trim());
    if (result.length === MAX_NOT_SHOWN) break;
  }
  return result;
}
