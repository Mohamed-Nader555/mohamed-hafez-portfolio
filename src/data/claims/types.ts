// Shapes of the data `npm run claims:apply` writes into this folder from
// Mohamed's notes (the assistant pack and his question bank).
import type { RoleId } from '@/types/content';

export type ClaimStrengthName = 'direct' | 'related';

/** A bridge from the way job adverts name something to what the site shows. */
export type Bridge = {
  id: string;
  /** Advert wording the bridge answers. */
  phrases: string[];
  strength: ClaimStrengthName;
  statement: string;
  /** What the bridge does not claim; shown with the statement. */
  limit?: string;
  /** Ledger claims that support the statement (two to six). */
  basisIds: string[];
};

/** core and working are direct experience; exposure is related, "exposure only". */
export type SkillTierName = 'core' | 'working' | 'exposure';

export type SkillTierGroup = {
  id: string;
  area: string;
  tier: SkillTierName;
  skills: string[];
  /** Ledger claims or résumés that mention these skills. */
  basisIds: string[];
  resumeSourceIds: string[];
};

export type WordingRule = {
  topic: string;
  say: string;
  never: string[];
};

export type BankAnswer = {
  id: string;
  group: string;
  question: string;
  alsoAskedAs: string[];
  /** Mohamed's answer in the first person, as he approved it. */
  answer: string;
  lens?: RoleId;
  /** A gap answer: given in chat only when asked, never listed on a page. */
  gap: boolean;
  /** Words in a question that bring a gap answer up. */
  triggers: string[];
  /** Ledger claims a gap answer rests on. */
  basisIds: string[];
};
