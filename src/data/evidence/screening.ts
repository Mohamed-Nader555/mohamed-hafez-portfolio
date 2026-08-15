import { screeningFacts } from '@/data/screening';
import { evidenceRecordSchema } from '@/types/content';

export const screeningEvidence = evidenceRecordSchema.array().parse(
  screeningFacts.map((fact) => ({
    id: `screening-${fact.id}`,
    title: fact.label,
    statement: fact.statement,
    topics: [...fact.topics],
    aliases: [...fact.aliases],
    roleWeights: { aiml: 5, software: 5, android: 5, teaching: 5 },
    sourceIds: [...fact.sourceIds],
    public: true as const,
  })),
);
