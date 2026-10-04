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
const SECTION_VOCABULARY: {
  heading: string;
  requiredFor: readonly string[];
}[] = [
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
const projectBySlug = new Map(
  pageProjects.map((project) => [project.slug, project]),
);

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
        expect(
          SECTION_ORDER,
          `${entry.id}: unknown heading "${heading}"`,
        ).toContain(heading);
      }

      // Headings never reorder relative to the master vocabulary.
      const orderIndexes = headings.map((heading) =>
        SECTION_ORDER.indexOf(heading),
      );
      const sortedIndexes = [...orderIndexes].sort((a, b) => a - b);
      expect(orderIndexes, `${entry.id}: headings out of order`).toEqual(
        sortedIndexes,
      );

      // Required-for-tier headings are present.
      for (const section of SECTION_VOCABULARY) {
        if (section.requiredFor.includes(project.detailLevel)) {
          expect(
            headings,
            `${entry.id}: missing required "${section.heading}"`,
          ).toContain(section.heading);
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
      // Our stripper is a heuristic (it approximates rendered word count
      // from raw MDX source, including inline literal data like
      // SubProjectGrid's 11 entries), not a full MDX AST evaluator, so allow
      // 5% below the brief's minimum and a wider margin above its maximum.
      const min = Math.round(bounds.min * 0.95);
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
        registeredLinkSourceIds.every(
          (sourceId) => !suppressedSourceIds.has(sourceId),
        ),
        entry.id,
      ).toBe(true);
      expect(
        registeredLinkSourceIds,
        `${entry.id}: self-citation`,
      ).not.toContain(ownSourceId);

      // Every internal (relative) link must point at a real, known route
      // (another case study or the /work index); external links used in
      // prose must resolve to a registered public source.
      for (const link of collectLinks(entry.tree)) {
        if (link.href.startsWith('/')) {
          if (link.href.startsWith('/work/')) {
            const targetSlug = link.href
              .replace('/work/', '')
              .replace(/\/$/, '');
            expect(
              targetSlug === '' || projectBySlug.has(targetSlug),
              `${entry.id}: links to unknown project ${link.href}`,
            ).toBe(true);
          }
          continue;
        }

        const source = sourceByHref.get(link.href);
        expect(
          source,
          `${entry.id}: unregistered external link ${link.href}`,
        ).toBeDefined();
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

  // Parent brief §9.1 forbidden-wording regressions. The patterns live here, in
  // the test file only: public code and content must never carry them.
  describe('forbidden wording (brief §9.1)', () => {
    const BANK_NAMES = /Alinma|Banque\s+Saudi\s+Fransi|\bBSF\b/i;
    // Non-clinical wellbeing language only on Your Life Is My Life.
    const CLINICAL_TERMS =
      /\b(treatment|therapy|therapist|depress\w*|suicid\w*|patients?|diagnos\w*|medical|psychiatr\w*)\b/i;
    // The commercial app template Mercato was adapted from must stay unnamed.
    const MERCATO_TEMPLATE = /tic[\s-]?tic/i;
    const PAYMENT_CLAIMS = /payment\s+gateway|processes\s+payments?/i;

    async function pageTexts() {
      const entries = await loadCaseStudies();
      return new Map(entries.map((entry) => [entry.id, entry]));
    }

    function sentences(text: string) {
      return text.split(/(?<=[.!?])\s+/);
    }

    it('never names the banking clients in any case study', async () => {
      for (const entry of (await pageTexts()).values()) {
        expect(entry.raw, `${entry.id} names a bank`).not.toMatch(BANK_NAMES);
      }
    });

    it('never names the banking clients in catalogue data or sources', () => {
      const publicData = JSON.stringify({ projects, sources });
      expect(publicData).not.toMatch(BANK_NAMES);
    });

    it('keeps Your Life Is My Life in non-clinical wellbeing language', async () => {
      const entry = (await pageTexts()).get('your-life-is-my-life')!;
      expect(nodeText(entry.tree)).not.toMatch(CLINICAL_TERMS);
      expect(JSON.stringify(entry.data)).not.toMatch(CLINICAL_TERMS);
      const project = projectBySlug.get('your-life-is-my-life')!;
      expect(
        `${project.hook} ${project.summary} ${project.ownership}`,
      ).not.toMatch(CLINICAL_TERMS);
    });

    it('does not name the template Mercato was adapted from', async () => {
      const texts = await pageTexts();
      expect(texts.get('mercato')!.raw).not.toMatch(MERCATO_TEMPLATE);
      const project = projectBySlug.get('mercato')!;
      expect(
        `${project.hook} ${project.summary} ${project.ownership}`,
      ).not.toMatch(MERCATO_TEMPLATE);
      // And it is a football-talent platform, never a marketplace.
      expect(nodeText(texts.get('mercato')!.tree)).not.toMatch(/marketplace/i);
    });

    it('never describes Search for Eats as published on Google Play', async () => {
      const texts = await pageTexts();
      const searchForEats = nodeText(texts.get('search-for-eats')!.tree);
      // The one place Google Play is mentioned must negate it.
      for (const sentence of sentences(searchForEats)) {
        if (/google play/i.test(sentence)) {
          expect(sentence, sentence).toMatch(/\bnot\b/i);
        }
      }
      // Anywhere else, a sentence naming Search for Eats and Google Play
      // together must also negate it.
      for (const entry of texts.values()) {
        for (const sentence of sentences(nodeText(entry.tree))) {
          if (
            /search for eats/i.test(sentence) &&
            /google play/i.test(sentence)
          ) {
            expect(sentence, `${entry.id}: ${sentence}`).toMatch(/\bnot\b/i);
          }
        }
      }
      expect(projectBySlug.get('search-for-eats')!.status).toBe(
        'client-delivered',
      );
    });

    it('never claims My Card is a payment gateway or processes payments', async () => {
      const entry = (await pageTexts()).get('my-card')!;
      // The page may say there is no gateway behind its payment screen; it
      // must never say there is one.
      for (const sentence of sentences(nodeText(entry.tree))) {
        if (PAYMENT_CLAIMS.test(sentence)) {
          expect(sentence, sentence).toMatch(/\b(no|not|never|without)\b/i);
        }
      }
      const project = projectBySlug.get('my-card')!;
      expect(
        `${project.hook} ${project.summary} ${project.ownership}`,
      ).not.toMatch(PAYMENT_CLAIMS);
    });

    it('catches each forbidden pattern when it is present', () => {
      // Guards against a regex typo silently turning a check into a no-op.
      expect('Alinma Bank').toMatch(BANK_NAMES);
      expect('Banque Saudi Fransi').toMatch(BANK_NAMES);
      expect('therapy for depression').toMatch(CLINICAL_TERMS);
      expect('a TicTic style app').toMatch(MERCATO_TEMPLATE);
      expect('a payment gateway').toMatch(PAYMENT_CLAIMS);
      expect('it processes payments').toMatch(PAYMENT_CLAIMS);
    });
  });

  it('keeps natural project links where they add reader value', async () => {
    const entries = new Map(
      (await loadCaseStudies()).map((entry) => [entry.id, entry]),
    );

    expect(collectLinks(entries.get('asc-pie')!.tree).length).toBeGreaterThan(
      0,
    );
    // Dive's repository link is data-driven (repos table -> RepositoryLinks),
    // not a hand-written markdown link.
    expect(entries.get('dive')!.raw).toContain('<RepositoryLinks');
    expect(
      projectBySlug.get('dive')!.repos.map((repo) => repo.state),
    ).toContain('live');
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
