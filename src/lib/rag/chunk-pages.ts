import { PROJECT_STATUS } from '@/data/project-status';
import type { CaseStudyFrontmatter } from '@/types/case-study';
import type { ProjectRecord, RoleId } from '@/types/content';
import {
  pageCitations,
  projectAliases,
  projectById,
  slugify,
} from './chunk-helpers';
import { extractMdxSections, splitLongText } from './mdx-text';
import type { KnowledgeCategory, KnowledgeChunk } from './types';
import { assistantVoice } from './voice';

export type CaseStudyPage = {
  slug: string;
  frontmatter: CaseStudyFrontmatter;
  /** MDX body without the frontmatter block. */
  body: string;
};

export function categoryForProject(project: ProjectRecord): KnowledgeCategory {
  if (project.group === 'research') return 'research';
  if (project.id === 'teaching-experience') return 'teaching';
  if (project.status === 'enterprise-bass') return 'experience';
  return 'project';
}

/**
 * One chunk per `##` section of each case-study body (long sections split at
 * paragraph breaks), plus chunks for the frontmatter lists that the page
 * renders as cards, tiles and tables.
 */
export function chunkCaseStudyPages(
  pages: readonly CaseStudyPage[],
): KnowledgeChunk[] {
  return pages.flatMap((page) => {
    const project = projectById.get(page.slug);
    if (!project) throw new Error(`No project for case study ${page.slug}`);
    const citations = pageCitations(page.slug);
    if (!citations.length)
      throw new Error(`Case study ${page.slug} has no public source.`);
    const aliases = projectAliases(project);
    const make = (
      id: string,
      heading: string,
      text: string,
      topics: string[] = [],
    ): KnowledgeChunk => ({
      id,
      title: `${project.title}: ${heading}`,
      text,
      topics: [project.title, heading, 'case study', ...topics],
      aliases,
      roles: [...project.roles] as RoleId[],
      projectId: project.id,
      category: categoryForProject(project),
      citations,
      family: 'page',
    });
    // Long text is split; every part is its own chunk with a numbered title.
    const split = (
      key: string,
      heading: string,
      text: string,
      topics?: string[],
    ) => {
      const parts = splitLongText(text);
      return parts.map((part, index) =>
        make(
          `${key}-${page.slug}${parts.length > 1 ? `-${index + 1}` : ''}`,
          parts.length > 1 ? `${heading} (part ${index + 1})` : heading,
          part,
          topics,
        ),
      );
    };
    const fm = page.frontmatter;
    const chunks: KnowledgeChunk[] = [];

    // Body sections.
    const used = new Map<string, number>();
    for (const section of extractMdxSections(page.body, fm)) {
      const heading = assistantVoice(section.heading ?? 'Overview');
      const base = slugify(heading) || 'overview';
      const count = (used.get(base) ?? 0) + 1;
      used.set(base, count);
      chunks.push(
        ...split(
          `page-${base}${count > 1 ? `-${count}` : ''}`,
          heading,
          assistantVoice(section.text),
        ),
      );
    }

    // Features, decisions and challenges.
    if (fm.features?.length)
      chunks.push(
        ...split(
          'features',
          'features',
          assistantVoice(
            fm.features
              .map((feature) => `${feature.title}: ${feature.detail}`)
              .join('\n\n'),
          ),
          ['features', ...fm.features.map((feature) => feature.title)],
        ),
      );
    if (fm.decisions?.length)
      chunks.push(
        ...split(
          'decisions',
          'design decisions',
          assistantVoice(
            fm.decisions
              .map(
                (decision) =>
                  `Chose ${decision.choice}${decision.over ? ` over ${decision.over}` : ''} because ${decision.because}.`,
              )
              .join('\n\n'),
          ),
          ['decisions', 'trade-offs'],
        ),
      );
    if (fm.challenges?.length)
      chunks.push(
        ...split(
          'challenges',
          'challenges and solutions',
          assistantVoice(
            fm.challenges
              .map(
                (challenge) =>
                  `Problem: ${challenge.problem} Solution: ${challenge.solution}`,
              )
              .join('\n\n'),
          ),
          ['challenges', 'problems', 'solutions'],
        ),
      );

    // Stack, key numbers, passport and status.
    chunks.push(
      make(
        `stack-${page.slug}`,
        'technology stack',
        fm.stack
          .map(
            (layer) =>
              `${layer.layer}: ${layer.items
                .map((item) =>
                  item.purpose ? `${item.name} (${item.purpose})` : item.name,
                )
                .join('; ')}.`,
          )
          .join(' '),
        [
          'stack',
          'technologies',
          'tech stack',
          ...fm.stack.flatMap((layer) => layer.items.map((item) => item.name)),
        ],
      ),
    );
    if (fm.stats?.length)
      chunks.push(
        make(
          `stats-${page.slug}`,
          'key numbers',
          `${fm.stats
            .map(
              (stat) =>
                `${stat.value} ${stat.label}${stat.note ? ` (${stat.note})` : ''}`,
            )
            .join('; ')}.`,
          ['numbers', 'results', 'metrics', 'statistics'],
        ),
      );
    const status = project.status ? PROJECT_STATUS[project.status] : undefined;
    chunks.push(
      make(
        `passport-${page.slug}`,
        'context and status',
        [
          `Context: ${fm.passport.context}.`,
          fm.passport.period ? `Period: ${fm.passport.period}.` : '',
          fm.passport.platform ? `Platform: ${fm.passport.platform}.` : '',
          status ? `Status: ${status.badge}. ${status.longer}` : '',
        ]
          .filter(Boolean)
          .join(' '),
        ['status', 'context', 'when', 'period', 'platform', 'published'],
      ),
    );
    if (fm.pipeline?.length)
      chunks.push(
        make(
          `pipeline-${page.slug}`,
          'pipeline',
          `Pipeline stages in order: ${fm.pipeline.join(' → ')}.`,
          ['pipeline', 'stages', 'flow'],
        ),
      );
    if (fm.screens?.length)
      chunks.push(
        make(
          `screens-${page.slug}`,
          'screens',
          assistantVoice(
            fm.screens
              .map(
                (screen) =>
                  `${screen.step ? `${screen.step}: ` : ''}${screen.caption}`,
              )
              .join(' '),
          ),
          ['screens', 'screenshots', 'interface', 'ui'],
        ),
      );
    return chunks;
  });
}
