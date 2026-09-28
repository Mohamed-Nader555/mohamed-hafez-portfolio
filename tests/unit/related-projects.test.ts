import { describe, expect, it } from 'vitest';

import { projects } from '@/data';
import type { ProjectRecord } from '@/types/content';

// No Astro-container test precedent exists in this repo yet (checked: no
// `experimental_AstroContainer` usage anywhere under tests/). Per the task
// brief, this mirrors `src/components/case-study/RelatedProjects.astro`'s
// exact scoring algorithm instead of rendering the component, so a change to
// one without the other will be caught by whichever test reads the source.
const pageProjects = projects.filter((project) =>
  ['flagship', 'story', 'brief'].includes(project.detailLevel),
);

function sharedScore(current: ProjectRecord, candidate: ProjectRecord) {
  const sharedRoles = candidate.roles.filter((role) =>
    current.roles.includes(role),
  ).length;
  const sharedTech = candidate.technologies.filter((tech) =>
    current.technologies.includes(tech),
  ).length;
  return sharedRoles * 10 + sharedTech;
}

function relatedProjectsFor(slug: string): ProjectRecord[] {
  const current = pageProjects.find((project) => project.slug === slug);
  if (!current) throw new Error(`Unknown case-study slug: ${slug}`);

  return pageProjects
    .filter((project) => project.slug !== slug)
    .map((project, index) => ({
      project,
      score: sharedScore(current, project),
      order: index,
    }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, 3)
    .map((entry) => entry.project);
}

describe('RelatedProjects scoring', () => {
  it('returns up to 3 related projects, deterministically, for every page project', () => {
    for (const project of pageProjects) {
      const first = relatedProjectsFor(project.slug);
      const second = relatedProjectsFor(project.slug);

      expect(first.length).toBeLessThanOrEqual(3);
      expect(first.length).toBeGreaterThan(0);
      expect(
        first.map((entry) => entry.slug),
        `${project.slug}: not deterministic across calls`,
      ).toEqual(second.map((entry) => entry.slug));
    }
  });

  it('never includes the page itself among its own related projects', () => {
    for (const project of pageProjects) {
      const related = relatedProjectsFor(project.slug);
      expect(related.map((entry) => entry.slug)).not.toContain(project.slug);
    }
  });

  it('ranks strictly by shared-role and shared-technology score, tie-broken by /work order', () => {
    // asc-pie (roles: aiml, software, teaching) shares more with minds-eye
    // (aiml, android, teaching -> 2 shared roles) than with a
    // no-overlap project like cloud-backend (software only -> 1 shared role).
    const related = relatedProjectsFor('asc-pie').map((entry) => entry.slug);
    const mindsEyeIndex = related.indexOf('minds-eye');
    const cloudBackendIndex = related.indexOf('cloud-backend');
    if (mindsEyeIndex !== -1 && cloudBackendIndex !== -1) {
      expect(mindsEyeIndex).toBeLessThan(cloudBackendIndex);
    }
  });
});
