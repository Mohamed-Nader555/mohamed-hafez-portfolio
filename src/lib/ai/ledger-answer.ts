// The ledger pipeline: route hints, one writer call, checks in code, one
// checker call, then labelled segments. Any failure ends in the existing
// verified-facts fallback; the writer is never called twice and no second
// model takes over.
import { starterSuggestions } from '@/data/assistant-suggestions';
import { buildEvidenceFallback } from '@/lib/rag/extractive-fallback';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { followUpsFor, retrieveEvidence } from '@/lib/rag/retrieve';
import type { Citation } from '@/lib/rag/types';
import {
  checkDraft,
  createCheckContext,
  filterNotShown,
  type DraftSegment,
} from './answer-checks';
import { buildActions } from './actions';
import { runChecker } from './checker';
import type { GeminiProvider, GeminiUsage } from './gemini-provider';
import { buildHintIds, matchHints } from './hints';
import { professionalOnly, refusal } from './refusal';
import type {
  AnswerInput,
  ChatLabel,
  ChatResponse,
  ChatSegment,
  ChatTrace,
} from './types';
import { runWriter } from './writer';

export type LedgerDeps = {
  writer: GeminiProvider;
  checker: GeminiProvider;
  writerModel: string;
  checkerModel: string;
  /** The writer's thinking level; medium when not set. */
  writerThinking?: 'low' | 'medium' | 'high';
  claims: readonly LedgerEntry[];
  /** The whole knowledge file, sent to the writer with every question. */
  knowledge: string;
  /** One usage line per question: token counts and latency, never any text. */
  log?: (event: Record<string, unknown>) => void;
};

const latencyBucketFor = (elapsed: number) =>
  elapsed < 500
    ? ('lt-500ms' as const)
    : elapsed < 2000
      ? ('500ms-2s' as const)
      : elapsed < 5000
        ? ('2s-5s' as const)
        : ('gt-5s' as const);

const labelOf = (cited: readonly LedgerEntry[]): ChatLabel =>
  cited.length === 0
    ? 'reading'
    : cited.some((claim) => claim.origin === 'own-words')
      ? 'own-words'
      : cited.some((claim) => claim.origin === 'notes')
        ? 'notes'
        : 'site';

const mergeCitations = (lists: Citation[][]): Citation[] => {
  const seen = new Map<string, Citation>();
  for (const citation of lists.flat())
    if (!seen.has(citation.sourceId)) seen.set(citation.sourceId, citation);
  return [...seen.values()];
};

const joinTerms = (terms: readonly string[]) =>
  terms.length <= 1
    ? (terms[0] ?? '')
    : `${terms.slice(0, -1).join(', ')} or ${terms[terms.length - 1]}`;

const usageFields = (usage?: GeminiUsage) => ({
  inputTokens: usage?.inputTokens ?? 0,
  cachedTokens: usage?.cachedTokens ?? 0,
  outputTokens: usage?.outputTokens ?? 0,
  thinkingTokens: usage?.thinkingTokens ?? 0,
});

