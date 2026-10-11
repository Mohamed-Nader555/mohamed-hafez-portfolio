import { describe, expect, it } from 'vitest';
import ledgerJson from '@/generated/ledger.json';
import type { BankAnswer } from '@/data/claims/types';
import {
  checkDraft,
  createCheckContext,
  filterNotShown,
  type CheckContext,
} from '@/lib/ai/answer-checks';
import type { LedgerEntry } from '@/lib/rag/ledger';

const cite = [{ sourceId: 's', label: 'S', href: '/s' }];
const claim = (
  id: string,
  text: string,
  extra: Partial<LedgerEntry> = {},
): LedgerEntry => ({
  id,
  text,
  strength: 'direct',
  origin: 'site',
  citations: cite,
  category: 'project',
  ...extra,
});

const bank: BankAnswer[] = [
  {
    id: 'qb-ceh',
    group: 'g',
    question: 'Are you certified?',
    alsoAskedAs: [],
    answer: 'No. I completed a training course. It was useful.',
    gap: false,
    triggers: [],
    basisIds: [],
  },
  {
    id: 'qb-gap-k8s',
    group: 'g',
    question: 'Kubernetes?',
    alsoAskedAs: [],
    answer: 'I have not run Kubernetes. I have used Docker.',
    gap: true,
    triggers: ['Kubernetes', 'K8s'],
    basisIds: [],
  },
];

const claims = new Map<string, LedgerEntry>(
  [
    claim(
      'c-dostava',
      'Mohamed built Dostava, an Android delivery app, with Retrofit and Room. It had 8 order categories.',
      { projectId: 'dostava' },
    ),
    claim('c-python', 'He uses Python for data work at DotPy.'),
    claim('c-related', 'He has seen Docker in class.', {
      strength: 'related',
    }),
    claim(
      'qb-ceh',
      'Q: Are you certified? A: No. I completed a training course. It was useful.',
      {
        origin: 'own-words',
      },
    ),
    claim(
      'qb-gap-k8s',
      'Q: Kubernetes? A: I have not run Kubernetes. I have used Docker.',
      {
        origin: 'own-words',
      },
    ),
  ].map((c) => [c.id, c]),
);

const KEYS: Array<[string, string, string?]> = [
  ['dostava', 'dostava', 'dostava'],
  ['retrofit', 'retrofit'],
  ['python', 'python'],
  ['docker', 'docker'],
  ['room', 'room'],
];

const ctx: CheckContext = {
  claims,
  bank,
  askedText: 'Does he know Rust and Terraform?',
  entitiesIn: (text) =>
    KEYS.filter(([, term]) => text.toLowerCase().includes(term)).map(
      ([key, , projectId]) => ({ key, projectId }),
    ),
};

const run = (segments: Array<{ text: string; claimIds: string[] }>) =>
  checkDraft(segments, ctx);

