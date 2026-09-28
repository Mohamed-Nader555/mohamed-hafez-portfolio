import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { projects } from '@/data';
import { ALLOWED_NUMBERS } from '@/data/allowed-numbers';

// Brief §6.3 / §9.3: every project needs an (possibly empty) ALLOWED_NUMBERS
// entry so the allowlist is a complete, auditable record of what numbers may
// ever appear on its page. The one exception is the `supporting` tier
// (`teaching-experience`), which has no `/work` page and no stat tiles at
// all, mirroring the exception already granted in the project-status test.
const scopedProjects = projects.filter(
  (project) => project.detailLevel !== 'supporting',
);

describe('ALLOWED_NUMBERS allowlist', () => {
  it('defines an entry (possibly empty) for every non-supporting project', () => {
    for (const project of scopedProjects) {
      expect(
        Object.prototype.hasOwnProperty.call(ALLOWED_NUMBERS, project.slug),
        `${project.slug}: missing ALLOWED_NUMBERS entry`,
      ).toBe(true);
      expect(Array.isArray(ALLOWED_NUMBERS[project.slug])).toBe(true);
    }
  });

  it('has no duplicate slug keys in the source file', () => {
    // A JS object literal silently collapses duplicate keys at runtime, so
    // the only reliable way to catch a copy-paste duplicate is to check the
    // raw source text rather than the parsed `ALLOWED_NUMBERS` object.
    const sourcePath = path.resolve('src/data/allowed-numbers.ts');
    const source = readFileSync(sourcePath, 'utf8');
    const objectBody = source
      .slice(source.indexOf('= {') + 3, source.lastIndexOf('} as const'))
      .split('\n');

    const keys: string[] = [];
    const keyPattern = /^\s*(?:'([^']+)'|([A-Za-z0-9_]+)):\s*\[/;
    for (const line of objectBody) {
      const match = keyPattern.exec(line);
      if (match) keys.push(match[1] ?? match[2]);
    }

    expect(keys.length).toBeGreaterThan(0);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('keeps ALLOWED_NUMBERS keys matching real project slugs', () => {
    const slugs = new Set(projects.map((project) => project.slug));
    for (const key of Object.keys(ALLOWED_NUMBERS)) {
      expect(slugs.has(key), `${key}: not a known project slug`).toBe(true);
    }
  });
});
