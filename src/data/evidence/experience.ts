import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const bassRecords = [
  {
    id: 'bass-java-services',
    title: 'BASS Java services',
    statement:
      'At BASS, I developed Java and Spring Boot services for enterprise content-management workflows.',
    topics: ['BASS', 'Java', 'Spring Boot', 'enterprise systems'],
    aliases: ['enterprise content management', 'ECM'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-software', 'public-experience'],
    public: true,
  },
  {
    id: 'bass-api-delivery',
    title: 'BASS API delivery',
    statement: 'At BASS, I worked with REST and SOAP APIs.',
    topics: ['BASS', 'REST APIs', 'SOAP APIs'],
    aliases: ['enterprise APIs', 'service integration'],
    roleWeights: { aiml: 1, software: 5, android: 2, teaching: 2 },
    sourceIds: ['resume-software', 'resume-teaching', 'public-experience'],
    public: true,
  },
  {
    id: 'bass-document-workflows',
    title: 'Enterprise document workflows',
    statement:
      'I supported OpenText Documentum workflows and validation controls in regulated, PII-aware environments at BASS.',
    topics: ['BASS', 'OpenText Documentum', 'validation', 'PII'],
    aliases: ['document management', 'regulated workflows'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-teaching',
      'public-experience',
    ],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

const currentRoleRecords = [
  {
    id: 'eklan-current-role',
    title: 'Current role at Eklan',
    statement:
      'I am currently working as Founding AI Engineer at Eklan (2026 to present).',
    topics: ['Eklan', 'Founding AI Engineer', 'current role', 'notice period'],
    aliases: [
      'current employer',
      'present role',
      'where does Mohamed work now',
      'who does Mohamed work for',
    ],
    roleWeights: { aiml: 4, software: 4, android: 0, teaching: 0 },
    sourceIds: ['public-experience'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

const mercatoRecords = [
  {
    id: 'mercato-football-talent',
    title: 'Mercato platform purpose',
    statement:
      'Mercato Star Finder is a football-talent platform where players present their skills for club agents to scout and sign them.',
    topics: ['Mercato', 'Android', 'football talent'],
    aliases: ['Mercato Star Finder', 'football-talent platform'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    sourceIds: ['resume-android', 'case-study-mercato'],
    public: true,
  },
  {
    id: 'android-historical-play-store',
    title: 'Historical Android app availability',
    statement:
      'Four apps were previously published on Google Play: three under client-owned listings (Dostava, Your Life Is My Life, and The Death Ninja) and one, Healthy Habit / Food Planner, as part of my ITI training. Search for Eats was not published to Google Play.',
    topics: ['Android', 'Google Play', 'historical availability'],
    aliases: ['Play Store', 'Google Play apps', '16 Android applications'],
    roleWeights: { aiml: 1, software: 3, android: 5, teaching: 1 },
    sourceIds: ['resume-android', 'resume-software'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const bassEvidence = evidenceRecordSchema.array().parse(bassRecords);
export const currentRoleEvidence = evidenceRecordSchema
  .array()
  .parse(currentRoleRecords);
export const mercatoEvidence = evidenceRecordSchema
  .array()
  .parse(mercatoRecords);
export const experienceEvidence = evidenceRecordSchema
  .array()
  .parse([...currentRoleEvidence, ...bassEvidence, ...mercatoEvidence]);
