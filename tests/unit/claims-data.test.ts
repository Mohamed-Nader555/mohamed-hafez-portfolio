import { beforeAll, describe, expect, it } from 'vitest';
import {
  bridges,
  excludedTopics,
  namedGaps,
  questionBank,
  skillTierGroups,
  unconfirmedClaims,
  wordingRules,
} from '@/data/claims';
import {
  findNeverPhrases,
  findPhrases,
  findVerdictPhrases,
  numeralsIn,
} from '@/lib/rag/claim-checks';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { forbiddenHashesIn } from '../helpers/forbidden-terms';
import { buildLedgerArtifacts } from '../../scripts/build-knowledge-index';

// The four committed files written by `npm run claims:apply` get the same kinds
// of rule the site's own data gets: no forbidden name, locked status wording,
// only technologies and numbers the site shows, and no verdict on fit.

const everyText = () => [
  ...bridges.flatMap((b) => [b.statement, b.limit ?? '']),
  ...questionBank.flatMap((a) => [a.question, ...a.alsoAskedAs, a.answer]),
  ...wordingRules.flatMap((r) => [r.topic, r.say]),
  ...skillTierGroups.flatMap((g) => g.skills),
];

let ledger: LedgerEntry[];
beforeAll(async () => {
  ({ ledger } = await buildLedgerArtifacts());
});

describe('bridges', () => {
  it('has the pack’s 22 bridges, each resting on two to six site claims', () => {
    expect(bridges).toHaveLength(22);
    const site = new Map(
      ledger.filter((c) => c.origin === 'site').map((c) => [c.id, c]),
    );
    for (const bridge of bridges) {
      expect(bridge.basisIds.length, bridge.id).toBeGreaterThanOrEqual(2);
      expect(bridge.basisIds.length, bridge.id).toBeLessThanOrEqual(6);
      for (const id of bridge.basisIds)
        expect(site.has(id), `${bridge.id} -> ${id}`).toBe(true);
    }
  });

  it('uses only numbers that its supporting claims show', () => {
    const site = new Map(ledger.map((c) => [c.id, c]));
    for (const bridge of bridges) {
      const shown = new Set(
        bridge.basisIds.flatMap((id) => numeralsIn(site.get(id)!.text)),
      );
      for (const number of numeralsIn(bridge.statement))
        expect(shown.has(number), `${bridge.id}: ${number}`).toBe(true);
    }
  });

  it('carries both strengths and a statement for every bridge', () => {
    expect(new Set(bridges.map((b) => b.strength))).toEqual(
      new Set(['direct', 'related']),
    );
    for (const bridge of bridges) {
      expect(bridge.statement.length, bridge.id).toBeGreaterThan(40);
      expect(bridge.phrases.length, bridge.id).toBeGreaterThan(0);
    }
  });
});

describe('skill tiers', () => {
  it('keeps only skills that a site claim or a public résumé mentions', () => {
    expect(skillTierGroups.length).toBeGreaterThan(20);
    for (const group of skillTierGroups) {
      expect(group.skills.length, group.id).toBeGreaterThan(0);
      expect(
        group.basisIds.length + group.resumeSourceIds.length,
        group.id,
      ).toBeGreaterThan(0);
    }
  });

  it('words exposure as exposure only and never as direct experience', () => {
    const exposure = ledger.filter((c) => c.id.endsWith('-exposure'));
    expect(exposure.length).toBeGreaterThan(3);
    for (const claim of exposure) {
      expect(claim.strength).toBe('related');
      expect(claim.text).toMatch(/^Exposure only/);
    }
    for (const claim of ledger.filter(
      (c) => c.id.startsWith('skills-') && !c.id.endsWith('-exposure'),
    ))
      expect(claim.strength).toBe('direct');
  });
});

describe('wording rules', () => {
  it('holds the rules, the unconfirmed claims, the excluded topics and the 11 gaps', () => {
    expect(wordingRules.length).toBeGreaterThanOrEqual(12);
    for (const rule of wordingRules) {
      expect(rule.topic).not.toBe('');
      expect(rule.say).not.toBe('');
    }
    expect(unconfirmedClaims.length).toBeGreaterThanOrEqual(6);
    expect(excludedTopics.length).toBeGreaterThanOrEqual(4);
    expect(namedGaps).toHaveLength(11);
  });

  it('is not contradicted by any claim from his notes or answers', () => {
    const claimsFromNotes = ledger
      .filter((c) => c.origin !== 'site')
      // The question is the visitor's wording, not a claim; check the answer.
      .map((c) =>
        c.text.replace(/^Q: .*? A: /, '').replace(/\(A gap answer:[^)]*\)/, ''),
      );
    for (const text of claimsFromNotes) {
      expect(findNeverPhrases(text), text.slice(0, 80)).toEqual([]);
      expect(findVerdictPhrases(text), text.slice(0, 80)).toEqual([]);
      expect(
        findPhrases(text, ['peft', 'lora', 'pdf redaction', 'trello']),
        text.slice(0, 80),
      ).toEqual([]);
    }
  });
});

describe('his answers', () => {
  it('imports the approved answers, five of them gap answers with basis claims', () => {
    expect(questionBank.length).toBeGreaterThanOrEqual(25);
    const gaps = questionBank.filter((a) => a.gap);
    expect(gaps).toHaveLength(5);
    for (const gap of gaps) {
      expect(gap.basisIds.length, gap.id).toBeGreaterThanOrEqual(2);
      expect(gap.triggers.length, gap.id).toBeGreaterThan(0);
    }
    for (const answer of questionBank.filter((a) => !a.gap))
      expect(answer.group, answer.id).not.toMatch(/Gaps/);
    expect(new Set(questionBank.map((a) => a.id)).size).toBe(
      questionBank.length,
    );
  });

  it('uses the site’s apostrophes', () => {
    for (const text of everyText())
      expect(text).not.toMatch(/[A-Za-z]'[A-Za-z]/);
  });
});

describe('all four files', () => {
  it('contain no forbidden name', () => {
    expect(forbiddenHashesIn(everyText().join('\n'))).toEqual([]);
  });

  it('keep the locked status wording', () => {
    const text = everyText().join('\n');
    expect(text).not.toMatch(/submitted and (currently )?under review/i);
    expect(text).not.toMatch(
      /CEH certified|published SPRINT-PP|accepted SPRINT-PP/i,
    );
    expect(text).not.toMatch(
      /immediately available|available immediately|immediate start/i,
    );
    expect(text).not.toMatch(/\bMSc\b/);
  });

  it('use only numbers the site shows', () => {
    const shown = new Set(
      ledger
        .filter((c) => c.origin === 'site')
        .flatMap((c) => numeralsIn(c.text)),
    );
    for (const claim of ledger.filter((c) => c.origin !== 'site'))
      for (const number of numeralsIn(claim.text))
        expect(shown.has(number), `${claim.id}: ${number}`).toBe(true);
  });
});
