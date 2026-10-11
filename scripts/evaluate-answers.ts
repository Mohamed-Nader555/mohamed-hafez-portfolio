// `npm run answers:evaluate -- --only a,b`: asks the named cases in
// tests/fixtures/answer-evaluation.json through the real writer and checker
// models and scores the replies. It needs GEMINI_API_KEY (npm loads it from
// the git-ignored .dev.vars) and costs real money, so it is not part of
// `npm test`. Brief 3, section 0a: it refuses to start unless the environment
// has ALLOW_PAID_MODEL_CALLS=yes, and it takes case ids only, at most 10.
//   --stage D     also run the cases that need the pasted job description
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import cases from '../tests/fixtures/answer-evaluation.json' with { type: 'json' };
import { answerRecruiterQuestion } from '../src/lib/ai/answer-service.ts';
import { parseWriterThinking } from '../src/lib/ai/assistant-runtime.ts';
import { createGeminiProvider } from '../src/lib/ai/gemini-provider.ts';
import type { LedgerDeps } from '../src/lib/ai/ledger-answer.ts';
import type { ChatResponse } from '../src/lib/ai/types.ts';
import type { LedgerEntry } from '../src/lib/rag/ledger.ts';
import { checkPaidRun, parseCaseIds } from './paid-guard.ts';
import {
  GROUP_REQUIRED_RATE,
  meetsRequirements,
  scoreCase,
  summarise,
  type CaseResult,
  type EvalCase,
} from './answer-scoring.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const WRITER_MODEL = process.env.GEMINI_WRITER_MODEL || 'gemini-3.8-flash';
const CHECKER_MODEL =
  process.env.GEMINI_CHECKER_MODEL || 'gemini-3.5-flash-lite';

const args = process.argv.slice(2);
const includeStageD = args[args.indexOf('--stage') + 1] === 'D';

const guard = checkPaidRun({
  env: process.env,
  requestedIds: parseCaseIds(args),
  knownIds: (cases as EvalCase[]).map((c) => c.id),
});
if (!guard.ok) {
  process.stderr.write(`${guard.message}\n`);
  process.exit(1);
}

const apiKey = process.env.GEMINI_API_KEY?.trim();
if (!apiKey) {
  process.stderr.write(
    'GEMINI_API_KEY is not set. Put it in .dev.vars (it is git-ignored) and run `npm run answers:evaluate`.\n',
  );
  process.exit(1);
}

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]!
    : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
};

const claims = JSON.parse(
  await readFile(resolve(root, 'src/generated/ledger.json'), 'utf8'),
) as LedgerEntry[];
const knowledge = await readFile(
  resolve(root, 'src/generated/knowledge.md'),
  'utf8',
);

type Usage = {
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  thinkingTokens: number;
  cachedTokens: number;
};
let lastUsage: Usage | undefined;
let lastEvent: Record<string, unknown> | undefined;
const deps: LedgerDeps = {
  writer: createGeminiProvider({ apiKey, model: WRITER_MODEL }),
  checker: createGeminiProvider({ apiKey, model: CHECKER_MODEL }),
  writerModel: WRITER_MODEL,
  checkerModel: CHECKER_MODEL,
  writerThinking: parseWriterThinking(process.env.GEMINI_WRITER_THINKING),
  claims,
  knowledge,
  log: (event) => {
    lastEvent = event;
    const writer = (event.writer ?? {}) as Record<string, number>;
    lastUsage = {
      latencyMs: Number(event.latencyMs ?? 0),
      inputTokens: writer.inputTokens ?? 0,
      outputTokens: writer.outputTokens ?? 0,
      thinkingTokens: writer.thinkingTokens ?? 0,
      cachedTokens: writer.cachedTokens ?? 0,
    };
  },
};
const classicUnused = {
  generate: async () => {
    throw new Error('The classic pipeline is not part of this evaluation.');
  },
};

const results: CaseResult[] = [];
const raw: Array<Record<string, unknown>> = [];
const usages: Usage[] = [];
const selected = (cases as EvalCase[]).filter((c) => guard.ids.includes(c.id));

