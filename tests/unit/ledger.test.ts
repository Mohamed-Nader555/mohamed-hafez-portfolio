import { beforeAll, describe, expect, it } from 'vitest';
import {
  KNOWLEDGE_MAX_CHARS,
  ledgerFromChunks,
  mergeLedger,
  renderKnowledgeMarkdown,
  type LedgerEntry,
} from '@/lib/rag/ledger';
import type { KnowledgeChunk } from '@/lib/rag/types';
import { buildLedgerArtifacts } from '../../scripts/build-knowledge-index';
import { forbiddenHashesIn } from '../helpers/forbidden-terms';

const cite = [{ sourceId: 's1', label: 'Source', href: '/work/demo' }];

function entry(overrides: Partial<LedgerEntry> & { id: string }): LedgerEntry {
  return {
    text: `Claim ${overrides.id}.`,
    strength: 'direct',
    origin: 'site',
    citations: cite,
    category: 'project',
    ...overrides,
  };
}

function chunk(overrides: Partial<KnowledgeChunk> & { id: string }) {
  return {
    title: 'T',
    text: `Text of ${overrides.id}.`,
    topics: [],
    aliases: [],
    roles: [],
    category: 'project',
    citations: cite,
    family: 'evidence',
    ...overrides,
  } satisfies KnowledgeChunk;
}

const projects = [
  { id: 'alpha', title: 'Alpha' },
  { id: 'beta', title: 'Beta' },
];

describe('ledgerFromChunks', () => {
  it('turns evidence, page and data chunks into direct site claims and drops the overview family', () => {
    const ledger = ledgerFromChunks([
      chunk({ id: 'e1', family: 'evidence', projectId: 'alpha' }),
      chunk({ id: 'p1', family: 'page' }),
      chunk({ id: 'd1', family: 'data', category: 'research' }),
      chunk({ id: 'o1', family: 'overview' }),
    ]);
    expect(ledger.map((claim) => claim.id)).toEqual(['e1', 'p1', 'd1']);
    for (const claim of ledger) {
      expect(claim.strength).toBe('direct');
      expect(claim.origin).toBe('site');
      expect(claim.citations).toEqual(cite);
    }
    expect(ledger[0]).toMatchObject({
      projectId: 'alpha',
      category: 'project',
    });
    expect(ledger[2]!.category).toBe('research');
    expect(ledger[1]).not.toHaveProperty('projectId');
  });

  it('keeps the text on one line', () => {
    const [claim] = ledgerFromChunks([
      chunk({ id: 'x', text: 'Line one.\n\nLine   two.' }),
    ]);
    expect(claim!.text).toBe('Line one. Line two.');
  });
});

describe('mergeLedger', () => {
  it('appends extra claims and refuses a duplicate id', () => {
    const site = [entry({ id: 'a' })];
    const extra = [entry({ id: 'b', origin: 'notes' })];
    expect(mergeLedger(site, extra).map((claim) => claim.id)).toEqual([
      'a',
      'b',
    ]);
    expect(() => mergeLedger(site, [entry({ id: 'a' })])).toThrow(/duplicate/i);
  });

  it('refuses a claim with no public citation', () => {
    expect(() => mergeLedger([entry({ id: 'a', citations: [] })], [])).toThrow(
      /citation/i,
    );
  });
});

