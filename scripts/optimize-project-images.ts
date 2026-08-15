import { mkdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

import sharp from 'sharp';

const variants = [
  {
    argument: '--dive-map',
    project: 'dive',
    outputName: 'hospital-map',
  },
  {
    argument: '--dive-emergency',
    project: 'dive',
    outputName: 'emergency-actions',
  },
  {
    argument: '--dostava-restaurants',
    project: 'dostava',
    outputName: 'restaurant-list',
  },
  {
    argument: '--dostava-produce',
    project: 'dostava',
    outputName: 'produce-order',
  },
] as const;

const requestedWidths = [480, 768] as const;

function readArguments() {
  const parsed = new Map<string, string>();
  for (let index = 2; index < process.argv.length; index += 2) {
    const name = process.argv[index];
    const value = process.argv[index + 1];
    if (!name || !value || !name.startsWith('--')) {
      throw new Error(
        'Image arguments must be supplied as --name followed by a source file.',
      );
    }
    parsed.set(name, value);
  }
  return parsed;
}

async function optimizeImage(
  inputPath: string,
  project: string,
  outputName: string,
) {
  const image = sharp(inputPath, { failOn: 'warning' });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not determine dimensions for ${outputName}.`);
  }

  const outputDirectory = resolve('public', 'images', 'projects', project);
  await mkdir(outputDirectory, { recursive: true });
  const widths: number[] = requestedWidths.filter(
    (width) => width <= metadata.width!,
  );
  if (!widths.includes(metadata.width)) widths.push(metadata.width);

  for (const width of [...new Set(widths)].sort((a, b) => a - b)) {
    const base = join(outputDirectory, `${outputName}-${width}`);
    const resized = sharp(inputPath, { failOn: 'warning' }).resize({
      width,
      withoutEnlargement: true,
    });

    await Promise.all([
      resized
        .clone()
        .avif({ quality: width === metadata.width ? 72 : 66, effort: 6 })
        .toFile(`${base}.avif`),
      resized
        .clone()
        .webp({ quality: width === metadata.width ? 84 : 78, effort: 6 })
        .toFile(`${base}.webp`),
    ]);
  }

  return {
    outputName,
    sourceWidth: metadata.width,
    sourceHeight: metadata.height,
    widths: [...new Set(widths)].sort((a, b) => a - b),
  };
}

async function main() {
  const argumentsByName = readArguments();
  const missing = variants
    .filter((variant) => !argumentsByName.has(variant.argument))
    .map((variant) => variant.argument);
  if (missing.length > 0) {
    throw new Error(`Missing required image arguments: ${missing.join(', ')}`);
  }

  const results = [];
  for (const variant of variants) {
    results.push(
      await optimizeImage(
        argumentsByName.get(variant.argument)!,
        variant.project,
        variant.outputName,
      ),
    );
  }

  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

main().catch((error: unknown) => {
  process.stderr.write(
    `${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exitCode = 1;
});
