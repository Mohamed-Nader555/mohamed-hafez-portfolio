import { describe, expect, it } from 'vitest';
import {
  findNeverPhrases,
  findVerdictPhrases,
  numeralsIn,
} from '@/lib/rag/claim-checks';
import {
  buildSkillTiers,
  chooseBasis,
  missingOnSite,
  resolveHint,
  skillMentioned,
  typographic,
} from '@/lib/rag/claim-import';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { matchKey } from '@/lib/rag/normalize-query';

const cite = [{ sourceId: 's', label: 'S', href: '/work/x' }];
function claim(id: string, text: string, extra: Partial<LedgerEntry> = {}) {
  return {
    id,
    text,
    strength: 'direct',
    origin: 'site',
    citations: cite,
    category: 'project',
    ...extra,
  } satisfies LedgerEntry;
}

const ledger: LedgerEntry[] = [
  claim(
    'pii-schema',
    'ASC-PIE unifies a 19-type PII schema with a 333,109-example corpus.',
    { projectId: 'asc-pie', category: 'research' },
  ),
  claim(
    'pii-scoring',
    'ASC-PIE scores strict and normalized span-level F1 across encoder and decoder models.',
    { projectId: 'asc-pie', category: 'research' },
  ),
  claim('pii-unrelated', 'ASC-PIE was written in Toronto.', {
    projectId: 'asc-pie',
    category: 'research',
  }),
  claim('doc-workflows', 'Documentum workflows route banking documents.', {
    projectId: 'documentum-workflows',
    category: 'experience',
  }),
  claim('teach-ta', 'He has taught since 2019 as a teaching assistant.', {
    category: 'teaching',
  }),
  claim('note-claim', 'ASC-PIE unifies a 19-type PII schema in his notes.', {
    origin: 'notes',
    projectId: 'asc-pie',
  }),
];

describe('claim checks', () => {
  it('reads numbers written as digits and ignores digits inside names', () => {
    expect(
      numeralsIn(
        'A 19-type schema, 333,109 examples, 99.5%, F1 and IOB2 since 2019.',
      ),
    ).toEqual(['19', '333109', '99.5', '2019']);
  });

  it('finds a never-phrase unless a negation comes before it in the sentence', () => {
    expect(findNeverPhrases('He was a team lead.')).toEqual(['team lead']);
    expect(findNeverPhrases('He was never a team lead.')).toEqual([]);
    expect(findNeverPhrases('The site does not show PDF redaction.')).toEqual(
      [],
    );
    expect(findNeverPhrases('He did PDF redaction.')).toEqual([
      'pdf redaction',
    ]);
    expect(findNeverPhrases('No. He was a team lead.')).toEqual(['team lead']);
    expect(findNeverPhrases('He studied LoRaWAN radios.')).toEqual([]);
  });

  it('finds verdict phrases', () => {
    expect(findVerdictPhrases('He is a good fit for the role.')).toEqual([
      'good fit',
    ]);
    expect(findVerdictPhrases('His evidence covers the role.')).toEqual([]);
  });
});

describe('typographic', () => {
  it('uses the site’s apostrophe inside words', () => {
    expect(typographic("Mind's Eye and I'm sure it's his master's.")).toBe(
      'Mind’s Eye and I’m sure it’s his master’s.',
    );
  });
});

describe('resolveHint', () => {
  it('matches a project, a category or an id prefix, among site claims only', () => {
    expect(resolveHint('asc-pie', ledger).map((c) => c.id)).toEqual([
      'pii-schema',
      'pii-scoring',
      'pii-unrelated',
    ]);
    expect(resolveHint('teaching', ledger).map((c) => c.id)).toEqual([
      'teach-ta',
    ]);
    expect(resolveHint('pii', ledger).map((c) => c.id)).toEqual([
      'pii-schema',
      'pii-scoring',
      'pii-unrelated',
    ]);
    expect(resolveHint('nothing', ledger)).toEqual([]);
  });
});

