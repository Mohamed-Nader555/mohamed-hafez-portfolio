import { matchKey, meaningfulTerms } from './normalize-query';

// Interchangeable phrases. A question that uses any phrase in a group also
// searches for the others, at a lower weight than the visitor's own words.
const groups: string[][] = [
  ['ml', 'machine learning'],
  ['ai', 'artificial intelligence'],
  ['cv', 'computer vision'],
  ['nlp', 'natural language processing'],
  ['llm', 'large language model', 'language model'],
  ['rag', 'retrieval augmented generation', 'retrieval'],
  ['ner', 'named entity recognition', 'named-entity recognition'],
  ['pii', 'personally identifiable information', 'personal information'],
  ['resume', 'curriculum vitae', 'cv'],
  ['stack', 'technologies', 'technology', 'tech stack', 'tools'],
  ['degree', 'education', 'university', 'masters', 'bachelor'],
  ['reach', 'contact', 'email', 'get in touch'],
  ['job', 'experience', 'employment', 'work history', 'career'],
  ['app', 'application'],
  ['mobile', 'android'],
  ['available', 'availability', 'start date', 'notice period'],
  ['visa', 'work permit', 'work authorization', 'pgwp'],
  [
    'teaching',
    'teach',
    'taught',
    'tutoring',
    'tutored',
    'tutor',
    'instruction',
    'instructor',
    'mentoring',
  ],
  ['gpa', 'grade point average', 'grades'],
  ['paper', 'publication', 'cascon'],
  ['db', 'database'],
  ['repo', 'repository', 'source code', 'github'],
  ['built', 'made', 'created', 'developed'],
  ['shipped', 'published', 'released', 'delivered'],
];

const indexed = groups.map((group) => group.map((phrase) => matchKey(phrase)));

/** Extra search terms implied by the phrases in a question. */
export function synonymTerms(question: string): string[] {
  const padded = ` ${matchKey(question)} `;
  const extra = new Set<string>();
  indexed.forEach((group, groupIndex) => {
    const hit = group.find((phrase) => padded.includes(` ${phrase} `));
    if (!hit) return;
    for (const phrase of groups[groupIndex]!)
      if (matchKey(phrase) !== hit)
        for (const term of meaningfulTerms(phrase)) extra.add(term);
  });
  const own = new Set(meaningfulTerms(question));
  return [...extra].filter((term) => !own.has(term));
}
