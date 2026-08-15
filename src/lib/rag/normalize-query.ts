const stopWords = new Set([
  'a',
  'an',
  'and',
  'are',
  'about',
  'can',
  'did',
  'do',
  'does',
  'for',
  'he',
  'him',
  'how',
  'i',
  'in',
  'is',
  'it',
  'me',
  'mohamed',
  'of',
  'on',
  'please',
  'tell',
  'the',
  'to',
  'was',
  'what',
  'where',
  'with',
  'you',
]);

export function normalizeQuery(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9+#./\-\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function meaningfulTerms(value: string): string[] {
  return [
    ...new Set(
      normalizeQuery(value)
        .split(' ')
        .filter((term) => term.length > 1 && !stopWords.has(term)),
    ),
  ];
}
