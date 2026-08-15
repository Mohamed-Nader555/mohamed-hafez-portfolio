import { describe, expect, it } from 'vitest';

import {
  evidence,
  getEvidenceForProject,
  projects,
  screeningFacts,
  sources,
} from '@/data';
import { validateEvidenceCorpus } from '@/data/evidence';
import { sourceRecordSchema } from '@/types/content';

describe('verified evidence corpus', () => {
  it('locks sensitive wording and project status', () => {
    const text = evidence.map((item) => item.statement).join('\n');

    expect(text).toMatch(/submitted and (currently )?under review/i);
    expect(text).toMatch(/CEH training/i);
    expect(text).not.toMatch(
      /CEH certified|published SPRINT-PP|accepted SPRINT-PP/i,
    );
  });

  it('keeps historical app availability accurate', () => {
    const app = evidence.find(
      (item) => item.id === 'android-historical-play-store',
    );

    expect(app?.statement).toMatch(/previously published/i);
    expect(app?.statement).toMatch(/no longer available/i);
  });

  it('encodes every locked attribution and status rule', () => {
    const byId = new Map(evidence.map((item) => [item.id, item.statement]));

    expect(byId.get('asc-pie-thesis-title')).toContain(
      'ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition',
    );
    expect(byId.get('asc-pie-degree-awarded')).toMatch(
      /completed and (officially )?awarded in 2026/i,
    );
    expect(byId.get('northstar-independent-delivery')).toMatch(
      /independently built.*end-to-end.*hands-on RAG engineering project/i,
    );
    expect(byId.get('northstar-independent-delivery')).not.toMatch(
      /assessment/i,
    );
    expect(byId.get('dive-end-to-end-ownership')).toMatch(
      /Mohamed owned and implemented.*end to end/i,
    );
    expect(byId.get('dive-end-to-end-ownership')).not.toMatch(
      /presenter|collaborator/i,
    );
    expect(byId.get('mercato-football-talent')).toMatch(
      /football-talent platform/i,
    );
  });

  it('keeps each claim uniquely addressable and publicly resolvable', () => {
    const evidenceIds = evidence.map((item) => item.id);
    const publicSourceIds = new Set(
      sources.filter((source) => source.isPublic).map((source) => source.id),
    );

    expect(new Set(evidenceIds).size).toBe(evidenceIds.length);
    expect(evidence.length).toBeGreaterThan(20);
    expect(
      evidence.every((item) =>
        item.sourceIds.every((sourceId) => publicSourceIds.has(sourceId)),
      ),
    ).toBe(true);
  });

  it('rejects unresolved and private citation targets', () => {
    const fixture = {
      ...evidence[0],
      id: 'source-policy-fixture',
      sourceIds: ['missing-source'],
    };

    expect(() => validateEvidenceCorpus([fixture], sources)).toThrow(
      /unknown source/i,
    );

    const privateSource = sourceRecordSchema.parse({
      id: 'private-source',
      label: 'Internal supporting material',
      kind: 'approved-source',
      isPublic: false,
    });

    expect(() =>
      validateEvidenceCorpus(
        [{ ...fixture, sourceIds: [privateSource.id] }],
        [...sources, privateSource],
      ),
    ).toThrow(/public source/i);
  });

  it('returns deterministic validated evidence for every project', () => {
    for (const project of projects) {
      const first = getEvidenceForProject(project.id);
      const second = getEvidenceForProject(project.id);

      expect(first.length, project.id).toBeGreaterThan(0);
      expect(second, project.id).toEqual(first);
      expect(Object.isFrozen(first), project.id).toBe(true);
      expect(Object.isFrozen(first[0]), project.id).toBe(true);
    }

    expect(() => getEvidenceForProject('not-a-project')).toThrow(
      /unknown project/i,
    );
    expect(() => getEvidenceForProject('../dive')).toThrow(/invalid project/i);
  });

  it('mirrors the exact screening registry without rewriting it', () => {
    for (const fact of screeningFacts) {
      const record = evidence.find(
        (item) => item.id === `screening-${fact.id}`,
      );

      expect(record?.statement, fact.id).toBe(fact.statement);
      expect(record?.sourceIds, fact.id).toEqual(fact.sourceIds);
    }
  });
});
