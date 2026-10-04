import { createHash } from 'node:crypto';

/**
 * Some names must never appear on the site or anywhere in this public
 * repository, so they cannot be written down here either. Text is tokenized
 * into lowercase one-, two- and three-word sequences; each sequence is hashed
 * (SHA-256) and compared with this constant set.
 *
 * The set holds the banking clients' names (and their common short forms) and
 * the template name from the content source's do-not-publish list. To add a
 * term, hash its lowercase, space-joined words with `sha256` and add the hex
 * digest; never commit the term itself.
 */
export const FORBIDDEN_HASHES: ReadonlySet<string> = new Set([
  'bb99ac76b8247c11d55c10e48ef8d535445c60f268f1691fa5ff79bc3490a816',
  '3aaedab977c913fe60055549f45122de44107066b3a7146249d1d28f2c86ab2d',
  'fa7f79b426fc69c0b596e20f15b6bd84ba043386f9327bc553f7e467e965a26a',
  'b5a30acf5e5a1f0f1a01fbcaf7615b06afa278ccec7415935c02641d2b9be6ff',
  'e896e5b37ac61ee39aae572d0e49f42aff93c8c6c292712d2ae90637fc555365',
  '4db8e3a035a19d0d2be45fda86a14a12b5a8f95642b894c226de16707f7eaeb5',
  '3a5faa76b89f5dbcd81eec0fdaee9a5c17ba806b2a3d4c9f7b562c3c299db136',
  'ef327d5b8b70cd8a0e78fbf8959acf1d3468ba82b9d0e7424b185d63459ea496',
  'edf52be1ce58dc2e707f66537a6b9c7fae0e9f4f06f902427ec15a3e2aee79e8',
]);

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

/** Lowercase words with accents folded away. */
const words = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/**
 * The forbidden sequences found in `text`, reported by hash only (a failure
 * message must not print the term it caught).
 */
export function forbiddenHashesIn(
  text: string,
  forbidden: ReadonlySet<string> = FORBIDDEN_HASHES,
): string[] {
  const tokens = words(text);
  const found = new Set<string>();
  for (let size = 1; size <= 3; size += 1)
    for (let start = 0; start + size <= tokens.length; start += 1) {
      const digest = sha256(tokens.slice(start, start + size).join(' '));
      if (forbidden.has(digest)) found.add(digest);
    }
  return [...found].map((digest) => digest.slice(0, 12));
}
