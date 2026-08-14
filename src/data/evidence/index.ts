import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const evidenceRecords = [
  {
    id: 'asc-pie-thesis-awarded',
    title: 'ASC-PIE thesis completion',
    statement:
      'Mohamed’s M.A. in Information Systems & Technology at York University was completed and awarded in 2026; the thesis is “ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition.”',
    topics: ['ASC-PIE', 'thesis', 'York University', 'PII-aware NER'],
    aliases: ['ASC PIE', 'PII-aware named entity recognition'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 4 },
    sourceIds: [
      'official-yorkspace',
      'official-thesis-handle',
      'case-study-asc-pie',
    ],
    public: true,
  },
  {
    id: 'sprint-pp-status',
    title: 'SPRINT-PP research status',
    statement: 'SPRINT-PP is a research paper submitted and under review.',
    topics: ['SPRINT-PP', 'research', 'privacy'],
    aliases: ['sprint pp', 'publication status'],
    roleWeights: { aiml: 5, software: 2, android: 0, teaching: 3 },
    sourceIds: ['case-study-asc-pie'],
    public: true,
  },
  {
    id: 'northstar-grounded-rag',
    title: 'Northstar grounded RAG delivery',
    statement:
      'Northstar is an independently built, end-to-end RAG engineering project demonstrating grounded retrieval, citations, refusal behavior, evaluation, testing, and Docker deployment.',
    topics: ['Northstar', 'RAG', 'retrieval', 'citations', 'Docker'],
    aliases: ['Northstar RAG', 'retrieval augmented generation'],
    roleWeights: { aiml: 5, software: 5, android: 1, teaching: 2 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'github-northstar-rag',
      'case-study-northstar',
    ],
    public: true,
  },
  {
    id: 'dive-end-to-end-ownership',
    title: 'Dive project ownership',
    statement:
      'Mohamed owned and implemented the Dive Simulation & Safety Profile Planner project end to end.',
    topics: ['Dive', 'Android', 'machine learning', 'safety planning'],
    aliases: ['Dive Simulation', 'Safety Profile Planner'],
    roleWeights: { aiml: 3, software: 4, android: 5, teaching: 1 },
    sourceIds: [
      'resume-aiml',
      'resume-android',
      'github-dive',
      'case-study-dive',
    ],
    public: true,
  },
  {
    id: 'mercato-football-talent',
    title: 'Mercato platform purpose',
    statement:
      'Mercato Star Finder is a football-talent platform where players present their skills for club agents to scout and sign them.',
    topics: ['Mercato', 'Android', 'football talent'],
    aliases: ['Mercato Star Finder', 'football talent platform'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android'],
    public: true,
  },
  {
    id: 'android-historical-play-store',
    title: 'Historical Android app availability',
    statement:
      'Four Android apps were previously published under client-owned Google Play listings and are no longer available because the clients did not continue maintenance or request updates.',
    topics: ['Android', 'Google Play', 'historical availability'],
    aliases: ['Play Store', 'Google Play apps'],
    roleWeights: { aiml: 1, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software'],
    public: true,
  },
  {
    id: 'ceh-training',
    title: 'CEH training status',
    statement:
      'Mohamed completed CEH training; it is not an official CEH certification.',
    topics: ['CEH', 'training', 'security'],
    aliases: ['Certified Ethical Hacker', 'CEH certification'],
    roleWeights: { aiml: 1, software: 2, android: 1, teaching: 2 },
    sourceIds: ['resume-aiml', 'resume-teaching'],
    public: true,
  },
  {
    id: 'bass-enterprise-engineering',
    title: 'BASS enterprise engineering',
    statement:
      'At BASS, Mohamed developed Java and Spring Boot services with REST and SOAP APIs and supported enterprise document workflows in regulated, PII-aware environments.',
    topics: ['BASS', 'Java', 'Spring Boot', 'enterprise systems'],
    aliases: ['enterprise content management', 'ECM'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-teaching',
      'public-experience',
    ],
    public: true,
  },
  {
    id: 'teaching-technical-communication',
    title: 'Teaching and technical communication',
    statement:
      'Mohamed has teaching-assistant and technical-instruction experience in Data Visualization, Systems Architecture, Data Structures, Java/OOP, and AI/ML fundamentals.',
    topics: ['teaching', 'technical instruction', 'Data Structures', 'AI/ML'],
    aliases: ['teaching assistant', 'technical instructor', 'TA'],
    roleWeights: { aiml: 2, software: 2, android: 1, teaching: 5 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-teaching',
      'public-experience',
    ],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const evidence = evidenceRecordSchema.array().parse(evidenceRecords);
