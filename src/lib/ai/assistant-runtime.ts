// Which pipeline answers a question: the ledger pipeline (Gemini writer and
// checker) or the classic one. Decided from Worker variables, the key and a
// daily question count kept in KV.

export type KvLike = {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
};

export type AssistantEnv = {
  ASSISTANT_MODE?: string;
  GEMINI_API_KEY?: string;
  GEMINI_WRITER_MODEL?: string;
  GEMINI_CHECKER_MODEL?: string;
  DAILY_MODEL_QUESTION_CAP?: string;
  CHAT_BUDGET?: KvLike;
};

export const DEFAULT_WRITER_MODEL = 'gemini-3.8-flash';
export const DEFAULT_CHECKER_MODEL = 'gemini-3.5-flash-lite';
export const DEFAULT_CAP = 200;
/** A count outlives its UTC day by a few hours, then KV removes it. */
const COUNT_TTL_SECONDS = 36 * 60 * 60;

export function parseCap(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_CAP;
}

/** Settings and two booleans for the health check; never the key itself. */
export function assistantConfig(env: AssistantEnv) {
  return {
    mode:
      env.ASSISTANT_MODE === 'ledger'
        ? ('ledger' as const)
        : ('classic' as const),
    keyPresent: Boolean(env.GEMINI_API_KEY?.trim()),
    writerModel: env.GEMINI_WRITER_MODEL?.trim() || DEFAULT_WRITER_MODEL,
    checkerModel: env.GEMINI_CHECKER_MODEL?.trim() || DEFAULT_CHECKER_MODEL,
    cap: parseCap(env.DAILY_MODEL_QUESTION_CAP),
  };
}

/**
 * Counts one model-backed question for the UTC day and says whether it is
 * within the cap. KV is eventually consistent, so the count is approximate,
 * which is enough for a cost guard. A missing or failing store never blocks a
 * question.
 */
export async function takeBudget(
  kv: KvLike | undefined,
  cap: number,
  now: Date = new Date(),
): Promise<boolean> {
  if (!kv) return true;
  const key = `model-questions:${now.toISOString().slice(0, 10)}`;
  try {
    const used = Number.parseInt((await kv.get(key)) ?? '0', 10) || 0;
    if (used >= cap) return false;
    await kv.put(key, String(used + 1), { expirationTtl: COUNT_TTL_SECONDS });
    return true;
  } catch {
    console.error('The daily question count could not be read or written.');
    return true;
  }
}

let warnedAboutKey = false;
export const resetConfigWarning = () => {
  warnedAboutKey = false;
};

export async function chooseAssistant(
  env: AssistantEnv,
  now: Date = new Date(),
): Promise<'ledger' | 'classic'> {
  const config = assistantConfig(env);
  if (config.mode !== 'ledger') return 'classic';
  if (!config.keyPresent) {
    if (!warnedAboutKey) {
      warnedAboutKey = true;
      console.error(
        'ASSISTANT_MODE is "ledger" but GEMINI_API_KEY is not set; running the classic pipeline.',
      );
    }
    return 'classic';
  }
  return (await takeBudget(env.CHAT_BUDGET, config.cap, now))
    ? 'ledger'
    : 'classic';
}
