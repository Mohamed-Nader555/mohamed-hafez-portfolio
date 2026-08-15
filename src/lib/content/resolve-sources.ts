import { sources } from '@/data';
import type { DeepReadonly } from '@/lib/content/resolve-lens';
import type { SourceRecord } from '@/types/content';

export type PublicSource = DeepReadonly<
  SourceRecord & { isPublic: true; publicHref: string }
>;

export function resolveSources(
  sourceIds: readonly string[],
  sourceRegistry: readonly SourceRecord[] = sources,
): readonly PublicSource[] {
  const sourceById = new Map(
    sourceRegistry.map((source) => [source.id, source]),
  );

  return Object.freeze(
    sourceIds.map((sourceId) => {
      const source = sourceById.get(sourceId);

      if (!source) {
        throw new Error(`Unknown source id: ${sourceId}`);
      }

      if (!source.isPublic) {
        throw new Error(`Source is not public: ${sourceId}`);
      }

      if (!source.publicHref) {
        throw new Error(`Public source lacks a href: ${sourceId}`);
      }

      return Object.freeze({
        ...source,
        isPublic: true as const,
        publicHref: source.publicHref,
      });
    }),
  );
}
