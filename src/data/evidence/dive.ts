import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'dive-end-to-end-ownership',
    title: 'Dive project ownership',
    statement:
      'I owned and implemented the Dive Simulation & Safety Profile Planner project end to end.',
    topics: ['Dive', 'ownership', 'client project'],
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
    id: 'dive-planning-purpose',
    title: 'Dive planning purpose',
    statement:
      'Dive supports recreational scuba planning with safety-profile classification and recommendations.',
    topics: ['Dive', 'scuba', 'safety planning', 'recommendations'],
    aliases: ['dive planner', 'safety profile'],
    roleWeights: { aiml: 4, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-aiml', 'resume-android', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-ml-classification',
    title: 'Dive safety classification',
    statement:
      'Dive uses a Python and scikit-learn classification component for safety profiles.',
    topics: ['Dive', 'Python', 'scikit-learn', 'classification'],
    aliases: ['Dive machine learning', 'safety classifier'],
    roleWeights: { aiml: 5, software: 3, android: 3, teaching: 1 },
    sourceIds: ['resume-aiml', 'github-dive', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-android-client',
    title: 'Dive Android client',
    statement: 'Dive includes an Android client implemented in Java.',
    topics: ['Dive', 'Android', 'Java'],
    aliases: ['Dive mobile app', 'Android client'],
    roleWeights: { aiml: 2, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'github-dive', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-firebase-services',
    title: 'Dive Firebase services',
    statement:
      'Dive integrates Firebase Authentication, Realtime Database, and Storage.',
    topics: ['Dive', 'Firebase', 'authentication', 'storage'],
    aliases: ['Firebase Realtime Database', 'Firebase Auth'],
    roleWeights: { aiml: 2, software: 4, android: 5, teaching: 1 },
    sourceIds: ['github-dive', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-api-maps-integration',
    title: 'Dive API and maps integration',
    statement:
      'The Dive Android client uses Retrofit for API calls and integrates Google Maps, Location, and Places services.',
    topics: ['Dive', 'Retrofit', 'Google Maps', 'Places'],
    aliases: ['Dive API', 'dive location services'],
    roleWeights: { aiml: 2, software: 4, android: 5, teaching: 1 },
    sourceIds: ['github-dive', 'case-study-dive'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const diveEvidence = evidenceRecordSchema.array().parse(records);
