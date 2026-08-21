import { evidence, projects, screeningFacts, sources } from '@/data';
import {
  careerExperience,
  credentials,
  education,
  skillGroups,
  teachingPortfolio,
} from '@/data/career';
import { projectArchive } from '@/data/project-archive';
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

const allResumeIds = [
  'resume-aiml',
  'resume-software',
  'resume-android',
  'resume-teaching',
];

function assistantVoice(text: string) {
  return text
    .replace(/\bI’m\b/g, 'Mohamed is')
    .replace(/\bI have\b/g, 'Mohamed has')
    .replace(/\bI\b/g, 'Mohamed')
    .replace(/\bmy\b/gi, 'his');
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
  const experienceChunks = careerExperience.map((entry) => ({
    id: `career-${entry.id}`,
    title: entry.title,
    text: assistantVoice(
      `${entry.period}. ${entry.organization}. ${entry.details.join(' ')}`,
    ),
    topics: [entry.title, entry.organization, 'experience'],
    aliases: [entry.id, ...entry.title.split(/\s+/)],
    roles: Object.entries(entry.weights)
      .filter(([, weight]) => weight > 0)
      .map(([role]) => role) as RoleId[],
    category: 'experience' as const,
    citations: citationsFor(allResumeIds),
  }));
  const skillChunks = skillGroups.map((group) => ({
    id: `skills-${group.id}`,
    title: group.label,
    text: `Mohamed’s ${group.label.toLowerCase()} experience includes ${group.skills}.`,
    topics: [group.label, ...group.skills.split(' · ')],
    aliases: [group.id, ...group.skills.split(' · ')],
    roles: ['aiml', 'software', 'android', 'teaching'] as RoleId[],
    category: 'skills' as const,
    citations: citationsFor(allResumeIds),
  }));
  const teachingChunks = teachingPortfolio.map((item, index) => ({
    id: `teaching-portfolio-${index + 1}`,
    title: item.title,
    text: assistantVoice(
      `${item.period}. ${item.organization}. ${item.detail}`,
    ),
    topics: [item.title, 'teaching', 'instruction'],
    aliases: [item.title, item.organization],
    roles: ['teaching', 'aiml', 'software'] as RoleId[],
    category: 'teaching' as const,
    citations: citationsFor(['resume-teaching']),
  }));
  const educationChunks = education.map((item, index) => ({
    id: `education-${index + 1}`,
    title: item.credential,
    text: `${item.period}. ${item.institution}. ${item.details.join(' ')}`,
    topics: [item.credential, item.institution, 'education'],
    aliases: [item.credential, item.institution],
    roles: ['aiml', 'software', 'android', 'teaching'] as RoleId[],
    category: 'experience' as const,
    citations: citationsFor(allResumeIds),
  }));
  const credentialChunk = {
    id: 'credentials-and-training',
    title: 'Certificates and training',
    text: credentials.map(([title, meta]) => `${title}: ${meta}.`).join(' '),
    topics: ['certificates', 'training', 'CEH', 'AWS', 'Android'],
    aliases: credentials.flatMap(([title]) => [title]),
    roles: ['aiml', 'software', 'android', 'teaching'] as RoleId[],
    category: 'skills' as const,
    citations: citationsFor(allResumeIds),
  };
  const archiveChunks = projectArchive.map((project, index) => ({
    id: `archive-project-${index + 1}`,
    title: project.title,
    text: `${project.summary} Technologies: ${project.technologies.join(', ')}.`,
    topics: [project.title, project.category, ...project.technologies],
    aliases: [project.title, ...project.technologies],
    roles: ['aiml', 'software', 'android', 'teaching'] as RoleId[],
    category: 'project' as const,
    citations: citationsFor(allResumeIds),
  }));
  return [
    ...facts,
    ...summaries,
    ...screening,
    ...experienceChunks,
    ...skillChunks,
    ...teachingChunks,
    ...educationChunks,
    credentialChunk,
    ...archiveChunks,
  ].filter((chunk) => chunk.citations.length > 0);
}
