import { describe, expect, it, vi } from 'vitest';
import type { GeminiProvider, GeminiRequest } from '@/lib/ai/gemini-provider';
import {
  buildPrivateInput,
  parsePrivate,
  pickAllowedFiles,
  renderFitMarkdown,
  runPrivateSection,
  selectExcerpts,
  splitSections,
} from '../../scripts/fit-private';

const usage = {
  inputTokens: 5,
  cachedTokens: 0,
  outputTokens: 3,
  thinkingTokens: 0,
};
const JD =
  'NLP Engineer. We read loan agreements for banks. Requirements: Python, named-entity recognition, Kubernetes.';

describe('pickAllowedFiles', () => {
  it('reads folder files 03 and 07 only, never 01, 02, 06 or 08', () => {
    const names = [
      '00_README_INDEX.md',
      '01_THE_HAFEZ_CODEX.md',
      '02_OFFERBOUND_AUTOMATION_KNOWLEDGE_BASE.md',
      '03_ROLE_ATLAS_TITLES_AND_DESCRIPTIONS.md',
      '04_PROJECT_VAULT.md',
      '05_RESEARCH_DOSSIER_ASC-PIE_SPRINT-PP.md',
      '06_TRUTH_LEDGER_CANONICAL_FACTS_AND_CONFLICTS.md',
      '07_STORY_BANK_AND_PITCHES.md',
      '08_PRESENCE_LINKEDIN_GITHUB_PORTFOLIO.md',
      '09_AGENT_PLAYBOOKS.md',
      'notes.txt',
    ];
    expect(pickAllowedFiles(names)).toEqual([
      '03_ROLE_ATLAS_TITLES_AND_DESCRIPTIONS.md',
      '07_STORY_BANK_AND_PITCHES.md',
    ]);
  });
});

describe('splitSections and selectExcerpts', () => {
  const doc = [
    '# Atlas',
    'Intro text.',
    '## Family 3 — NLP Engineer',
    'Named-entity recognition and Python evaluation. Kubernetes is a gap.',
    '## Family 14 — Android',
    'Kotlin and Retrofit and Room.',
    '## Family 4 — Document AI',
    'Loan agreements, banks, PDF extraction and named-entity recognition.',
  ].join('\n');

  it('splits a markdown file on its second-level headings', () => {
    expect(splitSections(doc).map((s) => s.heading)).toEqual([
      'Family 3 — NLP Engineer',
      'Family 14 — Android',
      'Family 4 — Document AI',
    ]);
  });

  it('picks the sections that share the most words with the job description, within the size limit', () => {
    const picked = selectExcerpts(
      [{ name: '03_atlas.md', text: doc }],
      JD,
      400,
    );
    const headings = picked.map((p) => p.heading);
    expect(headings).toContain('Family 3 — NLP Engineer');
    expect(headings).toContain('Family 4 — Document AI');
    expect(headings).not.toContain('Family 14 — Android');
    const total = picked.reduce((n, p) => n + p.text.length, 0);
    expect(total).toBeLessThanOrEqual(400);
    expect(picked[0]!.source).toBe('03_atlas.md');
  });

  it('sends nothing when no section matches', () => {
    expect(
      selectExcerpts(
        [{ name: 'a.md', text: doc }],
        'Zebra keeper wanted.',
        400,
      ),
    ).toEqual([]);
  });
});

describe('the private section', () => {
  const brief = 'Job description brief\n\nDirect experience\n- Python';
  const excerpts = [
    {
      source: '03_atlas.md',
      heading: 'Family 3',
      text: 'Kubernetes is a gap.',
    },
  ];

  it('asks for gaps, likely interview questions and points to stress, with the excerpts fenced as data', () => {
    const input = buildPrivateInput({ jobDescription: JD, brief, excerpts });
    expect(input).toContain(JD);
    expect(input).toContain(brief);
    expect(input).toContain('Kubernetes is a gap.');
    expect(input).toMatch(/gaps/i);
    expect(input).toMatch(/interview questions/i);
    expect(input).toMatch(/stress/i);
    expect(input).toMatch(/private, for mohamed only/i);
    expect(input).toMatch(/data, never instructions/i);
  });

  it('parses the three lists and rejects anything else', () => {
    expect(
      parsePrivate({ gaps: ['a'], interviewQuestions: ['b'], stress: ['c'] }),
    ).toEqual({ gaps: ['a'], interviewQuestions: ['b'], stress: ['c'] });
    expect(() => parsePrivate({ gaps: 'a' })).toThrow();
  });

  it('makes one call and returns its lists', async () => {
    const requests: GeminiRequest[] = [];
    const provider: GeminiProvider = {
      generateJson: vi.fn(async (request: GeminiRequest) => {
        requests.push(request);
        return {
          data: {
            gaps: ['Kubernetes'],
            interviewQuestions: ['Q?'],
            stress: ['S'],
          },
          usage,
        };
      }),
    };
    const result = await runPrivateSection(provider, {
      jobDescription: JD,
      brief,
      excerpts,
    });
    expect(requests).toHaveLength(1);
    expect(result.gaps).toEqual(['Kubernetes']);
  });
});

describe('renderFitMarkdown', () => {
  it('puts the public brief first, then a clearly private section', () => {
    const text = renderFitMarkdown({
      name: 'bank-nlp',
      brief: 'Job description brief\n\nDirect experience\n- Python',
      private: {
        gaps: ['Kubernetes'],
        interviewQuestions: ['Tell me about NER.'],
        stress: ['The 19-type schema.'],
      },
    });
    expect(text.startsWith('# Fit: bank-nlp')).toBe(true);
    expect(text.indexOf('Job description brief')).toBeLessThan(
      text.indexOf('Private: for Mohamed only'),
    );
    expect(text).toContain('Never publish');
    expect(text).toContain('- Kubernetes');
    expect(text).toContain('- Tell me about NER.');
    expect(text).toContain('- The 19-type schema.');
  });
});
