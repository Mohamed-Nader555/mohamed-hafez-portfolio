import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'teaching-delivery',
    title: 'Teaching delivery',
    statement:
      'I have planned and delivered tutorials, labs, office hours, workshops, and technical learning materials.',
    topics: ['teaching', 'tutorials', 'labs', 'workshops'],
    aliases: ['teaching assistant', 'technical instructor', 'TA'],
    roleWeights: { aiml: 2, software: 2, android: 1, teaching: 5 },
    sourceIds: ['resume-teaching', 'public-experience'],
    public: true,
  },
  {
    id: 'teaching-computing-topics',
    title: 'Computing instruction',
    statement:
      'My teaching experience includes Data Visualization, Systems Architecture, Data Structures, Java, and object-oriented programming.',
    topics: ['Data Visualization', 'Systems Architecture', 'Java', 'OOP'],
    aliases: ['computer science teaching', 'programming instruction'],
    roleWeights: { aiml: 2, software: 3, android: 2, teaching: 5 },
    sourceIds: ['resume-software', 'resume-teaching', 'public-experience'],
    public: true,
  },
  {
    id: 'teaching-ai-ml',
    title: 'AI/ML instruction',
    statement: 'I have taught AI and machine-learning fundamentals.',
    topics: ['AI', 'machine learning', 'teaching'],
    aliases: ['AI/ML fundamentals', 'machine learning instruction'],
    roleWeights: { aiml: 4, software: 2, android: 1, teaching: 5 },
    sourceIds: ['resume-aiml', 'resume-teaching', 'public-experience'],
    public: true,
  },
  {
    id: 'ceh-training',
    title: 'CEH training status',
    statement:
      'I completed CEH training but did not receive an official CEH certification.',
    topics: ['CEH', 'training', 'security'],
    aliases: ['Certified Ethical Hacker training', 'security training'],
    roleWeights: { aiml: 1, software: 2, android: 1, teaching: 2 },
    sourceIds: ['resume-aiml', 'resume-teaching'],
    public: true,
  },
  {
    id: 'student-leadership',
    title: 'Student leadership at Helwan University',
    statement:
      'At Helwan University (2018–2022), Mohamed was Leader of the Academic Committee in the Minders Student Activity, a member of the Technical Committee of the Microsoft Student Partner Tech Club, and an instructor at the Google Developers Student Club.',
    topics: [
      'leadership',
      'student activities',
      'Minders',
      'Microsoft Student Partner',
      'Google Developers Student Club',
    ],
    aliases: [
      'student leadership',
      'Academic Committee',
      'Minders Student Activity',
      'leadership experience',
    ],
    roleWeights: { aiml: 1, software: 1, android: 1, teaching: 4 },
    sourceIds: ['resume-teaching'],
    public: true,
  },
  {
    id: 'icpc-contestant',
    title: 'ICPC contestant',
    statement:
      'Mohamed competed in the ICPC programming contest in three consecutive years: 2019, 2020, and 2021.',
    topics: ['ICPC', 'competitive programming', 'problem solving'],
    aliases: [
      'competitive programming',
      'programming contest',
      'ICPC contestant',
    ],
    roleWeights: { aiml: 1, software: 2, android: 1, teaching: 3 },
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-android',
      'resume-teaching',
    ],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const teachingEvidence = evidenceRecordSchema.array().parse(records);
