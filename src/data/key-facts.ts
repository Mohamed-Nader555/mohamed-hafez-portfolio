export interface KeyFact {
  value: string;
  label: string;
}

/**
 * Value-and-label tiles shown on project cards (the /work flagship cards and
 * the home cards). Every value must be in `ALLOWED_NUMBERS` for its project;
 * `key-facts.test.ts` enforces it. A project with no allowlisted number has no
 * entry here and shows no facts row: never invent one.
 */
export const keyFactsBySlug: Readonly<Record<string, readonly KeyFact[]>> = {
  'eklan-composed-prompts': [
    {
      value: '12 → 20',
      label: 'vocabulary items per drill',
    },
    {
      value: '10/10 → 7/20',
      label: 'correct answers in the first slot',
    },
  ],
  'eklan-transcript-mining': [
    {
      value: '7 of 8',
      label: 'tutor-found mistakes matched in the best runs',
    },
    {
      value: '4',
      label: 'mistake groups per learner',
    },
  ],
  'eklan-ai-coach': [
    {
      value: 'Live model',
      label: 'release gated on an eval run',
    },
    {
      value: '48/48',
      label: 'eval cases passing',
    },
    {
      value: '238',
      label: 'unit tests',
    },
  ],
  'eklan-grading-pipeline': [
    {
      value: '26–41%',
      label: 'shorter wait for the report, in testing',
    },
    {
      value: '1.5',
      label: 'median points between two gradings, out of 100',
    },
  ],
  'eklan-voice-roleplay': [
    { value: '1 per agent', label: 'live session for each character' },
    { value: 'Built and load-tested', label: 'multi-agent voice mode' },
  ],
  'asc-pie': [
    { value: '333,109', label: 'examples' },
    { value: '99.1%', label: 'best strict F1' },
  ],
  'sprint-pp': [
    { value: '83.5%', label: 'accuracy' },
    { value: '0', label: 'raw examples stored' },
  ],
  'northstar-rag': [
    { value: '9', label: 'corpus documents' },
    { value: '700', label: 'characters per chunk' },
    { value: '3', label: 'source formats' },
  ],
  'minds-eye': [
    { value: 'A+', label: 'capstone grade' },
    { value: '80%+', label: 'delivered by me' },
  ],
  dive: [
    { value: '4', label: 'models compared' },
    { value: '99.5%', label: 'best offline test accuracy' },
  ],
  dostava: [{ value: '8', label: 'order categories' }],
  'applied-ml-portfolio': [
    { value: '11', label: 'applied ML projects' },
    { value: '2021–2023', label: 'delivery period' },
  ],
};
