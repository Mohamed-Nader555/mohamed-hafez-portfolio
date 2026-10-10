import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import MiniSearch from 'minisearch';
import YAML from 'yaml';
import { projects } from '../src/data/index.ts';
import { buildKnowledge } from '../src/lib/rag/chunk-evidence.ts';
import type { CaseStudyPage } from '../src/lib/rag/chunk-pages.ts';
import {
  KNOWLEDGE_MAX_CHARS,
  ledgerFromChunks,
  mergeLedger,
  renderKnowledgeMarkdown,
  type LedgerEntry,
} from '../src/lib/rag/ledger.ts';
import { splitFrontmatter } from '../src/lib/rag/mdx-text.ts';
import { miniSearchOptions } from '../src/lib/rag/search-config.ts';
import type { KnowledgeIndexArtifact } from '../src/lib/rag/types.ts';
import { caseStudyFrontmatterSchema } from '../src/types/case-study.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = resolve(root, 'src/content/case-studies');
const outputPath = resolve(root, 'src/generated/knowledge-index.json');
const ledgerPath = resolve(root, 'src/generated/ledger.json');
const knowledgePath = resolve(root, 'src/generated/knowledge.md');

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

/**
 * The claims ledger and its readable form. Both are deterministic: the same
 * content gives the same bytes, which Gemini's automatic caching relies on.
 */
export async function buildLedgerArtifacts(): Promise<{
  ledger: LedgerEntry[];
  markdown: string;
}> {
  const { chunks } = buildKnowledge({ pages: await loadCaseStudyPages() });
  const ledger = mergeLedger(ledgerFromChunks(chunks), []);
  const markdown = renderKnowledgeMarkdown(ledger, {
    projects: projects.map(({ id, title }) => ({ id, title })),
  });
  return { ledger, markdown };
}

export async function writeKnowledgeIndex() {
  const artifact = await buildKnowledgeIndex();
  const { ledger, markdown } = await buildLedgerArtifacts();
  await mkdir(dirname(outputPath), { recursive: true });
  const json = `${JSON.stringify(artifact)}\n`;
  await writeFile(outputPath, json, 'utf8');
  await writeFile(ledgerPath, `${JSON.stringify(ledger)}\n`, 'utf8');
  await writeFile(knowledgePath, markdown, 'utf8');
  return {
    artifact,
    bytes: Buffer.byteLength(json),
    claims: ledger.length,
    knowledgeChars: markdown.length,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { artifact, bytes, claims, knowledgeChars } =
    await writeKnowledgeIndex();
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
      )}); ${artifact.entities.length} entities; ${(bytes / 1024).toFixed(0)} KiB.\n` +
      `Generated ${claims} ledger claims; knowledge.md is ${knowledgeChars} characters (limit ${KNOWLEDGE_MAX_CHARS}).\n`,
  );
}
