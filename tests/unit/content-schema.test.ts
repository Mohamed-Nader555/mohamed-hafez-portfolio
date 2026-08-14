import { describe, expect, it } from 'vitest';
import {
  evidence,
  profile,
  projects,
  roles,
  screeningFacts,
  sources,
} from '@/data';
import {
  evidenceRecordSchema,
  projectRecordSchema,
  roleLensSchema,
  screeningFactSchema,
  sourceRecordSchema,
} from '@/types/content';

describe('portfolio content contracts', () => {
  it('keeps every evidence source resolvable', () => {
    const sourceIds = new Set(sources.map((source) => source.id));

    expect(
      evidence
        .flatMap((item) => item.sourceIds)
        .every((id) => sourceIds.has(id)),
    ).toBe(true);
  });

  it('defines exactly four recruiter lenses in the public route order', () => {
    expect(roles.map((role) => role.id)).toEqual([
      'aiml',
      'software',
      'android',
      'teaching',
    ]);
  });

  it('maps every role to its stable public resume target', () => {
    expect(roles.map((role) => role.resumeHref)).toEqual([
      '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
      '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
      '/resumes/Mohamed-Hafez-Android-Developer.pdf',
      '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    ]);
  });

  it('exports public contact and screening details for recruiter-facing use', () => {
    expect(profile.contacts).toEqual({
      email: 'mohamed.m.nader555@gmail.com',
      phone: '+1 647 929 2480',
      linkedIn: 'https://www.linkedin.com/in/mohamed-nader555',
      github: 'https://github.com/Mohamed-Nader555',
    });
    expect(screeningFacts.map((fact) => fact.id)).toEqual([
      'location',
      'availability',
      'work-authorization',
      'sponsorship',
      'work-arrangement',
      'relocation',
      'target-level',
      'employment-preference',
    ]);
  });
});

describe('Zod content boundaries', () => {
  it('rejects a public source without a public target', () => {
    expect(() =>
      sourceRecordSchema.parse({
        id: 'missing-public-target',
        label: 'Missing public target',
        kind: 'official',
        isPublic: true,
      }),
    ).toThrow();
  });

  it('requires one bounded weight for each recruiter lens', () => {
    expect(() =>
      evidenceRecordSchema.parse({
        id: 'incomplete-weights',
        title: 'Incomplete weights',
        statement: 'An evidence record with an incomplete role-weight map.',
        topics: ['testing'],
        roleWeights: { aiml: 5 },
        sourceIds: ['resume-aiml'],
        public: true,
      }),
    ).toThrow();
  });

  it('validates every exported public record at its own boundary', () => {
    expect(
      sources.every((record) => sourceRecordSchema.safeParse(record).success),
    ).toBe(true);
    expect(
      evidence.every(
        (record) => evidenceRecordSchema.safeParse(record).success,
      ),
    ).toBe(true);
    expect(
      projects.every((record) => projectRecordSchema.safeParse(record).success),
    ).toBe(true);
    expect(
      roles.every((record) => roleLensSchema.safeParse(record).success),
    ).toBe(true);
    expect(
      screeningFacts.every(
        (record) => screeningFactSchema.safeParse(record).success,
      ),
    ).toBe(true);
  });
});
