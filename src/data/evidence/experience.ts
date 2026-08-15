import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const bassRecords = [
  {
    id: 'bass-java-services',
    title: 'BASS Java services',
    statement:
      'At BASS, Mohamed developed Java and Spring Boot services for enterprise content-management workflows.',
    topics: ['BASS', 'Java', 'Spring Boot', 'enterprise systems'],
    aliases: ['enterprise content management', 'ECM'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: ['resume-aiml', 'resume-software', 'public-experience'],
    public: true,
  },
  {
    id: 'bass-api-delivery',
    title: 'BASS API delivery',
    statement: 'At BASS, Mohamed worked with REST and SOAP APIs.',
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
      'Mohamed supported OpenText Documentum workflows and validation controls in regulated, PII-aware environments at BASS.',
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

const mercatoRecords = [
  {
    id: 'mercato-football-talent',
    title: 'Mercato platform purpose',
    statement:
      'Mercato Star Finder is a football-talent platform where players present their skills for club agents to scout and sign them.',
    topics: ['Mercato', 'Android', 'football talent'],
    aliases: ['Mercato Star Finder', 'football-talent platform'],
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
] as const satisfies readonly EvidenceRecord[];

export const bassEvidence = evidenceRecordSchema.array().parse(bassRecords);
export const mercatoEvidence = evidenceRecordSchema
  .array()
  .parse(mercatoRecords);
export const experienceEvidence = evidenceRecordSchema
  .array()
  .parse([...bassEvidence, ...mercatoEvidence]);
