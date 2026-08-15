import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'minds-eye-purpose',
    title: 'Assistive smart-glasses system',
    statement:
      'Mind’s Eye is an assistive smart-glasses system that combines mobile, embedded, and cloud components.',
    topics: ['Mind’s Eye', 'assistive technology', 'smart glasses'],
    aliases: ['Minds Eye', 'wearable assistive system'],
    roleWeights: { aiml: 4, software: 2, android: 5, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-majority-delivery',
    title: 'Mind’s Eye ownership',
    statement: 'Mohamed delivered more than 80% of the Mind’s Eye system.',
    topics: ['Mind’s Eye', 'ownership', 'delivery'],
    aliases: ['project contribution', 'implementation ownership'],
    roleWeights: { aiml: 4, software: 3, android: 5, teaching: 2 },
    sourceIds: [
      'resume-aiml',
      'resume-android',
      'resume-software',
      'case-study-minds-eye',
    ],
    public: true,
  },
  {
    id: 'minds-eye-currency-recognition',
    title: 'Currency recognition',
    statement:
      'Mohamed built the Egyptian-currency recognition capability from scratch.',
    topics: ['Mind’s Eye', 'computer vision', 'currency recognition'],
    aliases: ['Egyptian currency', 'banknote recognition'],
    roleWeights: { aiml: 5, software: 2, android: 5, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-ocr-speech',
    title: 'OCR-to-speech workflow',
    statement:
      'Mind’s Eye uses Tesseract OCR to extract text and return it through text-to-speech.',
    topics: ['Mind’s Eye', 'Tesseract OCR', 'text-to-speech'],
    aliases: ['OCR', 'read text aloud'],
    roleWeights: { aiml: 4, software: 2, android: 5, teaching: 2 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-mobile-embedded-integration',
    title: 'Mobile and embedded integration',
    statement:
      'Mind’s Eye connects an Android Java client with Arduino-based wearable hardware.',
    topics: ['Android', 'Java', 'Arduino', 'embedded systems'],
    aliases: ['wearable integration', 'mobile embedded system'],
    roleWeights: { aiml: 3, software: 3, android: 5, teaching: 3 },
    sourceIds: ['resume-android', 'case-study-minds-eye'],
    public: true,
  },
  {
    id: 'minds-eye-service-integration',
    title: 'Recognition service integration',
    statement:
      'The Android client integrates recognition services through REST APIs and Retrofit.',
    topics: ['Android', 'REST APIs', 'Retrofit', 'recognition'],
    aliases: ['mobile API integration', 'recognition API'],
    roleWeights: { aiml: 3, software: 3, android: 5, teaching: 2 },
    sourceIds: ['resume-android', 'case-study-minds-eye'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const mindsEyeEvidence = evidenceRecordSchema.array().parse(records);
