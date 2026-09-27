import { z } from 'zod';

import { ALLOWED_NUMBERS } from '@/data/allowed-numbers';
import { projects } from '@/data/projects';
import { sources } from '@/data/sources';
import { VERIFIED_TECH } from '@/data/verified-tech';

const publicSourceIds = new Set(
  sources.filter((source) => source.isPublic).map((source) => source.id),
);

const passportSchema = z.object({
  context: z.string().min(1),
  period: z.string().min(1).optional(),
  platform: z.string().min(1).optional(),
});

const statTileSchema = z.object({
  value: z.string().min(1),
  label: z.string().min(1),
  note: z.string().min(1).optional(),
});

const featureSchema = z.object({
  title: z.string().min(1),
  detail: z.string().min(1),
});

const decisionSchema = z.object({
  choice: z.string().min(1),
  over: z.string().min(1).optional(),
  because: z.string().min(1),
});

const challengeSchema = z.object({
  problem: z.string().min(1),
  solution: z.string().min(1),
});

const stackItemSchema = z.object({
  name: z.string().min(1),
  kind: z.enum(['language', 'ml', 'data', 'framework', 'tool']),
  purpose: z.string().min(1).optional(),
});

const stackLayerSchema = z.object({
  layer: z.string().min(1),
  items: z.array(stackItemSchema).min(1),
});

const screenSchema = z.object({
  imageId: z.string().min(1),
  step: z.string().min(1).optional(),
  caption: z.string().min(1),
});

const linkSchema = z.object({
  label: z.string().min(1),
  sourceId: z.string().min(1),
});

export const caseStudyFrontmatterSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    passport: passportSchema,
    stats: z.array(statTileSchema).max(4).optional(),
    features: z.array(featureSchema).optional(),
    decisions: z.array(decisionSchema).optional(),
    challenges: z.array(challengeSchema).optional(),
    stack: z.array(stackLayerSchema).min(1),
    pipeline: z.array(z.string().min(1)).optional(),
    screens: z.array(screenSchema).optional(),
    links: z.array(linkSchema).optional(),
  })
  .superRefine((entry, context) => {
    const project = projects.find((candidate) => candidate.slug === entry.slug);
    if (!project) {
      context.addIssue({
        code: 'custom',
        message: `No catalogue project found for slug: ${entry.slug}`,
        path: ['slug'],
      });
      return;
    }

    const verifiedTech = VERIFIED_TECH[entry.slug] ?? [];
    entry.stack.forEach((layer, layerIndex) => {
      layer.items.forEach((item, itemIndex) => {
        if (!verifiedTech.includes(item.name)) {
          context.addIssue({
            code: 'custom',
            message: `Unverified technology "${item.name}" for ${entry.slug}. Add it to VERIFIED_TECH first.`,
            path: ['stack', layerIndex, 'items', itemIndex, 'name'],
          });
        }
      });
    });

    const allowedNumbers = ALLOWED_NUMBERS[entry.slug] ?? [];
    (entry.stats ?? []).forEach((stat, statIndex) => {
      if (!allowedNumbers.includes(stat.value)) {
        context.addIssue({
          code: 'custom',
          message: `Unallowed number "${stat.value}" for ${entry.slug}. Add it to ALLOWED_NUMBERS first.`,
          path: ['stats', statIndex, 'value'],
        });
      }
    });

    const ownSourceId = `case-study-${entry.slug}`;
    (entry.links ?? []).forEach((link, linkIndex) => {
      if (!publicSourceIds.has(link.sourceId)) {
        context.addIssue({
          code: 'custom',
          message: `Unknown or private source id: ${link.sourceId}`,
          path: ['links', linkIndex, 'sourceId'],
        });
      }
      if (link.sourceId === ownSourceId) {
        context.addIssue({
          code: 'custom',
          message: `Links must not self-cite the page's own source (${ownSourceId})`,
          path: ['links', linkIndex, 'sourceId'],
        });
      }
    });
  });

export type CaseStudyFrontmatter = z.infer<typeof caseStudyFrontmatterSchema>;
