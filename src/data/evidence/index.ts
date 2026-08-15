import { projects } from '@/data/projects';
import { sources } from '@/data/sources';
import {
  evidenceRecordSchema,
  type EvidenceRecord,
  type SourceRecord,
} from '@/types/content';

import { diveEvidence } from './dive';
import { dostavaEvidence } from './dostava';
import {
  bassEvidence,
  experienceEvidence,
  mercatoEvidence,
} from './experience';
import { mindsEyeEvidence } from './minds-eye';
import { northstarEvidence } from './northstar';
import { researchEvidence } from './research';
import { screeningEvidence } from './screening';
import { teachingEvidence } from './teaching';

const evidenceRecords = [
  ...researchEvidence,
  ...northstarEvidence,
  ...mindsEyeEvidence,
  ...diveEvidence,
  ...dostavaEvidence,
  ...experienceEvidence,
  ...teachingEvidence,
  ...screeningEvidence,
];

export function validateEvidenceCorpus(
  records: readonly EvidenceRecord[],
  sourceRegistry: readonly SourceRecord[],
): readonly EvidenceRecord[] {
  const validated = evidenceRecordSchema.array().parse(records);
  const evidenceIds = new Set<string>();
  const sourceById = new Map(
    sourceRegistry.map((source) => [source.id, source]),
  );

  for (const record of validated) {
    if (evidenceIds.has(record.id)) {
      throw new Error(`Duplicate evidence id: ${record.id}`);
    }
    evidenceIds.add(record.id);

    for (const sourceId of record.sourceIds) {
      const source = sourceById.get(sourceId);
      if (!source) {
        throw new Error(
          `Evidence ${record.id} references unknown source ${sourceId}`,
        );
      }
      if (!source.isPublic || !source.publicHref) {
        throw new Error(
          `Evidence ${record.id} must reference a public source: ${sourceId}`,
        );
      }
    }

    Object.freeze(record.topics);
    Object.freeze(record.aliases);
    Object.freeze(record.roleWeights);
    Object.freeze(record.sourceIds);
    Object.freeze(record);
  }

  return Object.freeze(validated);
}

export const evidence = validateEvidenceCorpus(evidenceRecords, sources);

const evidenceById = new Map(evidence.map((record) => [record.id, record]));

function canonicalRecords(
  records: readonly EvidenceRecord[],
): readonly EvidenceRecord[] {
  return records.map((record) => {
    const canonical = evidenceById.get(record.id);
    if (!canonical) {
      throw new Error(
        `Evidence is missing from the canonical corpus: ${record.id}`,
      );
    }
    return canonical;
  });
}

const projectEvidence = new Map<string, readonly EvidenceRecord[]>([
  ['asc-pie', canonicalRecords(researchEvidence)],
  ['northstar-rag', canonicalRecords(northstarEvidence)],
  ['minds-eye', canonicalRecords(mindsEyeEvidence)],
  ['dive', canonicalRecords(diveEvidence)],
  ['dostava', canonicalRecords(dostavaEvidence)],
  ['bass', canonicalRecords(bassEvidence)],
  ['mercato', canonicalRecords(mercatoEvidence)],
  ['teaching-experience', canonicalRecords(teachingEvidence)],
]);

export function getEvidenceForProject(
  projectId: string,
): readonly EvidenceRecord[] {
  if (!/^[a-z0-9-]+$/.test(projectId)) {
    throw new Error(`Invalid project id: ${projectId}`);
  }

  if (!projects.some((project) => project.id === projectId)) {
    throw new Error(`Unknown project: ${projectId}`);
  }

  const records = projectEvidence.get(projectId);
  if (!records || records.length === 0) {
    throw new Error(`No evidence configured for project: ${projectId}`);
  }

  return Object.freeze([...records]);
}

export {
  bassEvidence,
  diveEvidence,
  dostavaEvidence,
  experienceEvidence,
  mercatoEvidence,
  mindsEyeEvidence,
  northstarEvidence,
  researchEvidence,
  screeningEvidence,
  teachingEvidence,
};
