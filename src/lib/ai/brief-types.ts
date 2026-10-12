// The shape of a brief card: what a role's stored brief and a pasted
// job-description brief both show. Shared by the server (which builds the
// job-description brief) and the chat panel (which renders either).

export type BriefItem = {
  text: string;
  /** Evidence lines: the site's claims word for word, or his own answer. */
  detail: string[];
  /** Names the detail lines when they are not site claims, e.g. his own answer. */
  detailLabel?: string;
  /** The assistant's one-line reading; only kept when it passes the checks. */
  note?: string;
};

export type BriefGroup = {
  id: 'direct' | 'related' | 'not-shown';
  label: string;
  items: BriefItem[];
};

export type BriefCardData = {
  title: string;
  /** His own words, or a line counted by code, labelled; shown first. */
  summary?: { label: string; text: string };
  groups: BriefGroup[];
  /** Questions that lead into his strengths. */
  askHim: string[];
  /** The role's own page, when there is one. */
  pageHref?: string;
};
