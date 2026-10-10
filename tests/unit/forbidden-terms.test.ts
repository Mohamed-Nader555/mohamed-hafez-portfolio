import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  FORBIDDEN_HASHES,
  forbiddenHashesIn,
  sha256,
} from '../helpers/forbidden-terms';

const TEXT_FILE =
  /\.(ts|tsx|astro|mdx?|jsonc?|css|mjs|cjs|js|html|txt|ya?ml)$/i;

describe('forbidden terms', () => {
  it('finds a hashed term as a one-, two- or three-word sequence, in any case', () => {
    // A neutral, made-up term stands in for the real names (see the helper).
    const set = new Set([
      sha256('zorblax'),
      sha256('quux holdings'),
      sha256('foo bar baz'),
    ]);
    expect(forbiddenHashesIn('Acme ZORBLAX.', set)).toHaveLength(1);
    expect(forbiddenHashesIn('the Quux-Holdings group', set)).toHaveLength(1);
    expect(forbiddenHashesIn('foo, bar & baz', set)).toHaveLength(1);
    expect(forbiddenHashesIn('zorblaxes and quux alone', set)).toEqual([]);
    expect(forbiddenHashesIn('', set)).toEqual([]);
  });

  it('keeps the real hash list non-empty and well formed', () => {
    expect(FORBIDDEN_HASHES.size).toBeGreaterThan(0);
    for (const hash of FORBIDDEN_HASHES) expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('still holds the client names plus the private-profile hashes', () => {
    // 9 client-name hashes, then people, private projects, address, date of
    // birth and an old phone number. Fewer means a hash was deleted.
    expect(FORBIDDEN_HASHES.size).toBeGreaterThanOrEqual(40);
  });

  it('appears nowhere in the tracked repository files', () => {
    const files = execFileSync('git', ['ls-files', '-z'], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    })
      .split('\0')
      .filter((file) => TEXT_FILE.test(file));
    expect(files.length).toBeGreaterThan(100);
    const hits = files.flatMap((file) => {
      const found = forbiddenHashesIn(readFileSync(file, 'utf8'));
      return found.length ? [`${file}: ${found.join(', ')}`] : [];
    });
    expect(hits).toEqual([]);
    // Every tracked file is tokenized and hashed, which is slow on a busy machine.
  }, 60_000);
});
