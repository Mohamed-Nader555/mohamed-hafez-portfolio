import { aboutIntro } from '@/data/about';
import { architectures } from '@/data/architectures';
import { evidence, profile, projects } from '@/data';
import { repoSourceId, repoTable } from '@/data/repos';
import {
  corpusAblation,
  modelFamilies,
  paperLine,
  perTypeGains,
  promptingVersusFineTuning,
  researchQuestions,
  supervisor,
  thesisAbstract,
} from '@/data/research-asc-pie';
import {
  allRoles,
  citationsFor,
  pageCitations,
  projectAliases,
} from './chunk-helpers';
import { categoryForProject } from './chunk-pages';
import { splitLongText } from './mdx-text';
import type { KnowledgeChunk } from './types';
import { assistantVoice } from './voice';

const arrow = ' → ';

/** Architecture summary and component details, one chunk per project. */
export function architectureChunks(): KnowledgeChunk[] {
  return projects.flatMap((project) => {
    const architecture = architectures[project.id];
    const citations = pageCitations(project.slug);
    if (!architecture || !citations.length) return [];
    const label = new Map(
      architecture.nodes.map((node) => [node.id, node.label]),
    );
    const text = [
      architecture.summary,
      `Components: ${architecture.nodes
        .map((node) => `${node.label} (${node.detail})`)
        .join('; ')}.`,
      `Connections: ${architecture.edges
        .map(
          (edge) =>
            `${label.get(edge.from) ?? edge.from}${arrow}${label.get(edge.to) ?? edge.to}${edge.label ? ` [${edge.label}]` : ''}`,
        )
        .join('; ')}.`,
    ].join(' ');
    return splitLongText(assistantVoice(text), 200).map((part, index, all) => ({
      id: `architecture-${project.slug}${all.length > 1 ? `-${index + 1}` : ''}`,
      title: `${project.title}: architecture${all.length > 1 ? ` (part ${index + 1})` : ''}`,
      text: part,
      topics: [
        project.title,
        'architecture',
        'how it works',
        'system design',
        'components',
        ...architecture.nodes.map((node) => node.label),
      ],
      aliases: projectAliases(project),
      roles: [...project.roles],
      projectId: project.id,
      category: categoryForProject(project),
      citations,
      family: 'data' as const,
    }));
  });
}

