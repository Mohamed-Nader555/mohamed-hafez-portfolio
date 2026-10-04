/**
 * Content for the /research/asc-pie record that is not a catalogue fact:
 * supervisor, paper line, thesis abstract, the four research-question
 * answers, and the chart/table data. Numbers come from the thesis defence
 * deck (slides 25-32 and 34) and every one of them must be in
 * `ALLOWED_NUMBERS['asc-pie']` or `ALLOWED_NUMBERS['sprint-pp']`; the unit test
 * `research-asc-pie.test.ts` enforces that.
 */

export const supervisor = {
  name: 'Prof. Marin Litoiu',
  lab: 'CERAS Lab, York University',
} as const;

// The paper line shows the title and its status only. No author list is
// public yet, so none is shown here.
export const paperLine = {
  title:
    'ASC-PIE and SPRINT-PP: Evaluating Privacy-Safe Continual Learning for PII Extraction',
  status: 'Accepted to IEEE CASCON 2026',
} as const;

// Verbatim from the York University thesis record (content source §6.1).
export const thesisAbstract =
  'The robust extraction of Personally Identifiable Information (PII) is essential for privacy protection in modern text-processing systems, where users often share sensitive details in prompts, emails, chat logs, and support tickets. As PII categories and deployment domains evolve, updating extraction models can improve coverage but may also cause catastrophic forgetting of previously learned types. This thesis investigates how PII extraction can remain accurate, reliable, and maintainable as task scope expands. It introduces ASC-PIE, a unified English corpus and evaluation framework that combines public datasets with a synthetic component to improve coverage of rare and challenging PII cases without using real personal data. Using ASC-PIE, the thesis compares encoder-based, encoder-decoder, and decoder-only models under supervised fine-tuning and in-context prompting. It also proposes SPRINT-PP, a privacy-safe continual-learning method that mitigates forgetting without storing raw historical examples. The evaluation covers extraction quality, robustness, output validity, computational efficiency, and knowledge retention.';

export const researchQuestions = [
  {
    id: 'rq1',
    label: 'RQ1',
    title: 'Supervised model families',
    answer:
      'RoBERTa-large is the strongest supervised model, with a strict F1 of 0.991 and perfect output validity. FLAN-T5-base is the closest generative alternative at 0.987, also with perfect validity. The decoder-only models fall behind mainly on recall: when they produce a valid prediction it is usually right, but they recover fewer entities overall. Validity matters in a privacy pipeline, because a model whose outputs are often structurally unusable is not a dependable extractor however good its best answers are, so RoBERTa-large became the backbone for the continual-learning work.',
  },
  {
    id: 'rq2',
    label: 'RQ2',
    title: 'Fine-tuning versus prompting',
    answer:
      'For decoder-only models, in-context prompting is a strong alternative that needs no training. The best key-value three-shot prompts beat the matching fine-tuned baselines on the reported subsets, most clearly for Qwen2.5-7B (0.778 against 0.400). The output format matters as much as the number of examples: key-value is consistently stronger than JSON on quality, validity, and speed, at about 1.76 s/query against 26.8 s/query for Qwen. Three shots is the best operating point, because five shots cost more time without consistent gains.',
  },
  {
    id: 'rq3',
    label: 'RQ3',
    title: 'Forgetting and mitigation',
    answer:
      'Naive sequential fine-tuning collapses. Each new stage is learned well, but every earlier stage falls to an F1 of 0.000 in the stage-restricted view, so the model replaces what it knew instead of adding to it. SPRINT-PP is the strongest mitigation, reaching 83.5% final accuracy against 83.0% for distillation and 76.5% for replay. It stores no raw historical PII, and it trains in 25.6% less time than distillation.',
  },
  {
    id: 'rq4',
    label: 'RQ4',
    title: 'Corpus design and synthetic augmentation',
    answer:
      'Corpus design is a major driver of extraction quality, not a preprocessing detail. With the same RoBERTa-large backbone and the same evaluation, training on public data alone reaches a strict F1 of 0.415, with recall limited to 0.307. Training on the full ASC-PIE corpus reaches 0.992, with recall at 0.995, a gain of +0.577. Strict and normalised F1 are nearly identical in both settings, so the gain reflects real coverage of entities, not formatting. The gains are broad but uneven, and largest where public data alone gave the least coverage.',
  },
] as const;

