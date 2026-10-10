import { profileSchema } from '@/types/content';

export const profile = profileSchema.parse({
  name: 'Mohamed Hafez',
  githubHandle: 'Mohamed-Nader555',
  location: 'Toronto, Ontario, Canada',
  availability: 'Open to new roles, one-week notice period',
  workAuthorization: 'Open PGWP valid through June 2029',
  sponsorship: 'No sponsorship required',
  workPreferences: {
    arrangements: ['onsite', 'hybrid', 'remote'],
    geography: 'Canada',
    relocation: 'Open to relocation within Canada and the GTA',
  },
  targetLevel: 'Intermediate',
  employmentPreference: {
    fullTime: 'Preferred',
    contract: 'Open',
  },
  contacts: {
    email: 'mohamed.m.nader555@gmail.com',
    phone: '+1 647 929 2480',
    linkedIn: 'https://www.linkedin.com/in/mohamed-nader555',
    github: 'https://github.com/Mohamed-Nader555',
  },
  sourceIds: [
    'resume-aiml',
    'resume-software',
    'resume-android',
    'resume-teaching',
    'public-availability',
  ],
});
