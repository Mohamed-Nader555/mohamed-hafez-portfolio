import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'sprint-pp-status',
    title: 'SPRINT-PP research status',
    statement:
      'SPRINT-PP, a paper titled “ASC-PIE and SPRINT-PP: Evaluating Privacy-Safe Continual Learning for PII Extraction,” is accepted to IEEE CASCON 2026 in Toronto. The method is also part of Mohamed’s M.A. thesis. No author list is public yet.',
    topics: ['SPRINT-PP', 'research', 'privacy', 'CASCON', 'IEEE'],
    aliases: ['SPRINT PP', 'paper status', 'publication status', 'CASCON 2026'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 3 },
    sourceIds: ['case-study-sprint-pp', 'official-yorkspace'],
    public: true,
  },
  {
    id: 'sprint-pp-protocol',
    title: 'SPRINT-PP protocol',
    statement:
      'SPRINT-PP is a three-stage class-incremental protocol in which each stage adds new PII types, evaluated with both stage-restricted and cumulative views, tested on one RoBERTa-large backbone.',
    topics: ['SPRINT-PP', 'continual learning', 'class-incremental'],
    aliases: ['staged learning', 'incremental PII types'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 2 },
    sourceIds: ['official-yorkspace', 'case-study-sprint-pp'],
    public: true,
  },
  {
    id: 'sprint-pp-mechanism',
    title: 'How SPRINT-PP avoids storing raw data',
    statement:
      'SPRINT-PP has the frozen previous-stage model triage newly “O”-labelled tokens for suspected old entities, applies selective soft-label correction only to those tokens, keeps a one-centroid-per-type prototype memory with no raw text, and anchors the classifier rows for old labels.',
    topics: ['SPRINT-PP', 'privacy', 'continual learning', 'prototype memory'],
    aliases: ['no raw replay', 'selective correction', 'prototype memory'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 2 },
    sourceIds: ['official-yorkspace', 'case-study-sprint-pp'],
    public: true,
  },
  {
    id: 'sprint-pp-results',
    title: 'SPRINT-PP results',
    statement:
      'SPRINT-PP reached 83.5% accuracy, the strongest of four compared strategies, used 25.6% less training time than distillation, and stored zero raw historical examples. Its privacy is operational, not a formal guarantee.',
    topics: ['SPRINT-PP', 'results', 'accuracy', 'privacy'],
    aliases: ['SPRINT-PP accuracy', 'continual learning results'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 2 },
    sourceIds: ['official-yorkspace', 'case-study-sprint-pp'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const sprintPpEvidence = evidenceRecordSchema.array().parse(records);