export const promptingVersusFineTuning = {
  caption:
    'Decoder-only models: fine-tuned versus in-context prompting, strict F1 and output validity. Fine-tuning and prompting were reported on different-sized subsets, so read the comparison as indicative.',
  columns: ['Configuration', 'Strict F1', 'Validity'],
  rows: [
    ['Qwen2.5-7B · fine-tuned', '0.400', '0.543'],
    ['Qwen2.5-7B · JSON, 3-shot', '0.709', '0.906'],
    ['Qwen2.5-7B · key-value, 3-shot', '0.778', '0.950'],
    ['Llama3.1-8B · fine-tuned', '0.690', '0.814'],
    ['Llama3.1-8B · JSON, 5-shot', '0.705', '0.856'],
    ['Llama3.1-8B · key-value, 3-shot', '0.725', '0.914'],
  ],
} as const;

export const corpusAblation = {
  title: 'Public-only vs. full ASC-PIE · RoBERTa-large, strict scores',
  groupLabels: ['Public-only', 'Full ASC-PIE'],
  items: [
    { label: 'Precision', value: 0.64, groupValue: 0.989 },
    { label: 'Recall', value: 0.307, groupValue: 0.995 },
    { label: 'F1', value: 0.415, groupValue: 0.992 },
  ],
} as const;

export const perTypeGains = {
  caption:
    'Selected per-type strict F1, public-only versus full ASC-PIE training, on the matched comparison subset.',
  columns: ['PII type', 'Public-only', 'Full ASC-PIE', 'Gain'],
  rows: [
    ['JOBTITLE', '0.0000', '0.9982', '+0.9982'],
    ['EMAIL', '0.0786', '0.9940', '+0.9154'],
    ['SIN', '0.2236', '0.9980', '+0.7744'],
    ['CITY', '0.2826', '0.9995', '+0.7169'],
    ['NAME', '0.2716', '0.9824', '+0.7108'],
    ['STATE', '0.2891', '0.9986', '+0.7095'],
    ['LOCATION', '0.4477', '0.9102', '+0.4625'],
    ['PHONENUM', '0.7340', '0.9938', '+0.2598'],
    ['COUNTRY', '0.8000', '1.0000', '+0.2000'],
    ['CREDITCARD', '0.9786', '0.9911', '+0.0125'],
    ['DRIVER-LICENCE', '0.9744', '0.9756', '+0.0012'],
    ['TIME', '1.0000', '0.8333', '-0.1667'],
    ['TAXNUM', '1.0000', '0.7500', '-0.2500'],
  ],
  caveat:
    'TIME and TAXNUM are slightly lower under full ASC-PIE, but the matched subset holds only 5 TIME mentions and 3 TAXNUM mentions, so those two differences should not be over-read.',
} as const;

// Strict F1 (percent) and output validity for the seven supervised models.
export const modelFamilies = [
  { label: 'RoBERTa-large', f1: 99.1, validity: '1.000' },
  { label: 'FLAN-T5-base', f1: 98.7, validity: '1.000' },
  { label: 'ModernBERT-large', f1: 84.6, validity: '1.000' },
  { label: 'BERT-large-cased', f1: 80.7, validity: '1.000' },
  { label: 'Llama 3.1 8B', f1: 69.0, validity: '0.814' },
  { label: 'Qwen 2.5 7B', f1: 40.0, validity: '0.543' },
  { label: 'BART-base', f1: 34.8, validity: '0.561' },
] as const;