describe('renderKnowledgeMarkdown', () => {
  const claims: LedgerEntry[] = [
    entry({ id: 'ans-1', origin: 'own-words', category: 'experience' }),
    entry({ id: 'note-1', origin: 'notes', category: 'skills' }),
    entry({
      id: 'note-2',
      origin: 'notes',
      strength: 'related',
      category: 'skills',
    }),
    entry({ id: 'skill-1', category: 'skills' }),
    entry({ id: 'teach-1', category: 'teaching' }),
    entry({ id: 'res-1', category: 'research' }),
    entry({ id: 'beta-1', projectId: 'beta' }),
    entry({ id: 'alpha-1', projectId: 'alpha' }),
    entry({ id: 'alpha-2', projectId: 'alpha' }),
    entry({ id: 'misc-1' }),
    entry({ id: 'exp-1', category: 'experience' }),
    entry({ id: 'screen-1', category: 'screening' }),
  ];
  const render = () => renderKnowledgeMarkdown(claims, { projects });

  it('groups claims in the agreed order, with Mohamed’s notes and answers last', () => {
    const markdown = render();
    const order = [
      'screen-1',
      'exp-1',
      'alpha-1',
      'alpha-2',
      'beta-1',
      'misc-1',
      'res-1',
      'teach-1',
      'skill-1',
      'note-1',
      'ans-1',
    ].map((id) => markdown.indexOf(`[${id}]`));
    expect(order.every((position) => position >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
    const headings = markdown.match(/^#{1,3} .*$/gm)!;
    expect(headings).toEqual([
      expect.stringMatching(/^# /),
      '## Screening facts',
      '## Experience',
      '## Projects',
      '### Alpha',
      '### Beta',
      '### Other project facts',
      '## Research',
      '## Teaching',
      '## Skills',
      '## From Mohamed’s notes',
      '## Mohamed’s answers',
    ]);
  });

  it('starts every claim line with its id in brackets and marks related claims', () => {
    const lines = render()
      .split('\n')
      .filter((line) => line.startsWith('['));
    expect(lines).toHaveLength(claims.length);
    for (const claim of claims)
      expect(lines.some((line) => line.startsWith(`[${claim.id}] `))).toBe(
        true,
      );
    expect(lines.find((line) => line.startsWith('[note-2]'))).toContain(
      'related evidence only',
    );
    expect(lines.find((line) => line.startsWith('[note-1]'))).not.toContain(
      'related evidence only',
    );
  });

  it('is byte-identical for the same input, so the prompt prefix can be cached', () => {
    expect(render()).toBe(render());
    expect(render()).not.toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('fails when the file would be larger than the limit', () => {
    expect(KNOWLEDGE_MAX_CHARS).toBe(280_000);
    expect(() =>
      renderKnowledgeMarkdown(claims, { projects, maxChars: 200 }),
    ).toThrow(/limit/);
  });
});

describe('the built ledger and knowledge file', () => {
  let ledger: LedgerEntry[];
  let markdown: string;
  beforeAll(async () => {
    ({ ledger, markdown } = await buildLedgerArtifacts());
  });

  it('has a unique id and at least one public citation on every claim', () => {
    const ids = new Set<string>();
    for (const claim of ledger) {
      expect(ids.has(claim.id), claim.id).toBe(false);
      ids.add(claim.id);
      expect(claim.citations.length, claim.id).toBeGreaterThan(0);
      for (const citation of claim.citations)
        expect(citation.href, claim.id).toMatch(/^(\/|https:\/\/)/);
    }
    expect(ledger.length).toBeGreaterThan(400);
  });

  it('leaves out the overview family and keeps every other chunk as a direct site claim', () => {
    expect(ledger.some((claim) => claim.id.startsWith('overview-'))).toBe(
      false,
    );
    const site = ledger.filter((claim) => claim.origin === 'site');
    expect(site.length).toBeGreaterThan(500);
    expect(site.every((claim) => claim.strength === 'direct')).toBe(true);
  });

  it('adds Mohamed’s notes and answers after the site claims, each resting on site claims', () => {
    const origins = ledger.map((claim) => claim.origin);
    expect(origins.lastIndexOf('site')).toBeLessThan(origins.indexOf('notes'));
    const byId = new Map(ledger.map((claim) => [claim.id, claim]));
    const notes = ledger.filter((claim) => claim.origin === 'notes');
    expect(notes.filter((claim) => claim.id.startsWith('br-'))).toHaveLength(
      22,
    );
    expect(notes.some((claim) => claim.id.startsWith('skills-'))).toBe(true);
    for (const claim of notes) {
      expect(claim.basisIds?.length, claim.id).toBeGreaterThan(0);
      for (const id of claim.basisIds!)
        expect(byId.get(id)?.origin, `${claim.id} -> ${id}`).toBe('site');
    }
    const answers = ledger.filter((claim) => claim.origin === 'own-words');
    expect(answers.length).toBeGreaterThan(20);
    expect(ledger.find((claim) => claim.strength === 'related')?.origin).toBe(
      'notes',
    );
  });

  it('writes the same file every time and stays under the size limit', async () => {
    const again = await buildLedgerArtifacts();
    expect(again.markdown).toBe(markdown);
    expect(markdown.length).toBeLessThan(KNOWLEDGE_MAX_CHARS);
    for (const claim of ledger) expect(markdown).toContain(`[${claim.id}] `);
  });

  it('puts the screening facts first and names the current role in them', () => {
    const screening = markdown.slice(
      markdown.indexOf('## Screening facts'),
      markdown.indexOf('## Experience'),
    );
    expect(screening).toContain('Eklan');
    expect(screening).not.toMatch(/immediately available/i);
  });

  it('contains no forbidden term, and the site claims are in the third person', () => {
    expect(forbiddenHashesIn(markdown)).toEqual([]);
    // His own answers are first person by design and sit in their own section.
    const siteAndNotes = markdown.slice(
      0,
      markdown.indexOf('## Mohamed’s answers'),
    );
    expect(siteAndNotes).not.toMatch(/\bI (built|designed|developed)\b/);
    expect(markdown).toContain('## Mohamed’s answers');
  });
});
