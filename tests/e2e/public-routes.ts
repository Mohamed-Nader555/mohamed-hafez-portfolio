export interface PublicRouteExpectation {
  path: string;
  title: string;
  structuredType?: 'CreativeWork' | 'ScholarlyArticle';
}

export const existingPublicRoutes: readonly PublicRouteExpectation[] = [
  { path: '/', title: 'Mohamed Hafez — AI/ML Engineer' },
  { path: '/software', title: 'Mohamed Hafez — Software Engineer' },
  { path: '/android', title: 'Mohamed Hafez — Android Developer' },
  { path: '/teaching', title: 'Mohamed Hafez — TA / Instructor' },
  { path: '/work', title: 'Evidence-led work — Mohamed Hafez' },
  {
    path: '/work/asc-pie',
    title: 'ASC-PIE — Mohamed Hafez',
    structuredType: 'CreativeWork',
  },
  {
    path: '/work/northstar-rag',
    title: 'Northstar RAG System — Mohamed Hafez',
    structuredType: 'CreativeWork',
  },
  {
    path: '/work/minds-eye',
    title: "Mind's Eye — Mohamed Hafez",
    structuredType: 'CreativeWork',
  },
  {
    path: '/work/dive',
    title: 'Dive Simulation & Safety Profile Planner — Mohamed Hafez',
    structuredType: 'CreativeWork',
  },
  {
    path: '/work/dostava',
    title: 'Dostava Delivery — Mohamed Hafez',
    structuredType: 'CreativeWork',
  },
  {
    path: '/research/asc-pie',
    title:
      'ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition — Mohamed Hafez',
    structuredType: 'ScholarlyArticle',
  },
  {
    path: '/experience',
    title: 'Professional responsibility — Mohamed Hafez',
  },
  { path: '/about', title: 'About Mohamed Hafez' },
];

export const publicRoutes: readonly PublicRouteExpectation[] = [
  ...existingPublicRoutes,
  { path: '/privacy', title: 'Privacy — Mohamed Hafez' },
];
