import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

/**
 * The site's Content-Security-Policy is `script-src 'self' ...` with no
 * 'unsafe-inline'. Astro still emits a few small inline scripts on prerendered
 * pages (the island bootstrap that hydrates the assistant, and any hoisted
 * script it chooses to inline). A strict policy blocks them, so the assistant
 * never hydrated and the page scripts never ran in production.
 *
 * Instead of weakening the policy, allow exactly the inline scripts that the
 * build produced: add each script body's SHA-256 hash to `script-src`. A script
 * that is not in the build output still cannot run.
 */

const INLINE_SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;

export function inlineScriptHashes(html: string): string[] {
  const hashes: string[] = [];
  for (const match of html.matchAll(INLINE_SCRIPT)) {
    const attributes = match[1] ?? '';
    const body = match[2] ?? '';
    if (/\bsrc=/.test(attributes)) continue;
    // JSON-LD and other data blocks are not executed.
    const type = attributes
      .match(/\btype=["']([^"']+)["']/i)?.[1]
      ?.toLowerCase();
    if (
      type &&
      !['module', 'text/javascript', 'application/javascript'].includes(type)
    ) {
      continue;
    }
    if (!body.trim()) continue;
    hashes.push(
      `'sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}'`,
    );
  }
  return hashes;
}

/**
 * Rewrites the `script-src` directive of every Content-Security-Policy line so
 * it allows `hashes` (replacing any hashes from a previous run).
 */
export function addScriptHashes(
  headers: string,
  hashes: readonly string[],
): string {
  const unique = [...new Set(hashes)].sort();

  return headers
    .split('\n')
    .map((line) => {
      if (!/^\s*Content-Security-Policy:/i.test(line)) return line;
      return line.replace(
        /script-src([^;]*)/,
        (_directive, sources: string) => {
          const kept = sources
            .split(/\s+/)
            .filter((token) => token && !token.startsWith("'sha256-"));
          return `script-src ${[...kept, ...unique].join(' ')}`;
        },
      );
    })
    .join('\n');
}

async function htmlFiles(directory: string): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const full = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(full)));
    else if (entry.name.endsWith('.html')) files.push(full);
  }
  return files;
}

export async function applyScriptHashes(clientDir: string) {
  const hashes = new Set<string>();
  for (const file of await htmlFiles(clientDir)) {
    for (const hash of inlineScriptHashes(await readFile(file, 'utf8'))) {
      hashes.add(hash);
    }
  }

  const headersPath = join(clientDir, '_headers');
  const headers = await readFile(headersPath, 'utf8');
  await writeFile(headersPath, addScriptHashes(headers, [...hashes]));
  return hashes.size;
}

const invokedScript = process.argv[1];
if (invokedScript && import.meta.url === pathToFileURL(invokedScript).href) {
  applyScriptHashes(resolve('dist/client'))
    .then((count) => {
      process.stdout.write(
        `Added ${count} inline-script hash${count === 1 ? '' : 'es'} to the Content-Security-Policy script-src in dist/client/_headers.\n`,
      );
    })
    .catch((error: unknown) => {
      process.stderr.write(
        `${error instanceof Error ? error.message : String(error)}\n`,
      );
      process.exitCode = 1;
    });
}
