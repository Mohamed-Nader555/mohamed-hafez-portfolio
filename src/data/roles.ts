import { roleLensSchema, type RoleLens } from '@/types/content';

const roleLenses = [
  {
    id: 'aiml',
    label: 'AI/ML Engineer',
    route: '/',
    title: 'Mohamed Hafez — AI/ML Engineer',
    description:
      'I build privacy-aware NLP research and grounded RAG systems, with a focus on evaluation, reliability, and production delivery.',
    summary:
      'AI/ML engineer focused on privacy-aware NLP, applied machine learning, and grounded RAG systems.',
    resumeHref: '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
    featuredProjectIds: ['asc-pie', 'sprint-pp', 'northstar-rag', 'minds-eye'],
    depthEvidenceIds: {
      research: ['asc-pie-evaluation-framework', 'sprint-pp-status'],
      teaching: ['teaching-ai-ml', 'teaching-delivery'],
    },
    sourceIds: ['resume-aiml', 'official-yorkspace'],
  },
  {
    id: 'software',
    label: 'Software Engineer',
    route: '/software',
    title: 'Mohamed Hafez — Software Engineer',
    description:
      'I develop reliable services, enterprise workflows, APIs, and client products from architecture through delivery.',
    summary:
      'Software engineer with backend, enterprise-system, API, and product-delivery experience.',
    resumeHref: '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
    featuredProjectIds: [
      'northstar-rag',
      'documentum-workflows',
      'this-portfolio',
      'dive',
    ],
    depthEvidenceIds: {
      research: ['asc-pie-dataset-pipeline', 'asc-pie-label-standardization'],
      teaching: ['teaching-computing-topics', 'teaching-delivery'],
    },
    sourceIds: ['resume-software', 'public-experience'],
  },
  {
    id: 'android',
    label: 'Android Developer',
    route: '/android',
    title: 'Mohamed Hafez — Android Developer',
    description:
      'I build Android products that connect thoughtful mobile architecture with APIs, data, maps, ML, and accessible experiences.',
    summary:
      'Android developer with end-to-end client delivery and integrated mobile experiences.',
    resumeHref: '/resumes/Mohamed-Hafez-Android-Developer.pdf',
    featuredProjectIds: ['minds-eye', 'dive', 'dostava', 'food-planner'],
    depthEvidenceIds: {
      research: ['asc-pie-degree-awarded', 'asc-pie-evaluation-framework'],
      teaching: ['teaching-computing-topics', 'teaching-delivery'],
    },
    sourceIds: ['resume-android'],
  },
  {
    id: 'teaching',
    label: 'TA / Instructor',
    route: '/teaching',
    title: 'Mohamed Hafez — TA / Instructor',
    description:
      'I teach technical concepts through practical examples, clear explanations, and experience across research and engineering.',
    summary:
      'Technical instructor and teaching assistant with research and engineering experience.',
    resumeHref: '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    featuredProjectIds: [
      'teaching-experience',
      'asc-pie',
      'minds-eye',
      'online-tic-tac-toe',
    ],
    depthEvidenceIds: {
      research: ['asc-pie-thesis-title', 'sprint-pp-status'],
      teaching: ['teaching-computing-topics', 'ceh-training'],
    },
    sourceIds: ['resume-teaching'],
  },
] as const satisfies readonly RoleLens[];

export const roles = roleLensSchema.array().parse(roleLenses);
