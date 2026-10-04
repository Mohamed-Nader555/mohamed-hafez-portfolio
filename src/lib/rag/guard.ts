/**
 * Questions the assistant never answers. Two tiers:
 *
 * - hard: always refused (medical, compensation, political, private-life,
 *   prompt-injection, hidden or confidential material, references);
 * - soft: generic words that signal an off-topic or real-time question, but
 *   that are also ordinary words in the portfolio ("weather" in the Weather
 *   Checker project, "private" in a privacy-safe method). A question that
 *   names a project or a verified technology is never blocked by these.
 */
const hard: RegExp[] = [
  /\b(medical|medication|doctor|diagnos\w*|health (history|condition|issue|problem)s?|disabilit\w+|illness|therapy|pregnan\w*|mental health)\b/i,
  /\b(salary|salaries|compensation|wage|wages|pay (expectation|rate|range|scale)|expected pay|hourly rate|day rate|rate card|how much (does|would|will|do|is) (he|mohamed|his)\b.*\b(earn|make|cost|charge|paid|worth)|how much .* (paid|earn))\b/i,
  /\b(politic\w*|election|voting|religio\w*|church|mosque|marital|married|girlfriend|boyfriend|wife|husband|children|kids|how old|birthday|date of birth|home address|street address|social insurance|passport number|ssn)\b/i,
  /\b(ignore|disregard|forget|override|bypass)\b.{0,40}\b(previous|prior|above|earlier|all|your|system|these)\b.{0,40}\b(instruction|prompt|rule|guideline|polic)\w*/i,
  /\b(system prompt|developer message|your (hidden )?instructions|jailbreak|developer mode|dan mode|reveal (your|the) (prompt|rules|instructions)|you are now|from now on you|pretend (to be|you are)|act as if|act like|roleplay as)\b/i,
  /\b(hidden|private|confidential|secret|internal|unpublished) (document|file|note|source|data|information|material)s?\b/i,
  /\b(former|previous|current|his) (manager|boss|supervisor|colleague|coworker|employer)s?\b.*\b(contact|call|reach|email|phone|number)\b|\bcontact (his|a|any|your) (former |previous |current )?(reference|manager|boss|supervisor|colleague)s?\b|\breference check\b/i,
  /\b(api key|secret key|password|access token)\b/i,
  /\breferences?\b.{0,40}\b(phone|number|email|contact|call)\b/i,
];

const soft: RegExp[] = [
  /\b(weather|temperature|forecast|news|stock price|stocks|bitcoin|horoscope|lottery|sports? score|prime minister|president of|capital of)\b/i,
  /\bprivate\b(?! (instruction|instructor|tutor|tutoring|teaching|lesson))/i,
  /\b(recipe for|favou?rite|hobbies|hobby|pets?)\b/i,
  /\bwork for (us|me|my|our)\b|\b(hire|join) (him|us|our|my)\b.*\b(for|at) \d/i,
  /^\s*(please\s+)?(write|compose|draft|generate|translate|solve|calculate|tell me a joke|give me a recipe)\b/i,
  /\b(tell me a joke|write (me )?(a|an) (poem|essay|story|song|cover letter|email))\b/i,
];

export type GuardVerdict = 'allowed' | 'refuse';

export function checkQuestion(
  question: string,
  namesEntity: boolean,
): GuardVerdict {
  const text = question.replace(/[’‘]/g, "'");
  if (hard.some((pattern) => pattern.test(text))) return 'refuse';
  if (!namesEntity && soft.some((pattern) => pattern.test(text)))
    return 'refuse';
  return 'allowed';
}
