import { evidence, projects, screeningFacts, sources } from '@/data';
import type { EvidenceRecord, RoleId } from '@/types/content';
import type { KnowledgeCategory, KnowledgeChunk } from './types';

const sourceById = new Map(
  sources
    .filter((source) => source.isPublic && source.publicHref)
    .map((source) => [source.id, source]),
);
const projectByEvidencePrefix: Record<string, string> = {
  'asc-pie': 'asc-pie',
  northstar: 'northstar-rag',
  'minds-eye': 'minds-eye',
  dive: 'dive',
  dostava: 'dostava',
  bass: 'bass',
  mercato: 'mercato',
};

function categoryFor(record: EvidenceRecord): KnowledgeCategory {
  if (record.id.startsWith('screening-')) return 'screening';
  if (record.id.startsWith('asc-pie') || record.id.startsWith('sprint-pp'))
    return 'research';
  if (record.id.startsWith('teaching')) return 'teaching';
  if (
    record.id.startsWith('experience') ||
    record.id.startsWith('bass') ||
    record.id.startsWith('mercato')
  )
    return 'experience';
  return 'project';
}

function projectFor(record: EvidenceRecord): string | undefined {
  return Object.entries(projectByEvidencePrefix).find(([prefix]) =>
    record.id.startsWith(prefix),
  )?.[1];
}

function citationsFor(sourceIds: string[]) {
  return sourceIds.flatMap((id) => {
    const source = sourceById.get(id);
    return source?.publicHref
      ? [{ sourceId: id, label: source.label, href: source.publicHref }]
      : [];
  });
}

export function chunkEvidence(): KnowledgeChunk[] {
  const facts = evidence.map((record) => ({
    id: record.id,
    title: record.title,
    text: record.statement,
    topics: [...record.topics],
    aliases: [...record.aliases],
    roles: Object.entries(record.roleWeights)
      .filter(([, value]) => value > 0)
      .map(([role]) => role) as RoleId[],
    projectId: projectFor(record),
    category: categoryFor(record),
    citations: citationsFor(record.sourceIds),
  }));
  const summaries = projects.map((project) => ({
    id: `project-${project.id}`,
    title: project.title,
    text: `${project.summary} ${project.ownership} Technologies: ${project.technologies.join(', ')}.`,
    topics: [project.title, ...project.technologies],
    aliases: [project.id, project.slug, ...project.technologies],
    roles: [...project.roles],
    projectId: project.id,
    category: 'project' as const,
    citations: citationsFor(project.sourceIds),
  }));
  const screening = screeningFacts.map((fact) => ({
    id: `screening-summary-${fact.id}`,
    title: fact.label,
    text: fact.statement,
    topics: [...fact.topics],
    aliases: [...fact.aliases, fact.id],
    roles: ['aiml', 'software', 'android', 'teaching'] as RoleId[],
    category: 'screening' as const,
    citations: citationsFor(fact.sourceIds),
  }));
  return [...facts, ...summaries, ...screening].filter(
    (chunk) => chunk.citations.length > 0,
  );
}
