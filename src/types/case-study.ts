import { z } from 'zod';

import { sources } from '@/data/sources';
import { roleIdSchema } from '@/types/content';

const publicSourceIds = new Set(
  sources.filter((source) => source.isPublic).map((source) => source.id),
);

export const caseStudyFrontmatterSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    summary: z.string().min(1),
    roles: z.array(roleIdSchema).min(1),
    ownership: z.string().min(1),
    technologies: z.array(z.string().min(1)).min(1),
    sourceIds: z.array(z.string().min(1)).min(1),
    featured: z.boolean(),
    publishedAt: z.coerce.date(),
  })
  .superRefine((entry, context) => {
    if (new Set(entry.roles).size !== entry.roles.length) {
      context.addIssue({
        code: 'custom',
        message: 'Case-study roles must be unique.',
        path: ['roles'],
      });
    }

    if (new Set(entry.technologies).size !== entry.technologies.length) {
      context.addIssue({
        code: 'custom',
        message: 'Case-study technologies must be unique.',
        path: ['technologies'],
      });
    }

    for (const [index, sourceId] of entry.sourceIds.entries()) {
      if (!publicSourceIds.has(sourceId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown or private source id: ${sourceId}`,
          path: ['sourceIds', index],
        });
      }
    }
  });
