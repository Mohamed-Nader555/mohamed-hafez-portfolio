// `npm run fit -- path/to/jd.txt` (brief 3, task D5): writes
// `Claude outputs/fit/<name>.md` with the public brief for a job description,
// then a private section for Mohamed (gaps, likely interview questions, résumé
// points to stress). It is private and never deployed.
//
// It costs real money (the brief's writer and checker, then one more call), so
// it follows brief section 0a: it exits at once unless the environment has
// ALLOW_PAID_MODEL_CALLS=yes, and it handles one job description per run.
// It may read folder files 03 and 07 and send excerpts of those two only; it
// never opens files 01, 02, 06 or 08.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { briefToText } from '../src/components/ai/brief-card-data.ts';
import { answerFit } from '../src/lib/ai/fit-answer.ts';
import { createGeminiProvider } from '../src/lib/ai/gemini-provider.ts';
import { parseWriterThinking } from '../src/lib/ai/assistant-runtime.ts';
import type { LedgerDeps } from '../src/lib/ai/ledger-answer.ts';
import { jobDescriptionHasInjection } from '../src/lib/rag/guard.ts';
import type { LedgerEntry } from '../src/lib/rag/ledger.ts';
import { checkPaidSwitch } from './paid-guard.ts';
import {
  pickAllowedFiles,
  renderFitMarkdown,
  runPrivateSection,
  selectExcerpts,
} from './fit-private.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WRITER_MODEL = process.env.GEMINI_WRITER_MODEL || 'gemini-3.8-flash';
const CHECKER_MODEL =
  process.env.GEMINI_CHECKER_MODEL || 'gemini-3.5-flash-lite';
const MAX_JOB_DESCRIPTION = 6000;
const MAX_EXCERPT_TOTAL = 12_000;

const stop = (message: string): never => {
  process.stderr.write(`${message}\n`);
  process.exit(1);
};

const allowed = checkPaidSwitch(process.env);
if (!allowed.ok) stop(allowed.message);

const paths = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
if (paths.length !== 1)
  stop('Give exactly one job description file: npm run fit -- path/to/jd.txt');
const jdPath = resolve(paths[0]!);
const jobDescription = (await readFile(jdPath, 'utf8')).trim();
if (!jobDescription) stop('That job description file is empty.');
if (jobDescription.length > MAX_JOB_DESCRIPTION)
  stop(
    `The job description is ${jobDescription.length} characters; the limit is ${MAX_JOB_DESCRIPTION}.`,
  );
if (jobDescriptionHasInjection(jobDescription))
  stop('That job description contains instructions aimed at the assistant.');
const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) stop('GEMINI_API_KEY is not set in .dev.vars.');

const claims = JSON.parse(
  await readFile(resolve(root, 'src/generated/ledger.json'), 'utf8'),
) as LedgerEntry[];
const knowledge = await readFile(
  resolve(root, 'src/generated/knowledge.md'),
  'utf8',
);
const writer = createGeminiProvider({ apiKey: apiKey!, model: WRITER_MODEL });
const deps: LedgerDeps = {
  writer,
  checker: createGeminiProvider({ apiKey: apiKey!, model: CHECKER_MODEL }),
  writerModel: WRITER_MODEL,
  checkerModel: CHECKER_MODEL,
  writerThinking: parseWriterThinking(process.env.GEMINI_WRITER_THINKING),
  claims,
  knowledge,
  log: () => {},
};

const response = await answerFit(deps, {
  question: 'How does his background line up with this job description?',
  jobDescription,
  history: [],
  activeRole: 'aiml',
  requestId: 'fit-script',
});
if (!response?.brief)
  stop(response?.answer ?? 'The brief could not be written just now.');
const brief = briefToText(response!.brief!);

// Private section: only files 03 and 07 of the private folder, and only the
// excerpts that match this job description.
const folder = resolve(root, 'Universal Information');
const names = pickAllowedFiles(await readdir(folder));
const sources = await Promise.all(
  names.map(async (name) => ({
    name,
    text: await readFile(resolve(folder, name), 'utf8'),
  })),
);
const excerpts = selectExcerpts(sources, jobDescription, MAX_EXCERPT_TOTAL);
const privateSection = await runPrivateSection(writer, {
  jobDescription,
  brief,
  excerpts,
});

const name = basename(jdPath, extname(jdPath)).replace(/[^a-z0-9-_]+/gi, '-');
const outDir = resolve(root, 'Claude outputs/fit');
await mkdir(outDir, { recursive: true });
const outPath = resolve(outDir, `${name}.md`);
await writeFile(
  outPath,
  renderFitMarkdown({ name, brief, private: privateSection }),
  'utf8',
);
process.stdout.write(`Wrote ${outPath}\n`);
