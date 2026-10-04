import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { projects, sources } from '@/data';
import {
  repoSourceId,
  repoSourceRecords,
  repoTable,
  reposForProject,
  resolveRepoDisplay,
  SHOW_PENDING_REPOS,
  type RepoTable,
} from '@/data/repos';

const OWNER_URL = 'https://github.com/Mohamed-Nader555/';

// The follow-up brief's Task 5 mapping, verbatim: project -> [repo, state].
const live = 'live' as const;
const pending = 'pending' as const;
const EXPECTED: Record<string, [string, 'live' | 'pending'][]> = {
  'asc-pie': [
    ['Thesis-Experiments', live],
    ['Anon-Datasets', pending],
  ],
  'sprint-pp': [['Thesis-Experiments', live]],
  'northstar-rag': [['northstar-rag-system', pending]],
  'minds-eye': [
    ['GP-Android', pending],
    ['GP-Arduino', pending],
    ['GP-All', pending],
    ['GP-Zhaimer', pending],
    ['ServerFaceRecTraining', pending],
    ['ServerFaceRecTesting', pending],
    ['Selected', pending],
  ],
  dive: [['Diving-Simulation-App', live]],
  dostava: [['Dostava', pending]],
  'cti-intrusion-detection': [['cti-network-intrusion-detection-', pending]],
  'search-for-eats': [['SearchforEats', pending]],
  mercato: [['MercatoStarFinder', pending]],
  'food-planner': [['Healty-Habit', pending]],
  'weather-checker': [['Weather-Way', pending]],
  'shop-on-the-go': [
    ['GP-ItI', pending],
    ['ShopOnTheGoIndividual', pending],
  ],
  'this-portfolio': [['mohamed-hafez-portfolio', live]],
  'your-life-is-my-life': [['YourLifeisMyLife', pending]],
  'cloud-backend': [['CloudBackend', pending]],
  'restaurant-management': [['restaurant-java', pending]],
  'online-tic-tac-toe': [['TicTacToeProject', pending]],
  'gulf-arab-chat': [['Gulf-Arab-Chat', pending]],
  'tourist-guide': [['Tourist-Guide', pending]],
  sams: [['SAMS', pending]],
  'donation-app': [['Donation', pending]],
  'my-card': [['My-Card', pending]],
  'top-notch': [['TopNotch', pending]],
  'face-recognition-pipeline': [['ai-project-face-recognition', pending]],
  'healthcare-desktop': [['HealthCare', pending]],
  'priority-request-manager': [['Project-7-CO1923', pending]],
  'school-management-system': [['School-Management-system', pending]],
  'myapps-demo': [['MyAp-Demo', pending]],
};
const NO_REPO = [
  'death-ninja',
  'applied-ml-portfolio',
  'documentum-workflows',
  'pdf-utilities',
  'rest-pocs',
];

const allRepos = projects.flatMap((project) => project.repos);
const pendingRepos = allRepos.filter((repo) => repo.state === 'pending');

describe('project repos', () => {
  it('gives every project in the brief its repos with the right state', () => {
    for (const [slug, repos] of Object.entries(EXPECTED)) {
      const project = projects.find((candidate) => candidate.slug === slug);
      expect(project, slug).toBeDefined();
      expect(
        project?.repos.map((repo) => [repo.name, repo.state]),
        slug,
      ).toEqual(repos);
      for (const repo of project?.repos ?? []) {
        expect(repo.url).toBe(`${OWNER_URL}${repo.name}`);
      }
    }
  });

  it('keeps the trailing hyphen on the network-intrusion repo name', () => {
    const cti = projects.find((p) => p.slug === 'cti-intrusion-detection');
    expect(cti?.repos[0]?.name).toBe('cti-network-intrusion-detection-');
    expect(cti?.repos[0]?.url.endsWith('detection-')).toBe(true);
  });

  it('gives the projects with no repo an empty list', () => {
    for (const slug of NO_REPO) {
      expect(
        projects.find((project) => project.slug === slug)?.repos,
        slug,
      ).toEqual([]);
    }
    expect(
      projects.find((project) => project.slug === 'teaching-experience')?.repos,
    ).toEqual([]);
  });

  it('has exactly four live repos on four projects, everything else pending', () => {
    const liveProjects = projects
      .filter((project) => project.repos.some((repo) => repo.state === 'live'))
      .map((project) => project.slug)
      .sort();
    expect(liveProjects).toEqual(
      ['asc-pie', 'dive', 'sprint-pp', 'this-portfolio'].sort(),
    );
    expect(allRepos.filter((repo) => repo.state === 'live')).toHaveLength(4);
  });
});

