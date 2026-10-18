/**
 * Publishing rules for the Eklan role (Founding AI Engineer, Sep 2026 to
 * present). Mohamed set them on 18 Oct 2026; the internal product names are
 * held separately, as hashes, in `forbidden-terms.ts`.
 *
 * - Model families only (Gemini Live, Gemini Flash, OpenAI GPT), never an
 *   internal model id.
 * - Latency and load numbers always say they were measured in testing against
 *   the live models.
 * - No usage numbers (users, learners, revenue, retention).
 * - Never claim teammates' work: Stripe billing and paywall, auth hardening,
 *   LiveKit live classes, the mobile app, the dark theme, or the visual design
 *   of the simulation screens.
 * - No em dashes.
 * - Python, Java, Kotlin, Docker and the ML stack come from earlier roles and
 *   are never attached to Eklan work.
 */
export const LIVE_MODEL_QUALIFIER =
  'measured in testing against the live models';

const MODEL_ID =
  /\b(?:gemini|gpt|o[134]|chatgpt|claude)-(?=[\w.-]*\d)[\w.-]+|\bflash-lite\b|\bgpt-?\d|\bgemini\s+\d/gi;

const TEAMMATE_WORK =
  /\bstripe\b|\bpaywall\b|\blivekit\b|auth(?:entication)? hardening|better auth|\bmobile app\b|\bdark (?:theme|mode)\b|light and dark|\bredesign\b|visual design/gi;

const USAGE_NUMBER =
  /\b\d[\d,.]*\+?\s*(?:k\s+)?(?:users|customers|nurses|clinicians|daily|monthly|signups|sign-ups)\b|\brevenue\b|\bretention rate\b|\bactive learners\b/gi;

const TIMING_OR_LOAD =
  /(?:~|\b)\d+(?:\.\d+)?(?:\s?[–-]\s?\d+(?:\.\d+)?)?\s?(?:ms|s|sec|secs|seconds?)\b|\bp(?:50|90)\b|\bconcurrent\b|\bload[- ]test|\b0 errors\b|\breport time\b|\bfaster\b|\blatency\b/i;

/** Technologies from Mohamed's earlier roles, never attached to Eklan. */
export const NOT_USED_AT_EKLAN = [
  'Python',
  'Java',
  'Kotlin',
  'Docker',
  'PyTorch',
  'Hugging Face',
] as const;

const unique = (items: Iterable<string>) => [...new Set(items)];

export const emDashesIn = (text: string) => (text.match(/—/g) ?? []).length;

export const modelIdsIn = (text: string) =>
  unique((text.match(MODEL_ID) ?? []).map((m) => m.toLowerCase()));

export const teammateWorkIn = (text: string) =>
  unique((text.match(TEAMMATE_WORK) ?? []).map((m) => m.toLowerCase()));

export const usageNumbersIn = (text: string) =>
  unique((text.match(USAGE_NUMBER) ?? []).map((m) => m.toLowerCase()));

export const mentionsTimingOrLoad = (text: string) => TIMING_OR_LOAD.test(text);

export const carriesQualifier = (text: string) =>
  text.toLowerCase().replace(/\s+/g, ' ').includes(LIVE_MODEL_QUALIFIER);

/**
 * Blocks of prose (split on blank lines) that state a latency or load number
 * without saying it was measured in testing against the live models.
 */
export function unqualifiedTimingBlocks(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !block.startsWith('import '))
    .filter((block) => mentionsTimingOrLoad(block) && !carriesQualifier(block));
}
