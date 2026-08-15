import { execFileSync } from 'node:child_process';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const contentDirectory = path.resolve('src/content/case-studies');
const expectedSlugs = [
  'asc-pie',
  'dive',
  'dostava',
  'minds-eye',
  'northstar-rag',
];
const expectedSections = [
  'Context',
  'Ownership',
  'Constraints',
  'Architecture',
  'Implementation',
  'Outcome',
  'Evidence',
  'Reflection',
];

describe('case-study content collection', () => {
  it('contains exactly the five launch case studies in the common sequence', async () => {
    const files = (await readdir(contentDirectory))
      .filter((file) => file.endsWith('.mdx'))
      .sort();

    expect(files).toEqual(expectedSlugs.map((slug) => `${slug}.mdx`).sort());

    for (const file of files) {
      const content = await readFile(path.join(contentDirectory, file), 'utf8');
      const sectionOffsets = expectedSections.map((section) =>
        content.indexOf(`## ${section}`),
      );

      expect(
        sectionOffsets.every((offset) => offset >= 0),
        file,
      ).toBe(true);
      expect(sectionOffsets, file).toEqual(
        [...sectionOffsets].sort((a, b) => a - b),
      );
    }
  });

  it('passes Astro content collection validation', () => {
    let output = '';

    expect(() => {
      output = execFileSync(
        process.execPath,
        [path.resolve('node_modules/astro/bin/astro.mjs'), 'check'],
        {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe',
        },
      );
    }).not.toThrow();
    expect(output).not.toMatch(/deprecated/i);
  }, 30_000);
});
