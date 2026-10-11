// Next steps offered under an answer: the case study of the project it cites,
// the résumé for the active role, and an email link. All three come from
// public data; the visitor's question never passes through here.
import { profile } from '@/data/profile';
import { roles } from '@/data/roles';
import type { Citation } from '@/lib/rag/types';
import type { RoleId } from '@/types/content';
import type { ChatAction } from './types';

export function buildActions(
  citations: readonly Citation[],
  activeRole: RoleId,
): ChatAction[] {
  const actions: ChatAction[] = [];
  const caseStudy = citations.find((citation) =>
    citation.sourceId.startsWith('case-study-'),
  );
  if (caseStudy)
    actions.push({
      kind: 'case-study',
      label: caseStudy.label,
      href: caseStudy.href,
    });
  const role = roles.find((candidate) => candidate.id === activeRole);
  if (role)
    actions.push({
      kind: 'resume',
      label: `Résumé: ${role.label}`,
      href: role.resumeHref,
    });
  actions.push({
    kind: 'email',
    label: 'Email Mohamed about this',
    address: profile.contacts.email,
  });
  return actions;
}
