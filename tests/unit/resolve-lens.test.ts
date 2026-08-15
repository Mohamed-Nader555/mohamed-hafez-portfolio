import { describe, expect, it } from 'vitest';
import { projects, roles } from '@/data';
import { rankProjectsForRole, resolveLens } from '@/lib/content/resolve-lens';
import type { RoleLens } from '@/types/content';

const roleById = (roleId: RoleLens['id']) => {
  const role = roles.find((candidate) => candidate.id === roleId);

  if (!role) {
    throw new Error(`Missing test role: ${roleId}`);
  }

  return role;
};

describe('resolveLens', () => {
  it('ranks projects and selects the matching resume for every role', () => {
    expect(resolveLens('aiml').projects.map(({ id }) => id)).toEqual([
      'asc-pie',
      'northstar-rag',
      'minds-eye',
      'dive',
      'bass',
      'teaching-experience',
      'dostava',
      'mercato',
    ]);
    expect(resolveLens('software').resumeHref).toBe(
      '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
    );
    expect(resolveLens('android').projects[0].id).toBe('minds-eye');
    expect(resolveLens('teaching').resumeHref).toBe(
      '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    );
  });

  it('returns frozen arrays without mutating the canonical project order', () => {
    const canonicalOrder = projects.map(({ id }) => id);
    const resolved = resolveLens('software');

    expect(Object.isFrozen(resolved.projects)).toBe(true);
    expect(Object.isFrozen(resolved.evidence)).toBe(true);
    expect(projects.map(({ id }) => id)).toEqual(canonicalOrder);
  });
});

describe('rankProjectsForRole', () => {
  it('uses title order for equal-weight projects outside the featured list', () => {
    const byId = new Map(projects.map((project) => [project.id, project]));
    const role = { ...roleById('software'), featuredProjectIds: [] };
    const reversedUnfeatured = [
      byId.get('teaching-experience'),
      byId.get('minds-eye'),
      byId.get('mercato'),
    ].filter((project) => project !== undefined);

    expect(
      rankProjectsForRole(role, reversedUnfeatured).map(({ id }) => id),
    ).toEqual(['mercato', 'minds-eye', 'teaching-experience']);
  });

  it('rejects duplicate project ids in the configured catalog', () => {
    expect(() =>
      rankProjectsForRole(roleById('aiml'), [projects[0], projects[0]]),
    ).toThrow(/duplicate project id.*asc-pie/i);
  });

  it('rejects duplicate featured project ids', () => {
    const role = {
      ...roleById('aiml'),
      featuredProjectIds: ['asc-pie', 'asc-pie'],
    };

    expect(() => rankProjectsForRole(role, projects)).toThrow(
      /duplicate featured project id.*asc-pie/i,
    );
  });

  it('rejects featured project ids that are missing from the catalog', () => {
    const role = {
      ...roleById('aiml'),
      featuredProjectIds: ['asc-pie', 'missing-project'],
    };

    expect(() => rankProjectsForRole(role, projects)).toThrow(
      /missing featured project id.*missing-project/i,
    );
  });
});
