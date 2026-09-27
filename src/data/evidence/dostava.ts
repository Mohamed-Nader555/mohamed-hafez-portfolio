import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'dostava-purpose',
    title: 'Courier application',
    statement:
      'Dostava is an on-demand courier Android application for customer order and delivery workflows.',
    topics: ['Dostava', 'Android', 'courier', 'delivery'],
    aliases: ['delivery app', 'courier app'],
    roleWeights: { aiml: 1, software: 4, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-android-architecture',
    title: 'Dostava Android architecture',
    statement:
      'Dostava is implemented in Java on Firebase: Realtime Database, Authentication, Storage, and Analytics, using AndroidX Lifecycle (ViewModel/LiveData) for its presentation layer.',
    topics: ['Dostava', 'Java', 'Firebase', 'Android'],
    aliases: ['Dostava stack', 'delivery app architecture'],
    roleWeights: { aiml: 1, software: 5, android: 5, teaching: 2 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-firebase',
    title: 'Dostava Firebase integration',
    statement:
      'Dostava uses Firebase Realtime Database for users, orders, and its catalogue; Firebase Authentication with Facebook and Google sign-in; Firebase Storage for media; and Firebase Analytics.',
    topics: ['Dostava', 'Firebase', 'notifications', 'authentication'],
    aliases: ['push notifications', 'Firebase integration', 'Facebook login'],
    roleWeights: { aiml: 1, software: 4, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-monetization',
    title: 'Dostava monetization',
    statement: 'Dostava integrates AdMob.',
    topics: ['Dostava', 'AdMob', 'monetization'],
    aliases: ['ads integration'],
    roleWeights: { aiml: 0, software: 3, android: 4, teaching: 0 },
    sourceIds: ['resume-android', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-historical-play-store',
    title: 'Dostava release status',
    statement:
      'Dostava was previously published under a client-owned Google Play listing and is no longer available because the client did not continue maintenance or request updates.',
    topics: ['Dostava', 'Google Play', 'historical availability'],
    aliases: ['Play Store status', 'app availability'],
    roleWeights: { aiml: 0, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-dostava'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const dostavaEvidence = evidenceRecordSchema.array().parse(records);
