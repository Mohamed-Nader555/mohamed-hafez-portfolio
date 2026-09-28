export interface PublicRouteExpectation {
  path: string;
  title: string;
  structuredType?: 'CreativeWork' | 'ScholarlyArticle';
}

// Brief §4: 28 projects (6 flagship + 11 story + 11 brief) each get a
// `/work/<slug>` page, titled `${project.title} — Mohamed Hafez` per
// `CaseStudyLayout.astro`. Titles are copied verbatim from
// `src/data/projects.ts` (including the curly apostrophe in "Mind's Eye").
const workRoutes: readonly PublicRouteExpectation[] = [
  { path: '/work/asc-pie', title: 'ASC-PIE — Mohamed Hafez' },
  { path: '/work/sprint-pp', title: 'SPRINT-PP — Mohamed Hafez' },
  {
    path: '/work/northstar-rag',
    title: 'Northstar RAG System — Mohamed Hafez',
  },
  { path: '/work/minds-eye', title: 'Mind’s Eye — Mohamed Hafez' },
  {
    path: '/work/dive',
    title: 'Dive Simulation & Safety Profile Planner — Mohamed Hafez',
  },
  { path: '/work/dostava', title: 'Dostava Delivery — Mohamed Hafez' },
  {
    path: '/work/applied-ml-portfolio',
    title: 'Applied Machine Learning Portfolio — Mohamed Hafez',
  },
  {
    path: '/work/cti-intrusion-detection',
    title: 'Network Intrusion Detection Pipeline — Mohamed Hafez',
  },
  {
    path: '/work/search-for-eats',
    title: 'Search for Eats — Mohamed Hafez',
  },
  { path: '/work/mercato', title: 'Mercato Star Finder — Mohamed Hafez' },
  {
    path: '/work/food-planner',
    title: 'Healthy Habit / Food Planner — Mohamed Hafez',
  },
  {
    path: '/work/weather-checker',
    title: 'Weather Checker — Mohamed Hafez',
  },
  {
    path: '/work/shop-on-the-go',
    title: 'Shop on the Go — Mohamed Hafez',
  },
  {
    path: '/work/documentum-workflows',
    title: 'Documentum Workflow & Lifecycle Optimization — Mohamed Hafez',
  },
  {
    path: '/work/pdf-utilities',
    title: 'PDF Document Processing Utilities — Mohamed Hafez',
  },
  {
    path: '/work/rest-pocs',
    title: 'Internal REST Endpoints & Client Proofs of Concept — Mohamed Hafez',
  },
  { path: '/work/this-portfolio', title: 'This Portfolio — Mohamed Hafez' },
  {
    path: '/work/your-life-is-my-life',
    title: 'Your Life Is My Life — Mohamed Hafez',
  },
  { path: '/work/death-ninja', title: 'The Death Ninja — Mohamed Hafez' },
  {
    path: '/work/cloud-backend',
    title: 'CloudBackend E-Commerce API — Mohamed Hafez',
  },
  {
    path: '/work/restaurant-management',
    title: 'Restaurant Management Desktop App — Mohamed Hafez',
  },
  {
    path: '/work/online-tic-tac-toe',
    title: 'Online & Offline Tic-Tac-Toe — Mohamed Hafez',
  },
  {
    path: '/work/gulf-arab-chat',
    title: 'Gulf Arab Chat — Mohamed Hafez',
  },
  { path: '/work/tourist-guide', title: 'Tourist Guide — Mohamed Hafez' },
  {
    path: '/work/sams',
    title: 'SAMS: Student Academic Management System — Mohamed Hafez',
  },
  {
    path: '/work/donation-app',
    title: 'Donation Management App — Mohamed Hafez',
  },
  {
    path: '/work/my-card',
    title: 'My Card: Personalized Greeting Cards — Mohamed Hafez',
  },
  {
    path: '/work/top-notch',
    title: 'Top Notch: Recipe Community — Mohamed Hafez',
  },
].map((route) => ({ ...route, structuredType: 'CreativeWork' as const }));

export const existingPublicRoutes: readonly PublicRouteExpectation[] = [
  { path: '/', title: 'Mohamed Hafez — AI/ML Engineer' },
  { path: '/software', title: 'Mohamed Hafez — Software Engineer' },
  { path: '/android', title: 'Mohamed Hafez — Android Developer' },
  { path: '/teaching', title: 'Mohamed Hafez — TA / Instructor' },
  { path: '/work', title: 'Projects — Mohamed Hafez' },
  ...workRoutes,
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
