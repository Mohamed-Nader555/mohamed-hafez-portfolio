import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyPublicAssets } from '../../scripts/verify-public-assets';

const requiredResumePaths = [
  'resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
  'resumes/Mohamed-Hafez-Software-Engineer.pdf',
  'resumes/Mohamed-Hafez-Android-Developer.pdf',
  'resumes/Mohamed-Hafez-TA-Instructor.pdf',
] as const;

const temporaryDirectories: string[] = [];

async function createFixturePublicDirectory() {
  const publicDir = await mkdtemp(join(tmpdir(), 'portfolio-public-assets-'));
  temporaryDirectories.push(publicDir);

  for (const relativePath of requiredResumePaths) {
    const absolutePath = join(publicDir, ...relativePath.split('/'));
    await mkdir(resolve(absolutePath, '..'), { recursive: true });
    await writeFile(absolutePath, '%PDF-1.7\n%%EOF\n');
  }

  return publicDir;
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories
      .splice(0)
      .map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

describe('public asset policy', () => {
  it('accepts exactly the four stable, valid, size-bounded public resumes', async () => {
    const report = await verifyPublicAssets({ publicDir: resolve('public') });

    expect(report.resumePaths).toEqual(requiredResumePaths);
    expect(report.resumePaths).toHaveLength(4);
  });

  it('rejects a missing required resume with its public path in the error', async () => {
    const publicDir = await createFixturePublicDirectory();
    await rm(join(publicDir, ...requiredResumePaths[2].split('/')));

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /missing.*Mohamed-Hafez-Android-Developer\.pdf/i,
    );
  });

  it('rejects a required resume that does not start with the PDF signature', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[0].split('/')),
      'not a pdf',
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /AI-ML-Engineer\.pdf.*%PDF/i,
    );
  });

  it('rejects a required resume at or above the five MiB public limit', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[1].split('/')),
      Buffer.concat([
        Buffer.from('%PDF-1.7\n'),
        Buffer.alloc(5 * 1024 * 1024, 0x20),
      ]),
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /Software-Engineer\.pdf.*5 MiB/i,
    );
  });

  it.each([
    'master-profile.pdf',
    'comprehensive-notes.txt',
    'android-release.jks',
    'android-release.keystore',
    'credential-export.json',
    'service-account.json',
  ])(
    'rejects prohibited public artifact %s anywhere under public',
    async (name) => {
      const publicDir = await createFixturePublicDirectory();
      const suspiciousDir = join(publicDir, 'images', 'projects', 'nested');
      await mkdir(suspiciousDir, { recursive: true });
      await writeFile(join(suspiciousDir, name), 'public leak');

      await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
        new RegExp(name.replace('.', '\\.'), 'i'),
      );
    },
  );

  it('rejects an unexpected fifth file in the public resumes directory', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(join(publicDir, 'resumes', 'extra-resume.pdf'), '%PDF-1.7');

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /unexpected.*extra-resume\.pdf/i,
    );
  });

  it('rejects unexpected nested files under the public resumes path', async () => {
    const publicDir = await createFixturePublicDirectory();
    const nestedDirectory = join(publicDir, 'resumes', 'archive');
    await mkdir(nestedDirectory, { recursive: true });
    await writeFile(join(nestedDirectory, 'old.pdf'), '%PDF-1.7');

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /unexpected.*resumes[/\\]archive[/\\]old\.pdf/i,
    );
  });
});
