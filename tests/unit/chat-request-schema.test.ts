import { describe, expect, it } from 'vitest';
import { chatRequestSchema } from '@/lib/ai/types';

const base = {
  question: 'How does he line up with this job description?',
  activeRole: 'aiml',
  history: [],
  turnstileToken: 'token',
  sessionId: crypto.randomUUID(),
};

describe('chatRequestSchema and the pasted job description', () => {
  it('works without one, as before', () => {
    const parsed = chatRequestSchema.safeParse(base);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.jobDescription).toBeUndefined();
  });

  it('accepts one up to 6,000 characters and trims it', () => {
    const parsed = chatRequestSchema.safeParse({
      ...base,
      jobDescription: `  ${'a'.repeat(6000)}  `,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.jobDescription).toHaveLength(6000);
  });

  it('rejects one over 6,000 characters', () => {
    expect(
      chatRequestSchema.safeParse({
        ...base,
        jobDescription: 'a'.repeat(6001),
      }).success,
    ).toBe(false);
  });

  it('treats a blank one as none', () => {
    const parsed = chatRequestSchema.safeParse({
      ...base,
      jobDescription: '   ',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.jobDescription).toBeUndefined();
  });
});
