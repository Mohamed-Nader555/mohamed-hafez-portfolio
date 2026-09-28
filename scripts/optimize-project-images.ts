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
  // Dive: Check -> Recommend media plan (brief §5.7)
  {
    argument: '--dive-home',
    project: 'dive',
    outputName: 'home',
  },
  {
    argument: '--dive-login',
    project: 'dive',
    outputName: 'login',
  },
  {
    argument: '--dive-weather',
    project: 'dive',
    outputName: 'weather',
  },
  {
    argument: '--dive-mod',
    project: 'dive',
    outputName: 'mod-calculator',
  },
  {
    argument: '--dive-erdpml-pressure',
    project: 'dive',
    outputName: 'erdpml-pressure',
  },
  {
    argument: '--dive-erdpml-warning',
    project: 'dive',
    outputName: 'erdpml-warning',
  },
  {
    argument: '--dive-sim-input',
    project: 'dive',
    outputName: 'sim-input',
  },
  {
    argument: '--dive-safe',
    project: 'dive',
    outputName: 'safe-result',
  },
  {
    argument: '--dive-unsafe',
    project: 'dive',
    outputName: 'unsafe-result',
  },
  {
    argument: '--dive-safer-plan',
    project: 'dive',
    outputName: 'safer-plan',
  },
  // Mind's Eye
  {
    argument: '--minds-eye-login',
    project: 'minds-eye',
    outputName: 'login',
  },
  {
    argument: '--minds-eye-home',
    project: 'minds-eye',
    outputName: 'home',
  },
  {
    argument: '--minds-eye-vi-menu',
    project: 'minds-eye',
    outputName: 'vi-menu',
  },
  {
    argument: '--minds-eye-face-start',
    project: 'minds-eye',
    outputName: 'face-start',
  },
  {
    argument: '--minds-eye-select-action',
    project: 'minds-eye',
    outputName: 'select-action',
  },
  // Dostava: additional screens
  {
    argument: '--dostava-category-menu',
    project: 'dostava',
    outputName: 'category-menu',
  },
  {
    argument: '--dostava-supermarket',
    project: 'dostava',
    outputName: 'supermarket-order',
  },
  {
    argument: '--dostava-meat',
    project: 'dostava',
    outputName: 'meat-order',
  },
  {
    argument: '--dostava-splash',
    project: 'dostava',
    outputName: 'splash',
  },
  {
    argument: '--dostava-order-status',
    project: 'dostava',
    outputName: 'order-status',
  },
  // The Death Ninja (landscape)
  {
    argument: '--death-ninja-menu',
    project: 'death-ninja',
    outputName: 'menu',
  },
  {
    argument: '--death-ninja-level-1',
    project: 'death-ninja',
    outputName: 'level-1',
  },
  {
    argument: '--death-ninja-level-2',
    project: 'death-ninja',
    outputName: 'level-2',
  },
  {
    argument: '--death-ninja-boss',
    project: 'death-ninja',
    outputName: 'boss',
  },
  {
    argument: '--death-ninja-options',
    project: 'death-ninja',
    outputName: 'options',
  },
  {
    argument: '--death-ninja-win',
    project: 'death-ninja',
    outputName: 'win',
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
  const requestedVariants = variants.filter((variant) =>
    argumentsByName.has(variant.argument),
  );
  if (requestedVariants.length === 0) {
    const known = variants.map((variant) => variant.argument).join(', ');
    throw new Error(
      `No recognized image arguments supplied. Pass one or more of: ${known}`,
    );
  }

  const results = [];
  for (const variant of requestedVariants) {
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
