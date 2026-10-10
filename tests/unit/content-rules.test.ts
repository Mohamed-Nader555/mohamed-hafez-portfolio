import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { evidence, profile, projects, screeningFacts } from '@/data';
import { careerExperience } from '@/data/career';

describe('locked public-content rules', () => {
  it('locks Dive ownership to Mohamed without unrelated attribution', () => {
    const dive = projects.find((project) => project.id === 'dive');

    expect(dive?.ownership).toMatch(/I owned.*end.to.end/i);
    expect(dive?.ownership).not.toMatch(/presenter|unrelated collaborator/i);
  });

  it('keeps research and credential status accurate', () => {
    const text = evidence.map((item) => item.statement).join('\n');

    expect(text).toMatch(/completed.*awarded.*2026/i);
    expect(text).toMatch(/accepted to (IEEE )?CASCON 2026/i);
    expect(text).not.toMatch(/submitted and under review/i);
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
    const dostavaApp = evidence.find(
      (item) => item.id === 'dostava-historical-play-store',
    );

    expect(northstar?.summary).toMatch(/independently built.*end.to.end.*RAG/i);
    expect(northstar?.summary).not.toMatch(/assessment/i);
    expect(historicalApps?.statement).toMatch(/previously published/i);
    expect(dostavaApp?.statement).toMatch(/no longer available/i);
  });

  it('exposes the approved Canadian recruiter screening answers', () => {
    const statements = new Map(
      screeningFacts.map((fact) => [fact.id, fact.statement]),
    );

    expect(statements.get('location')).toBe('Toronto, Ontario, Canada.');
    expect(statements.get('availability')).toBe(
      'Currently working as Founding AI Engineer at Eklan. Open to new roles, with a one-week notice period.',
    );
    expect(statements.get('work-authorization')).toBe(
      'Open PGWP valid through June 2029.',
    );
    expect(statements.get('sponsorship')).toBe(
      'Legally authorized to work in Canada; no sponsorship required.',
    );
  });

  it('names the current role at Eklan without describing the work', () => {
    const current = careerExperience[0];
    expect(current).toMatchObject({
      id: 'eklan',
      title: 'Founding AI Engineer',
      organization: 'Eklan',
      period: '2026 — present',
    });
    const record = evidence.find((item) => item.id === 'eklan-current-role');
    expect(record?.statement).toBe(
      'I am currently working as Founding AI Engineer at Eklan (2026 to present).',
    );
    expect(record?.sourceIds).toEqual(['public-experience']);
  });

  it('no longer claims immediate availability anywhere on the site', () => {
    expect(profile.availability).toBe(
      'Open to new roles, one-week notice period',
    );
    const files = [
      'src/data/profile.ts',
      'src/data/screening.ts',
      'src/types/content.ts',
      'src/components/sections/Hero.astro',
      'src/components/layout/Footer.astro',
    ];
    for (const file of files) {
      expect(readFileSync(file, 'utf8'), file).not.toMatch(
        /immediately available|available immediately|immediate start/i,
      );
    }
  });
});
