import { z } from 'zod';

export const roleIdSchema = z.enum(['aiml', 'software', 'android', 'teaching']);
export type RoleId = z.infer<typeof roleIdSchema>;

const publicHrefSchema = z.url().or(z.string().startsWith('/'));
const sourceIdsSchema = z.array(z.string().min(1)).min(1);
const roleWeightsSchema = z.record(
  roleIdSchema,
  z.number().int().min(0).max(5),
);

export const sourceRecordSchema = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    kind: z.enum([
      'resume',
      'official',
      'case-study',
      'github',
      'approved-source',
    ]),
    publicHref: publicHrefSchema.optional(),
    isPublic: z.boolean(),
  })
  .refine((source) => !source.isPublic || source.publicHref !== undefined, {
    message: 'Public sources require a public href.',
    path: ['publicHref'],
  });
export type SourceRecord = z.infer<typeof sourceRecordSchema>;

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  statement: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  aliases: z.array(z.string().min(1)).default([]),
  roleWeights: roleWeightsSchema,
  sourceIds: sourceIdsSchema,
  public: z.literal(true),
});
export type EvidenceRecord = z.infer<typeof evidenceRecordSchema>;

export const projectRecordSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  ownership: z.string().min(1),
  roles: z.array(roleIdSchema).min(1),
  roleWeights: roleWeightsSchema,
  technologies: z.array(z.string().min(1)).min(1),
  sourceIds: sourceIdsSchema,
  detailLevel: z.enum(['detailed', 'supporting']),
  public: z.literal(true),
});
export type ProjectRecord = z.infer<typeof projectRecordSchema>;

export const roleLensSchema = z.object({
  id: roleIdSchema,
  label: z.string().min(1),
  route: z.string().startsWith('/'),
  title: z.string().min(1),
  description: z.string().min(1),
  summary: z.string().min(1),
  resumeHref: z.string().startsWith('/resumes/').endsWith('.pdf'),
  featuredProjectIds: z.array(z.string().min(1)).min(1),
  sourceIds: sourceIdsSchema,
});
export type RoleLens = z.infer<typeof roleLensSchema>;

export const contactChannelsSchema = z.object({
  email: z.email(),
  phone: z.string().min(1),
  linkedIn: z.url(),
  github: z.url(),
});
export type ContactChannels = z.infer<typeof contactChannelsSchema>;

export const profileSchema = z.object({
  name: z.literal('Mohamed Hafez'),
  githubHandle: z.literal('Mohamed-Nader555'),
  location: z.literal('Toronto, Ontario, Canada'),
  availability: z.literal('Immediately available'),
  workAuthorization: z.literal('Open PGWP valid through June 2029'),
  sponsorship: z.literal('No sponsorship required'),
  workPreferences: z.object({
    arrangements: z.array(z.enum(['onsite', 'hybrid', 'remote'])).length(3),
    geography: z.literal('Canada'),
    relocation: z.literal('Open to relocation within Canada and the GTA'),
  }),
  targetLevel: z.literal('Intermediate'),
  employmentPreference: z.object({
    fullTime: z.literal('Preferred'),
    contract: z.literal('Open'),
  }),
  contacts: contactChannelsSchema,
  sourceIds: sourceIdsSchema,
});
export type Profile = z.infer<typeof profileSchema>;

export const screeningFactSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().min(1),
  statement: z.string().min(1),
  topics: z.array(z.string().min(1)).min(1),
  aliases: z.array(z.string().min(1)).default([]),
  sourceIds: sourceIdsSchema,
  public: z.literal(true),
});
export type ScreeningFact = z.infer<typeof screeningFactSchema>;
