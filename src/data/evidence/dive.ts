import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'dive-end-to-end-ownership',
    title: 'Dive project ownership',
    statement:
      'I owned and implemented the Dive Simulation & Safety Profile Planner end to end, delivered to the client in June 2024. It is not published to Google Play.',
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
      'Dive is a planning and education aid for recreational scuba divers, not a safety device: it supports dive-plan checks and recommendations alongside a deterministic RDP calculator.',
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
      'Dive compared four classifiers hosted on PythonAnywhere — SVC, Logistic Regression, Decision Tree, and an ANN — for a safe/not-safe check, using inputs of max depth, bottom time, O₂ percentage, first-or-second dive of the day, surface interval, and an auto-calculated PPO₂. The Decision Tree was selected, with 100% training accuracy and 99.5% test accuracy; these are offline scores on the project’s own dataset, not a safety guarantee.',
    topics: ['Dive', 'Python', 'scikit-learn', 'classification', 'PythonAnywhere'],
    aliases: ['Dive machine learning', 'safety classifier', 'decision tree'],
    roleWeights: { aiml: 5, software: 3, android: 3, teaching: 1 },
    sourceIds: ['resume-aiml', 'github-dive', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-android-client',
    title: 'Dive Android client',
    statement: 'Dive includes an Android client implemented in Java and XML.',
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
      'Dive integrates Firebase Authentication and Realtime Database, with AES-encrypted passwords and database access rules.',
    topics: ['Dive', 'Firebase', 'authentication', 'security'],
    aliases: ['Firebase Realtime Database', 'Firebase Auth'],
    roleWeights: { aiml: 2, software: 4, android: 5, teaching: 1 },
    sourceIds: ['github-dive', 'case-study-dive'],
    public: true,
  },
  {
    id: 'dive-cloud-and-location-services',
    title: 'Dive cloud, weather, and maps integration',
    statement:
      'Dive runs on Google Cloud Platform and integrates Google Maps Platform, OpenWeather for live and forecast weather, and Retrofit for API calls.',
    topics: ['Dive', 'Google Cloud Platform', 'Google Maps', 'OpenWeather'],
    aliases: ['Dive API', 'dive location services', 'dive weather'],
    roleWeights: { aiml: 2, software: 4, android: 5, teaching: 1 },
    sourceIds: ['github-dive', 'case-study-dive'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const diveEvidence = evidenceRecordSchema.array().parse(records);