describe('repo sources', () => {
  const githubSources = new Map(
    sources
      .filter((source) => source.kind === 'github')
      .map((source) => [source.id, source]),
  );

  it('registers exactly one source per repo, public only when live', () => {
    for (const project of projects) {
      for (const repo of project.repos) {
        const entry = repoTable[project.slug]?.find(
          (candidate) => candidate.name === repo.name,
        );
        const source = githubSources.get(repoSourceId(entry ?? repo));

        expect(source, `${project.slug}/${repo.name}`).toBeDefined();
        expect(source?.isPublic, `${repo.name} isPublic`).toBe(
          repo.state === 'live',
        );
        expect(source?.publicHref, `${repo.name} href`).toBe(
          repo.state === 'live' ? repo.url : undefined,
        );
      }
    }
  });

  it('has no duplicate source ids', () => {
    const ids = sources.map((source) => source.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('exposes no public repository link beyond the live repos and the profile', () => {
    const publicGithub = sources
      .filter((source) => source.kind === 'github' && source.isPublic)
      .map((source) => source.publicHref)
      .sort();
    expect(publicGithub).toEqual(
      [
        'https://github.com/Mohamed-Nader555',
        `${OWNER_URL}Diving-Simulation-App`,
        `${OWNER_URL}Thesis-Experiments`,
        `${OWNER_URL}mohamed-hafez-portfolio`,
      ].sort(),
    );
  });

  it('keeps Northstar and Mind’s Eye link-free while their repos are pending', () => {
    for (const slug of ['northstar-rag', 'minds-eye']) {
      const display = resolveRepoDisplay(
        projects.find((project) => project.slug === slug)?.repos ?? [],
        false,
      );
      expect(display.links).toEqual([]);
    }
  });
});

describe('pending repo rendering', () => {
  it('ships with the flag off', () => {
    expect(SHOW_PENDING_REPOS).toBe(false);
  });

  it('renders nothing for pending repos while the flag is off', () => {
    for (const project of projects) {
      const display = resolveRepoDisplay(project.repos, false);
      expect(display.comingSoon, project.slug).toBe(false);
      for (const link of display.links) {
        expect(
          pendingRepos.some((repo) => repo.url === link.href),
          `${project.slug} leaked a pending URL`,
        ).toBe(false);
      }
    }
  });

  it('shows only a disabled chip, never a URL, for pending repos when the flag is on', () => {
    const minds = projects.find((project) => project.slug === 'minds-eye');
    const display = resolveRepoDisplay(minds?.repos ?? [], true);
    expect(display.links).toEqual([]);
    expect(display.comingSoon).toBe(true);

    const asc = projects.find((project) => project.slug === 'asc-pie');
    const mixed = resolveRepoDisplay(asc?.repos ?? [], true);
    expect(mixed.links.map((link) => link.href)).toEqual([
      `${OWNER_URL}Thesis-Experiments`,
    ]);
    expect(mixed.comingSoon).toBe(true);
  });

  it('flipping one repo to live publishes its link and registers its source as public', () => {
    const flipped: RepoTable = {
      ...repoTable,
      dostava: [{ name: 'Dostava', state: 'live', sourceId: 'github-dostava' }],
    };

    const repos = reposForProject('dostava', flipped);
    expect(resolveRepoDisplay(repos, false).links).toEqual([
      { label: 'Repository', href: `${OWNER_URL}Dostava` },
    ]);

    const source = repoSourceRecords(flipped).find(
      (record) => record.id === 'github-dostava',
    );
    expect(source?.isPublic).toBe(true);
    expect(source).toMatchObject({ publicHref: `${OWNER_URL}Dostava` });
    // Unflipped, the same source stays private.
    expect(
      repoSourceRecords().find((record) => record.id === 'github-dostava')
        ?.isPublic,
    ).toBe(false);
  });

  it('labels several live repos by name so the links are distinguishable', () => {
    const display = resolveRepoDisplay(
      [
        { name: 'A', url: `${OWNER_URL}A`, state: 'live' },
        { name: 'B', url: `${OWNER_URL}B`, state: 'live' },
      ],
      false,
    );
    expect(display.links.map((link) => link.label)).toEqual([
      'A repository',
      'B repository',
    ]);
  });
});

function walk(directory: string, files: string[] = []): string[] {
  for (const entry of readdirSync(directory)) {
    const full = path.join(directory, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else files.push(full);
  }
  return files;
}

describe('pending repo URLs in the site', () => {
  const pendingUrls = [...new Set(pendingRepos.map((repo) => repo.url))];

  it('appear nowhere in hand-written source (only the repo table builds them)', () => {
    const files = walk(path.resolve('src')).filter(
      (file) =>
        /\.(astro|mdx?|tsx?|css)$/.test(file) &&
        !file.endsWith(path.join('data', 'repos.ts')),
    );
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      for (const url of pendingUrls) {
        expect(text.includes(url), `${file} contains ${url}`).toBe(false);
      }
    }
  });

  const distClient = path.resolve('dist/client');
  it.skipIf(!existsSync(distClient))(
    'appear nowhere in the built HTML while the flag is off',
    () => {
      const pages = walk(distClient).filter((file) => file.endsWith('.html'));
      expect(pages.length).toBeGreaterThan(30);
      for (const file of pages) {
        const html = readFileSync(file, 'utf8');
        for (const url of pendingUrls) {
          expect(html.includes(url), `${file} contains ${url}`).toBe(false);
        }
        expect(html).not.toContain('Code: coming soon');
      }
    },
  );

  it.skipIf(!existsSync(distClient))(
    'show the live repository links on their pages',
    () => {
      const expectations: [string, string][] = [
        ['work/asc-pie', `${OWNER_URL}Thesis-Experiments`],
        ['work/sprint-pp', `${OWNER_URL}Thesis-Experiments`],
        ['work/dive', `${OWNER_URL}Diving-Simulation-App`],
        ['work/this-portfolio', `${OWNER_URL}mohamed-hafez-portfolio`],
      ];
      for (const [route, url] of expectations) {
        const html = readFileSync(
          path.join(distClient, route, 'index.html'),
          'utf8',
        );
        expect(html, route).toContain(`href="${url}"`);
        expect(html, route).toMatch(/Repository(?:<!-- -->)? /);
      }
    },
  );
});
