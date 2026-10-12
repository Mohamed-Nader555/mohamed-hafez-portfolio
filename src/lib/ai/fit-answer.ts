// Fit mode, end to end (brief 3, task D4): one writer call reads a pasted job
// description against the claims ledger, code applies the rules, one checker
// call reviews what is left, and the result is a brief in three groups.
// There is no verdict. The writer is never called twice and no second model
// takes over; when the writer fails the caller answers "temporarily
// unavailable". The job description is never stored and never logged.
import { questionBank } from '@/data/claims/question-bank';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { briefToText } from '@/components/ai/brief-card-data';
import { findVerdictPhrases, numeralsIn } from '@/lib/rag/claim-checks';
import type { LedgerEntry } from '@/lib/rag/ledger';
import { checkDraft, createCheckContext } from './answer-checks';
import { buildActions } from './actions';
import { runChecker } from './checker';
import { runFit, MAX_FIT_PROMPTS, type FitDraft } from './fit';
import type { GeminiUsage } from './gemini-provider';
import { buildHintIds, matchHints } from './hints';
import {
  errorName,
  labelOf,
  latencyBucketFor,
  mergeCitations,
  usageFields,
  type LedgerDeps,
} from './ledger-answer';
import type { BriefCardData, BriefGroup, BriefItem } from './brief-types';
import type {
  AnswerInput,
  ChatResponse,
  ChatSegment,
  ChatTrace,
} from './types';

const NO_REQUIREMENTS =
  'I couldn’t find job requirements in that text. Paste the posting’s requirements or responsibilities and try again.';

const norm = (text: string) =>
  text.replace(/[’‘]/g, "'").toLowerCase().replace(/\s+/g, ' ').trim();

