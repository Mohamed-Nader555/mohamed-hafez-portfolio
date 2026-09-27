import { describe, expect, it } from 'vitest';

import { sources } from '@/data';
import {
  resolveSources,
  resolveSourcesForRoute,
} from '@/lib/content/resolve-sources';

describe('resolveSources', () => {
  it('returns public sources in the requested order as immutable records', () => {
    const resolved = resolveSources([
      'official-yorkspace',
      'official-thesis-handle',
    ]);

    expect(resolved.map((source) => source.id)).toEqual([
      'official-yorkspace',
      'official-thesis-handle',
    ]);
    expect(resolved.every((source) => source.isPublic)).toBe(true);
    expect(() => (resolved as unknown as unknown[]).reverse()).toThrow();
    expect(() => {
      (resolved[0] as { label: string }).label = 'Changed';
    }).toThrow();
  });

  it('rejects unknown source ids instead of silently omitting them', () => {
    expect(() => resolveSources(['missing-source'])).toThrow(
      'Unknown source id: missing-source',
    );
  });

  it('rejects private-only and href-less sources', () => {
    expect(() => resolveSources(['github-northstar-rag'])).toThrow(
      'Source is not public: github-northstar-rag',
    );

    const hrefLessRegistry = [
      ...sources,
      {
        id: 'public-without-href',
        label: 'Broken public source',
        kind: 'approved-source' as const,
        isPublic: true,
      },
    ];

    expect(() =>
      resolveSources(['public-without-href'], hrefLessRegistry),
    ).toThrow('Public source lacks a href: public-without-href');
  });

  it('rejects circular evidence sources after normalizing the rendered route', () => {
    expect(() =>
      resolveSourcesForRoute(
        ['research-page-asc-pie'],
        'https://portfolio.test/research/asc-pie/?view=full#status',
      ),
    ).toThrow(
      'Circular evidence source research-page-asc-pie resolves to the current route: /research/asc-pie',
    );
  });
});
