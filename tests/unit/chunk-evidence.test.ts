import { describe, expect, it } from 'vitest';
import { chunkEvidence } from '@/lib/rag/chunk-evidence';

describe('curated knowledge chunks', () => {
  it('exposes only approved public citation targets', () => {
    const chunks = chunkEvidence();
    expect(chunks.length).toBeGreaterThan(20);
    expect(chunks.every((chunk) => chunk.citations.length > 0)).toBe(true);
    expect(
      chunks
        .flatMap((chunk) => chunk.citations)
        .every(
          (citation) =>
            citation.href.startsWith('/') ||
            citation.href.startsWith('https://'),
        ),
    ).toBe(true);
  });

  it('includes the public screening and project evidence', () => {
    const text = chunkEvidence()
      .map((chunk) => chunk.text)
      .join('\n');
    expect(text).toContain('PGWP');
    expect(text).toContain('Dostava');
    expect(text).toContain('Retrofit');
  });
});
