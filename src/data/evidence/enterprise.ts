import { evidenceRecordSchema, type EvidenceRecord } from '@/types/content';

const records = [
  // Documentum Workflow & Lifecycle Optimization
  {
    id: 'documentum-workflows-purpose',
    title: 'Documentum workflow purpose',
    statement:
      'At BASS, I built and supported OpenText Documentum workflows for document intake, classification, review, lifecycle states, and archive/retention for banking clients in regulated environments (Aug 2023 – Sep 2024).',
    topics: ['Documentum', 'workflows', 'enterprise', 'banking'],
    aliases: ['Documentum Workflow & Lifecycle Optimization'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    sourceIds: [
      'resume-software',
      'public-experience',
      'case-study-documentum-workflows',
    ],
    public: true,
  },
  {
    id: 'documentum-workflows-stack',
    title: 'Documentum workflow stack',
    statement:
      'This work used OpenText Documentum Content Server, Documentum Composer, DQL, Java, Oracle Database, Microsoft SQL Server, and Git, with DQL health queries proving retention compliance.',
    topics: ['Documentum', 'DQL', 'Oracle', 'SQL Server'],
    aliases: [],
    roleWeights: { aiml: 1, software: 5, android: 0, teaching: 2 },
    sourceIds: ['resume-software', 'case-study-documentum-workflows'],
    public: true,
  },
  // PDF Document Processing Utilities
  {
    id: 'pdf-utilities-purpose',
    title: 'PDF utilities purpose',
    statement:
      'At BASS, I built Java utilities for automated PDF generation, assembly, transformation, and packaging, with logging for failure diagnostics.',
    topics: ['PDF', 'iText', 'document processing'],
    aliases: ['PDF Document Processing Utilities'],
    roleWeights: { aiml: 1, software: 5, android: 0, teaching: 1 },
    sourceIds: [
      'resume-software',
      'public-experience',
      'case-study-pdf-utilities',
    ],
    public: true,
  },
  {
    id: 'pdf-utilities-stack',
    title: 'PDF utilities stack',
    statement:
      'These utilities used Java, iText, Apache Tomcat, Maven, and log4j.',
    topics: ['PDF', 'iText', 'Tomcat', 'Maven'],
    aliases: [],
    roleWeights: { aiml: 0, software: 5, android: 0, teaching: 0 },
    sourceIds: ['resume-software', 'case-study-pdf-utilities'],
    public: true,
  },
  // Internal REST Endpoints & Client PoCs
  {
    id: 'rest-pocs-purpose',
    title: 'REST endpoints and PoCs purpose',
    statement:
      'At BASS, I built internal REST endpoints and client proofs of concept bridging SOAP-based enterprise systems and documented JSON contracts.',
    topics: ['REST', 'SOAP', 'proof of concept'],
    aliases: ['Internal REST Endpoints & Client Proofs of Concept'],
    roleWeights: { aiml: 1, software: 5, android: 0, teaching: 1 },
    sourceIds: ['resume-software', 'public-experience', 'case-study-rest-pocs'],
    public: true,
  },
  {
    id: 'rest-pocs-stack',
    title: 'REST endpoints and PoCs stack',
    statement:
      'This work used Java, Spring Boot, Python, REST, SOAP, JSON Schema, basic authentication, Oracle Database, Microsoft SQL Server, Apache Tomcat, and Git.',
    topics: ['Java', 'Spring Boot', 'Python', 'REST'],
    aliases: [],
    roleWeights: { aiml: 0, software: 5, android: 0, teaching: 0 },
    sourceIds: ['resume-software', 'case-study-rest-pocs'],
    public: true,
  },
  // CloudBackend
  {
    id: 'cloud-backend-purpose',
    title: 'CloudBackend purpose',
    statement:
      'CloudBackend is an e-commerce API prototype with signup/login validation, product CRUD with approval and filtering, carts with quantity limits, and orders. It is a working pre-deployment prototype, not deployed to production.',
    topics: ['CloudBackend', 'Node.js', 'Express', 'API'],
    aliases: ['CloudBackend E-Commerce API'],
    roleWeights: { aiml: 0, software: 4, android: 0, teaching: 0 },
    sourceIds: ['resume-software', 'case-study-cloud-backend'],
    public: true,
  },
  {
    id: 'cloud-backend-stack',
    title: 'CloudBackend stack',
    statement:
      'CloudBackend uses Node.js, Express, MongoDB, Mongoose, bcrypt password hashing, and 1-hour JWTs.',
    topics: ['Node.js', 'Express', 'MongoDB', 'JWT'],
    aliases: [],
    roleWeights: { aiml: 0, software: 4, android: 0, teaching: 0 },
    sourceIds: ['resume-software', 'case-study-cloud-backend'],
    public: true,
  },
] as const satisfies readonly EvidenceRecord[];

export const enterpriseEvidence = evidenceRecordSchema.array().parse(records);
