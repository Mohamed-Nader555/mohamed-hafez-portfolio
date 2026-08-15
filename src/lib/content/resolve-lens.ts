import { evidence, projects, roles, sources } from '@/data';
import type {
  EvidenceRecord,
  ProjectRecord,
  RoleId,
  RoleLens,
  SourceRecord,
} from '@/types/content';

export type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

export type ResolvedLens = Readonly<{
  roleId: RoleId;
  label: string;
  route: string;
  title: string;
  description: string;
  summary: string;
  resumeHref: string;
  sourceIds: readonly string[];
  projects: readonly DeepReadonly<ProjectRecord>[];
  evidence: readonly DeepReadonly<EvidenceRecord>[];
  depthEvidence: Readonly<{
    research: readonly DeepReadonly<EvidenceRecord>[];
    teaching: readonly DeepReadonly<EvidenceRecord>[];
  }>;
}>;

type PublicSourceRecord = DeepReadonly<
  SourceRecord & { isPublic: true; publicHref: string }
>;

function immutableProjectCopy(
  project: ProjectRecord,
): DeepReadonly<ProjectRecord> {
  return Object.freeze({
    ...project,
    roles: Object.freeze([...project.roles]),
    roleWeights: Object.freeze({ ...project.roleWeights }),
    technologies: Object.freeze([...project.technologies]),
    sourceIds: Object.freeze([...project.sourceIds]),
  });
}

function immutableEvidenceCopy(
  record: EvidenceRecord,
): DeepReadonly<EvidenceRecord> {
  return Object.freeze({
    ...record,
    topics: Object.freeze([...record.topics]),
    aliases: Object.freeze([...record.aliases]),
    roleWeights: Object.freeze({ ...record.roleWeights }),
    sourceIds: Object.freeze([...record.sourceIds]),
  });
}

export function selectPublicSourceForEvidence(
  record: DeepReadonly<EvidenceRecord>,
  roleId: RoleId,
  sourceRegistry: readonly SourceRecord[],
): PublicSourceRecord {
  const sourceById = new Map(
    sourceRegistry.map((source) => [source.id, source]),
  );
  const candidates = record.sourceIds
    .map((id) => sourceById.get(id))
    .filter(
      (
        source,
      ): source is SourceRecord & { isPublic: true; publicHref: string } =>
        Boolean(source?.isPublic && source.publicHref),
    );
  const selected =
    candidates.find((source) => source.kind === 'official') ??
    candidates.find((source) => source.id === `resume-${roleId}`) ??
    candidates.find((source) => source.kind === 'case-study') ??
    candidates.find((source) => source.kind === 'resume') ??
    candidates.find((source) => source.kind === 'approved-source') ??
    candidates.find((source) => source.kind === 'github');

  if (!selected) {
    throw new Error(`Evidence ${record.id} lacks an eligible public source.`);
  }

  return Object.freeze({ ...selected });
}

export function resolveDepthEvidenceForRole(
  role: RoleLens,
  evidenceCatalog: readonly EvidenceRecord[],
  sourceRegistry: readonly SourceRecord[],
) {
  const configuredIds = [
    ...role.depthEvidenceIds.research,
    ...role.depthEvidenceIds.teaching,
  ];
  assertUniqueIds(
    configuredIds,
    (id) => `Duplicate depth evidence id for ${role.id}: ${id}`,
  );
  const evidenceById = new Map(
    evidenceCatalog.map((record) => [record.id, record]),
  );

  const resolveRecords = (ids: readonly string[]) =>
    Object.freeze(
      ids.map((id) => {
        const record = evidenceById.get(id);
        if (!record) {
          throw new Error(`Missing depth evidence id for ${role.id}: ${id}`);
        }
        try {
          selectPublicSourceForEvidence(record, role.id, sourceRegistry);
        } catch {
          throw new Error(
            `No eligible public source for depth evidence ${id} on ${role.id}`,
          );
        }
        return immutableEvidenceCopy(record);
      }),
    );

  return Object.freeze({
    research: resolveRecords(role.depthEvidenceIds.research),
    teaching: resolveRecords(role.depthEvidenceIds.teaching),
  });
}

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
): readonly DeepReadonly<ProjectRecord>[] {
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

  const ranked = [...projectCatalog].sort((left, right) => {
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
  });

  return Object.freeze(ranked.map(immutableProjectCopy));
}

function rankEvidenceForRole(
  roleId: RoleId,
  records: readonly EvidenceRecord[],
): readonly DeepReadonly<EvidenceRecord>[] {
  const ranked = [...records].sort(
    (left, right) =>
      right.roleWeights[roleId] - left.roleWeights[roleId] ||
      left.title.localeCompare(right.title, 'en'),
  );

  return Object.freeze(ranked.map(immutableEvidenceCopy));
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
    depthEvidence: resolveDepthEvidenceForRole(role, evidence, sources),
  });
}
