// The part of the knowledge build that reads the site: the case-study pages and
// the claims they and the data files make. It must not import src/data/claims,
// because `npm run claims:apply` runs it before those files exist.
import { readdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import { buildKnowledge } from '../src/lib/rag/chunk-evidence.ts';
import type { CaseStudyPage } from '../src/lib/rag/chunk-pages.ts';
import { ledgerFromChunks, type LedgerEntry } from '../src/lib/rag/ledger.ts';
import { splitFrontmatter } from '../src/lib/rag/mdx-text.ts';
import { caseStudyFrontmatterSchema } from '../src/types/case-study.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const casesDir = resolve(root, 'src/content/case-studies');

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

/** Every claim the site itself makes, before any claim from Mohamed's notes. */
export async function buildSiteLedger(): Promise<LedgerEntry[]> {
  const { chunks } = buildKnowledge({ pages: await loadCaseStudyPages() });
  return ledgerFromChunks(chunks);
}
