import type { ProjectRecord } from '@/types/content';
import { evidence, profile, roles, sources } from '@/data';

export interface PersonStructuredData {
  '@type': 'Person';
  '@id': string;
  name: string;
  url: string;
  homeLocation: { '@type': 'Place'; name: string };
  sameAs: string[];
  jobTitle: string[];
}

export interface CreativeWorkStructuredData {
  '@type': 'CreativeWork';
  name: string;
  description: string;
  url: string;
  creator: { '@id': string };
  keywords: string[];
  about: string[];
  isAccessibleForFree: true;
}

export interface ThesisStructuredData {
  '@type': 'ScholarlyArticle';
  headline: string;
  description: string;
  datePublished: string;
  url: string;
  author: { '@id': string };
  sameAs: string[];
  isAccessibleForFree: true;
  inLanguage: 'en';
}

export type StructuredDataNode =
  PersonStructuredData | CreativeWorkStructuredData | ThesisStructuredData;

export function createPersonStructuredData(siteUrl: URL): PersonStructuredData {
  return {
    '@type': 'Person',
    '@id': new URL('/#person', siteUrl).href,
    name: profile.name,
    url: siteUrl.href,
    homeLocation: {
      '@type': 'Place',
      name: profile.location,
    },
    sameAs: [profile.contacts.linkedIn, profile.contacts.github],
    jobTitle: roles.map((role) => role.label),
  };
}

export function createCreativeWorkStructuredData(
  project: ProjectRecord,
  pageUrl: URL,
  siteUrl: URL,
): CreativeWorkStructuredData {
  const roleLabels = new Map(roles.map((role) => [role.id, role.label]));

  return {
    '@type': 'CreativeWork',
    name: project.title,
    description: project.summary,
    url: pageUrl.href,
    creator: { '@id': new URL('/#person', siteUrl).href },
    keywords: [...project.technologies],
    about: project.roles.map((role) => roleLabels.get(role) ?? role),
    isAccessibleForFree: true,
  };
}

export function createThesisStructuredData(
  pageUrl: URL,
  siteUrl: URL,
): ThesisStructuredData {
  const titleRecord = evidence.find(
    (record) => record.id === 'asc-pie-thesis-title',
  );
  const degreeRecord = evidence.find(
    (record) => record.id === 'asc-pie-degree-awarded',
  );
  const evaluationRecord = evidence.find(
    (record) => record.id === 'asc-pie-evaluation-framework',
  );
  if (!titleRecord || !degreeRecord || !evaluationRecord) {
    throw new Error('Validated thesis evidence is incomplete.');
  }

  const headline = titleRecord.statement
    .match(/[“"](.+)[”"]/)?.[1]
    ?.replace(/\.$/, '');
  const completedYear = degreeRecord.statement.match(/\b(20\d{2})\b/)?.[1];
  if (!headline || !completedYear) {
    throw new Error('Unable to derive structured thesis facts.');
  }

  const officialUrls = sources
    .filter((source) =>
      ['official-yorkspace', 'official-thesis-handle'].includes(source.id),
    )
    .map((source) => source.publicHref)
    .filter((href): href is string => href !== undefined);
  if (officialUrls.length !== 2) {
    throw new Error('Validated thesis sources are incomplete.');
  }

  return {
    '@type': 'ScholarlyArticle',
    headline,
    description: evaluationRecord.statement,
    datePublished: completedYear,
    url: pageUrl.href,
    author: { '@id': new URL('/#person', siteUrl).href },
    sameAs: officialUrls,
    isAccessibleForFree: true,
    inLanguage: 'en',
  };
}

export function createStructuredDataGraph(...nodes: StructuredDataNode[]): {
  '@context': 'https://schema.org';
  '@graph': StructuredDataNode[];
} {
  return {
    '@context': 'https://schema.org',
    '@graph': nodes,
  };
}
