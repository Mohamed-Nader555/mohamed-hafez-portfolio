import { describe, expect, it } from 'vitest';
import { bridges, questionBank } from '@/data/claims';
import { buildHintIds, matchHints, triggerMatches } from '@/lib/ai/hints';

describe('triggerMatches', () => {
  it('matches a trigger word case-insensitively inside a sentence', () => {
    expect(
      triggerMatches('Does he have Kubernetes experience?', 'Kubernetes'),
    ).toBe(true);
    expect(triggerMatches('does he use kubernetes', 'Kubernetes')).toBe(true);
  });

  it('matches multi-word triggers by their words, whatever the ending', () => {
    expect(triggerMatches('Has he run A/B tests?', 'A/B testing')).toBe(true);
    expect(
      triggerMatches('Does he know causal inference?', 'causal inference'),
    ).toBe(true);
  });

  it('does not match part of a longer word or a missing word', () => {
    expect(triggerMatches('He built a Rustic app', 'Rust')).toBe(false);
    expect(
      triggerMatches(
        'Has he used distributed systems?',
        'distributed training',
      ),
    ).toBe(false);
  });
});

describe('matchHints', () => {
  it('finds the bridge whose advert wording the question uses', () => {
    const hints = matchHints('Has he worked in a regulated environment?');
    expect(hints.bridgeIds).toContain('br-regulated-finance');
  });

  it('finds a gap answer by its triggers', () => {
    const hints = matchHints('Does he have Kubernetes experience?');
    expect(hints.gapIds).toContain('qb-gap-kubernetes');
    expect(hints.answerIds).not.toContain('qb-gap-kubernetes');
  });

  it('finds his answer when the question is phrased in the third person', () => {
    expect(matchHints('Is he a Certified Ethical Hacker?').answerIds).toContain(
      'qb-ceh',
    );
    expect(matchHints('Tell me about yourself').answerIds).toContain(
      'qb-short-bio',
    );
  });

  it('matches the also-asked-as wording', () => {
    const answer = questionBank.find(
      (a) => a.alsoAskedAs.length > 0 && !a.gap,
    )!;
    const phrasing = answer.alsoAskedAs[0]!;
    expect(matchHints(phrasing).answerIds).toContain(answer.id);
  });

  it('returns nothing for an unrelated question', () => {
    const hints = matchHints('What is the capital of France?');
    expect(hints.bridgeIds).toEqual([]);
    expect(hints.gapIds).toEqual([]);
  });

  it('only returns ids that exist in the committed data', () => {
    const hints = matchHints(
      'Tell me about Kubernetes and regulated banking work',
    );
    const ids = new Set([
      ...bridges.map((b) => b.id),
      ...questionBank.map((a) => a.id),
    ]);
    for (const id of [...hints.bridgeIds, ...hints.answerIds, ...hints.gapIds])
      expect(ids.has(id)).toBe(true);
  });
});

describe('buildHintIds', () => {
  const ledger = new Set(['a', 'b', 'c', 'd', 'e']);

  it('puts gap answers first, then his answers, bridges, and keyword hits', () => {
    expect(
      buildHintIds(
        { gapIds: ['g'], answerIds: ['b'], bridgeIds: ['a'] },
        ['d', 'c'],
        new Set([...ledger, 'g']),
      ),
    ).toEqual(['g', 'b', 'a', 'd', 'c']);
  });

  it('drops ids that are not in the ledger and repeats, and caps the list', () => {
    expect(
      buildHintIds(
        { gapIds: [], answerIds: ['a', 'x'], bridgeIds: ['a'] },
        ['overview-who', 'a', 'b'],
        ledger,
        2,
      ),
    ).toEqual(['a', 'b']);
  });
});
