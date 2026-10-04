// Words that carry no search meaning. Dropped at build time (never indexed) and
// at query time, so both sides agree.
export const STOP_WORDS = new Set([
  'a',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'been',
  'by',
  'can',
  'could',
  'did',
  'do',
  'does',
  'for',
  'from',
  'get',
  'give',
  'got',
  'had',
  'has',
  'have',
  'he',
  'her',
  'him',
  'his',
  'how',
  'i',
  'if',
  'in',
  'is',
  'it',
  'list',
  'may',
  'me',
  'might',
  'name',
  'of',
  'on',
  'or',
  'please',
  'shall',
  'she',
  'should',
  'show',
  'tell',
  'that',
  'the',
  'their',
  'there',
  'they',
  'this',
  'to',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'who',
  'why',
  'will',
  'with',
  'would',
  'you',
  'your',
]);

// Searched, but never enough on their own to make a question answerable:
// "Tell me about Mohamed" is handled by an overview route, not by these words.
export const WEAK_TERMS = new Set(['mohamed', 'hafez', 'about']);

export function normalizeQuery(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]s\b/g, '')
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9+#./\-\s]/g, ' ')
    .replace(/(^|\s)[./-]+(?=\S)/g, '$1')
    .replace(/(?<=\S)[./-]+(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** A light plural stemmer so "projects" finds "project" and the reverse. */
export function stem(term: string): string {
  if (term.length <= 3) return term;
  if (term.endsWith('ies')) return `${term.slice(0, -3)}y`;
  if (/(?:ss|us|is|ous)$/.test(term)) return term;
  if (/(?:ches|shes|xes|sses)$/.test(term)) return term.slice(0, -2);
  return term.endsWith('s') ? term.slice(0, -1) : term;
}

/** Normalized, stemmed phrase used to compare names with questions. */
export const matchKey = (value: string): string =>
  normalizeQuery(value).split(' ').map(stem).join(' ');

/** MiniSearch term processor: normalize, stem, drop stop words. */
export function indexTerm(term: string): string | null {
  const normalized = normalizeQuery(term);
  if (!normalized || STOP_WORDS.has(normalized)) return null;
  return stem(normalized);
}

/** Search terms for a question (stop words removed, stemmed, unique). */
export function meaningfulTerms(value: string): string[] {
  return [
    ...new Set(
      normalizeQuery(value)
        .split(' ')
        .filter((term) => term.length > 1 && !STOP_WORDS.has(term))
        .map(stem),
    ),
  ];
}

/** The subset of search terms that can justify an answer by themselves. */
export const contentTerms = (value: string): string[] =>
  meaningfulTerms(value).filter((term) => !WEAK_TERMS.has(term));
