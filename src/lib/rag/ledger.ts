// The claims ledger: one typed list of everything the assistant may say about
// Mohamed. Site claims come from the knowledge chunks; claims from his notes
// and his own answers are added from the committed files in src/data/claims/.
import type { Citation, KnowledgeCategory, KnowledgeChunk } from './types';

/** direct: shown on the site. related: nearby evidence, never worded as direct. */
export type ClaimStrength = 'direct' | 'related';
export type ClaimOrigin = 'site' | 'notes' | 'own-words';

export type LedgerEntry = {
  id: string;
  text: string;
  strength: ClaimStrength;
  origin: ClaimOrigin;
  citations: Citation[];
  category: KnowledgeCategory;
  projectId?: string;
  /** Ledger ids that support this claim (bridges and gap answers). */
  basisIds?: string[];
};

/**
 * Gemini's automatic caching only helps while the start of the prompt repeats
 * exactly, and the whole file is sent with every question; this is the size at
 * which the build stops.
 */
export const KNOWLEDGE_MAX_CHARS = 280_000;

const oneLine = (text: string) => text.replace(/\s+/g, ' ').trim();

/** Evidence, page and data chunks become direct site claims; the overview family only repeats them. */
export function ledgerFromChunks(chunks: KnowledgeChunk[]): LedgerEntry[] {
  return chunks
    .filter((chunk) => chunk.family !== 'overview')
    .map((chunk) => ({
      id: chunk.id,
      text: oneLine(chunk.text),
      strength: 'direct' as const,
      origin: 'site' as const,
      citations: chunk.citations,
      category: chunk.category,
      ...(chunk.projectId ? { projectId: chunk.projectId } : {}),
    }));
}

/** Adds the claims from his notes and answers; every claim keeps a unique id and a public citation. */
export function mergeLedger(
  site: LedgerEntry[],
  extra: LedgerEntry[],
): LedgerEntry[] {
  const merged = [...site, ...extra];
  const seen = new Set<string>();
  for (const claim of merged) {
    if (seen.has(claim.id)) throw new Error(`Duplicate claim id: ${claim.id}`);
    seen.add(claim.id);
    if (claim.citations.length === 0)
      throw new Error(`Claim ${claim.id} has no public citation`);
  }
  return merged;
}

type KnowledgeFileOptions = {
  /** Project ids and titles, in the order their sections should appear. */
  projects: Array<{ id: string; title: string }>;
  maxChars?: number;
};

export function renderKnowledgeMarkdown(
  ledger: LedgerEntry[],
  { projects, maxChars = KNOWLEDGE_MAX_CHARS }: KnowledgeFileOptions,
): string {
  const line = (claim: LedgerEntry) =>
    `[${claim.id}] ${claim.text}${
      claim.strength === 'related' ? ' (related evidence only)' : ''
    }`;
  const section = (heading: string, claims: LedgerEntry[], level = '##') =>
    claims.length === 0
      ? []
      : [`${level} ${heading}`, '', ...claims.map(line), ''];

  const site = ledger.filter((claim) => claim.origin === 'site');
  const inCategory = (category: KnowledgeCategory) =>
    site.filter((claim) => claim.category === category);
  const projectClaims = inCategory('project');
  const listed = new Set(projects.map((project) => project.id));
  const generalProjectClaims = projectClaims.filter(
    (claim) => !claim.projectId || !listed.has(claim.projectId),
  );

  const lines = [
    '# Claims about Mohamed Hafez',
    '',
    'Each line starts with its claim ID in brackets. Use only these claims.',
    '',
    ...section('Screening facts', inCategory('screening')),
    ...section('Experience', inCategory('experience')),
    ...(projectClaims.length ? ['## Projects', ''] : []),
    ...projects.flatMap((project) =>
      section(
        project.title,
        projectClaims.filter((claim) => claim.projectId === project.id),
        '###',
      ),
    ),
    ...section('Other project facts', generalProjectClaims, '###'),
    ...section('Research', inCategory('research')),
    ...section('Teaching', inCategory('teaching')),
    ...section('Skills', inCategory('skills')),
    ...section(
      'From Mohamed’s notes',
      ledger.filter((claim) => claim.origin === 'notes'),
    ),
    ...section(
      'Mohamed’s answers',
      ledger.filter((claim) => claim.origin === 'own-words'),
    ),
  ];
  const markdown = `${lines.join('\n').trimEnd()}\n`;
  if (markdown.length > maxChars)
    throw new Error(
      `knowledge.md is ${markdown.length} characters, over the limit of ${maxChars}`,
    );
  return markdown;
}
