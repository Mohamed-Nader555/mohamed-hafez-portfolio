import { careerExperience, careerRoles, proofStats } from '@/data/career';
import { evidence, profile, projects, roles } from '@/data';
import { VERIFIED_TECH } from '@/data/verified-tech';
import type { ProjectGroup, ProjectRecord } from '@/types/content';
import {
  allRoles,
  citationsFor,
  pageCitations,
  projectAliases,
  slugify,
} from './chunk-helpers';
import { matchKey } from './normalize-query';
import type { KnowledgeChunk, KnowledgeEntity } from './types';
import { assistantVoice } from './voice';

export const GROUP_LABELS: Record<ProjectGroup | 'teaching', string> = {
  research: 'AI/ML research',
  ml: 'Applied ML and AI systems',
  android: 'Android apps',
  backend: 'Backend, enterprise and web',
  early: 'Early Java, desktop and C work',
  teaching: 'Teaching',
};
const GROUP_ORDER = ['research', 'ml', 'android', 'backend', 'early'] as const;

const groupOf = (project: ProjectRecord): ProjectGroup | 'teaching' =>
  project.group ?? 'teaching';
const hasPage = (project: ProjectRecord) =>
  ['flagship', 'story', 'brief'].includes(project.detailLevel);

// Parts of compound technology names that are too generic to name a technology
// on their own ("Google Maps / Location", "Coroutines/Flow").
const GENERIC_VARIANTS = new Set(['location', 'flow', 'colab']);

const baseName = (name: string) => name.replace(/\s*\([^)]*\)/g, '').trim();

function variantsOf(name: string): string[] {
  const parts = [...name.matchAll(/\(([^)]*)\)/g)].flatMap((match) =>
    match[1]!.split(/[/,]/),
  );
  const slashParts = baseName(name).split(/\s*\/\s*/);
  return [baseName(name), ...parts, ...slashParts]
    .map((part) => part.trim())
    .filter((part) => part && !GENERIC_VARIANTS.has(part.toLowerCase()));
}

type TechGroup = {
  key: string;
  display: string;
  names: Set<string>;
  terms: Set<string>;
  exactCase: Set<string>;
  projects: Map<string, Set<string>>;
};

function techGroups(): TechGroup[] {
  const groups = new Map<string, TechGroup>();
  for (const names of Object.values(VERIFIED_TECH))
    for (const name of names) {
      const key = matchKey(baseName(name));
      if (!groups.has(key))
        groups.set(key, {
          key,
          display: baseName(name),
          names: new Set(),
          terms: new Set(),
          exactCase: new Set(),
          projects: new Map(),
        });
    }
  for (const group of groups.values()) {
    for (const [slug, names] of Object.entries(VERIFIED_TECH)) {
      for (const name of names) {
        const base = matchKey(baseName(name));
        const belongs =
          base === group.key ||
          base.startsWith(`${group.key} `) ||
          variantsOf(name).some((variant) => matchKey(variant) === group.key);
        if (!belongs) continue;
        group.names.add(name);
        if (!group.projects.has(slug)) group.projects.set(slug, new Set());
        group.projects.get(slug)!.add(name);
      }
    }
    for (const name of group.names)
      for (const variant of [name, ...variantsOf(name)]) {
        // One-letter names ("C") would match any stray letter; they must
        // match as a capital in the original question.
        if (variant.length <= 1) group.exactCase.add(variant);
        else group.terms.add(matchKey(variant));
      }
    group.terms.add(group.key);
  }
  return [...groups.values()].filter((group) => group.projects.size > 0);
}

const findProject = (slug: string) =>
  projects.find((project) => project.slug === slug || project.id === slug);

