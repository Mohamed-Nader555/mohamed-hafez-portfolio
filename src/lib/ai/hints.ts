// Matching a visitor's question, in code, against the wording the notes expect:
// the advert phrases of each bridge, the other ways each answer is asked, and
// the trigger words of each gap answer. The matches go to the writer as hints.
import { bridges } from '@/data/claims/bridges';
import { questionBank } from '@/data/claims/question-bank';
import type { Bridge, BankAnswer } from '@/data/claims/types';
import { matchKey, meaningfulTerms } from '@/lib/rag/normalize-query';

export type MatchedHints = {
  bridgeIds: string[];
  answerIds: string[];
  gapIds: string[];
};

export const MAX_HINT_IDS = 12;

/** Words of a phrase as the matcher compares them: stemmed, "-ing" dropped. */
function tokens(text: string): string[] {
  return matchKey(text)
    .split(' ')
    .filter(Boolean)
    .map((word) => (word.length > 5 ? word.replace(/ing$/, '') : word));
}

/** Every word of the trigger appears, whole, in the text. */
export function triggerMatches(text: string, trigger: string): boolean {
  const wanted = tokens(trigger);
  if (wanted.length === 0) return false;
  const present = new Set(tokens(text));
  return wanted.every((word) => present.has(word));
}

/** At least three quarters of the candidate's words are in the question. */
function sameQuestion(question: string, candidate: string): boolean {
  const asked = new Set(meaningfulTerms(question));
  const wanted = meaningfulTerms(candidate);
  if (wanted.length === 0) return false;
  const shared = wanted.filter((term) => asked.has(term)).length;
  return shared >= Math.min(2, wanted.length) && shared / wanted.length >= 0.75;
}

type HintData = {
  bridges: readonly Bridge[];
  answers: readonly BankAnswer[];
};

export function matchHints(
  question: string,
  data: HintData = { bridges, answers: questionBank },
): MatchedHints {
  const bridgeIds = data.bridges
    .filter((bridge) =>
      bridge.phrases.some((phrase) => triggerMatches(question, phrase)),
    )
    .map((bridge) => bridge.id);
  const gapIds = data.answers
    .filter(
      (answer) =>
        answer.gap &&
        answer.triggers.some((trigger) => triggerMatches(question, trigger)),
    )
    .map((answer) => answer.id);
  const answerIds = data.answers
    .filter(
      (answer) =>
        !answer.gap &&
        [answer.question, ...answer.alsoAskedAs].some((candidate) =>
          sameQuestion(question, candidate),
        ),
    )
    .map((answer) => answer.id);
  return { bridgeIds, answerIds, gapIds };
}

/**
 * The claim ids handed to the writer: gap answers, then his answers, then
 * bridges, then what keyword search ranked highest. Only ledger ids count.
 */
export function buildHintIds(
  matched: MatchedHints,
  keywordIds: readonly string[],
  ledgerIds: ReadonlySet<string>,
  max = MAX_HINT_IDS,
): string[] {
  const ordered = [
    ...matched.gapIds,
    ...matched.answerIds,
    ...matched.bridgeIds,
    ...keywordIds,
  ];
  return [...new Set(ordered)].filter((id) => ledgerIds.has(id)).slice(0, max);
}
