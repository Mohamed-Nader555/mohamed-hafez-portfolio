import { describe, expect, it } from 'vitest';
import type { LedgerEntry } from '@/lib/rag/ledger';
import type { BankAnswer, SkillTierGroup } from '@/data/claims/types';
import {
  buildRoleBrief,
  gapTerms,
  RoleBriefError,
  skillTier,
  type RoleSpec,
} from '../../scripts/role-brief-rules';

const cite = (id: string) => ({
  sourceId: `src-${id}`,
  label: `Source ${id}`,
  href: `/x/${id}`,
});
const claim = (
  id: string,
  text: string,
  over: Partial<LedgerEntry> = {},
): LedgerEntry => ({
  id,
  text,
  strength: 'direct',
  origin: 'site',
  citations: [cite(id)],
  category: 'project',
  ...over,
});

const claims: LedgerEntry[] = [
  claim('c1', 'He built Python pipelines.'),
  claim('c2', 'He trained models with PyTorch.'),
  claim('c3', 'He packaged a service with Docker.'),
  claim('c4', 'He used Jetpack Compose once.'),
  claim('c5', 'He integrated OCR into an app.', { strength: 'related' }),
  claim('c6', 'He wrote about Kubernetes.'),
  claim('n1', 'Core skills in Python.', { origin: 'notes' }),
  claim('c7', 'He taught labs.'),
  claim('c8', 'He supported production.'),
  claim('c9', 'He reviewed code.'),
];
const tiers: SkillTierGroup[] = [
  {
    id: 't-core',
    area: 'languages',
    tier: 'core',
    skills: ['Python', 'PyTorch'],
    basisIds: [],
    resumeSourceIds: [],
  },
  {
    id: 't-working',
    area: 'tools',
    tier: 'working',
    skills: ['Docker'],
    basisIds: [],
    resumeSourceIds: [],
  },
  {
    id: 't-exposure',
    area: 'android',
    tier: 'exposure',
    skills: ['Jetpack Compose'],
    basisIds: [],
    resumeSourceIds: [],
  },
];
const namedGaps = [
  'Kubernetes, distributed training, large-scale model serving',
  'A/B testing, causal inference',
  'A PhD',
];
const bank = (id: string, gap = false): BankAnswer => ({
  id,
  group: 'g',
  question: `Question ${id}?`,
  alsoAskedAs: [],
  answer: `My answer ${id}.`,
  gap,
  triggers: [],
  basisIds: [],
});
const answers = [
  bank('qb-1'),
  bank('qb-2'),
  bank('qb-3'),
  bank('qb-4'),
  bank('qb-gap', true),
];
const ctx = { claims, tiers, namedGaps, bank: answers };

const requirement = (n: number, over = {}) => ({
  text: `Requirement ${n}`,
  claims: ['c1'],
  ...over,
});
const spec = (over: Partial<RoleSpec> = {}): RoleSpec => ({
  slug: 'role',
  title: 'A Role',
  alsoCalled: ['Role'],
  lens: 'aiml',
  answerId: 'qb-1',
  askHim: ['qb-2', 'qb-3', 'qb-4'],
  requirements: [1, 2, 3, 4, 5, 6].map((n) => requirement(n)),
  ...over,
});
const failing = (s: RoleSpec) => {
  try {
    buildRoleBrief(s, ctx);
  } catch (error) {
    expect(error).toBeInstanceOf(RoleBriefError);
    return (error as Error).message;
  }
  throw new Error('expected the build to fail');
};

describe('skillTier and gapTerms', () => {
  it('finds a skill’s tier ignoring case, and nothing for an unknown skill', () => {
    expect(skillTier('python', tiers)).toBe('core');
    expect(skillTier('Docker', tiers)).toBe('working');
    expect(skillTier('Jetpack Compose', tiers)).toBe('exposure');
    expect(skillTier('Rust', tiers)).toBeUndefined();
  });

  it('splits the named gaps into terms', () => {
    expect(gapTerms(namedGaps)).toEqual(
      expect.arrayContaining([
        'Kubernetes',
        'distributed training',
        'large-scale model serving',
        'A/B testing',
        'causal inference',
        'PhD',
      ]),
    );
  });
});

