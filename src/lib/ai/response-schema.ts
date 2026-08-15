import { z } from 'zod';

export const ModelAnswerSchema = z.object({
  answer: z.string().trim().min(1).max(1800),
  answerStatus: z.enum(['answered', 'refused']),
  citationIds: z.array(z.string().min(1)).max(8),
  followUps: z.array(z.string().trim().min(2).max(120)).max(3),
});
export type ValidatedAnswer = z.infer<typeof ModelAnswerSchema>;

export function validateModelAnswer(
  raw: unknown,
  allowedCitationIds: Set<string>,
): ValidatedAnswer {
  const answer = ModelAnswerSchema.parse(raw);
  if (answer.answerStatus === 'answered' && answer.citationIds.length === 0)
    throw new Error('Answered responses require citations.');
  if (answer.citationIds.some((id) => !allowedCitationIds.has(id)))
    throw new Error('Response includes an unknown citation.');
  if (answer.answerStatus === 'refused' && answer.citationIds.length > 0)
    throw new Error('Refusals cannot claim evidence citations.');
  return answer;
}
