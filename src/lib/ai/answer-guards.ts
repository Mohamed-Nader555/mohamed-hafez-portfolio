/** Numbers as written: "99.5", "2,025,878", "2026" (percent signs and commas dropped). */
export function extractNumbers(text: string): string[] {
  return [
    ...new Set(
      (text.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((value) =>
        value.replace(/,/g, '').replace(/\.$/, ''),
      ),
    ),
  ];
}

/**
 * Number guard: every number in a generated answer must also appear in the
 * evidence it was given. A model that invents or mis-copies a figure is
 * discarded in favour of the extractive fallback.
 */
export function ungroundedNumbers(
  answer: string,
  evidenceTexts: readonly string[],
): string[] {
  const grounded = new Set(extractNumbers(evidenceTexts.join(' ')));
  return extractNumbers(answer).filter((value) => !grounded.has(value));
}

/** The first balanced `{ … }` object in a string, ignoring braces in strings. */
export function firstJsonObject(text: string): string | undefined {
  const start = text.indexOf('{');
  if (start < 0) return undefined;
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const char = text[i]!;
    if (inString) {
      if (char === '\\') i++;
      else if (char === '"') inString = false;
    } else if (char === '"') inString = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return text.slice(start, i + 1);
  }
  return undefined;
}

/**
 * Tolerant reading of a model reply: a provider envelope (`{ response }`), a
 * JSON string, JSON wrapped in prose or a code fence, or plain text. Plain
 * text is treated as the answer itself; the caller cites the retrieved
 * sources.
 */
export function parseModelOutput(raw: unknown): unknown {
  if (raw && typeof raw === 'object') {
    if ('response' in raw) return parseModelOutput(raw.response);
    return raw;
  }
  if (typeof raw !== 'string') return raw;
  const text = raw.trim();
  for (const candidate of [text, firstJsonObject(text)]) {
    if (!candidate) continue;
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object') return parseModelOutput(parsed);
    } catch {
      // Fall through to the next candidate.
    }
  }
  return text
    ? {
        answer: text.replace(/^```(?:json)?|```$/g, '').trim(),
        answerStatus: 'answered',
        citationIds: [],
        followUps: [],
      }
    : raw;
}
