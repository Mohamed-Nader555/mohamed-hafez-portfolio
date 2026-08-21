import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'asc-pie-thesis-title',
    title: 'ASC-PIE thesis title',
    statement:
      'My thesis is “ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition.”',
    topics: ['ASC-PIE', 'thesis', 'PII-aware NER'],
    aliases: ['ASC PIE', 'PII-aware named-entity recognition'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 4 },
    sourceIds: ['official-yorkspace', 'official-thesis-handle'],
    public: true,
  },
  {
    id: 'asc-pie-degree-awarded',
    title: 'M.A. completion',
    statement:
      'I completed my M.A. in Information Systems & Technology at York University in 2026.',
    topics: ['York University', 'M.A.', 'education', '2026'],
    aliases: ['masters degree', 'graduate degree', 'degree status'],
    roleWeights: { aiml: 5, software: 3, android: 1, teaching: 5 },
    sourceIds: ['official-yorkspace', 'official-thesis-handle'],
    public: true,
  },
  {
    id: 'asc-pie-evaluation-framework',
    title: 'PII-aware NER evaluation',
    statement:
      'ASC-PIE evaluates named-entity recognition for personally identifiable information across privacy-focused datasets.',
    topics: ['ASC-PIE', 'NER', 'PII', 'evaluation'],
    aliases: ['personal data detection', 'entity recognition evaluation'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 4 },
    sourceIds: [
      'official-yorkspace',
      'github-thesis-experiments',
      'case-study-asc-pie',
    ],
    public: true,
  },
  {
    id: 'asc-pie-dataset-pipeline',
    title: 'Research data pipeline',
    statement:
      'The ASC-PIE experiments prepare real and synthetic privacy datasets for NER training and evaluation.',
    topics: ['ASC-PIE', 'datasets', 'synthetic data', 'NER'],
    aliases: ['dataset preprocessing', 'privacy datasets'],
    roleWeights: { aiml: 5, software: 4, android: 0, teaching: 3 },
    sourceIds: ['github-thesis-experiments', 'case-study-asc-pie'],
    public: true,
  },
  {
    id: 'asc-pie-label-standardization',
    title: 'PII label standardization',
    statement:
      'The research pipeline maps differing PII label schemes into a shared representation for comparison.',
    topics: ['ASC-PIE', 'label mapping', 'PII', 'data preparation'],
    aliases: ['label normalization', 'annotation mapping'],
    roleWeights: { aiml: 5, software: 4, android: 0, teaching: 3 },
    sourceIds: ['github-thesis-experiments', 'case-study-asc-pie'],
    public: true,
  },
  {
    id: 'asc-pie-experiment-stack',
    title: 'ASC-PIE experiment stack',
    statement:
      'ASC-PIE experiments use Python, PyTorch, Hugging Face Transformers, scikit-learn, and seqeval.',
    topics: ['Python', 'PyTorch', 'Transformers', 'scikit-learn', 'seqeval'],
    aliases: ['thesis technologies', 'research stack'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 3 },
    sourceIds: ['github-thesis-experiments', 'case-study-asc-pie'],
    public: true,
  },
  {
    id: 'sprint-pp-status',
    title: 'SPRINT-PP research status',
    statement: 'SPRINT-PP is a research paper submitted and under review.',
    topics: ['SPRINT-PP', 'research', 'privacy'],
    aliases: ['SPRINT PP', 'paper status', 'publication status'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-teaching'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const researchEvidence = evidenceRecordSchema.array().parse(records);
