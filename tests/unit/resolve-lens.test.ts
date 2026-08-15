import { describe, expect, it } from 'vitest';
import { projects, roles } from '@/data';
import { rankProjectsForRole, resolveLens } from '@/lib/content/resolve-lens';
import type { EvidenceRecord, ProjectRecord, RoleLens } from '@/types/content';

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

  it('returns detached deeply immutable project and evidence records', () => {
    const first = resolveLens('aiml');
    const project = first.projects[0] as ProjectRecord;
    const evidenceRecord = first.evidence.find(
      ({ id }) => id === 'asc-pie-thesis-title',
    ) as EvidenceRecord;
    const originalProject = {
      title: project.title,
      weight: project.roleWeights.aiml,
      roles: [...project.roles],
      technologies: [...project.technologies],
      sourceIds: [...project.sourceIds],
    };
    const originalEvidence = {
      title: evidenceRecord.title,
      statement: evidenceRecord.statement,
      weight: evidenceRecord.roleWeights.aiml,
      topics: [...evidenceRecord.topics],
      aliases: [...evidenceRecord.aliases],
      sourceIds: [...evidenceRecord.sourceIds],
    };

    try {
      Reflect.set(project, 'title', 'MUTATED PROJECT');
      Reflect.set(project.roleWeights, 'aiml', 0);
      for (const [items, value] of [
        [project.roles, 'android'],
        [project.technologies, 'MUTATED TECHNOLOGY'],
        [project.sourceIds, 'mutated-source'],
      ] as const) {
        try {
          (items as string[]).push(value);
        } catch {}
      }

      Reflect.set(evidenceRecord, 'title', 'MUTATED EVIDENCE TITLE');
      Reflect.set(evidenceRecord, 'statement', 'MUTATED EVIDENCE');
      Reflect.set(evidenceRecord.roleWeights, 'aiml', 0);
      for (const [items, value] of [
        [evidenceRecord.topics, 'MUTATED TOPIC'],
        [evidenceRecord.aliases, 'MUTATED ALIAS'],
        [evidenceRecord.sourceIds, 'mutated-source'],
      ] as const) {
        try {
          items.push(value);
        } catch {}
      }

      const second = resolveLens('aiml');
      const secondEvidence = second.evidence.find(
        ({ id }) => id === 'asc-pie-thesis-title',
      );

      expect(Object.isFrozen(project)).toBe(true);
      expect(Object.isFrozen(project.roleWeights)).toBe(true);
      expect(Object.isFrozen(project.roles)).toBe(true);
      expect(Object.isFrozen(project.technologies)).toBe(true);
      expect(Object.isFrozen(project.sourceIds)).toBe(true);
      expect(Object.isFrozen(evidenceRecord)).toBe(true);
      expect(Object.isFrozen(evidenceRecord.roleWeights)).toBe(true);
      expect(Object.isFrozen(evidenceRecord.topics)).toBe(true);
      expect(Object.isFrozen(evidenceRecord.aliases)).toBe(true);
      expect(Object.isFrozen(evidenceRecord.sourceIds)).toBe(true);
      expect(second.projects.map(({ id }) => id)).toEqual(
        first.projects.map(({ id }) => id),
      );
      expect(second.projects[0].title).toBe(originalProject.title);
      expect(second.projects[0].roleWeights.aiml).toBe(originalProject.weight);
      expect(second.projects[0].roles).toEqual(originalProject.roles);
      expect(second.projects[0].technologies).toEqual(
        originalProject.technologies,
      );
      expect(second.projects[0].sourceIds).toEqual(originalProject.sourceIds);
      expect(secondEvidence?.title).toBe(originalEvidence.title);
      expect(secondEvidence?.statement).toBe(originalEvidence.statement);
      expect(secondEvidence?.roleWeights.aiml).toBe(originalEvidence.weight);
      expect(secondEvidence?.topics).toEqual(originalEvidence.topics);
      expect(secondEvidence?.aliases).toEqual(originalEvidence.aliases);
      expect(secondEvidence?.sourceIds).toEqual(originalEvidence.sourceIds);
    } finally {
      if (!Object.isFrozen(project)) {
        project.title = originalProject.title;
      }
      if (!Object.isFrozen(project.roleWeights)) {
        project.roleWeights.aiml = originalProject.weight;
      }
      for (const [items, original] of [
        [project.roles, originalProject.roles],
        [project.technologies, originalProject.technologies],
        [project.sourceIds, originalProject.sourceIds],
      ] as const) {
        if (!Object.isFrozen(items)) {
          items.splice(0, items.length, ...original);
        }
      }
      if (!Object.isFrozen(evidenceRecord)) {
        evidenceRecord.title = originalEvidence.title;
        evidenceRecord.statement = originalEvidence.statement;
      }
      if (!Object.isFrozen(evidenceRecord.roleWeights)) {
        evidenceRecord.roleWeights.aiml = originalEvidence.weight;
      }
      for (const [items, original] of [
        [evidenceRecord.topics, originalEvidence.topics],
        [evidenceRecord.aliases, originalEvidence.aliases],
        [evidenceRecord.sourceIds, originalEvidence.sourceIds],
      ] as const) {
        if (!Object.isFrozen(items)) {
          items.splice(0, items.length, ...original);
        }
      }
    }
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
