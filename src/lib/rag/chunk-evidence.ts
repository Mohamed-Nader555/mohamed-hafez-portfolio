import { evidence, projects, screeningFacts } from '@/data';
import {
  careerExperience,
  credentials,
  education,
  skillGroups,
  teachingPortfolio,
} from '@/data/career';
import { PROJECT_STATUS } from '@/data/project-status';
import type { EvidenceRecord, RoleId } from '@/types/content';
import {
  allResumeIds,
  allRoles,
  citationsFor,
  projectAliases,
} from './chunk-helpers';
import {
  architectureChunks,
  profileChunks,
  repositoryChunks,
  researchChunks,
} from './chunk-data';
import { chunkCaseStudyPages, type CaseStudyPage } from './chunk-pages';
import { overviewChunks } from './chunk-overview';
import type {
  KnowledgeCategory,
  KnowledgeChunk,
  KnowledgeEntity,
} from './types';
import { assistantVoice } from './voice';

// Longest/most-specific prefixes are listed first so a shared stem (e.g.
// "shop-on-the-go" vs a hypothetical "shop-on-the-go-team") never resolves
// to the wrong project. Every flagship/story/brief project id from
// `projects.ts` has an entry; card projects that also get grounding are
// included too.
const projectByEvidencePrefix: Record<string, string> = {
  'asc-pie': 'asc-pie',
  'sprint-pp': 'sprint-pp',
  northstar: 'northstar-rag',
  'minds-eye': 'minds-eye',
  dive: 'dive',
  dostava: 'dostava',
  'applied-ml-portfolio': 'applied-ml-portfolio',
  'cti-intrusion-detection': 'cti-intrusion-detection',
  'search-for-eats': 'search-for-eats',
  mercato: 'mercato',
  'food-planner': 'food-planner',
  'weather-checker': 'weather-checker',
  'shop-on-the-go': 'shop-on-the-go',
  'documentum-workflows': 'documentum-workflows',
  'pdf-utilities': 'pdf-utilities',
  'rest-pocs': 'rest-pocs',
  'this-portfolio': 'this-portfolio',
  'your-life-is-my-life': 'your-life-is-my-life',
  'death-ninja': 'death-ninja',
  'cloud-backend': 'cloud-backend',
  'restaurant-management': 'restaurant-management',
  'online-tic-tac-toe': 'online-tic-tac-toe',
  'gulf-arab-chat': 'gulf-arab-chat',
  'tourist-guide': 'tourist-guide',
  sams: 'sams',
  'donation-app': 'donation-app',
  'my-card': 'my-card',
  'top-notch': 'top-notch',
  'face-recognition-pipeline': 'face-recognition-pipeline',
  'healthcare-desktop': 'healthcare-desktop',
  'priority-request-manager': 'priority-request-manager',
  'school-management-system': 'school-management-system',
  'myapps-demo': 'myapps-demo',
};

function categoryFor(record: EvidenceRecord): KnowledgeCategory {
  if (record.id.startsWith('screening-')) return 'screening';
  if (record.id.startsWith('asc-pie') || record.id.startsWith('sprint-pp'))
    return 'research';
  if (record.id.startsWith('teaching')) return 'teaching';
  if (
    record.id.startsWith('experience') ||
    record.id.startsWith('bass') ||
    record.id.startsWith('documentum-workflows') ||
    record.id.startsWith('pdf-utilities') ||
    record.id.startsWith('rest-pocs') ||
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

export type KnowledgeBase = {
  chunks: KnowledgeChunk[];
  entities: KnowledgeEntity[];
};

/** Verified evidence, catalogue summaries and the career/teaching record. */
function evidenceChunks(): KnowledgeChunk[] {
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
  const summaries = projects.map((project) => {
    const status = project.status ? PROJECT_STATUS[project.status] : undefined;
    return {
      id: `project-${project.id}`,
      title: project.title,
      text: assistantVoice(
        `${project.hook} ${project.summary} ${project.ownership} Technologies: ${project.technologies.join(', ')}.${status ? ` Status: ${status.longer}` : ''}`,
      ),
      topics: [project.title, ...project.technologies],
      aliases: projectAliases(project),
      roles: [...project.roles],
      projectId: project.id,
      category: 'project' as const,
      citations: citationsFor(project.sourceIds),
    };
  });
  const screening = screeningFacts.map((fact) => ({
    id: `screening-summary-${fact.id}`,
    title: fact.label,
    text: fact.statement,
    topics: [...fact.topics],
    aliases: [...fact.aliases, fact.id],
    roles: allRoles,
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
    roles: allRoles,
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
    roles: allRoles,
    category: 'experience' as const,
    citations: citationsFor(allResumeIds),
  }));
  const credentialChunk = {
    id: 'credentials-and-training',
    title: 'Certificates and training',
    text: credentials.map(([title, meta]) => `${title}: ${meta}.`).join(' '),
    topics: ['certificates', 'training', 'CEH', 'AWS', 'Android'],
    aliases: credentials.flatMap(([title]) => [title]),
    roles: allRoles,
    category: 'skills' as const,
    citations: citationsFor(allResumeIds),
  };
  return [
    ...facts,
    ...summaries,
    ...screening,
    ...experienceChunks,
    ...skillChunks,
    ...teachingChunks,
    ...educationChunks,
    credentialChunk,
  ]
    .map((chunk) => ({ ...chunk, family: 'evidence' as const }))
    .filter((chunk) => chunk.citations.length > 0);
}

/**
 * Everything the assistant may answer from: evidence records, case-study
 * pages (when supplied), architecture, public repositories, the research
 * record, the profile, and generated overview and technology chunks.
 */
export function buildKnowledge(
  options: { pages?: readonly CaseStudyPage[] } = {},
): KnowledgeBase {
  const overview = overviewChunks();
  // Everything the assistant says about Mohamed is in the third person,
  // whatever voice the source copy was written in.
  const chunks = [
    ...evidenceChunks(),
    ...chunkCaseStudyPages(options.pages ?? []),
    ...architectureChunks(),
    ...repositoryChunks(),
    ...researchChunks(),
    ...profileChunks(),
    ...overview.chunks,
  ]
    .filter((chunk) => chunk.citations.length > 0)
    .map((chunk) => ({ ...chunk, text: assistantVoice(chunk.text) }));
  const ids = new Set<string>();
  for (const chunk of chunks) {
    if (ids.has(chunk.id)) throw new Error(`Duplicate chunk id: ${chunk.id}`);
    ids.add(chunk.id);
  }
  return { chunks, entities: overview.entities };
}

export const chunkEvidence = (
  options: { pages?: readonly CaseStudyPage[] } = {},
): KnowledgeChunk[] => buildKnowledge(options).chunks;
