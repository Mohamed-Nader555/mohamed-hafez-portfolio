import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'this-portfolio-purpose',
    title: 'This portfolio purpose',
    statement:
      'This site is a four-focus engineering portfolio built and maintained by me, with typed, Zod-validated content and pre-rendered pages.',
    topics: ['portfolio', 'Astro', 'this site'],
    aliases: ['This Portfolio'],
    roleWeights: { aiml: 3, software: 5, android: 0, teaching: 1 },
    sourceIds: [
      'resume-software',
      'case-study-this-portfolio',
      'github-portfolio',
    ],
    public: true,
  },
  {
    id: 'this-portfolio-assistant',
    title: 'This portfolio’s assistant',
    statement:
      'The assistant on this site is protected by Turnstile and two rate limiters, retrieves lexically over curated, validated evidence, refuses before generation when nothing supports an answer, generates with Workers AI (Llama 3.1 8B) when it does, validates citations, and falls back to an extractive, verified-text answer if generation is unavailable.',
    topics: ['assistant', 'Turnstile', 'Workers AI', 'refusal', 'citations'],
    aliases: ['Ask Mohamed.AI', 'grounded assistant'],
    roleWeights: { aiml: 4, software: 4, android: 0, teaching: 1 },
    sourceIds: ['case-study-this-portfolio'],
    public: true,
  },
  {
    id: 'this-portfolio-stack',
    title: 'This portfolio’s stack',
    statement:
      'This site is built with Astro, TypeScript, Cloudflare Workers, Workers AI, Zod, and Playwright, with React islands, Turnstile, Vitest, and MDX.',
    topics: ['Astro', 'TypeScript', 'Cloudflare Workers', 'Zod'],
    aliases: [],
    roleWeights: { aiml: 2, software: 5, android: 0, teaching: 0 },
    sourceIds: ['case-study-this-portfolio', 'github-portfolio'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const platformEvidence = evidenceRecordSchema.array().parse(records);
