// Text checks shared by `npm run claims:apply`, the content tests and, later,
// the answer checks in stage C. They work on plain strings.

/**
 * Wording the pack says must never appear as a claim, kept as phrases a check
 * can find. The pack's own `never` lists hold descriptions such as "any RAGAS
 * score" that cannot be searched for, so this is the searchable subset.
 */
export const NEVER_PHRASES = [
  'technical manager',
  'team lead',
  'managed a team',
  'production deployment at scale',
  'rgbm',
  'safety guarantee',
  'sole author',
  'sole authorship',
  'msc',
  'ceh certified',
  'certified ethical hacker',
  'peft',
  'lora',
  'pdf redaction',
  'trello',
  'azure devops',
  'agile ceremonies',
  'documentum d2',
  'xcp',
  'immediately available',
] as const;

/** The assistant maps evidence; it never rates a candidate or predicts a hire. */
export const VERDICT_PHRASES = [
  'good fit',
  'great fit',
  'strong fit',
  'perfect fit',
  'excellent fit',
  'right fit',
  'best fit',
  'poor fit',
  'weak fit',
  'not a fit',
  'ideal candidate',
  'perfect candidate',
  'best candidate',
  'should hire',
  'must hire',
  'recommend hiring',
  'highly recommend',
  'match score',
  'fit score',
] as const;

const NEGATION = /\b(?:not|no|never|without|nor|neither|cannot)\b|n[’']t\b/i;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The listed phrases found in the text. A phrase is ignored when a negation
 * ("does not show", "no", "never") comes before it in the same sentence, so a
 * claim may say what the site does not show.
 */
export function findPhrases(
  text: string,
  phrases: readonly string[],
): string[] {
  const found: string[] = [];
  for (const phrase of phrases) {
    const pattern = new RegExp(
      `(?<![a-z0-9])${escapeRegExp(phrase)}(?![a-z0-9])`,
      'gi',
    );
    for (const match of text.matchAll(pattern)) {
      const before = text.slice(0, match.index);
      const sentence = before.slice(
        Math.max(before.lastIndexOf('. '), before.lastIndexOf('? ')) + 1,
      );
      if (!NEGATION.test(sentence)) {
        found.push(phrase);
        break;
      }
    }
  }
  return found;
}

export const findNeverPhrases = (text: string) =>
  findPhrases(text, NEVER_PHRASES);
export const findVerdictPhrases = (text: string) =>
  findPhrases(text, VERDICT_PHRASES);

/**
 * Numbers written as digits, without thousands separators or a percent sign.
 * Digits attached to letters ("F1", "IOB2", "Qwen2.5") belong to a name and
 * are not numbers.
 */
export function numeralsIn(text: string): string[] {
  const numerals = text.matchAll(/(?<![A-Za-z\d.,])\d+(?:,\d{3})*(?:\.\d+)?/g);
  return [...new Set([...numerals].map((match) => match[0].replace(/,/g, '')))];
}