describe('chooseBasis', () => {
  it('picks the claims that cover the statement, including every number', () => {
    const result = chooseBasis(
      'Information extraction is his specialism: a 19-type PII schema, a 333,109-example corpus and strict and normalized span-level F1.',
      ['asc-pie'],
      ledger,
    );
    expect(result).toEqual({ basisIds: ['pii-schema', 'pii-scoring'] });
  });

  it('never picks a claim that is not from the site', () => {
    const result = chooseBasis('A 19-type PII schema.', ['asc-pie'], ledger);
    expect('basisIds' in result && result.basisIds).not.toContain('note-claim');
  });

  it('holds a bridge back when no claim supports it', () => {
    const result = chooseBasis(
      'He built quantum compilers.',
      ['asc-pie'],
      ledger,
    );
    expect(result).toEqual({ heldBack: expect.stringMatching(/support/i) });
    expect(chooseBasis('Anything at all.', ['nothing'], ledger)).toEqual({
      heldBack: expect.stringMatching(/support/i),
    });
  });

  it('holds a bridge back when a number in it is in none of its basis claims', () => {
    const result = chooseBasis(
      'ASC-PIE unifies a 19-type PII schema over 4,000,000 examples.',
      ['asc-pie'],
      ledger,
    );
    expect(result).toEqual({ heldBack: expect.stringContaining('4000000') });
  });

  it('keeps between two and six claims', () => {
    const many = Array.from({ length: 10 }, (_, i) =>
      claim(
        `doc-${i}`,
        `Documentum workflow number${i} routes banking files.`,
        { projectId: 'documentum-workflows' },
      ),
    );
    const result = chooseBasis(
      'Documentum workflow routes banking files.',
      ['documentum-workflows'],
      many,
    );
    expect(
      'basisIds' in result && result.basisIds.length,
    ).toBeGreaterThanOrEqual(2);
    expect('basisIds' in result && result.basisIds.length).toBeLessThanOrEqual(
      6,
    );
  });
});

describe('skillMentioned', () => {
  const key = matchKey(
    'Built notebooks with Colab, pytest and C++ on Linux; Retrofit services.',
  );
  it('matches a name, a part of a slash name, and plurals', () => {
    expect(skillMentioned('Jupyter/Colab', key)).toBe(true);
    expect(skillMentioned('C/C++', key)).toBe(true);
    expect(skillMentioned('Retrofit/OkHttp', key)).toBe(true);
    expect(skillMentioned('notebook', key)).toBe(true);
  });
  it('does not match a one-letter part or a missing name', () => {
    expect(skillMentioned('C#', matchKey('Uses C and C++ only'))).toBe(false);
    expect(skillMentioned('Kubernetes', key)).toBe(false);
    expect(skillMentioned('C/C++', matchKey('A C compiler'))).toBe(false);
  });
});

describe('buildSkillTiers', () => {
  const skillLedger = [
    claim('stack-a', 'Built services in Python with pytest.'),
    claim('stack-b', 'Trained models with PyTorch.'),
  ];
  const result = buildSkillTiers(
    {
      languages: { core: ['Python', 'Kotlin'], exposure: ['Dart'] },
      testing: { working: ['pytest', 'Espresso'] },
    },
    skillLedger,
    [{ sourceId: 'resume-android', text: 'Kotlin, Espresso and Dart apps.' }],
  );

  it('keeps a skill that a site claim or a résumé mentions', () => {
    const core = result.groups.find((g) => g.id === 'skills-languages-core')!;
    expect(core.skills).toEqual(['Python', 'Kotlin']);
    expect(core.basisIds).toEqual(['stack-a']);
    expect(core.resumeSourceIds).toEqual(['resume-android']);
    const working = result.groups.find(
      (g) => g.id === 'skills-testing-working',
    )!;
    expect(working.skills).toEqual(['pytest', 'Espresso']);
  });

  it('keeps tiers apart and lists nothing it could not confirm', () => {
    expect(result.groups.map((g) => g.id)).toEqual([
      'skills-languages-core',
      'skills-languages-exposure',
      'skills-testing-working',
    ]);
    expect(result.heldBack).toEqual([]);
    const held = buildSkillTiers(
      { languages: { core: ['Python', 'Cobol'] } },
      skillLedger,
      [],
    );
    expect(held.heldBack).toEqual([
      { area: 'languages', tier: 'core', skill: 'Cobol' },
    ]);
    expect(held.groups[0]!.skills).toEqual(['Python']);
  });
});

describe('missingOnSite', () => {
  it('lists the phrases no site claim contains', () => {
    expect(
      missingOnSite(['19-type PII schema', 'taught since 2020'], ledger),
    ).toEqual(['taught since 2020']);
    expect(missingOnSite(['pii schema'], [ledger[5]!])).toEqual(['pii schema']);
  });

  it('reads "ML" as machine learning, "15+" as 15 and a hyphen as a space', () => {
    const site = [
      claim(
        'a',
        'Mohamed delivered more than ten applied machine-learning projects and 15+ workshops to 100+ attendees.',
      ),
    ];
    expect(
      missingOnSite(
        [
          'more than ten applied ML projects',
          '15 workshops',
          '100 attendees',
          '16 workshops',
        ],
        site,
      ),
    ).toEqual(['16 workshops']);
  });
});
