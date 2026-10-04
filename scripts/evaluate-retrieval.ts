import { pathToFileURL } from 'node:url';
import cases from '../tests/fixtures/rag-evaluation.json' with { type: 'json' };
import { retrieveEvidence } from '../src/lib/rag/retrieve.ts';

type Case = {
  question: string;
  activeRole: 'aiml' | 'software' | 'android' | 'teaching';
  supported: boolean;
  expectedSourceIds?: string[];
  history?: [];
  // Free-text note on what the case guards against; not used by the scorer.
  note?: string;
};

export const MIN_SOURCE_RECALL = 0.95;

export function runEvaluation() {
  const results = (cases as Case[]).map((entry) => {
    const result = retrieveEvidence({
      question: entry.question,
      activeRole: entry.activeRole,
      history: entry.history ?? [],
      limit: 8,
    });
    const actualSources = new Set(
      result.chunks.flatMap((chunk) =>
        chunk.citations.map((citation) => citation.sourceId),
      ),
    );
    return {
      ...entry,
      actual: result.supported,
      hit:
        !entry.expectedSourceIds ||
        entry.expectedSourceIds.some((id) => actualSources.has(id)),
      top: result.chunks[0]?.citations[0]?.sourceId ?? 'none',
      category: result.category,
    };
  });
  const unsupported = results.filter((entry) => !entry.supported);
  const supported = results.filter((entry) => entry.supported);
  const refusalPrecision =
    unsupported.filter((entry) => !entry.actual).length / unsupported.length;
  const sourceRecall =
    supported.filter((entry) => entry.actual && entry.hit).length /
    supported.length;
  const screeningPass = results
    .filter((entry) =>
      /located|start|sponsorship|authorization|remote|relocat|seniority|contract/.test(
        entry.question,
      ),
    )
    .every((entry) => entry.actual && entry.hit);
  return {
    results,
    total: results.length,
    refused: unsupported.length,
    refusalPrecision,
    sourceRecall,
    screeningPass,
    passed:
      refusalPrecision === 1 &&
      sourceRecall >= MIN_SOURCE_RECALL &&
      screeningPass,
  };
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const evaluation = runEvaluation();
  for (const result of evaluation.results)
    process.stdout.write(
      `${result.actual === result.supported && result.hit ? 'PASS' : 'FAIL'} ${result.category} ${result.top} — ${result.question}\n`,
    );
  process.stdout.write(
    `${evaluation.total} cases (${evaluation.refused} must be refused). Unsupported refusal precision: ${(evaluation.refusalPrecision * 100).toFixed(0)}%; supported source recall: ${(evaluation.sourceRecall * 100).toFixed(0)}%; screening: ${evaluation.screeningPass ? 'pass' : 'fail'}\n`,
  );
  if (!evaluation.passed) process.exitCode = 1;
}