export function overviewChunks(): {
  chunks: KnowledgeChunk[];
  entities: KnowledgeEntity[];
} {
  const chunks: KnowledgeChunk[] = [];
  const make = (
    chunk: Omit<KnowledgeChunk, 'family' | 'roles' | 'category'> &
      Partial<Pick<KnowledgeChunk, 'roles' | 'category'>>,
  ) =>
    chunks.push({
      roles: allRoles,
      category: 'skills',
      ...chunk,
      family: 'overview',
    });

  // Who he is.
  const evidenceText = (id: string) =>
    evidence.find((record) => record.id === id)?.statement ?? '';
  make({
    id: 'overview-who',
    title: 'Who Mohamed Hafez is',
    text: [
      `${profile.name} is a ${profile.location.split(',')[0]}-based engineer working across four focus areas: ${roles.map((role) => role.label).join(', ')}.`,
      evidenceText('asc-pie-degree-awarded'),
      evidenceText('asc-pie-thesis-title'),
      `${profile.availability}. ${profile.workAuthorization}. ${profile.sponsorship}.`,
      `Highlights: ${proofStats.map((stat) => `${stat.value} ${stat.label.toLowerCase()}`).join('; ')}.`,
    ]
      .filter(Boolean)
      .join(' '),
    topics: [
      'who is Mohamed',
      'about Mohamed',
      'background',
      'summary',
      'overview',
      'introduction',
      'strengths',
      'bio',
    ],
    aliases: [
      'who is mohamed',
      'tell me about mohamed',
      'about mohamed',
      'background',
      'summary',
      'overview',
      'strengths',
      'bio',
    ],
    citations: citationsFor([
      'public-about',
      'resume-aiml',
      'official-yorkspace',
      'public-availability',
    ]),
  });

  // Employers and roles.
  make({
    id: 'overview-employers',
    title: 'Where Mohamed has worked',
    text: `Roles and employers: ${careerExperience
      .map(
        (entry) => `${entry.title} at ${entry.organization} (${entry.period})`,
      )
      .join('; ')}.`,
    topics: [
      'employers',
      'worked for',
      'companies',
      'work history',
      'career',
      'experience',
      'jobs',
    ],
    aliases: [
      'who has he worked for',
      'employers',
      'work history',
      'career history',
      'work experience',
      'companies',
    ],
    category: 'experience',
    citations: citationsFor([
      'public-experience',
      'resume-software',
      'resume-aiml',
    ]),
  });

  // Project catalogue: titles by group, then hooks per group.
  const pageProjects = projects.filter(hasPage);
  const byGroup = (group: ProjectGroup | 'teaching') =>
    projects.filter((project) => groupOf(project) === group);
  make({
    id: 'overview-catalogue',
    title: 'Everything Mohamed has built',
    text: `${pageProjects.length} projects have full case studies. ${GROUP_ORDER.map(
      (group) =>
        `${GROUP_LABELS[group]}: ${byGroup(group)
          .filter(hasPage)
          .map((project) => project.title)
          .join(', ')}`,
    ).join(
      '. ',
    )}. Smaller projects and the teaching shelf are also listed on the work page: ${projects
      .filter((project) => !hasPage(project))
      .map((project) => project.title)
      .join(', ')}.`,
    topics: [
      'projects',
      'portfolio',
      'what has he built',
      'work',
      'apps',
      'catalogue',
      'all projects',
    ],
    aliases: [
      'what has he built',
      'all projects',
      'list projects',
      'projects',
      'portfolio',
      'what has he made',
    ],
    citations: citationsFor(['public-home', 'public-about']),
  });
  for (const group of [...GROUP_ORDER, 'teaching'] as const) {
    const members = byGroup(group);
    if (!members.length) continue;
    make({
      id: `overview-catalogue-${group}`,
      title: `${GROUP_LABELS[group]}: Mohamed's projects`,
      text: members
        .map((project) => `${project.title}: ${assistantVoice(project.hook)}`)
        .join(' '),
      topics: [GROUP_LABELS[group], 'projects', 'list', group],
      aliases: [GROUP_LABELS[group], group],
      roles: [...new Set(members.flatMap((project) => project.roles))],
      citations: [
        ...citationsFor(['public-home']),
        ...members
          .slice(0, 5)
          .flatMap((project) => pageCitations(project.slug)),
      ],
    });
  }

  // Per focus area.
  for (const role of roles) {
    const featured = role.featuredProjectIds
      .map((id) => projects.find((project) => project.id === id))
      .filter((project): project is ProjectRecord => Boolean(project));
    make({
      id: `overview-lens-${role.id}`,
      title: `${role.label}: how Mohamed fits`,
      text: `${role.summary} ${assistantVoice(careerRoles[role.id].summary)} Featured projects for this focus: ${featured
        .map((project) => `${project.title} (${assistantVoice(project.hook)})`)
        .join(' ')}`,
      topics: [role.label, 'focus area', 'fit', 'role', role.id, 'hire'],
      aliases: [role.label, role.id, `${role.label} role`],
      roles: [role.id],
      citations: [
        ...citationsFor([...role.sourceIds]),
        ...featured.flatMap((project) => pageCitations(project.slug)),
      ].slice(0, 6),
    });
  }

  // How to reach him: exactly the channels the Contact section shows.
  make({
    id: 'overview-contact',
    title: 'How to reach Mohamed',
    text: `Public contact channels: email ${profile.contacts.email}; phone ${profile.contacts.phone}; LinkedIn ${profile.contacts.linkedIn}; GitHub ${profile.contacts.github} (${profile.githubHandle}). There is no contact form or scheduler: contact is direct. ${profile.availability}, ${profile.location}.`,
    topics: [
      'contact',
      'reach',
      'email',
      'phone',
      'LinkedIn',
      'GitHub',
      'get in touch',
    ],
    aliases: [
      'contact',
      'how to reach',
      'email',
      'phone',
      'linkedin',
      'github',
      'get in touch',
    ],
    citations: citationsFor(['public-home', 'public-about', 'github-profile']),
  });

  // Technology index: one chunk per verified technology (grouped by base
  // name), naming the projects that use it.
  const entities: KnowledgeEntity[] = [];
  for (const group of techGroups()) {
    const slugs = [...group.projects.keys()];
    const id = `tech-${slugify(group.display)}`;
    const items = slugs.map((slug) => {
      const shown = [...group.projects.get(slug)!].filter(
        (name) => name !== group.display,
      );
      return `${findProject(slug)?.title ?? slug}${shown.length ? ` (as ${shown.join(', ')})` : ''}`;
    });
    // Card projects have no case-study page; they cite their own sources.
    const citations = slugs
      .flatMap((slug) => {
        const pages = pageCitations(slug);
        return pages.length
          ? pages
          : citationsFor(findProject(slug)?.sourceIds ?? []);
      })
      .filter(
        (citation, index, all) =>
          all.findIndex((other) => other.sourceId === citation.sourceId) ===
          index,
      )
      .slice(0, 6);
    if (!citations.length) continue;
    make({
      id,
      title: `Technology: ${group.display}`,
      text: `${group.display} appears in ${slugs.length} of Mohamed's published projects: ${items.join('; ')}.`,
      topics: [
        group.display,
        'technology',
        'tech stack',
        'which projects use',
        ...group.names,
      ],
      aliases: [group.display, ...group.names],
      roles: [
        ...new Set(
          slugs.flatMap((slug) => findProject(slug)?.roles ?? allRoles),
        ),
      ],
      citations,
    });
    entities.push({
      kind: 'tech',
      key: group.key,
      terms: [...group.terms],
      ...(group.exactCase.size ? { exactCase: [...group.exactCase] } : {}),
      chunkId: id,
      label: group.display,
    });
  }

  for (const project of projects)
    entities.push({
      kind: 'project',
      key: matchKey(project.title),
      terms: [
        ...new Set(projectAliases(project).map((alias) => matchKey(alias))),
      ],
      projectId: project.id,
      label: project.title,
    });
  return { chunks, entities };
}
