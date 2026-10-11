import { describe, expect, it } from 'vitest';
import { roleBriefs } from '@/data/claims/role-briefs';
import {
  briefToText,
  roleBriefToCard,
  type BriefCardData,
} from '@/components/ai/brief-card-data';

describe('roleBriefToCard', () => {
  const brief = roleBriefs.find((b) => b.slug === 'nlp-engineer')!;
  const card = roleBriefToCard(brief);

  it('keeps the title, his answer and the page link', () => {
    expect(card.title).toBe(brief.title);
    expect(card.summary).toEqual({
      label: 'Mohamed’s answer',
      text: brief.summary.text,
    });
    expect(card.pageHref).toBe(`/hiring/${brief.slug}`);
    expect(card.askHim).toEqual(brief.askHim.map((p) => p.question));
  });

  it('has a direct group and, when there is related evidence, a related one, and no gap group', () => {
    expect(card.groups.map((g) => g.id)).toEqual(
      brief.related.length ? ['direct', 'related'] : ['direct'],
    );
    expect(card.groups[0]!.label).toBe('Direct experience');
    expect(card.groups[0]!.items).toHaveLength(brief.direct.length);
    expect(card.groups[0]!.items[0]).toEqual({
      text: brief.direct[0]!.text,
      detail: brief.direct[0]!.evidence.map((e) => e.text),
    });
  });
});

describe('briefToText', () => {
  const card: BriefCardData = {
    title: 'A Role',
    summary: { label: 'Mohamed’s answer', text: 'He builds things.' },
    groups: [
      {
        id: 'direct',
        label: 'Direct experience',
        items: [{ text: 'Build services', detail: ['He built a service.'] }],
      },
      {
        id: 'not-shown',
        label: 'Not shown on the site',
        items: [{ text: 'Run clusters', detail: [] }],
      },
    ],
    askHim: ['What did you build?'],
    pageHref: '/hiring/a-role',
  };

  it('writes a plain-text brief a recruiter can paste into an email', () => {
    expect(briefToText(card, 'https://example.test')).toBe(
      [
        'A Role',
        '',
        'Mohamed’s answer: “He builds things.”',
        '',
        'Direct experience',
        '- Build services',
        '  He built a service.',
        '',
        'Not shown on the site',
        '- Run clusters',
        '',
        'Ask him about',
        '- What did you build?',
        '',
        'Full page: https://example.test/hiring/a-role',
      ].join('\n'),
    );
  });

  it('labels his own answer and the assistant’s reading inside an item', () => {
    const text = briefToText({
      title: 'T',
      groups: [
        {
          id: 'not-shown',
          label: 'Not shown on the site',
          items: [
            {
              text: 'Run clusters',
              detail: ['I have not run clusters.'],
              detailLabel: 'Mohamed’s answer',
              note: 'Nearby work is listed above.',
            },
          ],
        },
      ],
      askHim: [],
    });
    expect(text).toBe(
      [
        'T',
        '',
        'Not shown on the site',
        '- Run clusters',
        '  Mohamed’s answer: I have not run clusters.',
        '  Assistant’s reading: Nearby work is listed above.',
      ].join('\n'),
    );
  });

  it('leaves out the page line and the prompts when there are none', () => {
    const text = briefToText({
      title: 'T',
      groups: [],
      askHim: [],
    });
    expect(text).toBe('T');
  });
});
