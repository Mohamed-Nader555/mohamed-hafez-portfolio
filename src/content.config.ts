import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

import { caseStudyFrontmatterSchema } from '@/types/case-study';

const caseStudies = defineCollection({
  loader: glob({
    pattern: '**/*.mdx',
    base: './src/content/case-studies',
  }),
  schema: caseStudyFrontmatterSchema,
});

export const collections = { caseStudies };
