import type { ProjectRepo, RepoState } from '@/types/content';

/**
 * Repository catalogue (parent brief D11).
 *
 * Every project's GitHub repositories live here as one compact table. Each repo
 * is `live` (public, linked) or `pending` (not linked anywhere until Mohamed
 * has cleaned it up). To publish a repo, change its `state` to `'live'`: the
 * project catalogue, the page header and Links section, and the public source
 * registry (`sources.ts`) all derive from this file, so that is the only edit.
 */
const REPO_OWNER = 'Mohamed-Nader555';

/**
 * Pending repos render nothing by default. When `true`, each project with a
 * pending repo shows a disabled "Code: coming soon" chip (never a link).
 */
export const SHOW_PENDING_REPOS = false;

export interface RepoEntry {
  name: string;
  state: RepoState;
  /** Existing public source id, kept stable for content that already cites it. */
  sourceId?: string;
  /** Existing public label, kept stable where the site already shows it. */
  label?: string;
}

const T = (name: string, state: RepoState, rest?: Partial<RepoEntry>) => ({
  name,
  state,
  ...rest,
});

// Owner: Mohamed-Nader555. `cti-network-intrusion-detection-` keeps its
// trailing hyphen: it is part of the real repository name.
export type RepoTable = Readonly<Record<string, readonly RepoEntry[]>>;

export const repoTable: RepoTable = {
  'asc-pie': [
    T('Thesis-Experiments', 'live', {
      sourceId: 'github-thesis-experiments',
      label: 'Thesis experiments repository',
    }),
    T('Anon-Datasets', 'pending', { sourceId: 'github-anon-datasets' }),
  ],
  'sprint-pp': [
    T('Thesis-Experiments', 'live', {
      sourceId: 'github-thesis-experiments',
      label: 'Thesis experiments repository',
    }),
  ],
  'northstar-rag': [
    T('northstar-rag-system', 'pending', {
      sourceId: 'github-northstar-rag-system',
    }),
  ],
  'minds-eye': [
    T('GP-Android', 'pending', { sourceId: 'github-gp-android' }),
    T('GP-Arduino', 'pending', { sourceId: 'github-gp-arduino' }),
    T('GP-All', 'pending', { sourceId: 'github-gp-all' }),
    T('GP-Zhaimer', 'pending'),
    T('ServerFaceRecTraining', 'pending'),
    T('ServerFaceRecTesting', 'pending'),
    T('Selected', 'pending'),
  ],
  dive: [
    T('Diving-Simulation-App', 'live', {
      sourceId: 'github-dive',
      label: 'Dive Simulation repository',
    }),
  ],
  dostava: [T('Dostava', 'pending', { sourceId: 'github-dostava' })],
  'cti-intrusion-detection': [T('cti-network-intrusion-detection-', 'pending')],
  'search-for-eats': [T('SearchforEats', 'pending')],
  mercato: [T('MercatoStarFinder', 'pending')],
  'food-planner': [T('Healty-Habit', 'pending')],
  'weather-checker': [T('Weather-Way', 'pending')],
  'shop-on-the-go': [
    T('GP-ItI', 'pending', { sourceId: 'github-shop-on-the-go-team' }),
    T('ShopOnTheGoIndividual', 'pending', {
      sourceId: 'github-shop-on-the-go-individual',
    }),
  ],
  'this-portfolio': [
    T('mohamed-hafez-portfolio', 'live', {
      sourceId: 'github-portfolio',
      label: 'This site’s repository',
    }),
  ],
  'your-life-is-my-life': [T('YourLifeisMyLife', 'pending')],
  'cloud-backend': [T('CloudBackend', 'pending')],
  'restaurant-management': [T('restaurant-java', 'pending')],
  'online-tic-tac-toe': [T('TicTacToeProject', 'pending')],
  'gulf-arab-chat': [T('Gulf-Arab-Chat', 'pending')],
  'tourist-guide': [T('Tourist-Guide', 'pending')],
  sams: [T('SAMS', 'pending')],
  'donation-app': [T('Donation', 'pending')],
  'my-card': [T('My-Card', 'pending')],
  'top-notch': [T('TopNotch', 'pending')],
  'face-recognition-pipeline': [T('ai-project-face-recognition', 'pending')],
  'healthcare-desktop': [T('HealthCare', 'pending')],
  'priority-request-manager': [T('Project-7-CO1923', 'pending')],
  'school-management-system': [T('School-Management-system', 'pending')],
  'myapps-demo': [T('MyAp-Demo', 'pending')],
};
// No repo: death-ninja, applied-ml-portfolio, documentum-workflows,
// pdf-utilities, rest-pocs (and the teaching-experience record).

function repoUrl(name: string): string {
  return `https://github.com/${REPO_OWNER}/${name}`;
}

/** `github-<kebab-name>`, unless the repo already has a registered id. */
export function repoSourceId(repo: { name: string; sourceId?: string }) {
  return (
    repo.sourceId ??
    `github-${repo.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')}`
  );
}

/** The `repos` field for one project in the catalogue. */
export function reposForProject(
  slug: string,
  table: RepoTable = repoTable,
): ProjectRepo[] {
  return (table[slug] ?? []).map(({ name, state }) => ({
    name,
    url: repoUrl(name),
    state,
  }));
}

/**
 * One source record per unique repository (Thesis-Experiments serves both
 * ASC-PIE and SPRINT-PP). Only `live` repos are public and carry an href.
 */
export function repoSourceRecords(table: RepoTable = repoTable) {
  const seen = new Map<string, RepoEntry>();
  for (const entries of Object.values(table)) {
    for (const entry of entries) {
      const key = repoSourceId(entry);
      const existing = seen.get(key);
      if (existing && existing.state !== entry.state) {
        throw new Error(
          `Repository ${entry.name} has conflicting states across projects.`,
        );
      }
      if (!existing) seen.set(key, entry);
    }
  }

  return [...seen.values()].map((entry) => {
    const live = entry.state === 'live';
    return {
      id: repoSourceId(entry),
      label:
        live && entry.label
          ? entry.label
          : `${entry.name} repository${live ? '' : ' (pending)'}`,
      kind: 'github' as const,
      ...(live ? { publicHref: repoUrl(entry.name) } : {}),
      isPublic: live,
    };
  });
}

export interface RepoDisplay {
  /** Live repos: real links, in catalogue order. */
  links: { label: string; href: string }[];
  /** True when a "Code: coming soon" chip should render (flag on, pending repo). */
  comingSoon: boolean;
}

/**
 * What a page may show for a project's repos. Pending repos never produce a
 * link or a URL: with the flag on they only turn on a disabled chip.
 */
export function resolveRepoDisplay(
  repos: readonly ProjectRepo[],
  showPending: boolean = SHOW_PENDING_REPOS,
): RepoDisplay {
  const live = repos.filter((repo) => repo.state === 'live');
  return {
    links: live.map((repo) => ({
      label: live.length > 1 ? `${repo.name} repository` : 'Repository',
      href: repo.url,
    })),
    comingSoon: showPending && repos.some((repo) => repo.state === 'pending'),
  };
}
