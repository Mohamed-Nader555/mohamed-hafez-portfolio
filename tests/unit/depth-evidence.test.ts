import { describe, expect, it } from 'vitest';
import { evidence, roles, sources } from '@/data';
import {
  resolveDepthEvidenceForRole,
  resolveLens,
  selectPublicSourceForEvidence,
} from '@/lib/content/resolve-lens';

const evidenceById = new Map(evidence.map((record) => [record.id, record]));

function record(id: string) {
  const value = evidenceById.get(id);
  if (!value) throw new Error(`Missing test evidence: ${id}`);
  return value;
}

describe('explicit lens depth evidence', () => {
  it('resolves the approved AI/ML and teaching presentation records', () => {
    expect(
      resolveLens('aiml').depthEvidence.research.map(({ id }) => id),
    ).toEqual(['asc-pie-evaluation-framework', 'sprint-pp-status']);
    expect(
      resolveLens('teaching').depthEvidence.teaching.map(({ id }) => id),
    ).toEqual(['teaching-computing-topics', 'ceh-training']);
  });

  it('rejects duplicate configured depth evidence ids', () => {
    const role = {
      ...roles[0],
      depthEvidenceIds: {
        research: ['asc-pie-thesis-title', 'asc-pie-thesis-title'],
        teaching: ['teaching-delivery'],
      },
    };

    expect(() => resolveDepthEvidenceForRole(role, evidence, sources)).toThrow(
      /duplicate depth evidence id.*asc-pie-thesis-title/i,
    );
  });

  it('rejects missing or public-source-ineligible configured evidence', () => {
    const missingRole = {
      ...roles[0],
      depthEvidenceIds: {
        research: ['missing-evidence'],
        teaching: ['teaching-delivery'],
      },
    };
    expect(() =>
      resolveDepthEvidenceForRole(missingRole, evidence, sources),
    ).toThrow(/missing depth evidence id.*missing-evidence/i);

    const unsafeEvidence = {
      ...record('asc-pie-thesis-title'),
      id: 'unsafe-depth-evidence',
      sourceIds: ['github-northstar-rag'],
    };
    const unsafeRole = {
      ...roles[0],
      depthEvidenceIds: {
        research: ['unsafe-depth-evidence'],
        teaching: ['teaching-delivery'],
      },
    };
    expect(() =>
      resolveDepthEvidenceForRole(
        unsafeRole,
        [unsafeEvidence, record('teaching-delivery')],
        sources,
      ),
    ).toThrow(/public source.*unsafe-depth-evidence/i);
  });
});

describe('depth evidence source precedence', () => {
  it('prefers official sources for official research claims', () => {
    const officialAndResumeRecord = {
      ...record('asc-pie-evaluation-framework'),
      sourceIds: [
        'resume-aiml',
        ...record('asc-pie-evaluation-framework').sourceIds,
      ],
    };

    expect(
      selectPublicSourceForEvidence(officialAndResumeRecord, 'aiml', sources)
        .id,
    ).toBe('official-yorkspace');
  });

  it('prefers the active-role resume before unrelated resumes', () => {
    expect(
      selectPublicSourceForEvidence(
        record('teaching-computing-topics'),
        'teaching',
        sources,
      ).id,
    ).toBe('resume-teaching');
    expect(
      selectPublicSourceForEvidence(record('ceh-training'), 'teaching', sources)
        .id,
    ).toBe('resume-teaching');
  });

  it('never selects a suppressed source when a safe public fallback exists', () => {
    const mixedRecord = {
      ...record('northstar-independent-delivery'),
      sourceIds: ['github-northstar-rag', 'case-study-northstar'],
    };

    expect(selectPublicSourceForEvidence(mixedRecord, 'aiml', sources).id).toBe(
      'case-study-northstar',
    );
  });
});
