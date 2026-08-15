import cases from '../tests/fixtures/rag-evaluation.json' with { type: 'json' };
import { retrieveEvidence } from '../src/lib/rag/retrieve.ts';
type Case = {
  question: string;
  activeRole: 'aiml' | 'software' | 'android' | 'teaching';
  supported: boolean;
  expectedSourceIds?: string[];
  history?: [];
};
const results = (cases as Case[]).map((entry) => {
  const result = retrieveEvidence({
    question: entry.question,
    activeRole: entry.activeRole,
    history: entry.history ?? [],
    limit: 5,
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
for (const result of results)
  process.stdout.write(
    `${result.actual === result.supported && result.hit ? 'PASS' : 'FAIL'} ${result.category} ${result.top} — ${result.question}\n`,
  );
process.stdout.write(
  `Unsupported refusal precision: ${(refusalPrecision * 100).toFixed(0)}%; supported source recall: ${(sourceRecall * 100).toFixed(0)}%; screening: ${screeningPass ? 'pass' : 'fail'}\n`,
);
if (refusalPrecision < 1 || sourceRecall < 0.9 || !screeningPass)
  process.exitCode = 1;
