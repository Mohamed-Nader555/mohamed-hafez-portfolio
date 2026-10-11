// The pure core of `npm run briefs:check`: one checker-model call per brief,
// each requirement beside the claims behind it (brief 3, task D1). The entry
// point (check-role-briefs.ts) wires it to the real model behind the paid-call
// guard; the unit tests use a fake provider.
import { runChecker } from '../src/lib/ai/checker.ts';
import type {
  GeminiProvider,
  GeminiUsage,
} from '../src/lib/ai/gemini-provider.ts';
import type { RoleBrief } from '../src/data/claims/types.ts';
import type { LedgerEntry } from '../src/lib/rag/ledger.ts';

export type BriefCheck = {
  slug: string;
  status: 'checked' | 'skipped' | 'failed';
  /** The requirement texts the checker marked overstated or unsupported. */
  flagged: string[];
  usage?: GeminiUsage;
};

export async function checkRoleBrief(
  checker: GeminiProvider,
  brief: RoleBrief,
  claims: readonly LedgerEntry[],
): Promise<BriefCheck> {
  const requirements = [...brief.direct, ...brief.related];
  const result = await runChecker(
    checker,
    requirements.map((requirement, index) => ({
      index,
      text: requirement.text,
      claimIds: requirement.evidence.map((e) => e.claimId),
    })),
    new Map(claims.map((claim) => [claim.id, claim])),
  );
  return {
    slug: brief.slug,
    status: result.status,
    flagged: result.flagged.map((index) => requirements[index]!.text),
    ...(result.usage ? { usage: result.usage } : {}),
  };
}
