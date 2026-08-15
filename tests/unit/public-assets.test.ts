import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { verifyPublicAssets } from '../../scripts/verify-public-assets';
import {
  createEncryptedPdf,
  createPdf,
  createTruncatedPdf,
} from './fixtures/pdf-fixtures';

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
    await writeFile(absolutePath, createPdf(2));
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
  it('accepts a structurally valid two-page PDF fixture', async () => {
    const publicDir = await createFixturePublicDirectory();

    await expect(verifyPublicAssets({ publicDir })).resolves.toMatchObject({
      resumePaths: requiredResumePaths,
      publicFileCount: 4,
    });
  });

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

  it('rejects a magic-only PDF fixture', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[0].split('/')),
      '%PDF-1.7\n%%EOF\n',
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /parse|valid/i,
    );
  });

  it('rejects a truncated PDF with a corrupt xref/trailer', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[0].split('/')),
      createTruncatedPdf(),
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /parse|valid/i,
    );
  });

  it('rejects a structurally valid one-page PDF', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[0].split('/')),
      createPdf(1),
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /two pages|2 pages/i,
    );
  });

  it('rejects a valid encrypted/password-protected PDF', async () => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(
      join(publicDir, ...requiredResumePaths[0].split('/')),
      createEncryptedPdf(),
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /encrypt|password/i,
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
    await writeFile(
      join(publicDir, 'resumes', 'extra-resume.pdf'),
      createPdf(2),
    );

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /unexpected.*extra-resume\.pdf/i,
    );
  });

  it('rejects unexpected nested files under the public resumes path', async () => {
    const publicDir = await createFixturePublicDirectory();
    const nestedDirectory = join(publicDir, 'resumes', 'archive');
    await mkdir(nestedDirectory, { recursive: true });
    await writeFile(join(nestedDirectory, 'old.pdf'), createPdf(2));

    await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
      /unexpected.*resumes[/\\]archive[/\\]old\.pdf/i,
    );
  });

  it.each([
    'candidate-master-cv.pdf',
    'candidate_master_cv.pdf',
    'candidate.master.cv.pdf',
    'candidate comprehensive notes.txt',
    'candidate-private-notes.txt',
    'candidate_raw-source.txt',
    'candidate.raw.data.txt',
    'candidate/raw-export.txt',
    'candidate-credential-export.json',
    'candidate_credentials.json',
    'candidate-service-account.json',
    'candidate-service_account.json',
    'android-signing.jks',
    'android-release.keystore',
    'android-key.pem',
  ])(
    'rejects prefixed, infix, or nested prohibited artifact %s',
    async (name) => {
      const publicDir = await createFixturePublicDirectory();
      const artifactPath = join(
        publicDir,
        'images',
        'projects',
        'nested',
        ...name.split('/'),
      );
      await mkdir(resolve(artifactPath, '..'), { recursive: true });
      await writeFile(artifactPath, 'public leak');
      const baseName = name.split('/').at(-1) ?? name;

      await expect(verifyPublicAssets({ publicDir })).rejects.toThrow(
        new RegExp(baseName.replace('.', '\\.'), 'i'),
      );
    },
  );

  it.each([
    '_headers',
    '_redirects',
    'masterpiece.png',
    'privateer.png',
    'rawdata.csv',
  ])('keeps safe token-boundary path %s allowed', async (name) => {
    const publicDir = await createFixturePublicDirectory();
    await writeFile(join(publicDir, name), 'safe public artifact');

    await expect(verifyPublicAssets({ publicDir })).resolves.toMatchObject({
      resumePaths: requiredResumePaths,
    });
  });
});
