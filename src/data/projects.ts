import { projectRecordSchema, type ProjectRecord } from '@/types/content';

const projectsData = [
  {
    id: 'asc-pie',
    slug: 'asc-pie',
    title: 'ASC-PIE',
    summary:
      'I developed this PII-aware named-entity recognition corpus and evaluation framework for my M.A. thesis.',
    ownership:
      'I designed and built the research pipeline, corpus standardization, and evaluation framework.',
    roles: ['aiml', 'software', 'teaching'],
    roleWeights: { aiml: 5, software: 3, android: 0, teaching: 4 },
    technologies: [
      'Python',
      'PyTorch',
      'Hugging Face Transformers',
      'scikit-learn',
    ],
    sourceIds: [
      'official-yorkspace',
      'official-thesis-handle',
      'github-thesis-experiments',
      'case-study-asc-pie',
    ],
    detailLevel: 'detailed',
    public: true,
  },
  {
    id: 'northstar-rag',
    slug: 'northstar-rag',
    title: 'Northstar RAG System',
    summary:
      'An independently built, end-to-end hands-on RAG engineering project for grounded retrieval and citation-backed answers.',
    ownership:
      'I independently built the RAG system end to end, including retrieval, citations, refusal behavior, evaluation, testing, and Docker deployment.',
    roles: ['aiml', 'software'],
    roleWeights: { aiml: 5, software: 5, android: 1, teaching: 2 },
    technologies: [
      'Python',
      'FastAPI',
      'LangChain',
      'Chroma',
      'sentence-transformers',
      'RAGAS',
      'Docker',
    ],
    sourceIds: ['resume-aiml', 'resume-software', 'case-study-northstar'],
    detailLevel: 'detailed',
    public: true,
  },
  {
    id: 'minds-eye',
    slug: 'minds-eye',
    title: 'Mind’s Eye',
    summary:
      'Assistive smart-glasses system integrating mobile, embedded, and cloud components for recognition and OCR-driven text-to-speech.',
    ownership:
      'I delivered more than 80% of the wearable assistive system and built Egyptian currency recognition from scratch.',
    roles: ['aiml', 'android', 'teaching'],
    roleWeights: { aiml: 4, software: 2, android: 5, teaching: 3 },
    technologies: [
      'Android (Java)',
      'Arduino',
      'OpenCV',
      'Tesseract OCR',
      'REST APIs',
    ],
    sourceIds: [
      'resume-aiml',
      'resume-android',
      'resume-software',
      'case-study-minds-eye',
    ],
    detailLevel: 'detailed',
    public: true,
  },
  {
    id: 'dive',
    slug: 'dive',
    title: 'Dive Simulation & Safety Profile Planner',
    summary:
      'Mobile and ML-assisted recreational scuba dive-planning project with safety-profile classification and recommendations.',
    ownership:
      'I owned and implemented the project end to end, including the Android client, ML safety classification, API integration, and planning features.',
    roles: ['aiml', 'software', 'android'],
    roleWeights: { aiml: 3, software: 4, android: 5, teaching: 1 },
    technologies: [
      'Python',
      'scikit-learn',
      'Android (Java)',
      'Firebase',
      'Google Cloud Platform',
    ],
    sourceIds: [
      'resume-aiml',
      'resume-android',
      'github-dive',
      'case-study-dive',
    ],
    detailLevel: 'detailed',
    public: true,
  },
  {
    id: 'dostava',
    slug: 'dostava',
    title: 'Dostava Delivery',
    summary:
      'On-demand courier Android application with order workflows, tracking, notifications, offline-first data, and maps.',
    ownership:
      'I delivered the Android application using the documented mobile architecture and service integrations.',
    roles: ['software', 'android'],
    roleWeights: { aiml: 1, software: 4, android: 5, teaching: 1 },
    technologies: [
      'Java',
      'MVVM',
      'Retrofit',
      'Room',
      'Firebase',
      'Google Maps',
    ],
    sourceIds: ['resume-android', 'resume-software', 'case-study-dostava'],
    detailLevel: 'detailed',
    public: true,
  },
  {
    id: 'bass',
    slug: 'bass',
    title: 'BASS Engineering',
    summary:
      'Enterprise content-management engineering involving Java services, APIs, document workflows, validation, and support.',
    ownership:
      'I developed and supported services, validation controls, and enterprise document workflows.',
    roles: ['software', 'teaching'],
    roleWeights: { aiml: 2, software: 5, android: 1, teaching: 3 },
    technologies: [
      'Java',
      'Spring Boot',
      'REST APIs',
      'SOAP APIs',
      'OpenText Documentum',
      'MS SQL Server',
    ],
    sourceIds: [
      'resume-aiml',
      'resume-software',
      'resume-teaching',
      'public-experience',
    ],
    detailLevel: 'supporting',
    public: true,
  },
  {
    id: 'mercato',
    slug: 'mercato',
    title: 'Mercato Star Finder',
    summary:
      'Football-talent platform enabling players to present their skills so club agents can scout and sign them.',
    ownership:
      'I built the Android application as part of my client-project delivery work.',
    roles: ['android'],
    roleWeights: { aiml: 0, software: 2, android: 4, teaching: 1 },
    technologies: ['Java', 'Android'],
    sourceIds: ['resume-android'],
    detailLevel: 'supporting',
    public: true,
  },
  {
    id: 'teaching-experience',
    slug: 'teaching-experience',
    title: 'Teaching & Technical Instruction',
    summary:
      'Teaching-assistant and instructor experience across computer science, software development, and AI/ML topics.',
    ownership:
      'I planned and delivered tutorials, labs, office hours, workshops, and technical learning materials.',
    roles: ['teaching'],
    roleWeights: { aiml: 2, software: 2, android: 1, teaching: 5 },
    technologies: [
      'Data Structures',
      'Algorithms',
      'Java',
      'Object-Oriented Programming',
      'AI/ML',
    ],
    sourceIds: ['resume-teaching', 'public-experience'],
    detailLevel: 'supporting',
    public: true,
  },
] as const satisfies readonly ProjectRecord[];

export const projects = projectRecordSchema.array().parse(projectsData);
