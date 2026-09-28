const WORDS_PER_MINUTE = 230;

/** Computes a rounded-up reading time in minutes from raw markdown/MDX text. */
export function computeReadingTime(rawText: string): number {
  const words = rawText
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
