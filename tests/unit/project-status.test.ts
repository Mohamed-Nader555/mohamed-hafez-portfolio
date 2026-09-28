import { describe, expect, it } from 'vitest';

import { projects } from '@/data';
import { PROJECT_STATUS, statusKeySchema } from '@/data/project-status';

// Brief §5.6 / §9.3: every flagship/story/brief/card project must carry a
// `status` key that resolves in `PROJECT_STATUS`, so `<StatusBadge>` and the
// case-study passport never render an unknown or missing status. The
// `supporting` tier (`teaching-experience`) has no `/work` page and no
// status badge, so it may omit the field.
const statusedProjects = projects.filter((project) =>
  ['flagship', 'story', 'brief', 'card'].includes(project.detailLevel),
);

describe('project status keys', () => {
  it('requires a valid status for every flagship/story/brief/card project', () => {
    for (const project of statusedProjects) {
      expect(project.status, `${project.slug}: missing status`).toBeDefined();
      expect(
        statusKeySchema.safeParse(project.status).success,
        `${project.slug}: "${project.status}" is not a valid status key`,
      ).toBe(true);
      expect(
        PROJECT_STATUS[project.status as keyof typeof PROJECT_STATUS],
        `${project.slug}: "${project.status}" has no PROJECT_STATUS definition`,
      ).toBeDefined();
    }
  });

  it('allows the supporting-tier teaching-experience record to omit status', () => {
    const teaching = projects.find(
      (project) => project.slug === 'teaching-experience',
    );
    expect(teaching).toBeDefined();
    expect(teaching?.detailLevel).toBe('supporting');
    expect(teaching?.status).toBeUndefined();
  });

  it('gives every PROJECT_STATUS badge and longer line non-empty text', () => {
    for (const [key, definition] of Object.entries(PROJECT_STATUS)) {
      expect(definition.badge.length, key).toBeGreaterThan(0);
      expect(definition.longer.length, key).toBeGreaterThan(0);
    }
  });
});
