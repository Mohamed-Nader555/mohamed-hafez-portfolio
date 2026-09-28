import { projects } from '@/data/projects';
import { sources } from '@/data/sources';
import {
  evidenceRecordSchema,
  type EvidenceRecord,
  type SourceRecord,
} from '@/types/content';

import { androidAppsEvidence } from './android-apps';
import { appliedMlEvidence } from './applied-ml';
import { diveEvidence } from './dive';
import { dostavaEvidence } from './dostava';
import { earlyJavaEvidence } from './early-java';
import { enterpriseEvidence } from './enterprise';
import {
  bassEvidence,
  experienceEvidence,
  mercatoEvidence,
} from './experience';
import { mindsEyeEvidence } from './minds-eye';
import { northstarEvidence } from './northstar';
import { platformEvidence } from './platform';
import { researchEvidence } from './research';
import { screeningEvidence } from './screening';
import { sprintPpEvidence } from './sprint-pp';
import { teachingEvidence } from './teaching';

const evidenceRecords = [
  ...researchEvidence,
  ...sprintPpEvidence,
  ...northstarEvidence,
  ...mindsEyeEvidence,
  ...diveEvidence,
  ...dostavaEvidence,
  ...appliedMlEvidence,
  ...androidAppsEvidence,
  ...enterpriseEvidence,
  ...earlyJavaEvidence,
  ...platformEvidence,
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

function byIdPrefix(prefix: string): readonly EvidenceRecord[] {
  return evidence.filter((record) => record.id.startsWith(prefix));
}

const projectEvidence = new Map<string, readonly EvidenceRecord[]>([
  ['asc-pie', canonicalRecords(researchEvidence)],
  ['sprint-pp', canonicalRecords(sprintPpEvidence)],
  ['northstar-rag', canonicalRecords(northstarEvidence)],
  ['minds-eye', canonicalRecords(mindsEyeEvidence)],
  ['dive', canonicalRecords(diveEvidence)],
  ['dostava', canonicalRecords(dostavaEvidence)],
  ['applied-ml-portfolio', byIdPrefix('applied-ml-portfolio-')],
  ['cti-intrusion-detection', byIdPrefix('cti-intrusion-detection-')],
  ['search-for-eats', byIdPrefix('search-for-eats-')],
  ['mercato', canonicalRecords(mercatoEvidence)],
  ['food-planner', byIdPrefix('food-planner-')],
  ['weather-checker', byIdPrefix('weather-checker-')],
  ['shop-on-the-go', byIdPrefix('shop-on-the-go-')],
  ['documentum-workflows', byIdPrefix('documentum-workflows-')],
  ['pdf-utilities', byIdPrefix('pdf-utilities-')],
  ['rest-pocs', byIdPrefix('rest-pocs-')],
  ['this-portfolio', canonicalRecords(platformEvidence)],
  ['your-life-is-my-life', byIdPrefix('your-life-is-my-life-')],
  ['death-ninja', byIdPrefix('death-ninja-')],
  ['cloud-backend', byIdPrefix('cloud-backend-')],
  ['restaurant-management', byIdPrefix('restaurant-management-')],
  ['online-tic-tac-toe', byIdPrefix('online-tic-tac-toe-')],
  ['gulf-arab-chat', byIdPrefix('gulf-arab-chat-')],
  ['tourist-guide', byIdPrefix('tourist-guide-')],
  ['sams', byIdPrefix('sams-')],
  ['donation-app', byIdPrefix('donation-app-')],
  ['my-card', byIdPrefix('my-card-')],
  ['top-notch', byIdPrefix('top-notch-')],
  ['face-recognition-pipeline', byIdPrefix('face-recognition-pipeline-')],
  ['healthcare-desktop', byIdPrefix('healthcare-desktop-')],
  ['priority-request-manager', byIdPrefix('priority-request-manager-')],
  ['school-management-system', byIdPrefix('school-management-system-')],
  ['myapps-demo', byIdPrefix('myapps-demo-')],
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
  androidAppsEvidence,
  appliedMlEvidence,
  bassEvidence,
  diveEvidence,
  dostavaEvidence,
  earlyJavaEvidence,
  enterpriseEvidence,
  experienceEvidence,
  mercatoEvidence,
  mindsEyeEvidence,
  northstarEvidence,
  platformEvidence,
  researchEvidence,
  screeningEvidence,
  sprintPpEvidence,
  teachingEvidence,
};
