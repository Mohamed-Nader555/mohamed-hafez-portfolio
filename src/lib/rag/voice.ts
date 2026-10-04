// Page copy is written in the first person. The assistant speaks about Mohamed
// in the third person, so every chunk is rewritten with this helper.

const A = "['’]";

// Present-tense verbs that appear after "I" in the site copy, with their
// third-person forms. Past tense and modals need no change.
const presentTense: Record<string, string> = {
  build: 'builds',
  design: 'designs',
  develop: 'develops',
  deliver: 'delivers',
  use: 'uses',
  work: 'works',
  teach: 'teaches',
  write: 'writes',
  run: 'runs',
  own: 'owns',
  focus: 'focuses',
  handle: 'handles',
  support: 'supports',
  lead: 'leads',
  create: 'creates',
  train: 'trains',
  apply: 'applies',
  bring: 'brings',
  keep: 'keeps',
  ship: 'ships',
  make: 'makes',
  choose: 'chooses',
  prefer: 'prefers',
  want: 'wants',
  need: 'needs',
  know: 'knows',
  try: 'tries',
  start: 'starts',
  turn: 'turns',
  take: 'takes',
  find: 'finds',
  give: 'gives',
  pair: 'pairs',
  connect: 'connects',
  combine: 'combines',
  measure: 'measures',
  test: 'tests',
  compare: 'compares',
  learn: 'learns',
  enjoy: 'enjoys',
  read: 'reads',
  store: 'stores',
  show: 'shows',
  explain: 'explains',
  treat: 'treats',
  rely: 'relies',
};

const rules: Array<[RegExp, string | ((...match: string[]) => string)]> = [
  [new RegExp(`\\bI${A}m\\b`, 'g'), 'Mohamed is'],
  [new RegExp(`\\bI${A}ve\\b`, 'g'), 'Mohamed has'],
  [new RegExp(`\\bI${A}d\\b`, 'g'), 'Mohamed would'],
  [new RegExp(`\\bI${A}ll\\b`, 'g'), 'Mohamed will'],
  [new RegExp(`\\bI don${A}t\\b`, 'g'), 'Mohamed doesn’t'],
  [/\bI am\b/g, 'Mohamed is'],
  [/\bI have\b/g, 'Mohamed has'],
  [/\bI do\b/g, 'Mohamed does'],
  [/\bI go\b/g, 'Mohamed goes'],
  [
    new RegExp(`\\bI (${Object.keys(presentTense).join('|')})\\b`, 'g'),
    (_all, verb) => `Mohamed ${presentTense[verb] ?? verb}`,
  ],
  [/\bmyself\b/g, 'himself'],
  [/\bmine\b/g, 'his'],
  [/\bme\b/g, 'him'],
  [/\bmy\b/g, 'his'],
  // A capital "My" is only a pronoun at the start of a sentence; "Your Life Is
  // My Life" and "My Card" are project names.
  [/(^|[.!?]\s+|\n)My\b(?! Card)/g, (_all, lead) => `${lead}His`],
  [
    /(?<!\b(?:Stage|Phase|Part|Type|Level|Table|Vitamin) )\bI\b(?!\/)/g,
    'Mohamed',
  ],
];

export function assistantVoice(text: string): string {
  return rules.reduce(
    (value, [pattern, replacement]) =>
      value.replace(pattern, replacement as never),
    text,
  );
}
