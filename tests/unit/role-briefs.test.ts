import { describe, expect, it } from 'vitest';
import ledger from '@/generated/ledger.json';
import { questionBank } from '@/data/claims';
import { roleBriefs } from '@/data/claims/role-briefs';
import { namedGaps } from '@/data/claims/wording-rules';
import { checkDraft, createCheckContext } from '@/lib/ai/answer-checks';
import {
  findNeverPhrases,
  findVerdictPhrases,
  numeralsIn,
} from '@/lib/rag/claim-checks';
import type { LedgerEntry } from '@/lib/rag/ledger';
import type { RoleBrief } from '@/data/claims/types';
import { gapTerms } from '../../scripts/role-brief-rules';
import { forbiddenHashesIn } from '../helpers/forbidden-terms';

const claims = ledger as LedgerEntry[];
const byId = new Map(claims.map((claim) => [claim.id, claim]));

// The 11 roles of the assistant pack (stage D), in order.
const SLUGS = [
  'machine-learning-engineer',
  'nlp-engineer',
  'document-ai-engineer',
  'ai-llm-engineer',
  'ai-evaluation-engineer',
  'privacy-engineer',
  'ai-solutions-engineer',
  'documentum-ecm-consultant',
  'java-backend-developer',
  'android-developer',
  'technical-instructor',
];

/** Everything a visitor can read on a brief. */
const textOf = (brief: RoleBrief) =>
  [
    brief.title,
    ...brief.alsoCalled,
    brief.summary.text,
    ...brief.askHim.map((prompt) => prompt.question),
    ...[...brief.direct, ...brief.related].flatMap((requirement) => [
      requirement.text,
      ...requirement.evidence.map((e) => e.text),
    ]),
  ].join('\n');

describe('the 11 role briefs', () => {
  it('cover the pack’s roles, in order, with unique slugs', () => {
    expect(roleBriefs.map((brief) => brief.slug)).toEqual(SLUGS);
    expect(new Set(roleBriefs.map((brief) => brief.slug)).size).toBe(11);
  });

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s lists six to ten requirements, led by one identity',
    (_slug, brief) => {
      const count = brief.direct.length + brief.related.length;
      expect(count).toBeGreaterThanOrEqual(6);
      expect(count).toBeLessThanOrEqual(10);
      expect(brief.direct.length).toBeGreaterThan(0);
      expect(brief.alsoCalled.length).toBeGreaterThan(0);
    },
  );

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s quotes the ledger word for word and cites public sources',
    (_slug, brief) => {
      for (const requirement of [...brief.direct, ...brief.related]) {
        expect(requirement.evidence.length).toBeGreaterThan(0);
        for (const evidence of requirement.evidence)
          expect(evidence.text).toBe(byId.get(evidence.claimId)?.text);
        expect(requirement.citations.length).toBeGreaterThan(0);
        const publicIds = new Set(
          requirement.evidence.flatMap(
            (e) => byId.get(e.claimId)?.citations.map((c) => c.sourceId) ?? [],
          ),
        );
        for (const citation of requirement.citations)
          expect(publicIds.has(citation.sourceId)).toBe(true);
      }
    },
  );

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s passes the checks a live answer must pass (numbers, names, wording)',
    (_slug, brief) => {
      const context = createCheckContext(claims, '');
      for (const requirement of [...brief.direct, ...brief.related]) {
        const { dropped } = checkDraft(
          [
            {
              text: requirement.text,
              claimIds: requirement.evidence.map((e) => e.claimId),
            },
          ],
          context,
        );
        expect(dropped.map((d) => `${requirement.text}: ${d.reason}`)).toEqual(
          [],
        );
        expect(numeralsIn(requirement.text)).toEqual([]);
      }
    },
  );

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s has no verdict wording, never-phrase, named gap, private-strategy word or forbidden name',
    (_slug, brief) => {
      const text = textOf(brief);
      expect(findVerdictPhrases(text)).toEqual([]);
      expect(findNeverPhrases(text)).toEqual([]);
      const gaps = gapTerms(namedGaps).filter((term) =>
        new RegExp(
          `(?<![A-Za-z0-9])${term.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![A-Za-z0-9])`,
          'i',
        ).test(text),
      );
      expect(gaps).toEqual([]);
      expect(text).not.toMatch(
        /findability|shortlist|fit rating|strong fit|moderate fit/i,
      );
      expect(forbiddenHashesIn(text)).toEqual([]);
    },
  );

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s puts a requirement under direct only when a site claim states it',
    (_slug, brief) => {
      for (const requirement of brief.direct) {
        const cited = requirement.evidence.map((e) => byId.get(e.claimId)!);
        expect(cited.some((claim) => claim.origin === 'site')).toBe(true);
        expect(cited.every((claim) => claim.strength === 'direct')).toBe(true);
      }
    },
  );

  it.each(roleBriefs.map((brief) => [brief.slug, brief] as const))(
    '%s quotes one of his answers and offers three prompts, none of them a gap',
    (_slug, brief) => {
      const answer = questionBank.find((a) => a.id === brief.summary.answerId);
      expect(answer?.gap).toBe(false);
      expect(brief.summary.text).toBe(answer?.answer);
      expect(brief.askHim).toHaveLength(3);
      expect(new Set(brief.askHim.map((p) => p.answerId)).size).toBe(3);
      for (const prompt of brief.askHim) {
        const entry = questionBank.find((a) => a.id === prompt.answerId);
        expect(entry?.gap).toBe(false);
        expect(prompt.question).toBe(entry?.question);
      }
    },
  );
});
