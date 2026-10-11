// What a brief card shows and the plain text "Copy brief" puts on the
// clipboard. Used by the role picker (stored briefs) and by the pasted
// job-description brief. Pure functions; no model is involved.
import type { RoleBrief } from '@/data/claims/types';

export type BriefItem = { text: string; detail: string[] };
export type BriefGroup = {
  id: 'direct' | 'related' | 'not-shown';
  label: string;
  items: BriefItem[];
};
export type BriefCardData = {
  title: string;
  /** His own words, labelled; shown first. */
  summary?: { label: string; text: string };
  groups: BriefGroup[];
  /** Questions that lead into his strengths. */
  askHim: string[];
  /** The role's own page, when there is one. */
  pageHref?: string;
};

export const GROUP_LABELS = {
  direct: 'Direct experience',
  related: 'Related experience',
  'not-shown': 'Not shown on the site',
} as const;

export function roleBriefToCard(brief: RoleBrief): BriefCardData {
  const group = (
    id: 'direct' | 'related',
    requirements: RoleBrief['direct'],
  ): BriefGroup => ({
    id,
    label: GROUP_LABELS[id],
    items: requirements.map((requirement) => ({
      text: requirement.text,
      detail: requirement.evidence.map((item) => item.text),
    })),
  });
  return {
    title: brief.title,
    summary: { label: 'Mohamed’s answer', text: brief.summary.text },
    groups: [
      group('direct', brief.direct),
      ...(brief.related.length ? [group('related', brief.related)] : []),
    ],
    askHim: brief.askHim.map((prompt) => prompt.question),
    pageHref: `/hiring/${brief.slug}`,
  };
}

/** A plain-text brief a recruiter can paste into an email. */
export function briefToText(card: BriefCardData, origin = ''): string {
  const blocks: string[][] = [[card.title]];
  if (card.summary)
    blocks.push([`${card.summary.label}: “${card.summary.text}”`]);
  for (const group of card.groups)
    if (group.items.length)
      blocks.push([
        group.label,
        ...group.items.flatMap((item) => [
          `- ${item.text}`,
          ...item.detail.map((line) => `  ${line}`),
        ]),
      ]);
  if (card.askHim.length)
    blocks.push(['Ask him about', ...card.askHim.map((q) => `- ${q}`)]);
  if (card.pageHref) blocks.push([`Full page: ${origin}${card.pageHref}`]);
  return blocks.map((lines) => lines.join('\n')).join('\n\n');
}
