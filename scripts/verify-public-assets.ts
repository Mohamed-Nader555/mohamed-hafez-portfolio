import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const requiredResumePaths = [
  'resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
  'resumes/Mohamed-Hafez-Software-Engineer.pdf',
  'resumes/Mohamed-Hafez-Android-Developer.pdf',
  'resumes/Mohamed-Hafez-TA-Instructor.pdf',
] as const;

export interface PublicAssetVerificationOptions {
  publicDir: string;
}

export interface PublicAssetVerificationReport {
  resumePaths: readonly string[];
  publicFileCount: number;
}

const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const prohibitedPublicPathPatterns = [
  /(?:^|[-_.\s/])(?:master|comprehensive|private|credentials?|password)(?=$|[-_.\s/])/i,
  /(?:^|[-_.\s/])raw[-_.\s]+(?:source|data|export|analytics|chat)(?=$|[-_.\s/])/i,
  /(?:^|[-_.\s/])service[-_.\s]+account(?=$|[-_.\s/])/i,
  /(?:^|[/])\.env(?:$|[-_.\s/])/i,
  /(?:^|[/])\.dev\.vars(?:$|[-_.\s/])/i,
  /\.(?:jks|keystore|pem|p12|pfx|key|sig|asc)$/i,
] as const;

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const path = join(directory, entry.name);
      return entry.isDirectory() ? listFiles(path) : [path];
    }),
  );

  return nested.flat();
}

function toPublicPath(publicDir: string, absolutePath: string) {
  return relative(publicDir, absolutePath).split(sep).join('/');
}

async function validatePdf(absolutePath: string, publicPath: string) {
  const data = new Uint8Array(await readFile(absolutePath));
  let passwordRequired = false;
  const loadingTask = getDocument({ data, disableWorker: true });
  loadingTask.onPassword = () => {
    passwordRequired = true;
    throw new Error(`Encrypted PDF requires a password: ${publicPath}`);
  };

  try {
    const document = await loadingTask.promise;
    if (passwordRequired) {
      throw new Error(`Encrypted PDF is not allowed: ${publicPath}`);
    }
    if (document.numPages !== 2) {
      throw new Error(
        `Public resume ${publicPath} must contain exactly two pages (found ${document.numPages}).`,
      );
    }
  } catch (error: unknown) {
    if (passwordRequired) {
      throw new Error(`Encrypted PDF is not allowed: ${publicPath}`, {
        cause: error,
      });
    }
    if (
      error instanceof Error &&
      error.message.includes('must contain exactly two pages')
    ) {
      throw error;
    }
    throw new Error(
      `Public resume ${publicPath} could not be parsed as a valid PDF.`,
      {
        cause: error,
      },
    );
  } finally {
    await loadingTask.destroy();
  }
}

export async function verifyPublicAssets(
  options: PublicAssetVerificationOptions,
): Promise<PublicAssetVerificationReport> {
  const errors: string[] = [];
  const publicFiles = await listFiles(options.publicDir);
  const publicPaths = publicFiles.map((file) =>
    toPublicPath(options.publicDir, file),
  );

  for (const publicPath of publicPaths) {
    if (
      prohibitedPublicPathPatterns.some((pattern) => pattern.test(publicPath))
    ) {
      errors.push(`Prohibited public artifact: ${publicPath}`);
    }
  }

  const actualResumePaths = publicPaths
    .filter((publicPath) => publicPath.startsWith('resumes/'))
    .sort();
  const requiredResumeSet = new Set<string>(requiredResumePaths);

  for (const publicPath of actualResumePaths) {
    if (!requiredResumeSet.has(publicPath)) {
      errors.push(`Unexpected public resume: ${publicPath}`);
    }
  }

  for (const publicPath of requiredResumePaths) {
    const absolutePath = join(options.publicDir, ...publicPath.split('/'));
    if (!publicPaths.includes(publicPath)) {
      errors.push(`Missing required public resume: ${publicPath}`);
      continue;
    }

    const fileStat = await stat(absolutePath);
    if (fileStat.size >= MAX_RESUME_BYTES) {
      errors.push(`Public resume ${publicPath} must be smaller than 5 MiB.`);
    }
    if (fileStat.size < MAX_RESUME_BYTES) {
      try {
        await validatePdf(absolutePath, publicPath);
      } catch (error: unknown) {
        errors.push(error instanceof Error ? error.message : String(error));
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Public asset verification failed:\n- ${errors.join('\n- ')}`,
    );
  }

  return {
    resumePaths: [...requiredResumePaths],
    publicFileCount: publicFiles.length,
  };
}

const invokedScript = process.argv[1];
if (invokedScript && import.meta.url === pathToFileURL(invokedScript).href) {
  verifyPublicAssets({ publicDir: join(process.cwd(), 'public') })
    .then((report) => {
      process.stdout.write(
        `Verified ${report.resumePaths.length} resumes across ${report.publicFileCount} public files.\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
