import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  {
    id: 'restaurant-management-purpose',
    title: 'Restaurant Management App purpose',
    statement:
      'I built a Java desktop app for a restaurant covering role dashboards, meals, orders, billing, offers, rewards, and reports, with binary file persistence, as freelance Java work.',
    topics: ['restaurant management', 'Java', 'Swing', 'freelance'],
    aliases: ['Restaurant Management Desktop App'],
    roleWeights: { aiml: 0, software: 4, android: 0, teaching: 1 },
    sourceIds: ['resume-software', 'case-study-restaurant-management'],
    public: true,
  },
  {
    id: 'online-tic-tac-toe-purpose',
    title: 'Tic-Tac-Toe purpose',
    statement:
      'I built a networked Tic-Tac-Toe game end to end: a JavaFX client and server supporting offline play against a friend or a Minimax AI with difficulty levels, and online play with authentication, user lists, invitations, scores, and game recording/replay.',
    topics: ['Tic-Tac-Toe', 'JavaFX', 'Minimax', 'sockets'],
    aliases: ['Online & Offline Tic-Tac-Toe'],
    roleWeights: { aiml: 0, software: 3, android: 0, teaching: 2 },
    sourceIds: [
      'resume-software',
      'resume-teaching',
      'case-study-online-tic-tac-toe',
    ],
    public: true,
  },
  {
    id: 'healthcare-desktop-purpose',
    title: 'HealthCare Desktop purpose',
    statement:
      'I built a Java Swing desktop app for recording general wellness indicators and reports, as a local prototype and not a clinical system.',
    topics: ['HealthCare Desktop', 'Java', 'Swing', 'wellness'],
    aliases: ['HealthCare Desktop Monitoring'],
    roleWeights: { aiml: 0, software: 3, android: 0, teaching: 0 },
    sourceIds: ['resume-software'],
    public: true,
  },
  {
    id: 'priority-request-manager-purpose',
    title: 'Priority-Based Request Manager purpose',
    statement:
      'I built an early data-structures assignment in C implementing four priority tiers with QuickSort and binary search.',
    topics: ['C', 'data structures', 'QuickSort', 'binary search'],
    aliases: ['Priority-Based Request Manager'],
    roleWeights: { aiml: 0, software: 2, android: 0, teaching: 2 },
    sourceIds: ['resume-software'],
    public: true,
  },
  {
    id: 'school-management-system-purpose',
    title: 'School Management System purpose',
    statement:
      'I built a Java console system for a small school covering principals, teachers, students, subjects, role-based salary rules, and file persistence.',
    topics: ['School Management System', 'Java', 'OOP'],
    aliases: [],
    roleWeights: { aiml: 0, software: 3, android: 0, teaching: 1 },
    sourceIds: ['resume-software'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const earlyJavaEvidence = evidenceRecordSchema.array().parse(records);