for (const entry of selected) {
  if (entry.stage === 'D' && !includeStageD) {
    results.push({ case: entry, pass: false, reasons: [], skipped: true });
    process.stdout.write(`SKIP ${entry.id} (needs stage D)\n`);
    continue;
  }
  lastUsage = undefined;
  lastEvent = undefined;
  const started = Date.now();
  let response: ChatResponse;
  try {
    response = await answerRecruiterQuestion(
      { provider: classicUnused, modelId: WRITER_MODEL, ledger: deps },
      {
        question: entry.question,
        history: [],
        activeRole: entry.activeRole,
        requestId: entry.id,
      },
    );
  } catch (error) {
    results.push({
      case: entry,
      pass: false,
      reasons: [`threw: ${error instanceof Error ? error.message : 'error'}`],
      skipped: false,
    });
    process.stdout.write(`FAIL ${entry.id} (threw)\n`);
    continue;
  }
  const latencyMs = Date.now() - started;
  const usage = lastUsage as Usage | undefined;
  if (usage) usages.push({ ...usage, latencyMs });
  const scored = scoreCase(entry, {
    answer: response.answer,
    answerStatus: response.answerStatus,
    notShown: response.notShown,
    segments: response.segments?.map((segment) => ({
      text: segment.text,
      label: segment.label,
      claimIds: segment.claimIds,
    })),
  });
  results.push({ case: entry, ...scored, skipped: false });
  raw.push({
    id: entry.id,
    group: entry.group,
    question: entry.question,
    status: response.answerStatus,
    path: response.trace?.path ?? 'refused-before-model',
    checker: response.trace?.checker,
    trace: response.trace,
    codeDropKinds: lastEvent?.codeDropKinds,
    checkerFlagged: lastEvent?.checkerFlagged,
    latencyMs,
    usage,
    pass: scored.pass,
    reasons: scored.reasons,
    answer: response.answer,
    segments: response.segments,
    notShown: response.notShown,
  });
  process.stdout.write(
    `${scored.pass ? 'PASS' : 'FAIL'} ${entry.group} ${entry.id} ${latencyMs}ms${
      scored.pass ? '' : ` — ${scored.reasons.join('; ')}`
    }\n`,
  );
}

const summary = summarise(results);
process.stdout.write('\n');
for (const [group, s] of Object.entries(summary))
  process.stdout.write(
    `${group.padEnd(12)} ${s.passed}/${s.run} passed${s.skipped ? `, ${s.skipped} skipped` : ''} (needs ${GROUP_REQUIRED_RATE[group as keyof typeof GROUP_REQUIRED_RATE] * 100}%)\n`,
  );
const modelUsages = usages.filter((u) => u.inputTokens > 0);
const stats = {
  medianLatencyMs: median(usages.map((u) => u.latencyMs)),
  medianInputTokens: median(modelUsages.map((u) => u.inputTokens)),
  medianCachedTokens: median(modelUsages.map((u) => u.cachedTokens)),
  medianOutputTokens: median(modelUsages.map((u) => u.outputTokens)),
  medianThinkingTokens: median(modelUsages.map((u) => u.thinkingTokens)),
};
process.stdout.write(
  `\nMedian latency ${stats.medianLatencyMs} ms; median tokens in ${stats.medianInputTokens} (cached ${stats.medianCachedTokens}), out ${stats.medianOutputTokens}, thinking ${stats.medianThinkingTokens}\n`,
);

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = resolve(root, 'Claude outputs/eval');
await mkdir(outDir, { recursive: true });
await writeFile(
  resolve(outDir, `answers-${stamp}.json`),
  `${JSON.stringify({ stamp, writer: WRITER_MODEL, checker: CHECKER_MODEL, raw }, null, 2)}\n`,
  'utf8',
);

if (!meetsRequirements(summary)) {
  process.stdout.write(
    '\nBelow the required pass rate in at least one group.\n',
  );
  process.exitCode = 1;
}
