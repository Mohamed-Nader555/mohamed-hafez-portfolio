import { describe, expect, it } from 'vitest';
import { retrieveEvidence } from '@/lib/rag/retrieve';

describe('evidence retrieval', () => {
  it('retrieves Dostava from a paraphrased technology question', () => {
    const result = retrieveEvidence({
      question: 'What was the Android stack for the delivery app?',
      history: [],
      activeRole: 'android',
      limit: 5,
    });
    expect(result.supported).toBe(true);
    expect(result.chunks.some((chunk) => chunk.projectId === 'dostava')).toBe(
      true,
    );
  });

  it('carries sources into a short follow-up', () => {
    const result = retrieveEvidence({
      question: 'What else did he integrate?',
      history: [
        { role: 'user', content: 'Tell me about Northstar.' },
        {
          role: 'assistant',
          content: 'Northstar is a RAG service.',
          citationIds: ['case-study-northstar'],
        },
      ],
      activeRole: 'aiml',
      limit: 5,
    });
    expect(result.supported).toBe(true);
    expect(
      result.chunks.some((chunk) => chunk.projectId === 'northstar-rag'),
    ).toBe(true);
  });

  it('refuses unsupported and sensitive questions before generation', () => {
    expect(
      retrieveEvidence({
        question: 'What is Mohamed’s medical history?',
        history: [],
        activeRole: 'aiml',
        limit: 5,
      }).supported,
    ).toBe(false);
  });
});
