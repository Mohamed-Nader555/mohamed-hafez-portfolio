import { describe, expect, it } from 'vitest';

import { evidence, profile, projects, sources } from '@/data';
import {
  createCreativeWorkStructuredData,
  createPersonStructuredData,
  createStructuredDataGraph,
  createThesisStructuredData,
} from '@/lib/seo/structured-data';
import { resolvePublicSiteUrl } from '@/lib/seo/site-url';

describe('public site URL policy', () => {
  it('normalizes one validated HTTPS origin', () => {
    expect(resolvePublicSiteUrl('https://portfolio.example').href).toBe(
      'https://portfolio.example/',
    );
  });

  it.each([
    'http://portfolio.example',
    'https://user:secret@portfolio.example',
    'https://portfolio.example/path',
    'https://portfolio.example/?query=true',
    'https://portfolio.example/#fragment',
    'ftp://portfolio.example',
  ])('rejects an unsafe or non-origin PUBLIC_SITE_URL value: %s', (value) => {
    expect(() => resolvePublicSiteUrl(value)).toThrow(/PUBLIC_SITE_URL/i);
  });

  it('requires an explicit fallback when the environment value is absent', () => {
    expect(() => resolvePublicSiteUrl(undefined)).toThrow(/PUBLIC_SITE_URL/i);
    expect(resolvePublicSiteUrl(undefined, 'https://portfolio.test').href).toBe(
      'https://portfolio.test/',
    );
  });
});

describe('validated structured data', () => {
  const siteUrl = new URL('https://portfolio.test/');

  it('derives Mohamed’s Person record from the validated profile', () => {
    const person = createPersonStructuredData(siteUrl);

    expect(person).toMatchObject({
      '@type': 'Person',
      '@id': 'https://portfolio.test/#person',
      name: profile.name,
      url: 'https://portfolio.test/',
      homeLocation: {
        '@type': 'Place',
        name: profile.location,
      },
      sameAs: [profile.contacts.linkedIn, profile.contacts.github],
    });
  });

  it('derives a case study CreativeWork from its validated project', () => {
    const northstar = projects.find(
      (project) => project.id === 'northstar-rag',
    );
    expect(northstar).toBeDefined();

    const work = createCreativeWorkStructuredData(
      northstar!,
      new URL('/work/northstar-rag', siteUrl),
      siteUrl,
    );

    expect(work).toMatchObject({
      '@type': 'CreativeWork',
      name: northstar!.title,
      description: northstar!.summary,
      url: 'https://portfolio.test/work/northstar-rag',
      creator: { '@id': 'https://portfolio.test/#person' },
      keywords: northstar!.technologies,
    });
  });

  it('publishes ScholarlyArticle data only for the completed thesis', () => {
    const titleRecord = evidence.find(
      (record) => record.id === 'asc-pie-thesis-title',
    );
    const degreeRecord = evidence.find(
      (record) => record.id === 'asc-pie-degree-awarded',
    );
    const evaluationRecord = evidence.find(
      (record) => record.id === 'asc-pie-evaluation-framework',
    );
    const officialUrls = sources
      .filter((source) =>
        ['official-yorkspace', 'official-thesis-handle'].includes(source.id),
      )
      .map((source) => source.publicHref);

    const article = createThesisStructuredData(
      new URL('/research/asc-pie', siteUrl),
      siteUrl,
    );

    expect(article).toMatchObject({
      '@type': 'ScholarlyArticle',
      headline:
        'ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition',
      description: evaluationRecord?.statement,
      datePublished: '2026',
      author: { '@id': 'https://portfolio.test/#person' },
      sameAs: officialUrls,
    });
    expect(titleRecord?.statement).toContain(article.headline);
    expect(degreeRecord?.statement).toContain(article.datePublished);
    expect(JSON.stringify(article)).not.toMatch(/SPRINT-PP|under review/i);
  });

  it('creates one schema.org graph without duplicating Mohamed', () => {
    const person = createPersonStructuredData(siteUrl);
    const thesis = createThesisStructuredData(
      new URL('/research/asc-pie', siteUrl),
      siteUrl,
    );

    expect(createStructuredDataGraph(person, thesis)).toEqual({
      '@context': 'https://schema.org',
      '@graph': [person, thesis],
    });
  });
});
