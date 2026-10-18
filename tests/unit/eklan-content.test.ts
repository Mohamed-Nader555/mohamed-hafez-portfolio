import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';
import { evidence, projects } from '@/data';
import { architectures } from '@/data/architectures';
import { careerExperience, careerRoles, skillGroups } from '@/data/career';
import { namedGaps, unconfirmedClaims } from '@/data/claims/wording-rules';
import { keyFactsBySlug } from '@/data/key-facts';
import { PROJECT_STATUS } from '@/data/project-status';
import { VERIFIED_TECH } from '@/data/verified-tech';
import { splitFrontmatter } from '@/lib/rag/mdx-text';
import {
  LIVE_MODEL_QUALIFIER,
  NOT_USED_AT_EKLAN,
  carriesQualifier,
  emDashesIn,
  mentionsTimingOrLoad,
  modelIdsIn,
  teammateWorkIn,
  unqualifiedTimingBlocks,
  usageNumbersIn,
} from '../helpers/eklan-rules';

// Everything the site says about the Eklan role: the career entry, evidence
// records and projects whose ids start with "eklan", their case-study pages,
// diagrams, card facts and status badge.
const eklanCareer = careerExperience.filter((entry) => entry.id === 'eklan');
const eklanEvidence = evidence.filter((record) =>
  record.id.startsWith('eklan-'),
);
const eklanProjects = projects.filter((project) =>
  project.id.startsWith('eklan-'),
);
const eklanPages = eklanProjects
  .filter((project) =>
    ['flagship', 'story', 'brief'].includes(project.detailLevel),
  )
  .map((project) => {
    const raw = readFileSync(
      `src/content/case-studies/${project.slug}.mdx`,
      'utf8',
    );
    const { frontmatter, body } = splitFrontmatter(raw);
    return {
      slug: project.slug,
      raw,
      body,
      data: YAML.parse(frontmatter) as Record<string, unknown>,
    };
  });
const statusRecord = (PROJECT_STATUS as Record<string, unknown>)['eklan'];

const eklanTexts: Array<[string, string]> = [
  ...eklanCareer.map((entry): [string, string] => [
    'career',
    JSON.stringify(entry),
  ]),
  ...eklanEvidence.map((record): [string, string] => [
    record.id,
    JSON.stringify(record),
  ]),
  ...eklanProjects.map((project): [string, string] => [
    project.id,
    JSON.stringify(project),
  ]),
  ...eklanPages.map((page): [string, string] => [page.slug, page.raw]),
  ...eklanProjects.map((project): [string, string] => [
    `${project.slug} diagram`,
    JSON.stringify(architectures[project.slug] ?? {}),
  ]),
  ...eklanProjects.map((project): [string, string] => [
    `${project.slug} facts`,
    JSON.stringify(keyFactsBySlug[project.slug] ?? []),
  ]),
  ['status', JSON.stringify(statusRecord ?? {})],
];

/** Every plain string inside a value (frontmatter, records). */
function stringsIn(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(stringsIn);
  if (value && typeof value === 'object')
    return Object.values(value).flatMap(stringsIn);
  return [];
}

describe('Eklan rule checker', () => {
  it('finds internal model ids but allows model families', () => {
    expect(modelIdsIn('Gemini Live, Gemini Flash and OpenAI GPT')).toEqual([]);
    expect(modelIdsIn('we used gemini-2.5-flash')).toHaveLength(1);
    expect(modelIdsIn('a Flash-Lite director')).toHaveLength(1);
    expect(modelIdsIn('GPT-4o tool calls')).toHaveLength(1);
    expect(modelIdsIn('gemini-live-2.5-flash-preview')).toHaveLength(1);
    expect(modelIdsIn('browser-to-Gemini-Live streaming')).toEqual([]);
  });

  it('finds teammates’ work and usage numbers', () => {
    expect(teammateWorkIn('Stripe billing and LiveKit')).toHaveLength(2);
    expect(teammateWorkIn('the light and dark themes')).toHaveLength(1);
    expect(teammateWorkIn('a feature-flagged release')).toEqual([]);
    expect(usageNumbersIn('used by 300 nurses')).toHaveLength(1);
    expect(usageNumbersIn('10 concurrent learners in a load test')).toEqual([]);
  });

  it('asks every latency or load number to carry the qualifier', () => {
    expect(mentionsTimingOrLoad('about 1.4 s to first audio')).toBe(true);
    expect(mentionsTimingOrLoad('17–39 s per class')).toBe(true);
    expect(mentionsTimingOrLoad('five drill types and 3 days')).toBe(false);
    expect(
      unqualifiedTimingBlocks(
        `First audio in about 1.4 s.\n\nMedian 1.4 s, ${LIVE_MODEL_QUALIFIER}.`,
      ),
    ).toEqual(['First audio in about 1.4 s.']);
    expect(emDashesIn('a — b')).toBe(1);
  });
});

