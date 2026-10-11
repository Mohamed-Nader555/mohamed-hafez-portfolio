// Spending guards for every script that calls a paid model (brief 3, section
// 0a). `npm run answers:evaluate` and, later, `npm run fit` both start with
// these checks, so a paid run is always deliberate, named and small.

/** The most cases one run may ask. */
export const MAX_PAID_CASES = 10;

export type GuardResult<T = object> =
  ({ ok: true } & T) | { ok: false; message: string };

/** Paid calls only start when the environment says `ALLOW_PAID_MODEL_CALLS=yes`. */
export function checkPaidSwitch(
  env: Record<string, string | undefined>,
): GuardResult {
  if (env.ALLOW_PAID_MODEL_CALLS === 'yes') return { ok: true };
  return {
    ok: false,
    message:
      'This script calls a paid model. Set ALLOW_PAID_MODEL_CALLS=yes to allow it, after counting the call against the allowance in LIVE-PROGRESS.md.',
  };
}

/** Case ids from `--only a,b` and bare arguments; `--stage` and its value are skipped. */
export function parseCaseIds(args: string[]): string[] {
  const ids: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]!;
    if (arg === '--stage') {
      i += 1;
      continue;
    }
    if (arg === '--only') continue;
    for (const part of arg.split(',')) {
      const id = part.trim();
      if (id && !ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

export function checkPaidRun(input: {
  env: Record<string, string | undefined>;
  requestedIds: string[];
  knownIds: string[];
}): GuardResult<{ ids: string[] }> {
  const allowed = checkPaidSwitch(input.env);
  if (!allowed.ok) return allowed;
  const ids = input.requestedIds;
  if (!ids.length)
    return {
      ok: false,
      message:
        'Name the case ids to run (for example `npm run answers:evaluate -- --only facts-asc-pie`). Full runs are not allowed.',
    };
  const unknown = ids.filter((id) => !input.knownIds.includes(id));
  if (unknown.length)
    return {
      ok: false,
      message: `Not in the evaluation set: ${unknown.join(', ')}.`,
    };
  if (ids.length > MAX_PAID_CASES)
    return {
      ok: false,
      message: `At most ${MAX_PAID_CASES} cases per run; ${ids.length} were named.`,
    };
  return { ok: true, ids };
}
