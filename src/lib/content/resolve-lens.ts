import { evidence, projects, roles } from '@/data';
import type {
  EvidenceRecord,
  ProjectRecord,
  RoleId,
  RoleLens,
} from '@/types/content';

export type ResolvedLens = Readonly<{
  roleId: RoleId;
  label: string;
  route: string;
  title: string;
  description: string;
  summary: string;
  resumeHref: string;
  sourceIds: readonly string[];
  projects: readonly ProjectRecord[];
  evidence: readonly EvidenceRecord[];
}>;

function assertUniqueIds(
  ids: readonly string[],
  duplicateMessage: (id: string) => string,
) {
  const seen = new Set<string>();

  for (const id of ids) {
    if (seen.has(id)) {
      throw new Error(duplicateMessage(id));
    }

    seen.add(id);
  }
}

export function rankProjectsForRole(
  role: RoleLens,
  projectCatalog: readonly ProjectRecord[],
): readonly ProjectRecord[] {
  assertUniqueIds(
    projectCatalog.map(({ id }) => id),
    (id) => `Duplicate project id in catalog: ${id}`,
  );
  assertUniqueIds(
    role.featuredProjectIds,
    (id) => `Duplicate featured project id for ${role.id}: ${id}`,
  );

  const projectIds = new Set(projectCatalog.map(({ id }) => id));

  for (const id of role.featuredProjectIds) {
    if (!projectIds.has(id)) {
      throw new Error(`Missing featured project id for ${role.id}: ${id}`);
    }
  }

  const featuredOrder = new Map(
    role.featuredProjectIds.map((id, index) => [id, index]),
  );

  return Object.freeze(
    [...projectCatalog].sort((left, right) => {
      const weightDifference =
        right.roleWeights[role.id] - left.roleWeights[role.id];

      if (weightDifference !== 0) {
        return weightDifference;
      }

      const featuredDifference =
        (featuredOrder.get(left.id) ?? role.featuredProjectIds.length) -
        (featuredOrder.get(right.id) ?? role.featuredProjectIds.length);

      if (featuredDifference !== 0) {
        return featuredDifference;
      }

      return left.title.localeCompare(right.title, 'en');
    }),
  );
}

function rankEvidenceForRole(
  roleId: RoleId,
  records: readonly EvidenceRecord[],
): readonly EvidenceRecord[] {
  return Object.freeze(
    [...records].sort(
      (left, right) =>
        right.roleWeights[roleId] - left.roleWeights[roleId] ||
        left.title.localeCompare(right.title, 'en'),
    ),
  );
}

export function resolveLens(roleId: RoleId): ResolvedLens {
  const role = roles.find((candidate) => candidate.id === roleId);

  if (!role) {
    throw new Error(`Unknown recruiter lens: ${roleId}`);
  }

  return Object.freeze({
    roleId: role.id,
    label: role.label,
    route: role.route,
    title: role.title,
    description: role.description,
    summary: role.summary,
    resumeHref: role.resumeHref,
    sourceIds: Object.freeze([...role.sourceIds]),
    projects: rankProjectsForRole(role, projects),
    evidence: rankEvidenceForRole(role.id, evidence),
  });
}