describe('Eklan content rules', () => {
  it('has the five Section 6 case studies, each with a card and a detail page', () => {
    expect(eklanPages.map((page) => page.slug)).toEqual([
      'eklan-voice-roleplay',
      'eklan-grading-pipeline',
      'eklan-ai-coach',
      'eklan-transcript-mining',
      'eklan-composed-prompts',
    ]);
    for (const page of eklanPages) {
      const headings = [...page.body.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
      for (const heading of [
        'The problem',
        'What I built',
        'Outcome',
        'Tech stack',
      ])
        expect(headings, `${page.slug}: ${heading}`).toContain(heading);
    }
    for (const project of eklanProjects) {
      expect(project.group, project.id).toBe('eklan');
      expect(project.status, project.id).toBe('eklan');
    }
  });

  it('uses no em dashes in Eklan content, role copy or skills', () => {
    const texts = [
      ...eklanTexts,
      ['role copy', JSON.stringify(careerRoles)] as [string, string],
      ['skills', JSON.stringify(skillGroups)] as [string, string],
    ];
    for (const [where, text] of texts)
      expect(emDashesIn(text), `${where}: em dash`).toBe(0);
  });

  it('names model families only, never an internal model id', () => {
    const texts = [
      ...eklanTexts,
      ['skills', JSON.stringify(skillGroups)] as [string, string],
    ];
    for (const [where, text] of texts)
      expect(modelIdsIn(text), `${where}: model id`).toEqual([]);
  });

  it('never claims teammates’ work or usage numbers', () => {
    for (const [where, text] of eklanTexts) {
      expect(teammateWorkIn(text), `${where}: teammates' work`).toEqual([]);
      expect(usageNumbersIn(text), `${where}: usage number`).toEqual([]);
    }
  });

  it('says every latency or load number was measured in testing against the live models', () => {
    for (const page of eklanPages) {
      expect(unqualifiedTimingBlocks(page.body), page.slug).toEqual([]);
      for (const text of stringsIn({ ...page.data, stats: undefined }))
        expect(
          !mentionsTimingOrLoad(text) || carriesQualifier(text),
          `${page.slug} frontmatter: ${text}`,
        ).toBe(true);
      const stats = (page.data.stats ?? []) as Array<{
        value: string;
        label: string;
        note?: string;
      }>;
      for (const stat of stats)
        if (mentionsTimingOrLoad(`${stat.value} ${stat.label}`))
          expect(
            carriesQualifier(stat.note ?? ''),
            `${page.slug} stat ${stat.value}`,
          ).toBe(true);
    }
    const records = [
      ...eklanCareer.flatMap((entry) => stringsIn(entry)),
      ...eklanEvidence.map((record) => record.statement),
      ...eklanProjects.flatMap((project) => [
        project.hook,
        project.summary,
        project.ownership,
      ]),
      ...eklanProjects.flatMap((project) =>
        stringsIn(architectures[project.slug] ?? {}),
      ),
    ];
    for (const text of records)
      expect(
        !mentionsTimingOrLoad(text) || carriesQualifier(text),
        `unqualified: ${text}`,
      ).toBe(true);
    for (const project of eklanProjects)
      for (const fact of keyFactsBySlug[project.slug] ?? [])
        if (mentionsTimingOrLoad(`${fact.value} ${fact.label}`))
          expect(fact.label, `${project.slug} card fact`).toMatch(
            /tested|testing/i,
          );
  });

  it('keeps earlier-role technologies off the Eklan work', () => {
    const banned = new RegExp(`\\b(?:${NOT_USED_AT_EKLAN.join('|')})\\b`);
    for (const project of eklanProjects) {
      for (const name of [
        ...project.technologies,
        ...(VERIFIED_TECH[project.slug] ?? []),
      ])
        expect(name, project.slug).not.toMatch(banned);
    }
    for (const page of eklanPages)
      for (const text of stringsIn(page.data.stack ?? []))
        expect(text, page.slug).not.toMatch(banned);
    for (const text of [
      ...eklanCareer.flatMap((entry) => stringsIn(entry)),
      ...eklanEvidence.map((record) => record.statement),
    ])
      expect(text).not.toMatch(banned);
  });
});

describe('skills from the Section 4 resume block', () => {
  const group = (id: string) =>
    skillGroups.find((entry) => entry.id === id)?.skills ?? '';

  it('carries every line of the resume skills block', () => {
    expect(group('ai-llm')).toMatch(/^Gemini Live API · OpenAI GPT · /);
    expect(group('ai-llm')).toContain('pronunciation scoring (SpeechAce)');
    expect(group('languages')).toMatch(
      /^TypeScript · JavaScript · Python · SQL · Java · Kotlin/,
    );
    expect(group('web-backend')).toBe(
      'Next.js · React · Node.js · REST APIs · WebSockets · Web Audio / AudioWorklet · Tailwind CSS · Zod',
    );
    expect(group('data-cloud')).toBe(
      'MongoDB Atlas · Mongoose · Vercel (serverless, cron) · Cloudinary · PostHog · Sentry · Docker',
    );
    for (const skill of [
      'PyTorch',
      'Hugging Face',
      'fine-tuning',
      'NER',
      'RAG',
    ])
      expect(`${group('machine-learning')} ${group('nlp-llms')}`).toContain(
        skill,
      );
    expect(group('tools')).toMatch(
      /^Git · GitHub · Claude Code · MCP · VS Code · CI\/CD · feature flags/,
    );
  });

  it('leads AI/ML with AI / LLM and Software with the web stack', () => {
    expect(careerRoles.aiml.skillOrder[0]).toBe('ai-llm');
    expect(careerRoles.software.skillOrder.slice(0, 3)).toEqual([
      'languages',
      'web-backend',
      'data-cloud',
    ]);
  });
});

describe('the assistant’s rules for the Eklan role', () => {
  it('may describe the work, within the publishing limits', () => {
    const rules = unconfirmedClaims.join('\n');
    expect(rules).not.toMatch(/beyond the title/);
    expect(rules).toMatch(/Stripe.*LiveKit.*mobile app.*dark theme/);
    expect(rules).toMatch(/Usage numbers for Eklan/);
    expect(rules).toMatch(/measured in testing against the live models/);
    expect(rules).toMatch(/model ids/);
  });

  it('no longer lists React or front-end work as a gap', () => {
    expect(namedGaps.join(' ')).not.toMatch(/React(?! Native)|front-end/);
  });
});
