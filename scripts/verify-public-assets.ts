import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

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
const PDF_SIGNATURE = Buffer.from('%PDF');
const prohibitedPublicPathPatterns = [
  /(?:^|[/\\])master(?:[-_. /\\]|$)/i,
  /comprehensive/i,
  /credential/i,
  /service[-_ ]?account/i,
  /password/i,
  /private[-_ ]?key/i,
  /(?:^|[/\\])private(?:[-_. /\\]|$)/i,
  /(?:^|[/\\])raw[-_ ]?(?:source|export|analytics|chat)/i,
  /(?:^|[/\\])\.env(?:\.|$)/i,
  /(?:^|[/\\])\.dev\.vars(?:\.|$)/i,
  /\.(?:jks|keystore|pem|p12|pfx|key)$/i,
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

    const [fileStat, signature] = await Promise.all([
      stat(absolutePath),
      readFile(absolutePath).then((content) => content.subarray(0, 4)),
    ]);
    if (fileStat.size >= MAX_RESUME_BYTES) {
      errors.push(`Public resume ${publicPath} must be smaller than 5 MiB.`);
    }
    if (!signature.equals(PDF_SIGNATURE)) {
      errors.push(
        `Public resume ${publicPath} must begin with the %PDF signature.`,
      );
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
