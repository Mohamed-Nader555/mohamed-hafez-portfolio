import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

// Brief §7.2: the SPRINT-PP summary table (ACC / BWT / Forgetting /
// Intransigence for the four compared strategies) is the authoritative
// source for these numbers. This parses `sprint-pp.mdx`'s raw source
// directly (matching the approach `tests/integration/case-study-build.test
// .ts` uses for frontmatter/content) rather than rendering the MDX, since
// this suite runs under Vitest/jsdom, not Astro's renderer.
const mdxPath = path.resolve('src/content/case-studies/sprint-pp.mdx');
const source = readFileSync(mdxPath, 'utf8');

// Brief §7.2's summary table, verbatim (ACC, BWT, Forgetting, Intransigence,
// "Stores raw PII?"). SPRINT-PP's ACC there is given as the decimal 0.8350,
// BWT -0.2075, Forgetting 0.2075, Intransigence 0.0156; the page renders ACC
// as a percentage (83.5%) and the rest as raw decimals, so ACC is compared
// numerically and the rest compared as exact strings.
const EXPECTED_SUMMARY: {
  strategy: string;
  acc: number;
  bwt: string;
  forgetting: string;
  intransigence: string;
  storesRawPii: string;
}[] = [
  {
    strategy: 'SPRINT-PP',
    acc: 0.835,
    bwt: '−0.2075',
    forgetting: '0.2075',
    intransigence: '0.0156',
    storesRawPii: 'No',
  },
  {
    strategy: 'Distillation',
    acc: 0.83,
    bwt: '−0.2111',
    forgetting: '0.2111',
    intransigence: '0.0193',
    storesRawPii: 'No',
  },
  {
    strategy: 'Replay',
    acc: 0.765,
    bwt: '−0.2726',
    forgetting: '0.2726',
    intransigence: '0.0278',
    storesRawPii: 'Yes',
  },
  {
    strategy: 'Baseline',
    acc: 0.146,
    bwt: '−0.6506',
    forgetting: '0.6506',
    intransigence: '0.0202',
    storesRawPii: 'No',
  },
];

function extractCompareTableRows(raw: string) {
  const block = raw.match(/rows=\{\[([\s\S]*?)\]\}/);
  if (!block) throw new Error('Could not find <CompareTable rows={[...]} />');

  const rowPattern =
    /\[\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*,\s*'([^']*)'\s*\]/g;

  return [...block[1].matchAll(rowPattern)].map((match) => ({
    strategy: match[1],
    acc: match[2],
    bwt: match[3],
    forgetting: match[4],
    intransigence: match[5],
    storesRawPii: match[6],
  }));
}

function extractStageMatrixBlocks(raw: string) {
  const pattern = /matrices=\{\{([\s\S]*?)\}\}/g;
  const strategyPattern =
    /(?:'([^']+)'|([A-Za-z][A-Za-z0-9]*)):\s*\[\s*((?:\[[^\]]*\]\s*,?\s*)+)\]/g;

  return [...raw.matchAll(pattern)].map((match) => {
    const byStrategy = new Map<string, number[]>();
    for (const strategyMatch of match[1].matchAll(strategyPattern)) {
      const name = strategyMatch[1] ?? strategyMatch[2];
      const numbers = (strategyMatch[3].match(/-?\d+(?:\.\d+)?/g) ?? []).map(
        Number,
      );
      byStrategy.set(name, numbers);
    }
    return byStrategy;
  });
}

describe('SPRINT-PP outcome numbers (brief §7.2)', () => {
  it('renders the exact CompareTable summary row per strategy', () => {
    const rows = extractCompareTableRows(source);
    expect(rows).toHaveLength(EXPECTED_SUMMARY.length);

    for (const expected of EXPECTED_SUMMARY) {
      const row = rows.find((entry) => entry.strategy === expected.strategy);
      expect(
        row,
        `missing CompareTable row for ${expected.strategy}`,
      ).toBeDefined();
      if (!row) continue;

      expect(
        Number.parseFloat(row.acc) / 100,
        `${expected.strategy}: ACC`,
      ).toBeCloseTo(expected.acc, 4);
      expect(row.bwt, `${expected.strategy}: BWT`).toBe(expected.bwt);
      expect(row.forgetting, `${expected.strategy}: Forgetting`).toBe(
        expected.forgetting,
      );
      expect(row.intransigence, `${expected.strategy}: Intransigence`).toBe(
        expected.intransigence,
      );
      expect(row.storesRawPii, `${expected.strategy}: Stores raw PII?`).toBe(
        expected.storesRawPii,
      );
    }
  });

  it('embeds two <StageMatrix> calls (stage-restricted and cumulative) with 3x3 numeric grids only', () => {
    const matrixBlocks = extractStageMatrixBlocks(source);
    expect(matrixBlocks).toHaveLength(2);

    const [stageRestricted, cumulative] = matrixBlocks;
    expect([...stageRestricted.keys()].sort()).toEqual(
      ['Baseline', 'Replay', 'Distillation', 'SPRINT-PP'].sort(),
    );
    expect([...cumulative.keys()].sort()).toEqual(
      ['Replay', 'Distillation', 'SPRINT-PP'].sort(),
    );

    for (const numbers of [
      ...stageRestricted.values(),
      ...cumulative.values(),
    ]) {
      expect(numbers).toHaveLength(9); // 3x3 grid
      for (const value of numbers) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("keeps the shared strategies' stage-0-vs-stage-0 cell consistent across both matrices", () => {
    // Stage 0 evaluated on its own can't depend on which view (stage-
    // restricted vs cumulative) is looking at it for a given strategy, since
    // no other stage has been learned yet. Replay, Distillation, and
    // SPRINT-PP all appear in both <StageMatrix> calls (Baseline is
    // deliberately left out of the cumulative view, per the page's own
    // prose), so their first cell should match across both calls.
    const [stageRestricted, cumulative] = extractStageMatrixBlocks(source);
    const sharedStrategies = ['Replay', 'Distillation', 'SPRINT-PP'];

    const stage0Cells = sharedStrategies.map(
      (strategy) => stageRestricted.get(strategy)?.[0],
    );
    expect(new Set(stage0Cells).size, 'stage-restricted stage-0 cells').toBe(1);

    for (const strategy of sharedStrategies) {
      expect(
        cumulative.get(strategy)?.[0],
        `${strategy}: cumulative stage-0 cell should match stage-restricted`,
      ).toBeCloseTo(stageRestricted.get(strategy)?.[0] ?? NaN, 4);
    }
  });

  it('never claims SPRINT-PP is "published" or "under review" near its status', () => {
    expect(source).not.toMatch(/published SPRINT-PP|accepted SPRINT-PP/i);
    expect(source).not.toMatch(/submitted and (currently )?under review/i);
    expect(source).toMatch(/accepted to (IEEE )?CASCON 2026/i);
  });
});