/** The label comes from the posting: whole, or at least half its words appear in it. */
function groundedIn(label: string, jobDescription: string): boolean {
  const posting = norm(jobDescription);
  const wanted = norm(label);
  if (posting.includes(wanted)) return true;
  const words = wanted.split(/[^a-z0-9+#./-]+/).filter((w) => w.length >= 3);
  if (words.length === 0) return false;
  const found = words.filter((word) => posting.includes(word)).length;
  return found / words.length >= 0.5;
}

const plural = (count: number, word: string) =>
  `${count} ${word}${count === 1 ? '' : 's'}`;

type Kept = {
  label: string;
  claimIds: string[];
  evidence: LedgerEntry[];
  note?: string;
  group: 'direct' | 'related';
};

export async function answerFit(
  deps: LedgerDeps,
  input: AnswerInput,
): Promise<ChatResponse | undefined> {
  const jobDescription = input.jobDescription ?? '';
  const started = Date.now();
  const log = deps.log ?? ((event) => console.info(JSON.stringify(event)));
  const byId = new Map(deps.claims.map((claim) => [claim.id, claim]));
  const ledgerIds = new Set(byId.keys());

  const hintIds = buildHintIds(matchHints(jobDescription), [], ledgerIds);
  let draft: FitDraft;
  let writerUsage: GeminiUsage | undefined;
  try {
    const result = await runFit(deps.writer, {
      knowledge: deps.knowledge,
      question: input.question,
      jobDescription,
      hintIds,
    });
    draft = result.draft;
    writerUsage = result.usage;
  } catch (error) {
    console.error(
      'The writer model was not usable for a job description.',
      errorName(error),
    );
    log({
      event: 'assistant_answer',
      path: 'fit',
      failed: true,
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel },
    });
    return undefined;
  }

  const followUps = starterSuggestions[input.activeRole].slice(0, 3);
  const emptyAnswer = (checker: ChatTrace['checker']): ChatResponse => ({
    requestId: input.requestId,
    answer: NO_REQUIREMENTS,
    answerStatus: 'not_covered',
    citations: [],
    followUps,
    trace: {
      path: 'fit',
      writerModel: deps.writerModel,
      checker,
      drafted: draft.requirements.length,
      dropped: draft.requirements.length,
    },
    telemetry: {
      questionCategory: 'unknown',
      latencyBucket: latencyBucketFor(Date.now() - started),
      modelId: deps.writerModel,
    },
  });
  if (draft.requirements.length === 0) {
    log({
      event: 'assistant_answer',
      path: 'fit',
      empty: true,
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel, ...usageFields(writerUsage) },
    });
    return emptyAnswer('skipped');
  }

  // Rules in code, requirement by requirement.
  const postingNumerals = new Set(numeralsIn(jobDescription));
  const context = createCheckContext(
    deps.claims,
    `${input.question}\n${jobDescription}`,
  );
  const seen = new Set<string>();
  const kept: Kept[] = [];
  const notShown: BriefItem[] = [];
  const notShownTerms: string[] = [];
  const notShownSegments: ChatSegment[] = [];
  const gapSegments: ChatSegment[] = [];

  for (const item of draft.requirements) {
    const label = item.requirement.replace(/\s+/g, ' ').trim();
    const key = norm(label);
    if (seen.has(key)) continue;
    if (findVerdictPhrases(label).length) continue;
    if (numeralsIn(label).some((n) => !postingNumerals.has(n))) continue;
    if (!groundedIn(label, jobDescription)) continue;
    seen.add(key);

    // A requirement that names a named gap gets his own gap answer.
    const gapId = matchHints(label).gapIds[0];
    const gapAnswer = gapId
      ? questionBank.find((answer) => answer.id === gapId)
      : undefined;
    if (gapAnswer) {
      notShown.push({
        text: `The site doesn’t show ${label}.`,
        detail: [gapAnswer.answer],
        detailLabel: 'Mohamed’s answer',
      });
      gapSegments.push({
        text: `${label}: ${gapAnswer.answer}`,
        label: 'own-words',
        claimIds: [gapAnswer.id],
        citations: byId.get(gapAnswer.id)?.citations ?? [],
      });
      continue;
    }

    if (item.group === 'not_shown') {
      notShown.push({ text: `The site doesn’t show ${label}.`, detail: [] });
      notShownTerms.push(label);
      notShownSegments.push({
        text: `The site doesn’t show ${label}.`,
        label: 'reading',
        claimIds: [],
        citations: [],
      });
      continue;
    }

    // Direct or related: only claims that exist, and only site or notes claims.
    const cited = [...new Set(item.claimIds)]
      .map((id) => byId.get(id))
      .filter(
        (claim): claim is LedgerEntry =>
          Boolean(claim) && claim!.origin !== 'own-words',
      );
    if (cited.length === 0) continue;
    const direct =
      item.group === 'direct' &&
      cited.some((claim) => claim.origin === 'site') &&
      cited.every((claim) => claim.strength === 'direct');
    const note = item.note.trim();
    const noteOk =
      note.length > 0 &&
      findVerdictPhrases(note).length === 0 &&
      checkDraft(
        [{ text: note, claimIds: cited.map((claim) => claim.id) }],
        context,
      ).dropped.length === 0;
    kept.push({
      label,
      claimIds: cited.map((claim) => claim.id),
      evidence: cited.slice(0, 2),
      ...(noteOk ? { note } : {}),
      group: direct ? 'direct' : 'related',
    });
  }

  // The checker reads each direct or related requirement beside its claims.
  const checkable = kept.map((entry, index) => ({
    index,
    text: `He has ${entry.group} experience with: ${entry.label}.${entry.note ? ` ${entry.note}` : ''}`,
    claimIds: entry.claimIds,
  }));
  const checked = await runChecker(deps.checker, checkable, context.claims);
  const removed = new Set(checked.flagged);
  const verified =
    checked.status === 'checked' && checked.unchecked.length === 0;
  const final: Kept[] = kept
    .filter((_, index) => !removed.has(index))
    // What could not be checked is never claimed as direct.
    .map((entry) => (verified ? entry : { ...entry, group: 'related' }));

  const toItem = (entry: Kept): BriefItem => ({
    text: entry.label,
    detail: entry.evidence.map((claim) => claim.text),
    ...(entry.note ? { note: entry.note } : {}),
  });
  const directItems = final.filter((e) => e.group === 'direct').map(toItem);
  const relatedItems = final.filter((e) => e.group === 'related').map(toItem);

  const total = directItems.length + relatedItems.length + notShown.length;
  if (total === 0) {
    log({
      event: 'assistant_answer',
      path: 'fit',
      empty: true,
      latencyMs: Date.now() - started,
      writer: { model: deps.writerModel, ...usageFields(writerUsage) },
      checker: { model: deps.checkerModel, ...usageFields(checked.usage) },
    });
    return emptyAnswer(verified ? 'passed' : 'unchecked');
  }

  const groups: BriefGroup[] = [
    { id: 'direct', label: 'Direct experience', items: directItems },
    { id: 'related', label: 'Related experience', items: relatedItems },
    { id: 'not-shown', label: 'Not shown on the site', items: notShown },
  ];
  const askHim = [...new Set(draft.askHimIds)]
    .map((id) => questionBank.find((answer) => answer.id === id))
    .filter((answer): answer is NonNullable<typeof answer> =>
      Boolean(answer && !answer.gap),
    )
    .slice(0, MAX_FIT_PROMPTS)
    .map((answer) => answer.question);
  const brief: BriefCardData = {
    title: 'Job description brief',
    summary: {
      label: 'Summary',
      text: `${plural(total, 'requirement')} in the posting: ${directItems.length} direct, ${relatedItems.length} related, ${notShown.length} not shown on the site.`,
    },
    groups,
    askHim,
  };

  // The older answer fields keep working for stored threads and old tests.
  const evidenceSegments: ChatSegment[] = final.map((entry) => ({
    text: entry.label,
    label: labelOf(entry.evidence),
    claimIds: entry.claimIds,
    citations: mergeCitations(entry.evidence.map((claim) => claim.citations)),
  }));
  const segments = [...evidenceSegments, ...gapSegments, ...notShownSegments];
  const citations = mergeCitations(
    segments.map((segment) => segment.citations),
  );
  const elapsed = Date.now() - started;
  const trace: ChatTrace = {
    path: 'fit',
    writerModel: deps.writerModel,
    checkerModel: deps.checkerModel,
    checker:
      checked.status === 'skipped'
        ? 'skipped'
        : verified
          ? 'passed'
          : 'unchecked',
    drafted: draft.requirements.length,
    dropped: draft.requirements.length - total,
  };
  log({
    event: 'assistant_answer',
    path: 'fit',
    latencyMs: elapsed,
    kept: total,
    dropped: trace.dropped,
    checker: checked.status,
    writer: { model: deps.writerModel, ...usageFields(writerUsage) },
    checkerUsage: { model: deps.checkerModel, ...usageFields(checked.usage) },
  });

  return {
    requestId: input.requestId,
    answer: briefToText(brief),
    answerStatus: 'answered',
    citations,
    segments,
    brief,
    actions: buildActions(citations, input.activeRole),
    ...(notShownTerms.length ? { notShown: notShownTerms } : {}),
    trace,
    followUps,
    telemetry: {
      questionCategory: 'unknown',
      latencyBucket: latencyBucketFor(elapsed),
      modelId: deps.writerModel,
    },
  };
}
