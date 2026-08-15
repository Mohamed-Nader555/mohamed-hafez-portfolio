import { mkdir, writeFile } from 'node:fs/promises';
import MiniSearch from 'minisearch';
import { chunkEvidence } from '../src/lib/rag/chunk-evidence.ts';
import { normalizeQuery } from '../src/lib/rag/normalize-query.ts';
import type { KnowledgeIndexArtifact } from '../src/lib/rag/types.ts';

export function buildKnowledgeIndex(): KnowledgeIndexArtifact {
  const chunks = chunkEvidence();
  const index = new MiniSearch({
    fields: ['title', 'text', 'topics', 'aliases'],
    storeFields: ['id', 'roles', 'projectId', 'category', 'citations'],
    searchOptions: { boost: { title: 4, aliases: 6, topics: 3, text: 1 } },
    processTerm: normalizeQuery,
  });
  index.addAll(
    chunks.map((chunk) => ({
      ...chunk,
      topics: chunk.topics.join(' '),
      aliases: chunk.aliases.join(' '),
    })),
  );
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    chunks,
    miniSearch: index.toJSON() as Record<string, unknown>,
  };
}

const artifact = buildKnowledgeIndex();
await mkdir(new URL('../src/generated/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../src/generated/knowledge-index.json', import.meta.url),
  `${JSON.stringify(artifact)}\n`,
  'utf8',
);
process.stdout.write(
  `Generated ${artifact.chunks.length} public knowledge chunks.\n`,
);
