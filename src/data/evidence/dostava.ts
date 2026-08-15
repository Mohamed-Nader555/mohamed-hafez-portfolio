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
    statement: 'Dostava is implemented in Java using MVVM architecture.',
    topics: ['Dostava', 'Java', 'MVVM', 'Android'],
    aliases: ['Dostava stack', 'delivery app architecture'],
    roleWeights: { aiml: 1, software: 5, android: 5, teaching: 2 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-network-data',
    title: 'Dostava network and data layers',
    statement:
      'Dostava uses Retrofit for remote APIs and Room for local persistence.',
    topics: ['Dostava', 'Retrofit', 'Room', 'data layer'],
    aliases: ['offline data', 'API client', 'local database'],
    roleWeights: { aiml: 1, software: 5, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-firebase',
    title: 'Dostava Firebase integration',
    statement:
      'Dostava integrates Firebase services for its mobile delivery workflows and notifications.',
    topics: ['Dostava', 'Firebase', 'notifications'],
    aliases: ['push notifications', 'Firebase integration'],
    roleWeights: { aiml: 1, software: 4, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    public: true,
  },
  {
    id: 'dostava-maps-tracking',
    title: 'Dostava maps and tracking',
    statement:
      'Dostava integrates Google Maps for delivery location and tracking workflows.',
    topics: ['Dostava', 'Google Maps', 'tracking', 'location'],
    aliases: ['delivery tracking', 'maps integration'],
    roleWeights: { aiml: 1, software: 4, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
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
