import { describe, expect, it } from 'vitest';

import { projects } from '@/data';
import { VERIFIED_TECH } from '@/data/verified-tech';

// Brief §9.3 / §6.3: every page project's core chips (`technologies[]` in
// `projects.ts`) must be a subset of its `VERIFIED_TECH` allowlist. Card and
// supporting tiers don't get a `/work` page, so they're out of scope here
// (some card projects still have a `VERIFIED_TECH` entry for the assistant's
// stack chips, which is fine, just not required).
const pageProjects = projects.filter((project) =>
  ['flagship', 'story', 'brief'].includes(project.detailLevel),
);

describe('VERIFIED_TECH allowlist', () => {
  it('has a non-empty entry for every flagship/story/brief project', () => {
    for (const project of pageProjects) {
      const entry = VERIFIED_TECH[project.slug];
      expect(
        entry,
        `${project.slug}: missing VERIFIED_TECH entry`,
      ).toBeDefined();
      expect(
        entry?.length ?? 0,
        `${project.slug}: VERIFIED_TECH entry must not be empty`,
      ).toBeGreaterThan(0);
    }
  });

  it('accepts every core technology chip in projects.ts as verified (chips are a subset)', () => {
    for (const project of pageProjects) {
      const verified = VERIFIED_TECH[project.slug] ?? [];
      for (const chip of project.technologies) {
        expect(
          verified.includes(chip),
          `${project.slug}: core chip "${chip}" is not in VERIFIED_TECH[${project.slug}]`,
        ).toBe(true);
      }
    }
  });
});