const errorName = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function answerFromLedger(
  deps: LedgerDeps,
  input: AnswerInput,
): Promise<ChatResponse> {
  const started = Date.now();
  const log = deps.log ?? ((event) => console.info(JSON.stringify(event)));
  const retrieval = retrieveEvidence({ ...input, limit: 8 });
  const followUps = (
    retrieval.supported
      ? followUpsFor(retrieval, input.activeRole)
      : retrieval.suggestions?.length
        ? retrieval.suggestions
        : starterSuggestions[input.activeRole]
  ).slice(0, 3);

  const fallback = (drafted: number, writerUsed: boolean): ChatResponse => {
    const trace: ChatTrace = {
      path: 'fallback',
      ...(writerUsed ? { writerModel: deps.writerModel } : {}),
      checker: 'skipped',
      drafted,
      dropped: drafted,
    };
    if (!retrieval.supported)
      return refusal(input.requestId, retrieval, followUps);
    const evidence = buildEvidenceFallback(
      retrieval,
      input.requestId,
      followUps,
    );
    return {
      ...evidence,
      actions: buildActions(evidence.citations, input.activeRole),
      trace,
    };
  };

  const ledgerIds = new Set(deps.claims.map((claim) => claim.id));
  const matched = matchHints(input.question);
  const byId = new Map(deps.claims.map((claim) => [claim.id, claim]));
  const matchedClaims = [
    ...matched.gapIds,
    ...matched.answerIds,
    ...matched.bridgeIds,
  ]
    .slice(0, 4)
    .flatMap((id) => {
      const claim = byId.get(id);
      return claim ? [{ id, text: claim.text.slice(0, 700) }] : [];
    });
  // The direct site evidence nearest to each matched bridge, so an answer can
  // cite the record that states the fact (for example banking clients in
  // regulated environments), not only the bridge written from it.
  const bridgeEvidence = matched.bridgeIds.slice(0, 2).flatMap((id) => {
    const bridge = byId.get(id);
    if (!bridge) return [];
    return retrieveEvidence({
      question: bridge.text,
      history: [],
      activeRole: input.activeRole,
      limit: 6,
    })
      .chunks.filter((chunk) => chunk.family !== 'overview')
      .filter((chunk) => ledgerIds.has(chunk.id))
      .slice(0, 2);
  });
  for (const chunk of bridgeEvidence)
    if (!matchedClaims.some((claim) => claim.id === chunk.id))
      matchedClaims.push({
        id: chunk.id,
        text: byId.get(chunk.id)!.text.slice(0, 500),
      });
  const hintIds = buildHintIds(
    matched,
    [
      ...bridgeEvidence.map((chunk) => chunk.id),
      ...retrieval.chunks.map((chunk) => chunk.id),
    ],
    ledgerIds,
  );

  let draft;
  let writerUsage: GeminiUsage | undefined;
  try {
    const result = await runWriter(deps.writer, {
      knowledge: deps.knowledge,
      question: input.question,
      history: input.history,
      hintIds,
      matchedClaims,
      unknownSubject: retrieval.unknownSubject,
      thinkingLevel: deps.writerThinking,
    });
    draft = result.draft;
    writerUsage = result.usage;
  } catch (error) {
    console.error(
      'The writer model was not usable; serving the evidence answer.',
      errorName(error),
    );
    log({
      event: 'assistant_answer',
      path: 'fallback',
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel, failed: true },
    });
    return fallback(0, true);
  }

  if (draft.answerStatus === 'refused')
    return professionalOnly(input.requestId, followUps);

  const askedText = input.question;
  const context = createCheckContext(deps.claims, askedText);
  const { kept, dropped } = checkDraft(draft.segments, context);
  const notShown = filterNotShown(draft.notShown, askedText);
  if (kept.length === 0 && notShown.length === 0) {
    log({
      event: 'assistant_answer',
      path: 'fallback',
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel, ...usageFields(writerUsage) },
    });
    return fallback(draft.segments.length, true);
  }

  const citedBy = (segment: DraftSegment) =>
    segment.claimIds.map((id) => context.claims.get(id)!);
  // His quotes are proved verbatim in code; the checker reads the rest.
  const checkable = kept
    .map((segment, index) => ({ index, ...segment }))
    .filter((segment) => {
      const cited = citedBy(segment);
      return cited.length === 0 || cited.some((c) => c.origin !== 'own-words');
    });
  const checked = await runChecker(deps.checker, checkable, context.claims);

  const removed = new Set(checked.flagged);
  for (const index of checked.unchecked)
    if (kept[index]!.claimIds.length === 0) removed.add(index);
  const finalSegments = kept.filter((_, index) => !removed.has(index));

  if (finalSegments.length === 0 && notShown.length === 0) {
    log({
      event: 'assistant_answer',
      path: 'fallback',
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel, ...usageFields(writerUsage) },
      checker: { model: deps.checkerModel, ...usageFields(checked.usage) },
    });
    return fallback(draft.segments.length, true);
  }

  const segments: ChatSegment[] = finalSegments.map((segment) => {
    const cited = citedBy(segment);
    return {
      text: segment.text,
      label: labelOf(cited),
      claimIds: [...segment.claimIds],
      citations: mergeCitations(cited.map((claim) => claim.citations)),
    };
  });
  if (notShown.length) {
    const sentence: ChatSegment = {
      text: `The site doesn’t show ${joinTerms(notShown)}.`,
      label: 'reading',
      claimIds: [],
      citations: [],
    };
    if (draft.answerStatus === 'not_covered' || segments.length === 0)
      segments.unshift(sentence);
    else segments.push(sentence);
  }

  const answerStatus =
    draft.answerStatus === 'not_covered' || finalSegments.length === 0
      ? ('not_covered' as const)
      : ('answered' as const);
  const elapsed = Date.now() - started;
  const trace: ChatTrace = {
    path: 'ledger',
    writerModel: deps.writerModel,
    checkerModel: deps.checkerModel,
    checker:
      checked.status === 'skipped'
        ? 'skipped'
        : checked.status === 'checked' && checked.unchecked.length === 0
          ? 'passed'
          : 'unchecked',
    drafted: draft.segments.length,
    dropped: draft.segments.length - finalSegments.length,
  };
  log({
    event: 'assistant_answer',
    path: 'ledger',
    latencyMs: elapsed,
    kept: finalSegments.length,
    dropped: trace.dropped,
    codeDropKinds: dropped.map((d) => d.kind),
    checkerFlagged: checked.flagged.length,
    checker: checked.status,
    writer: { model: deps.writerModel, ...usageFields(writerUsage) },
    checkerUsage: { model: deps.checkerModel, ...usageFields(checked.usage) },
  });

  const citations = mergeCitations(
    segments.map((segment) => segment.citations),
  );
  return {
    requestId: input.requestId,
    answer: segments.map((segment) => segment.text).join(' '),
    answerStatus,
    citations,
    segments,
    actions: buildActions(citations, input.activeRole),
    ...(notShown.length ? { notShown } : {}),
    trace,
    followUps,
    telemetry: {
      questionCategory: retrieval.category,
      latencyBucket: latencyBucketFor(elapsed),
      modelId: deps.writerModel,
    },
  };
}
