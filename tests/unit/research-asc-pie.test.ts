import { describe, expect, it } from 'vitest';

import { ALLOWED_NUMBERS } from '@/data/allowed-numbers';
import {
  corpusAblation,
  modelFamilies,
  paperLine,
  perTypeGains,
  promptingVersusFineTuning,
  researchQuestions,
  thesisAbstract,
} from '@/data/research-asc-pie';

// The research record shows numbers outside the case-study frontmatter, so the
// frontmatter schema never checks them. This test applies the same rule: every
// number must be in the project's allowlist (the research page covers both
// ASC-PIE and SPRINT-PP, so both lists apply).
const allowed = new Set<string>([
  ...ALLOWED_NUMBERS['asc-pie'],
  ...ALLOWED_NUMBERS['sprint-pp'],
]);

// Model and label names that contain digits but are not claims.
const NAME_PATTERN =
  /Qwen ?2\.5[- ]?7B|Llama ?3\.1[- ]?8B|FLAN-T5-base|RQ\d|\b[35]-shot\b/gi;
const NUMBER_PATTERN = /[+-]?\d+(?:,\d{3})*(?:\.\d+)?(?: s\/query|s|%)?/g;

function numbersIn(text: string): string[] {
  return text.replace(NAME_PATTERN, ' ').match(NUMBER_PATTERN) ?? [];
}

function flatten(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (typeof value === 'number') return [String(value)];
  if (Array.isArray(value)) return value.flatMap(flatten);
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(flatten);
  return [];
}

describe('research record numbers', () => {
  it('uses only allowlisted numbers in the answers, tables, and prose', () => {
    const texts = [
      ...flatten(researchQuestions),
      ...flatten(promptingVersusFineTuning),
      ...flatten(perTypeGains),
      ...modelFamilies.flatMap((model) => [
        `${model.f1.toFixed(1)}%`,
        model.validity,
      ]),
      thesisAbstract,
    ];
    const missing = texts
      .flatMap(numbersIn)
      .filter((token) => !allowed.has(token));

    expect([...new Set(missing)]).toEqual([]);
  });

  it('lists the corpus-ablation chart values as decimals in the allowlist', () => {
    for (const item of corpusAblation.items) {
      for (const value of [item.value, item.groupValue]) {
        expect(allowed.has(value.toFixed(3)), `${item.label} ${value}`).toBe(
          true,
        );
      }
    }
  });

  it('gives every supervised model a validity and keeps the four top models at 1.000', () => {
    expect(modelFamilies).toHaveLength(7);
    expect(
      modelFamilies.filter((model) => model.validity === '1.000'),
    ).toHaveLength(4);
    expect(
      Object.fromEntries(modelFamilies.map((m) => [m.label, m.validity])),
    ).toMatchObject({
      'Llama 3.1 8B': '0.814',
      'Qwen 2.5 7B': '0.543',
      'BART-base': '0.561',
    });
  });

  it('shows the paper title and status without an author list', () => {
    expect(paperLine.title).toBe(
      'ASC-PIE and SPRINT-PP: Evaluating Privacy-Safe Continual Learning for PII Extraction',
    );
    expect(paperLine.status).toMatch(/accepted to IEEE CASCON 2026/i);
    expect(JSON.stringify(paperLine)).not.toMatch(/author/i);
  });

  it('answers all four research questions in one paragraph each', () => {
    expect(researchQuestions.map((rq) => rq.label)).toEqual([
      'RQ1',
      'RQ2',
      'RQ3',
      'RQ4',
    ]);
    for (const rq of researchQuestions) {
      expect(rq.answer).not.toContain('\n');
      expect(rq.answer.split(/\s+/).length).toBeGreaterThan(40);
    }
  });
});
