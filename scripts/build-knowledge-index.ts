import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MiniSearch from 'minisearch';
import YAML from 'yaml';
import { buildKnowledge } from '../src/lib/rag/chunk-evidence.ts';
import type { CaseStudyPage } from '../src/lib/rag/chunk-pages.ts';
import { splitFrontmatter } from '../src/lib/rag/mdx-text.ts';
import { miniSearchOptions } from '../src/lib/rag/search-config.ts';
import type { KnowledgeIndexArtifact } from '../src/lib/rag/types.ts';
import { caseStudyFrontmatterSchema } from '../src/types/case-study.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = resolve(root, 'src/content/case-studies');
const outputPath = resolve(root, 'src/generated/knowledge-index.json');

/** Reads and validates every case-study page (frontmatter and body). */
export async function loadCaseStudyPages(): Promise<CaseStudyPage[]> {
  const files = (await readdir(casesDir)).filter((file) =>
    file.endsWith('.mdx'),
  );
  return Promise.all(
    files.sort().map(async (file) => {
      const { frontmatter, body } = splitFrontmatter(
        await readFile(resolve(casesDir, file), 'utf8'),
      );
      const parsed = caseStudyFrontmatterSchema.parse(YAML.parse(frontmatter));
      return { slug: parsed.slug, frontmatter: parsed, body };
    }),
  );
}

export async function buildKnowledgeIndex(): Promise<KnowledgeIndexArtifact> {
  const { chunks, entities } = buildKnowledge({
    pages: await loadCaseStudyPages(),
  });
  const index = new MiniSearch(miniSearchOptions);
  index.addAll(
    chunks.map((chunk) => ({
      id: chunk.id,
      title: chunk.title,
      text: chunk.text,
      topics: chunk.topics.join(' '),
      aliases: chunk.aliases.join(' '),
    })),
  );
  return {
    version: 2,
    generatedAt: new Date().toISOString(),
    chunks,
    entities,
    miniSearch: index.toJSON() as unknown as Record<string, unknown>,
  };
}

export async function writeKnowledgeIndex() {
  const artifact = await buildKnowledgeIndex();
  await mkdir(dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(artifact)}\n`;
  await writeFile(outputPath, json, 'utf8');
  return { artifact, bytes: Buffer.byteLength(json) };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { artifact, bytes } = await writeKnowledgeIndex();
  const byFamily = artifact.chunks.reduce<Record<string, number>>(
    (counts, chunk) => ({
      ...counts,
      [chunk.family]: (counts[chunk.family] ?? 0) + 1,
    }),
    {},
  );
  process.stdout.write(
    `Generated ${artifact.chunks.length} public knowledge chunks (${Object.entries(
      byFamily,
    )
      .map(([family, count]) => `${family} ${count}`)
      .join(
        ', ',
      )}); ${artifact.entities.length} entities; ${(bytes / 1024).toFixed(0)} KiB.\n`,
  );
}