/** Public repositories only; pending repositories are never named. */
export function repositoryChunks(): KnowledgeChunk[] {
  return projects.flatMap((project) => {
    const live = (repoTable[project.id] ?? []).filter(
      (repo) => repo.state === 'live',
    );
    const citations = citationsFor(live.map((repo) => repoSourceId(repo)));
    if (!live.length || !citations.length) return [];
    return [
      {
        id: `repos-${project.slug}`,
        title: `${project.title}: public repositories`,
        text: `Public code for ${project.title}: ${live
          .map(
            (repo) =>
              `${repo.name} (https://github.com/Mohamed-Nader555/${repo.name})`,
          )
          .join('; ')}.`,
        topics: [project.title, 'repository', 'source code', 'github', 'code'],
        aliases: projectAliases(project),
        roles: [...project.roles],
        projectId: project.id,
        category: categoryForProject(project),
        citations,
        family: 'data' as const,
      },
    ];
  });
}

const table = (columns: readonly string[], rows: readonly string[][]) =>
  rows
    .map((row) =>
      row.map((cell, index) => `${columns[index]}: ${cell}`).join(', '),
    )
    .join('; ');

/** The ASC-PIE research record, one chunk per topic. */
export function researchChunks(): KnowledgeChunk[] {
  const citations = citationsFor([
    'research-page-asc-pie',
    'official-yorkspace',
  ]);
  const make = (
    id: string,
    title: string,
    text: string,
    topics: string[],
  ): KnowledgeChunk => ({
    id: `research-${id}`,
    title: `ASC-PIE research: ${title}`,
    text,
    topics: ['ASC-PIE', 'research', 'thesis', title, ...topics],
    aliases: ['asc-pie', 'thesis', 'research record', 'sprint-pp'],
    roles: ['aiml', 'teaching', 'software'],
    projectId: 'asc-pie',
    category: 'research',
    citations,
    family: 'data',
  });
  const paper = make(
    'paper',
    'paper and supervision',
    `The paper "${paperLine.title}" has the status: ${paperLine.status}. The thesis was supervised by ${supervisor.name}, ${supervisor.lab}.`,
    ['paper', 'CASCON', 'supervisor', 'publication', 'accepted'],
  );
  const abstract = splitLongText(thesisAbstract).map((part, index, all) =>
    make(
      `abstract${all.length > 1 ? `-${index + 1}` : ''}`,
      'thesis abstract',
      part,
      ['abstract', 'summary', 'PII', 'named-entity recognition'],
    ),
  );
  const questions = researchQuestions.map((question) =>
    make(question.id, `${question.label} ${question.title}`, question.answer, [
      question.label,
      question.title,
      'research question',
      'findings',
    ]),
  );
  return [
    paper,
    ...abstract,
    ...questions,
    make(
      'prompting-vs-fine-tuning',
      'prompting versus fine-tuning',
      `${promptingVersusFineTuning.caption} ${table(
        promptingVersusFineTuning.columns,
        promptingVersusFineTuning.rows.map((row) => [...row]),
      )}.`,
      ['prompting', 'fine-tuning', 'Qwen', 'Llama', 'in-context learning'],
    ),
    make(
      'corpus-ablation',
      'public-only versus full corpus',
      `${corpusAblation.title}. ${corpusAblation.items
        .map(
          (item) =>
            `${item.label}: ${corpusAblation.groupLabels[0]} ${item.value}, ${corpusAblation.groupLabels[1]} ${item.groupValue}`,
        )
        .join('; ')}.`,
      ['corpus', 'ablation', 'synthetic data', 'RoBERTa-large'],
    ),
    make(
      'per-type-gains',
      'per-type gains',
      `${perTypeGains.caption} ${table(
        perTypeGains.columns,
        perTypeGains.rows.map((row) => [...row]),
      )}. ${perTypeGains.caveat}`,
      ['PII types', 'per-type', 'F1'],
    ),
    make(
      'model-families',
      'model families compared',
      `Strict F1 and output validity for the seven supervised models: ${modelFamilies
        .map(
          (model) =>
            `${model.label} F1 ${model.f1}%, validity ${model.validity}`,
        )
        .join('; ')}.`,
      ['models', 'RoBERTa', 'FLAN-T5', 'ModernBERT', 'BERT', 'Llama', 'Qwen'],
    ),
  ];
}

/** Profile and About page copy. */
export function profileChunks(): KnowledgeChunk[] {
  const degree = evidence.find(
    (record) => record.id === 'asc-pie-degree-awarded',
  );
  const make = (
    id: string,
    title: string,
    text: string,
    topics: string[],
    sourceIds: string[],
  ): KnowledgeChunk => ({
    id,
    title,
    text,
    topics: [title, ...topics],
    aliases: [id, ...topics],
    roles: allRoles,
    category: 'screening',
    citations: citationsFor(sourceIds),
    family: 'data',
  });
  return [
    make(
      'about-introduction',
      'About Mohamed Hafez',
      `${assistantVoice(aboutIntro.summary)}${degree ? ` ${degree.statement}` : ''}`,
      ['about', 'introduction', 'background', 'bio', 'engineer'],
      ['public-about', 'resume-aiml'],
    ),
    make(
      'profile-practical-details',
      'Practical details',
      `Location: ${profile.location}. ${profile.availability}. ${profile.workAuthorization}. ${profile.sponsorship}. Open to ${profile.workPreferences.arrangements.join(', ')} work in ${profile.workPreferences.geography}. ${profile.workPreferences.relocation}. Target level: ${profile.targetLevel}. Full-time: ${profile.employmentPreference.fullTime}; contract: ${profile.employmentPreference.contract}.`,
      ['availability', 'work authorization', 'location', 'relocation', 'level'],
      ['public-availability', 'public-about'],
    ),
  ];
}
