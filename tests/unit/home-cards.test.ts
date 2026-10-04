import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { projects, roles } from '@/data';
import { ALLOWED_NUMBERS } from '@/data/allowed-numbers';
import { keyFactsBySlug } from '@/data/key-facts';
import { resolveLens } from '@/lib/content/resolve-lens';
import { splitFrontmatter } from '@/lib/rag/mdx-text';

// Every project that can appear on a home card: the ids each focus lists as
// featured, plus the projects the lens actually ranks into its four cards.
const homeIds = [
  ...new Set(
    roles.flatMap((role) => [
      ...role.featuredProjectIds,
      ...resolveLens(role.id)
        .projects.slice(0, 4)
        .map((project) => project.id),
    ]),
  ),
];
const byId = (id: string) => projects.find((project) => project.id === id)!;

const passport = (slug: string): string => {
  const { frontmatter } = splitFrontmatter(
    readFileSync(`src/content/case-studies/${slug}.mdx`, 'utf8'),
  );
  const parsed = YAML.parse(frontmatter).passport as {
    context: string;
    period?: string;
  };
  return `${parsed.context} ${parsed.period ?? ''}`;
};

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter(Boolean);

describe('home card data', () => {
  it('covers every featured project', () => {
    expect(homeIds.length).toBeGreaterThanOrEqual(11);
  });

  it.each(homeIds)('%s has a role line of 90 characters or fewer', (id) => {
    const project = byId(id);
    expect(project.roleLine, id).toBeTruthy();
    expect(project.roleLine!.length).toBeLessThanOrEqual(90);
  });

  it.each(homeIds)(
    '%s has a context line of 48 characters or fewer (when it has a page)',
    (id) => {
      const project = byId(id);
      if (project.detailLevel === 'supporting') {
        expect(project.contextLine).toBeUndefined();
        return;
      }
      expect(project.contextLine, id).toBeTruthy();
      expect(project.contextLine!.length).toBeLessThanOrEqual(48);
    },
  );

  it('derives each context line only from the page passport', () => {
    for (const id of homeIds) {
      const project = byId(id);
      if (!project.contextLine) continue;
      const allowed = new Set(words(passport(project.slug)));
      for (const word of words(project.contextLine)) {
        // "2023–24" abbreviates a year the passport spells out.
        if (/^\d{1,3}$/.test(word)) continue;
        expect(allowed.has(word), `${id}: "${word}"`).toBe(true);
      }
    }
  });

  it('derives each role line only from the ownership statement', () => {
    const filler = new Set(['and', 'the', 'from', 'with', 'for', 'to', 'of']);
    for (const id of homeIds) {
      const project = byId(id);
      const owned = new Set(words(project.ownership));
      for (const word of words(project.roleLine!)) {
        if (word.length < 4 || filler.has(word)) continue;
        expect(owned.has(word), `${id}: "${word}"`).toBe(true);
      }
    }
  });

  it('keeps the first person out of both lines', () => {
    for (const id of homeIds) {
      const { contextLine = '', roleLine = '' } = byId(id);
      expect(`${contextLine} ${roleLine}`).not.toMatch(/\b(I|my|me)\b/i);
    }
  });
});

describe('key facts', () => {
  it('shows only values on the project allowlist, at most three per card', () => {
    for (const [slug, facts] of Object.entries(keyFactsBySlug)) {
      expect(facts.length, slug).toBeLessThanOrEqual(3);
      for (const fact of facts)
        expect(ALLOWED_NUMBERS[slug], slug).toContain(fact.value);
    }
  });

  it('gives no facts row to a featured project without an allowlisted number', () => {
    for (const slug of [
      'documentum-workflows',
      'this-portfolio',
      'food-planner',
      'online-tic-tac-toe',
      'teaching-experience',
    ])
      expect(keyFactsBySlug[slug]).toBeUndefined();
  });
});
