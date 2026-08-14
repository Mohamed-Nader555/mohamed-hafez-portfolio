import { roleLensSchema, type RoleLens } from '@/types/content';

const roleLenses = [
  {
    id: 'aiml',
    label: 'AI/ML Engineer',
    route: '/',
    title: 'Mohamed Hafez — AI/ML Engineer',
    description:
      'AI/ML engineering evidence covering privacy-aware NLP research and grounded RAG delivery.',
    summary:
      'AI/ML engineer focused on privacy-aware NLP, applied machine learning, and grounded RAG systems.',
    resumeHref: '/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf',
    featuredProjectIds: ['asc-pie', 'northstar-rag', 'minds-eye', 'dive'],
    sourceIds: ['resume-aiml', 'official-yorkspace'],
  },
  {
    id: 'software',
    label: 'Software Engineer',
    route: '/software',
    title: 'Mohamed Hafez — Software Engineer',
    description:
      'Software engineering evidence covering RAG services, enterprise systems, APIs, and client delivery.',
    summary:
      'Software engineer with backend, enterprise-system, API, and product-delivery experience.',
    resumeHref: '/resumes/Mohamed-Hafez-Software-Engineer.pdf',
    featuredProjectIds: ['northstar-rag', 'bass', 'dive', 'dostava'],
    sourceIds: ['resume-software', 'public-experience'],
  },
  {
    id: 'android',
    label: 'Android Developer',
    route: '/android',
    title: 'Mohamed Hafez — Android Developer',
    description:
      'Android engineering evidence spanning assistive technology, client applications, integrations, and delivery.',
    summary:
      'Android developer with end-to-end client delivery and integrated mobile experiences.',
    resumeHref: '/resumes/Mohamed-Hafez-Android-Developer.pdf',
    featuredProjectIds: ['minds-eye', 'dive', 'dostava', 'mercato'],
    sourceIds: ['resume-android'],
  },
  {
    id: 'teaching',
    label: 'TA / Instructor',
    route: '/teaching',
    title: 'Mohamed Hafez — TA / Instructor',
    description:
      'Teaching and technical-communication evidence supported by research and hands-on engineering breadth.',
    summary:
      'Technical instructor and teaching assistant with research and engineering experience.',
    resumeHref: '/resumes/Mohamed-Hafez-TA-Instructor.pdf',
    featuredProjectIds: [
      'teaching-experience',
      'asc-pie',
      'northstar-rag',
      'minds-eye',
    ],
    sourceIds: ['resume-teaching'],
  },
] as const satisfies readonly RoleLens[];

export const roles = roleLensSchema.array().parse(roleLenses);
