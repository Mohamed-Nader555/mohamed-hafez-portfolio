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
