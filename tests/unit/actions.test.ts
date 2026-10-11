import { describe, expect, it } from 'vitest';
import { buildActions } from '@/lib/ai/actions';
import { profile } from '@/data/profile';
import { roles } from '@/data/roles';

const cite = (sourceId: string, label: string, href: string) => ({
  sourceId,
  label,
  href,
});

describe('buildActions', () => {
  it('offers the case study of the cited project, the résumé for the active role and an email link', () => {
    const actions = buildActions(
      [
        cite('resume-android', 'Android résumé', '/resumes/x.pdf'),
        cite('case-study-dostava', 'Dostava case study', '/work/dostava'),
      ],
      'android',
    );
    expect(actions.map((a) => a.kind)).toEqual([
      'case-study',
      'resume',
      'email',
    ]);
    expect(actions[0]).toEqual({
      kind: 'case-study',
      label: 'Dostava case study',
      href: '/work/dostava',
    });
    const resume = roles.find((r) => r.id === 'android')!;
    expect(actions[1]).toMatchObject({
      kind: 'resume',
      href: resume.resumeHref,
    });
    expect(actions[2]).toMatchObject({
      kind: 'email',
      address: profile.contacts.email,
    });
  });

  it('leaves out the case study when no cited source is one', () => {
    const actions = buildActions(
      [cite('public-experience', 'Experience', '/about')],
      'aiml',
    );
    expect(actions.map((a) => a.kind)).toEqual(['resume', 'email']);
  });

  it('uses only the first case study', () => {
    const actions = buildActions(
      [
        cite('case-study-a', 'A case study', '/work/a'),
        cite('case-study-b', 'B case study', '/work/b'),
      ],
      'software',
    );
    expect(actions.filter((a) => a.kind === 'case-study')).toHaveLength(1);
    expect(actions[0]).toMatchObject({ href: '/work/a' });
  });

  it('never puts a visitor’s question in an action', () => {
    const json = JSON.stringify(buildActions([], 'teaching'));
    expect(json).not.toMatch(/mailto|body=/i);
  });
});
