import { describe, expect, it } from 'vitest';
import { evidence, projects, screeningFacts } from '@/data';

describe('locked public-content rules', () => {
  it('locks Dive ownership to Mohamed without unrelated attribution', () => {
    const dive = projects.find((project) => project.id === 'dive');

    expect(dive?.ownership).toMatch(/I owned.*end.to.end/i);
    expect(dive?.ownership).not.toMatch(/presenter|unrelated collaborator/i);
  });

  it('keeps research and credential status accurate', () => {
    const text = evidence.map((item) => item.statement).join('\n');

    expect(text).toMatch(/completed.*awarded.*2026/i);
    expect(text).toMatch(/submitted and under review/i);
    expect(text).toMatch(/CEH training/i);
    expect(text).not.toMatch(
      /published SPRINT-PP|accepted SPRINT-PP|CEH certified/i,
    );
  });

  it('describes Northstar and historical Android work without misleading status', () => {
    const northstar = projects.find(
      (project) => project.id === 'northstar-rag',
    );
    const historicalApps = evidence.find(
      (item) => item.id === 'android-historical-play-store',
    );

    expect(northstar?.summary).toMatch(/independently built.*end-to-end.*RAG/i);
    expect(northstar?.summary).not.toMatch(/assessment/i);
    expect(historicalApps?.statement).toMatch(/previously published/i);
    expect(historicalApps?.statement).toMatch(/no longer available/i);
  });

  it('exposes the approved Canadian recruiter screening answers', () => {
    const statements = new Map(
      screeningFacts.map((fact) => [fact.id, fact.statement]),
    );

    expect(statements.get('location')).toBe('Toronto, Ontario, Canada.');
    expect(statements.get('availability')).toBe('Immediately available.');
    expect(statements.get('work-authorization')).toBe(
      'Open PGWP valid through June 2029.',
    );
    expect(statements.get('sponsorship')).toBe(
      'Legally authorized to work in Canada; no sponsorship required.',
    );
  });
});
