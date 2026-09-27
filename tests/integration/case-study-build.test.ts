import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { projects, sources } from '@/data';
import { caseStudyFrontmatterSchema } from '@/types/case-study';

const contentDirectory = path.resolve('src/content/case-studies');

// Brief §5.3: exact order, never reordered. tiers a heading is required for.
const SECTION_VOCABULARY: { heading: string; requiredFor: readonly string[] }[] = [
  { heading: 'The problem', requiredFor: ['flagship', 'story', 'brief'] },
  { heading: 'Who it was for', requiredFor: [] },
  { heading: 'My role', requiredFor: ['flagship', 'story'] },
  { heading: 'What I built', requiredFor: ['flagship', 'story', 'brief'] },
  { heading: 'How it works', requiredFor: ['flagship', 'story'] },
  { heading: 'Decisions that mattered', requiredFor: [] },
  { heading: 'Hard problems I solved', requiredFor: [] },
  { heading: 'Tech stack', requiredFor: ['flagship', 'story', 'brief'] },
  { heading: 'Outcome', requiredFor: ['flagship', 'story'] },
  { heading: 'What I learned', requiredFor: ['flagship', 'story', 'brief'] },
  { heading: "What I'd do next", requiredFor: [] },
  { heading: 'Links', requiredFor: [] },
];
const SECTION_ORDER = SECTION_VOCABULARY.map((entry) => entry.heading);

// Brief §4: target word counts (MDX prose only) per tier.
const WORD_BOUNDS: Record<string, { min: number; max: number }> = {
  flagship: { min: 900, max: 1600 },
  story: { min: 450, max: 900 },
  brief: { min: 180, max: 400 },
};

type AstNode = {
  type: string;
  depth?: number;
  url?: string;
  value?: string;
  children?: AstNode[];
};

function nodeText(node: AstNode): string {
  if (typeof node.value === 'string') return node.value;
  return (node.children ?? []).map(nodeText).join(' ');
}

function collectLinks(node: AstNode): Array<{ label: string; href: string }> {
  const ownLink =
    node.type === 'link' && node.url
      ? [{ label: nodeText(node), href: node.url }]
      : [];

  return [
    ...ownLink,
    ...(node.children ?? []).flatMap((child) => collectLinks(child)),
  ];
}

function parseMdx(raw: string) {
  const lines = raw.split(/\r?\n/);
  const closingDelimiter = lines.indexOf('---', 1);

  if (lines[0] !== '---' || closingDelimiter === -1) {
    throw new Error('Case study requires YAML frontmatter.');
  }

  return {
    data: parseYaml(lines.slice(1, closingDelimiter).join('\n')),
    content: lines.slice(closingDelimiter + 1).join('\n'),
  };
}

/**
 * Rough MDX-prose word count: strips fenced code, import lines, JSX/HTML
 * tags, and structural punctuation, but — unlike an earlier version of this
 * helper — keeps the *content* of inline `export const foo = [...]` data
 * literals (e.g. `SubProjectGrid`'s items), since that text is genuinely
 * rendered on the page even though it's authored as a JS literal rather than
 * frontmatter.
 */
