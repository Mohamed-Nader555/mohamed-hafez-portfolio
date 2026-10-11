// `npm run briefs:check -- --only a,b`: sends the named role briefs, each
// requirement beside the claims behind it, to the checker model once and
// writes the result to Claude outputs/eval/ (brief 3, task D1). It costs real
// money, so it follows the spending rule of brief section 0a: it exits at
// once unless the environment has ALLOW_PAID_MODEL_CALLS=yes, and it takes
// brief slugs only, at most 10.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { roleBriefs } from '../src/data/claims/role-briefs.ts';
import { createGeminiProvider } from '../src/lib/ai/gemini-provider.ts';
import type { LedgerEntry } from '../src/lib/rag/ledger.ts';
import { checkPaidRun, parseCaseIds } from './paid-guard.ts';
import { checkRoleBrief, type BriefCheck } from './role-brief-check.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHECKER_MODEL =
  process.env.GEMINI_CHECKER_MODEL || 'gemini-3.5-flash-lite';

const guard = checkPaidRun({
  env: process.env,
  requestedIds: parseCaseIds(process.argv.slice(2)),
  knownIds: roleBriefs.map((brief) => brief.slug),
});
if (!guard.ok) {
  process.stderr.write(`${guard.message}\n`);
  process.exit(1);
}
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  process.stderr.write('GEMINI_API_KEY is not set in .dev.vars.\n');
  process.exit(1);
}

const claims = JSON.parse(
  await readFile(resolve(root, 'src/generated/ledger.json'), 'utf8'),
) as LedgerEntry[];
const checker = createGeminiProvider({ apiKey, model: CHECKER_MODEL });

const results: BriefCheck[] = [];
for (const brief of roleBriefs.filter((b) => guard.ids.includes(b.slug))) {
  const result = await checkRoleBrief(checker, brief, claims);
  results.push(result);
  process.stdout.write(
    `${result.status === 'checked' && !result.flagged.length ? 'PASS' : 'REVIEW'} ${brief.slug} (${result.status}${result.flagged.length ? `, flagged: ${result.flagged.join('; ')}` : ''})\n`,
  );
}

const outDir = resolve(root, 'Claude outputs/eval');
await mkdir(outDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
await writeFile(
  resolve(outDir, `briefs-${stamp}.json`),
  `${JSON.stringify({ stamp, checker: CHECKER_MODEL, results }, null, 2)}\n`,
  'utf8',
);
if (results.some((r) => r.status !== 'checked' || r.flagged.length))
  process.exitCode = 1;