describe('buildRoleBrief grouping', () => {
  it('is direct when a site claim states it and every skill is core or working', () => {
    const brief = buildRoleBrief(
      spec({
        requirements: [
          requirement(1, { claims: ['c2', 'c1'], skills: ['PyTorch'] }),
          requirement(2, { claims: ['c3'], skills: ['Docker'] }),
          ...[3, 4, 5, 6].map((n) => requirement(n)),
        ],
      }),
      ctx,
    );
    expect(brief.direct).toHaveLength(6);
    expect(brief.related).toHaveLength(0);
  });

  it('is related when a skill is exposure only, when the author marks it adjacent, when a claim is related, or when no site claim is cited', () => {
    const brief = buildRoleBrief(
      spec({
        requirements: [
          requirement(1, { claims: ['c4'], skills: ['Jetpack Compose'] }),
          requirement(2, { adjacent: true }),
          requirement(3, { claims: ['c5'] }),
          requirement(4, { claims: ['n1'] }),
          requirement(5),
          requirement(6),
        ],
      }),
      ctx,
    );
    expect(brief.related.map((r) => r.text)).toEqual([
      'Requirement 1',
      'Requirement 2',
      'Requirement 3',
      'Requirement 4',
    ]);
    expect(brief.direct.map((r) => r.text)).toEqual([
      'Requirement 5',
      'Requirement 6',
    ]);
  });

  it('keeps his claims word for word, at most two as evidence, with merged citations', () => {
    const brief = buildRoleBrief(
      spec({
        requirements: [
          requirement(1, { claims: ['c1', 'c2', 'c3'] }),
          ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
        ],
      }),
      ctx,
    );
    const first = brief.direct[0]!;
    expect(first.evidence).toEqual([
      { claimId: 'c1', text: 'He built Python pipelines.' },
      { claimId: 'c2', text: 'He trained models with PyTorch.' },
    ]);
    expect(first.citations.map((c) => c.sourceId)).toEqual([
      'src-c1',
      'src-c2',
      'src-c3',
    ]);
  });
});

describe('buildRoleBrief refuses', () => {
  it('a claim that is not in the ledger', () => {
    expect(
      failing(
        spec({
          requirements: [
            requirement(1, { claims: ['nope'] }),
            ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
          ],
        }),
      ),
    ).toContain('nope');
  });

  it('a skill with no tier', () => {
    expect(
      failing(
        spec({
          requirements: [
            requirement(1, { skills: ['Rust'] }),
            ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
          ],
        }),
      ),
    ).toContain('Rust');
  });

  it('a requirement that names a named gap, in its words or its evidence', () => {
    expect(
      failing(
        spec({
          requirements: [
            requirement(1, { text: 'Run Kubernetes clusters' }),
            ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
          ],
        }),
      ),
    ).toMatch(/named gap/);
    expect(
      failing(
        spec({
          requirements: [
            requirement(1, { claims: ['c6'] }),
            ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
          ],
        }),
      ),
    ).toMatch(/named gap/);
  });

  it('verdict wording and fewer than six or more than ten requirements', () => {
    expect(
      failing(
        spec({
          requirements: [
            requirement(1, { text: 'A perfect fit for the team' }),
            ...[2, 3, 4, 5, 6].map((n) => requirement(n)),
          ],
        }),
      ),
    ).toMatch(/verdict/);
    expect(
      failing(spec({ requirements: [1, 2, 3].map((n) => requirement(n)) })),
    ).toMatch(/six to ten/);
    expect(
      failing(
        spec({
          requirements: Array.from({ length: 11 }, (_, n) => requirement(n)),
        }),
      ),
    ).toMatch(/six to ten/);
  });

  it('a summary or prompt that is missing, a gap answer, or not three prompts', () => {
    expect(failing(spec({ answerId: 'qb-missing' }))).toContain('qb-missing');
    expect(failing(spec({ answerId: 'qb-gap' }))).toMatch(/gap/);
    expect(failing(spec({ askHim: ['qb-2', 'qb-gap', 'qb-3'] }))).toMatch(
      /gap/,
    );
    expect(failing(spec({ askHim: ['qb-2', 'qb-3'] }))).toMatch(/three/);
    expect(failing(spec({ askHim: ['qb-2', 'qb-2', 'qb-3'] }))).toMatch(
      /three/,
    );
  });
});

describe('buildRoleBrief output', () => {
  it('carries his answer and three of his questions', () => {
    const brief = buildRoleBrief(spec(), ctx);
    expect(brief.summary).toEqual({
      answerId: 'qb-1',
      text: 'My answer qb-1.',
    });
    expect(brief.askHim).toEqual([
      { answerId: 'qb-2', question: 'Question qb-2?' },
      { answerId: 'qb-3', question: 'Question qb-3?' },
      { answerId: 'qb-4', question: 'Question qb-4?' },
    ]);
    expect(brief.slug).toBe('role');
    expect(brief.lens).toBe('aiml');
  });
});
