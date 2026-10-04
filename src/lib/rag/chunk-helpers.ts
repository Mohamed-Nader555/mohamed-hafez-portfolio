import { projects, sources } from '@/data';
import type { Citation } from './types';
import type { ProjectRecord, RoleId } from '@/types/content';

const publicSources = sources.filter(
  (source) => source.isPublic && source.publicHref,
);
export const sourceById = new Map(
  publicSources.map((source) => [source.id, source]),
);

export function citationsFor(sourceIds: readonly string[]): Citation[] {
  return sourceIds.flatMap((id) => {
    const source = sourceById.get(id);
    return source?.publicHref
      ? [{ sourceId: id, label: source.label, href: source.publicHref }]
      : [];
  });
}

/** The public case-study source for a page (matched by its /work/<slug> href). */
export function pageCitations(slug: string): Citation[] {
  const source = publicSources.find(
    (candidate) => candidate.publicHref === `/work/${slug}`,
  );
  return source ? citationsFor([source.id]) : [];
}

export const allResumeIds = [
  'resume-aiml',
  'resume-software',
  'resume-android',
  'resume-teaching',
];
export const allRoles: RoleId[] = ['aiml', 'software', 'android', 'teaching'];

export const projectById = new Map(
  projects.map((project) => [project.id, project]),
);

// Short names a visitor might use. Everything else (id, slug, title, the part
// of the title before a colon) is derived.
const nicknames: Record<string, string[]> = {
  'asc-pie': ['asc pie', 'thesis', 'thesis project', 'pii corpus'],
  'sprint-pp': ['sprint pp', 'sprint', 'continual learning', 'cascon paper'],
  'northstar-rag': ['northstar', 'northstar rag', 'rag system', 'rag project'],
  'minds-eye': [
    'minds eye',
    'mind eye',
    'smart glasses',
    'glasses',
    'capstone',
    'esp32 glasses',
  ],
  dive: ['dive app', 'dive planner', 'diving app', 'dive simulation', 'diving'],
  dostava: ['dostava', 'delivery app', 'courier app'],
  'applied-ml-portfolio': [
    'applied ml',
    'applied machine learning',
    'dotpy projects',
  ],
  'cti-intrusion-detection': [
    'cti',
    'intrusion detection',
    'network intrusion',
    'ids pipeline',
  ],
  'search-for-eats': ['search for eats', 'restaurant finder'],
  mercato: ['mercato', 'star finder', 'football scouting'],
  'food-planner': ['healthy habit', 'food planner', 'meal planner'],
  'weather-checker': ['weather checker', 'weather way', 'weather app'],
  'shop-on-the-go': ['shop on the go', 'shopping app'],
  'documentum-workflows': ['documentum', 'documentum workflow', 'ecm'],
  'pdf-utilities': ['pdf utilities', 'pdf processing', 'pdf tools'],
  'rest-pocs': ['rest pocs', 'rest endpoints', 'proofs of concept'],
  'this-portfolio': [
    'this portfolio',
    'this site',
    'this website',
    'portfolio site',
    'portfolio website',
  ],
  'your-life-is-my-life': ['your life is my life', 'wellbeing app'],
  'death-ninja': ['death ninja', 'ninja game', 'ninja platformer'],
  'cloud-backend': ['cloudbackend', 'cloud backend', 'ecommerce api'],
  'restaurant-management': ['restaurant management', 'restaurant app'],
  'online-tic-tac-toe': ['tic tac toe', 'tic-tac-toe', 'tictactoe'],
  'gulf-arab-chat': ['gulf arab chat', 'gulf chat'],
  'tourist-guide': ['tourist guide'],
  sams: ['sams', 'student academic management'],
  'donation-app': ['donation app', 'donation management'],
  'my-card': ['my card', 'greeting cards'],
  'top-notch': ['top notch', 'recipe community'],
  'face-recognition-pipeline': [
    'face recognition pipeline',
    'face recognition',
  ],
  'healthcare-desktop': ['healthcare desktop', 'health monitoring app'],
  'priority-request-manager': ['priority request manager', 'priority manager'],
  'school-management-system': ['school management system', 'school system'],
  'myapps-demo': ['myapps', 'my apps', 'launcher demo'],
  'teaching-experience': ['teaching experience', 'technical instruction'],
};

export function projectAliases(project: ProjectRecord): string[] {
  const beforeColon = project.title.split(/[:(]/)[0]!.trim();
  return [
    ...new Set(
      [
        project.id,
        project.slug,
        project.title,
        beforeColon,
        ...(nicknames[project.id] ?? []),
      ].map((alias) => alias.trim()),
    ),
  ];
}

export const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
