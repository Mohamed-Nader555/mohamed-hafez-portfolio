import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { fromMarkdown } from 'mdast-util-from-markdown';
import { describe, expect, it } from 'vitest';
import { parse as parseYaml } from 'yaml';

import { projects, sources } from '@/data';
import { caseStudyFrontmatterSchema } from '@/types/case-study';

const contentDirectory = path.resolve('src/content/case-studies');
const expectedSections = [
  'Context',
  'Ownership',
  'Constraints',
  'Architecture',
  'Implementation',
  'Outcome',
  'Evidence',
  'Reflection',
];

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

function evidenceLinks(tree: AstNode) {
  const children = tree.children ?? [];
  const evidenceIndex = children.findIndex(
    (node) =>
      node.type === 'heading' &&
      node.depth === 2 &&
      nodeText(node) === 'Evidence',
  );
  const nextSectionIndex = children.findIndex(
    (node, index) =>
      index > evidenceIndex && node.type === 'heading' && node.depth === 2,
  );
  const end = nextSectionIndex === -1 ? children.length : nextSectionIndex;

  return children
    .slice(evidenceIndex + 1, end)
    .flatMap((node) => collectLinks(node));
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
        data: caseStudyFrontmatterSchema.parse(parsed.data),
        tree: fromMarkdown(parsed.content) as unknown as AstNode,
      };
    }),
  );
}

describe('case-study content collection', () => {
  it('maps exactly one entry to each detailed project through one canonical slug', async () => {
    const entries = await loadCaseStudies();
    const detailedProjects = projects.filter(
      (project) => project.detailLevel === 'detailed',
    );

    expect(entries).toHaveLength(5);
    expect(detailedProjects).toHaveLength(5);
    expect(entries.map((entry) => entry.id).sort()).toEqual(
      detailedProjects.map((project) => project.slug).sort(),
    );
    expect(new Set(entries.map((entry) => entry.data.slug)).size).toBe(
      entries.length,
    );

    for (const entry of entries) {
      const project = detailedProjects.find(
        (candidate) => candidate.slug === entry.id,
      );

      expect(project, entry.id).toBeDefined();
      expect(entry.data.slug, entry.id).toBe(entry.id);
      expect(project?.id, entry.id).toBe(entry.id);
      expect(project?.slug, entry.id).toBe(entry.id);
      expect([...entry.data.sourceIds].sort(), entry.id).toEqual(
        [...(project?.sourceIds ?? [])].sort(),
      );
    }
  });

  it('uses the eight actual level-two heading nodes in exact order', async () => {
    for (const entry of await loadCaseStudies()) {
      const headings = (entry.tree.children ?? [])
        .filter((node) => node.type === 'heading' && node.depth === 2)
        .map(nodeText);

      expect(headings, entry.id).toEqual(expectedSections);
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
      const entrySources = sources.filter((source) =>
        entry.data.sourceIds.includes(source.id),
      );
      const ownCaseStudySource = entrySources.find(
        (source) => source.kind === 'case-study',
      );
      const links = collectLinks(entry.tree);

      expect(
        entry.data.sourceIds.every(
          (sourceId) => !suppressedSourceIds.has(sourceId),
        ),
        entry.id,
      ).toBe(true);
      expect(
        links.map((link) => link.href),
        `${entry.id}: self-citation`,
      ).not.toContain(ownCaseStudySource?.publicHref);

      for (const link of links) {
        const source = sourceByHref.get(link.href);

        expect(source, `${entry.id}: ${link.href}`).toBeDefined();
        expect(entry.data.sourceIds, `${entry.id}: ${link.href}`).toContain(
          source?.id,
        );
      }
    }
  });

  it('locks attribution, research status, and app availability across public copy', async () => {
    const entries = new Map(
      (await loadCaseStudies()).map((entry) => [entry.id, entry]),
    );
    const publicText = [...entries.values()]
      .map((entry) =>
        [
          entry.data.title,
          entry.data.summary,
          entry.data.ownership,
          nodeText(entry.tree),
        ].join('\n'),
      )
      .join('\n');

    expect(publicText).not.toMatch(
      /assessment|presenter|collaborator|published SPRINT-PP|accepted SPRINT-PP|get it on google play/i,
    );
    expect(nodeText(entries.get('asc-pie')!.tree)).toMatch(
      /submitted and (currently )?under review/i,
    );
    expect(nodeText(entries.get('asc-pie')!.tree)).toMatch(
      /completed and (officially )?awarded.*2026/i,
    );
    expect(entries.get('northstar-rag')?.data.summary).toMatch(
      /independently built.*end-to-end.*hands-on RAG engineering project/i,
    );
    expect(entries.get('dive')?.data.ownership).toMatch(
      /Mohamed owned and implemented.*end to end/i,
    );
    expect(nodeText(entries.get('dostava')!.tree)).toMatch(
      /previously published.*no longer available/i,
    );
  });

  it('provides recruiter-verifiable links in every Evidence section', async () => {
    const entries = new Map(
      (await loadCaseStudies()).map((entry) => [entry.id, entry]),
    );

    for (const entry of entries.values()) {
      expect(evidenceLinks(entry.tree).length, entry.id).toBeGreaterThan(0);
    }

    expect(
      evidenceLinks(entries.get('minds-eye')!.tree).map((link) => link.label),
    ).toEqual(
      expect.arrayContaining([
        'AI/ML Engineer résumé',
        'Android Developer résumé',
      ]),
    );
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
  }, 60_000);
});