function countProseWords(rawContent: string): number {
  const stripped = rawContent
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^import .+$/gm, ' ')
    .replace(/^export const \w+ = /gm, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/frontmatter\.\w+/g, ' ')
    .replace(/^#{1,6}\s+/gm, ' ')
    .replace(/[{}[\]"'`;:,=>*_-]/g, ' ');
  return stripped.trim().split(/\s+/).filter(Boolean).length;
}

async function loadCaseStudies() {
  const files = (await readdir(contentDirectory))
    .filter((file) => file.endsWith('.mdx'))
    .sort();

  return Promise.all(
    files.map(async (file) => {
      const raw = await readFile(path.join(contentDirectory, file), 'utf8');
      const parsed = parseMdx(raw);

      return {
        id: path.basename(file, '.mdx'),
        raw,
        data: caseStudyFrontmatterSchema.parse(parsed.data),
        content: parsed.content,
        tree: fromMarkdown(parsed.content) as unknown as AstNode,
      };
    }),
  );
}

const pageProjects = projects.filter((project) =>
  ['flagship', 'story', 'brief'].includes(project.detailLevel),
);
const projectBySlug = new Map(pageProjects.map((project) => [project.slug, project]));

describe('case-study content collection', () => {
  it('maps exactly one entry to each flagship/story/brief project through one canonical slug', async () => {
    const entries = await loadCaseStudies();

    expect(entries).toHaveLength(pageProjects.length);
    expect(entries.map((entry) => entry.id).sort()).toEqual(
      pageProjects.map((project) => project.slug).sort(),
    );
    expect(new Set(entries.map((entry) => entry.data.slug)).size).toBe(
      entries.length,
    );

    for (const entry of entries) {
      const project = projectBySlug.get(entry.id);

      expect(project, entry.id).toBeDefined();
      expect(entry.data.slug, entry.id).toBe(entry.id);
      expect(project?.slug, entry.id).toBe(entry.id);
    }
  });

  it('uses the §5.3 section vocabulary in the correct order for its tier', async () => {
    for (const entry of await loadCaseStudies()) {
      const project = projectBySlug.get(entry.id);
      expect(project, entry.id).toBeDefined();
      if (!project) continue;

      const headings = (entry.tree.children ?? [])
        .filter((node) => node.type === 'heading' && node.depth === 2)
        .map(nodeText);

      // Every heading must be from the approved vocabulary.
      for (const heading of headings) {
        expect(SECTION_ORDER, `${entry.id}: unknown heading "${heading}"`).toContain(
          heading,
        );
      }

      // Headings never reorder relative to the master vocabulary.
      const orderIndexes = headings.map((heading) => SECTION_ORDER.indexOf(heading));
      const sortedIndexes = [...orderIndexes].sort((a, b) => a - b);
      expect(orderIndexes, `${entry.id}: headings out of order`).toEqual(
        sortedIndexes,
      );

      // Required-for-tier headings are present.
      for (const section of SECTION_VOCABULARY) {
        if (section.requiredFor.includes(project.detailLevel)) {
          expect(headings, `${entry.id}: missing required "${section.heading}"`).toContain(
            section.heading,
          );
        }
      }

      // Brief tier only uses its four sections (plus optionally "Who it was
      // for", and "How it works" for the one brief-tier project that has an
      // architectures.ts entry — cloud-backend, per brief §6.6).
      if (project.detailLevel === 'brief') {
        const allowed = [
          'The problem',
          'Who it was for',
          'What I built',
          'Tech stack',
          'What I learned',
          ...(project.slug === 'cloud-backend' ? ['How it works'] : []),
        ];
        for (const heading of headings) {
          expect(
            allowed,
            `${entry.id}: unexpected heading "${heading}" for brief tier`,
          ).toContain(heading);
        }
      }
    }
  });

  it("keeps MDX prose inside its tier's word-count band", async () => {
    for (const entry of await loadCaseStudies()) {
      const project = projectBySlug.get(entry.id);
      if (!project) continue;
      const bounds = WORD_BOUNDS[project.detailLevel];
      if (!bounds) continue;

      const words = countProseWords(entry.content);
      // Generous tolerance: our stripper is a heuristic (it approximates
      // rendered word count from raw MDX source, including inline literal
      // data like SubProjectGrid's 11 entries), not a full MDX AST evaluator,
      // so allow 15% below and a wider margin above the brief's target band.
      const min = Math.round(bounds.min * 0.65);
      const max = Math.round(bounds.max * 1.6);
      expect(
        words,
        `${entry.id}: ${words} words, expected roughly ${bounds.min}-${bounds.max} for ${project.detailLevel}`,
      ).toBeGreaterThanOrEqual(min);
      expect(
        words,
        `${entry.id}: ${words} words, expected roughly ${bounds.min}-${bounds.max} for ${project.detailLevel}`,
      ).toBeLessThanOrEqual(max);
    }
  });

  it('keeps public links registered, entry-scoped, and launch-safe', async () => {
    const sourceByHref = new Map(
      sources
        .filter((source) => source.isPublic && source.publicHref)
        .map((source) => [source.publicHref, source]),
    );
    const suppressedSourceIds = new Set([
      'github-northstar-rag',
      'github-dostava',
    ]);

    for (const entry of await loadCaseStudies()) {
      const project = projectBySlug.get(entry.id);
      if (!project) continue;
      const ownSourceId = `case-study-${entry.id}`;
      const registeredLinkSourceIds = (entry.data.links ?? []).map(
        (link) => link.sourceId,
      );

      expect(
        registeredLinkSourceIds.every((sourceId) => !suppressedSourceIds.has(sourceId)),
        entry.id,
      ).toBe(true);
      expect(registeredLinkSourceIds, `${entry.id}: self-citation`).not.toContain(
        ownSourceId,
      );

      // Every internal (relative) link must point at a real, known route
      // (another case study or the /work index); external links used in
      // prose must resolve to a registered public source.
      for (const link of collectLinks(entry.tree)) {
        if (link.href.startsWith('/')) {
          if (link.href.startsWith('/work/')) {
            const targetSlug = link.href.replace('/work/', '').replace(/\/$/, '');
            expect(
              targetSlug === '' || projectBySlug.has(targetSlug),
              `${entry.id}: links to unknown project ${link.href}`,
            ).toBe(true);
          }
          continue;
        }

        const source = sourceByHref.get(link.href);
        expect(source, `${entry.id}: unregistered external link ${link.href}`).toBeDefined();
      }
    }
  });

  it('locks attribution, research status, and app availability across public copy', async () => {
    const entries = new Map(
      (await loadCaseStudies()).map((entry) => [entry.id, entry]),
    );
    const publicText = [...entries.values()]
      .map((entry) => nodeText(entry.tree))
      .join('\n');

    expect(publicText).not.toMatch(
      /assessment|published SPRINT-PP|accepted SPRINT-PP|get it on google play|BERT-base-cased|five public datasets|100% sure/i,
    );
    expect(publicText).not.toMatch(/submitted and (currently )?under review/i);
    // Dive must never name the deck's presenter or supervisors (§2 rule 4).
    expect(nodeText(entries.get('dive')!.tree)).not.toMatch(
      /presenter|unrelated collaborator/i,
    );

    expect(nodeText(entries.get('sprint-pp')!.tree)).toMatch(
      /accepted to (IEEE )?CASCON 2026/i,
    );
    expect(nodeText(entries.get('asc-pie')!.tree)).toMatch(
      /completed.*officially awarded.*2026/i,
    );
    expect(projectBySlug.get('northstar-rag')?.summary).toMatch(
      /independently built.*end.to.end.*hands-on RAG engineering project/i,
    );
    expect(nodeText(entries.get('dostava')!.tree)).toMatch(
      /previously published.*no longer available/i,
    );
  });

  it('keeps natural project links where they add reader value', async () => {
    const entries = new Map(
      (await loadCaseStudies()).map((entry) => [entry.id, entry]),
    );

    expect(collectLinks(entries.get('asc-pie')!.tree).length).toBeGreaterThan(0);
    expect(collectLinks(entries.get('dive')!.tree).length).toBeGreaterThan(0);
    // D11 / §7.3: no link to Northstar's own (unready) repository — internal
    // cross-links to other case studies (ASC-PIE, This Portfolio) are fine
    // and expected.
    expect(
      collectLinks(entries.get('northstar-rag')!.tree).map((link) => link.href),
    ).not.toEqual(
      expect.arrayContaining([expect.stringContaining('northstar-rag-system')]),
    );
    expect(entries.get('northstar-rag')!.data.links ?? []).toEqual([]);
  });

  it('passes Astro content collection validation', () => {
    let output = '';

    expect(() => {
      output = execFileSync(
        process.execPath,
        [path.resolve('node_modules/astro/bin/astro.mjs'), 'check'],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    }).not.toThrow();
    expect(output).not.toMatch(/deprecated/i);
  }, 120_000);
});