describe('checkDraft', () => {
  it('keeps a segment that its claims support', () => {
    const { kept, dropped } = run([
      { text: 'He built Dostava with Retrofit.', claimIds: ['c-dostava'] },
    ]);
    expect(dropped).toEqual([]);
    expect(kept).toHaveLength(1);
  });

  it('drops a segment citing a claim that does not exist', () => {
    const { kept, dropped } = run([
      { text: 'He built Dostava.', claimIds: ['c-dostava', 'nope'] },
    ]);
    expect(kept).toEqual([]);
    expect(dropped[0]!.reason).toMatch(/unknown claim/i);
  });

  it('drops a number that no cited claim shows and keeps one that is shown', () => {
    const bad = run([
      { text: 'Dostava had 12 order categories.', claimIds: ['c-dostava'] },
    ]);
    expect(bad.kept).toEqual([]);
    expect(bad.dropped[0]!.reason).toMatch(/number/i);
    const good = run([
      { text: 'Dostava had 8 order categories.', claimIds: ['c-dostava'] },
    ]);
    expect(good.kept).toHaveLength(1);
  });

  it('drops a technology that the cited claims do not name', () => {
    const { kept, dropped } = run([
      { text: 'Dostava used Python.', claimIds: ['c-dostava'] },
    ]);
    expect(kept).toEqual([]);
    expect(dropped[0]!.reason).toMatch(/python/i);
  });

  it('accepts a project named through the cited claim’s project', () => {
    const { kept } = run([
      { text: 'Dostava is a delivery app.', claimIds: ['c-dostava'] },
    ]);
    expect(kept).toHaveLength(1);
  });

  it('counts the claims a bridge rests on as grounding for names', () => {
    const withBasis = new Map(claims);
    withBasis.set(
      'br-x',
      claim('br-x', 'He built services for clients.', {
        origin: 'notes',
        basisIds: ['c-python'],
      }),
    );
    const result = checkDraft(
      [{ text: 'He built services in Python.', claimIds: ['br-x'] }],
      { ...ctx, claims: withBasis },
    );
    expect(result.kept).toHaveLength(1);
    // Without the basis, the same name is still dropped.
    expect(
      run([{ text: 'He built services in Python.', claimIds: ['c-dostava'] }])
        .kept,
    ).toEqual([]);
  });

  it('drops an employer the cited claims do not name', () => {
    const { kept, dropped } = run([
      { text: 'He worked at BASS.', claimIds: ['c-dostava'] },
    ]);
    expect(kept).toEqual([]);
    expect(dropped[0]!.reason).toMatch(/bass/i);
    expect(
      run([{ text: 'He works with Python at DotPy.', claimIds: ['c-python'] }])
        .kept,
    ).toHaveLength(1);
  });

  it('allows a quote of his answer only word for word', () => {
    expect(
      run([
        {
          text: 'No. I completed a training course.',
          claimIds: ['qb-ceh'],
        },
      ]).kept,
    ).toHaveLength(1);
    const paraphrase = run([
      { text: 'He is not certified.', claimIds: ['qb-ceh'] },
    ]);
    expect(paraphrase.kept).toEqual([]);
    expect(paraphrase.dropped[0]!.reason).toMatch(/verbatim|quote/i);
  });

  it('does not let a quote carry extra text or other claims', () => {
    const mixed = run([
      {
        text: 'No. I completed a training course. He also built Dostava.',
        claimIds: ['qb-ceh', 'c-dostava'],
      },
    ]);
    expect(mixed.kept).toEqual([]);
  });

  it('allows one own-reading segment with no numbers and no named technology', () => {
    const { kept, dropped } = run([
      { text: 'Together these show breadth.', claimIds: [] },
      { text: 'Another own reading.', claimIds: [] },
    ]);
    expect(kept).toHaveLength(1);
    expect(dropped[0]!.reason).toMatch(/own reading/i);
  });

  it('drops an own reading that has a number or names a technology', () => {
    expect(run([{ text: 'He has 5 years.', claimIds: [] }]).kept).toEqual([]);
    expect(run([{ text: 'He likes Python.', claimIds: [] }]).kept).toEqual([]);
  });

  it('requires the gap answer when a segment names a named gap', () => {
    const uncited = run([
      { text: 'He could use Kubernetes.', claimIds: ['c-python'] },
    ]);
    expect(uncited.kept).toEqual([]);
    expect(uncited.dropped[0]!.reason).toMatch(/gap/i);
    const cited = run([
      { text: 'I have not run Kubernetes.', claimIds: ['qb-gap-k8s'] },
    ]);
    expect(cited.kept).toHaveLength(1);
  });

  it('drops wording the notes forbid and verdict wording', () => {
    expect(
      run([{ text: 'He is a team lead.', claimIds: ['c-python'] }]).kept,
    ).toEqual([]);
    const verdict = run([
      { text: 'He is a good fit for this.', claimIds: ['c-python'] },
    ]);
    expect(verdict.kept).toEqual([]);
    expect(verdict.dropped[0]!.reason).toMatch(/verdict/i);
  });

  it('lets a claim say what the site does not show', () => {
    const { kept } = run([
      {
        text: 'There is no good fit score on the site.',
        claimIds: ['c-python'],
      },
    ]);
    expect(kept).toHaveLength(1);
  });

  it('reports the index of each dropped segment and keeps the order of the rest', () => {
    const { kept, dropped } = run([
      { text: 'He built Dostava.', claimIds: ['c-dostava'] },
      { text: 'He is a good fit.', claimIds: ['c-python'] },
      { text: 'He uses Python.', claimIds: ['c-python'] },
    ]);
    expect(kept.map((s) => s.text)).toEqual([
      'He built Dostava.',
      'He uses Python.',
    ]);
    expect(dropped.map((d) => d.index)).toEqual([1]);
  });
});

describe('filterNotShown', () => {
  it('keeps only terms the visitor wrote', () => {
    expect(
      filterNotShown(
        ['Rust', 'Go', 'terraform'],
        'Does he know Rust and Terraform?',
      ),
    ).toEqual(['Rust', 'terraform']);
  });

  it('removes repeats and caps the list at six', () => {
    const asked = 'a1 b2 c3 d4 e5 f6 g7';
    expect(
      filterNotShown(['a1', 'A1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7'], asked),
    ).toEqual(['a1', 'b2', 'c3', 'd4', 'e5', 'f6']);
  });
});

describe('createCheckContext with the real ledger', () => {
  const ledger = ledgerJson as LedgerEntry[];
  const real = createCheckContext(ledger, 'Does he know Rust?');
  const first = ledger.find((c) => c.id === 'sprint-pp-status')!;

  it('keeps a sentence taken from a real claim', () => {
    const sentence = first.text.split(/(?<=\.)\s/)[0]!;
    const { kept } = checkDraft(
      [{ text: sentence, claimIds: [first.id] }],
      real,
    );
    expect(kept).toHaveLength(1);
  });

  it('does not mistake ordinary words for a project name', () => {
    const entities = real.entitiesIn(
      'He brings applied machine learning to a capstone and a proof of concept.',
    );
    expect(entities).toEqual([]);
    expect(
      real.entitiesIn(
        'He built the Applied Machine Learning Portfolio at DotPy.',
      ).length,
    ).toBeGreaterThan(0);
  });

  it('drops an invented technology next to a real claim', () => {
    const { kept } = checkDraft(
      [
        {
          text: 'It was served with Kubernetes at scale.',
          claimIds: [first.id],
        },
      ],
      real,
    );
    expect(kept).toEqual([]);
  });
});
