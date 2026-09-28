import { z } from 'zod';

export const statusKeySchema = z.enum([
  'thesis-awarded',
  'accepted-cascon',
  'independent',
  'course-project',
  'learning-project',
  'capstone-a-plus',
  'client-unpublished',
  'play-previously',
  'play-iti',
  'client-delivered',
  'iti-cohort',
  'dotpy-delivery',
  'enterprise-bass',
  'live-site',
  'prototype',
  'freelance-java',
  'java-project',
  'desktop-prototype',
  'java-game',
  'android-app',
  'coursework',
]);
export type StatusKey = z.infer<typeof statusKeySchema>;

export interface StatusDefinition {
  badge: string;
  longer: string;
}

export const PROJECT_STATUS: Readonly<Record<StatusKey, StatusDefinition>> = {
  'thesis-awarded': {
    badge: 'Thesis · awarded 2026',
    longer: 'M.A. thesis completed; degree officially awarded 2026.',
  },
  'accepted-cascon': {
    badge: 'Accepted · CASCON 2026',
    longer:
      'Paper accepted to IEEE CASCON 2026 (Toronto, 10–12 Nov 2026); the method is also part of my M.A. thesis.',
  },
  independent: {
    badge: 'Independent build',
    longer:
      'Independently built end to end as a hands-on RAG engineering project.',
  },
  'course-project': {
    badge: 'Course project · 2025',
    longer: 'A course project: a notebook-based pipeline I built in 2025.',
  },
  'learning-project': {
    badge: 'Learning project',
    longer: 'A self-contained learning project I built and published.',
  },
  'capstone-a-plus': {
    badge: 'Capstone · A+',
    longer: 'B.Sc. graduation capstone by a five-person team, graded A+.',
  },
  'client-unpublished': {
    badge: 'Client project · not published',
    longer:
      'Delivered to the client in June 2024; not published to Google Play.',
  },
  'play-previously': {
    badge: 'Previously on Google Play',
    longer:
      'Previously published under a client-owned Google Play listing; no longer available because the client stopped maintaining it.',
  },
  'play-iti': {
    badge: 'Published · ITI training',
    longer:
      'Built during the ITI Android track (2023) and published to Google Play as part of the training.',
  },
  'client-delivered': {
    badge: 'Client project · delivered',
    longer: 'Delivered to the client; not published.',
  },
  'iti-cohort': {
    badge: 'ITI project · 2023',
    longer:
      'Built during the ITI Android Mobile Development track, Mar–Jul 2023.',
  },
  'dotpy-delivery': {
    badge: 'Applied ML · DotPy',
    longer: 'Delivered at DotPy, 2021–2023.',
  },
  'enterprise-bass': {
    badge: 'Enterprise · BASS',
    longer:
      'Enterprise work at BASS for banking clients in regulated environments, 2023–2024.',
  },
  'live-site': {
    badge: 'Live · evolving',
    longer: 'The site you are reading; built and maintained by me.',
  },
  prototype: {
    badge: 'Backend prototype',
    longer: 'A working pre-deployment prototype; not deployed to production.',
  },
  'freelance-java': {
    badge: 'Freelance Java',
    longer: 'Freelance Java project I built end to end.',
  },
  'java-project': {
    badge: 'Java project',
    longer: 'A Java project I built end to end.',
  },
  'desktop-prototype': {
    badge: 'Java desktop prototype',
    longer:
      'A local Java desktop prototype I built and published; not a clinical system.',
  },
  'java-game': {
    badge: 'JavaFX game',
    longer:
      'A networked JavaFX game I built end to end; part of my freelance Java work and my ITI track (2023).',
  },
  'android-app': {
    badge: 'Android app',
    longer: 'An Android app I built end to end.',
  },
  coursework: {
    badge: 'Early coursework',
    longer: 'Early data-structures assignment in C.',
  },
};
