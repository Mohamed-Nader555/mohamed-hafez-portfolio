import MiniSearch from 'minisearch';
import knowledgeIndex from '@/generated/knowledge-index.json';
import { starterSuggestions } from '@/data/assistant-suggestions';
import { checkQuestion } from './guard';
import {
  matchKey,
  meaningfulTerms,
  normalizeQuery,
  WEAK_TERMS,
} from './normalize-query';
import { miniSearchOptions } from './search-config';
import { synonymTerms } from './synonyms';
import type {
  KnowledgeChunk,
  KnowledgeEntity,
  KnowledgeIndexArtifact,
  RetrievalInput,
  RetrievalResult,
} from './types';

/** Minimum search score for a question with no named project or overview route. */
export const SUPPORT_SCORE_THRESHOLD = 9;
export const MAX_CHUNKS = 8;
export const MAX_CHUNKS_PER_PAGE = 3;
/** Total characters of evidence handed to the model. */
export const EVIDENCE_BUDGET_CHARS = 6000;

const artifact = knowledgeIndex as unknown as KnowledgeIndexArtifact;
const { chunks, entities } = artifact;
const search = MiniSearch.loadJS(
  artifact.miniSearch as never,
  miniSearchOptions,
);
const indexById = new Map(chunks.map((chunk, index) => [chunk.id, index]));
const chunkById = (id: string): KnowledgeChunk | undefined =>
  chunks[indexById.get(id) ?? -1];

export const knowledgeChunkCount = () => chunks.length;

// ---------------------------------------------------------------- entities --

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function findEntities(raw: string) {
  const padded = ` ${matchKey(raw)} `;
  const projectHits: KnowledgeEntity[] = [];
  let techHits: KnowledgeEntity[] = [];
  for (const entity of entities) {
    const matched =
      entity.terms.some((term) => padded.includes(` ${term} `)) ||
      entity.exactCase?.some((term) =>
        new RegExp(
          `(^|[^A-Za-z0-9])${escapeRegExp(term)}($|[^A-Za-z0-9+#])`,
        ).test(raw),
      );
    if (!matched) continue;
    (entity.kind === 'project' ? projectHits : techHits).push(entity);
  }
  // "Java" names the Java technology first; technologies that merely list it
  // as a variant are only used when nothing names it directly.
  const primary = techHits.filter(
    (entity) =>
      padded.includes(` ${entity.key} `) ||
      entity.exactCase?.some((term) => raw.includes(term)),
  );
  if (primary.length) techHits = primary;
  return {
    projectHits: projectHits.slice(0, 3),
    techHits: techHits.slice(0, 3),
  };
}

// ------------------------------------------------------------------ routes --

// Words that can follow "has he used …" without naming a technology.
const FILLER = new Set([
  'use',
  'used',
  'using',
  'user',
  'experience',
  'project',
  'work',
  'worked',
  'know',
  'familiar',
  'skill',
  'technology',
  'technologie',
  'tool',
  'language',
  'framework',
  'library',
  'program',
  'programming',
  'develop',
  'built',
  'build',
  'code',
  'coding',
  'written',
  'proficient',
  'expertise',
  'stack',
  'anything',
  'something',
  'much',
  'lot',
  'many',
  'other',
  'any',
  'ever',
  'often',
  'proficiency',
  'knowledge',
  'skilled',
  'capable',
  'able',
  'comfortable',
  'background',
]);

const TECH_INTENT =
  /\b(has|have|did|does|do|can|could|is)\b.*\b(he|mohamed)\b.*\b(use[ds]?|using|know|knows|worked? with|work with|experience (with|in)|familiar|proficient|skilled|built with|written in|programm?(?:s|ed)? in|code in|develop(?:s|ed)? (in|with)|knowledge of|comfortable)\b|\b(experience|expertise|proficien\w+|familiar\w*|knowledge)\b.*\b(with|in|of)\b|\bwhich (projects?|apps?|work)\b.*\b(use|used|using|built with|involve|include)\b|\b(projects?|apps?) (that|which) (use|used|using)\b/i;

const EMPLOYER_INTENT =
  /\b(work(?:ed|s)?|employed|intern(?:ed|s)?|internship|job|hired) (for|at|with|by)\b/i;

/**
 * A technology or employer the question asks about that the portfolio never
 * mentions: every unfamiliar word is a name the index has no trace of.
 */
function unknownSubject(
  raw: string,
  normalized: string,
):
  | { kind: 'unknown-technology' | 'unknown-employer'; name: string }
  | undefined {
  const kind = EMPLOYER_INTENT.test(raw)
    ? 'unknown-employer'
    : TECH_INTENT.test(raw)
      ? 'unknown-technology'
      : undefined;
  if (!kind) return undefined;
  const unknown = normalized.split(' ').filter((token) => {
    const [term] = meaningfulTerms(token);
    return (
      term !== undefined &&
      token.length > 1 &&
      !FILLER.has(term) &&
      !WEAK_TERMS.has(term) &&
      search.search(token, { prefix: false, fuzzy: false }).length === 0
    );
  });
  if (!unknown.length) return undefined;
  const original = raw
    .replace(/[^A-Za-z0-9+#./\- ]/g, ' ')
    .split(/\s+/)
    .filter((word) => unknown.includes(normalizeQuery(word)));
  return { kind, name: original.join(' ') || unknown.join(' ') };
}

const roleKeywords: Array<
  [RegExp, 'aiml' | 'software' | 'android' | 'teaching']
> = [
  [/\b(android|mobile|kotlin|app developer)\b/i, 'android'],
  [
    /\b(ai|ml|machine learning|nlp|data scien\w+|research|deep learning|llm)\b/i,
    'aiml',
  ],
  [
    /\b(teach\w*|instructor|tutor\w*|lecturer|professor|ta|teaching assistant)\b/i,
    'teaching',
  ],
  [
    /\b(software|backend|back end|full.?stack|engineer|developer|web)\b/i,
    'software',
  ],
];

/** `extras` caps how many ranked chunks may follow the routed ones. */
type Route = { ids: string[]; label: string; extras: number };

function detectRoutes(
  raw: string,
  activeRole: RetrievalInput['activeRole'],
  projectNamed: boolean,
  techNamed: boolean,
): Route | undefined {
  const text = raw.replace(/[’‘]/g, "'");
  const roleFor = () =>
    roleKeywords.find(([pattern]) => pattern.test(text))?.[1] ?? activeRole;
  if (
    /\b(contact|reach|e-?mail|phone|call|linkedin|github|get in touch|talk to|message|connect with)\b/i.test(
      text,
    ) &&
    !projectNamed
  )
    return { ids: ['overview-contact'], label: 'contact', extras: 0 };
  if (
    /\b(worked for|work for|work history|employers?|companies|career history|employment history|previous jobs|where (has|did|does) (he|mohamed) (work|worked)|who has he worked)\b/i.test(
      text,
    )
  )
    return { ids: ['overview-employers'], label: 'employers', extras: 0 };
  if (techNamed && !projectNamed && TECH_INTENT.test(text))
    return { ids: [], label: 'technology', extras: 5 };
  if (!projectNamed) {
    if (
      /\b(fit|suit|suitable|right for|good for|good candidate|hire|qualified|candidate|why (would|should))\b/i.test(
        text,
      ) ||
      /\b(strengths?|good at|best at|stand out|expertise|key skills?|main skills?|core skills?)\b/i.test(
        text,
      )
    )
      return {
        ids: [`overview-lens-${roleFor()}`, 'overview-who'],
        label: 'lens',
        extras: 2,
      };
    if (
      /\b(who is|who's|tell me about (him|mohamed|yourself)|introduce|background|summar(y|ize|ise)|overview|bio\b|describe him|about mohamed|about him)\b/i.test(
        text,
      )
    )
      return {
        ids: ['overview-who', 'about-introduction'],
        label: 'who',
        extras: 0,
      };
    if (
      /\bhow many\b.*\b(apps?|projects?|years|hours|applications?)\b/i.test(
        text,
      )
    )
      return {
        ids: ['overview-who', 'overview-catalogue'],
        label: 'count',
        extras: 1,
      };
    if (
      /\b(what|which|list|show|name|all)\b.*\b(projects?|apps?|applications?|work|built|made|shipped|delivered|portfolio)\b/i.test(
        text,
      ) ||
      /\bwhat (has|have|did) (he|mohamed) (built|build|made|make|shipped|ship|created|create|developed|develop|delivered|deliver|worked on|done)\b/i.test(
        text,
      )
    ) {
      const groups: string[] = [];
      if (/\b(android|mobile|apps?)\b/i.test(text))
        groups.push('overview-catalogue-android');
      if (/\b(ml|ai|machine learning|nlp|research|data science)\b/i.test(text))
        groups.push('overview-catalogue-ml', 'overview-catalogue-research');
      if (/\b(backend|enterprise|api|apis|web|java|services?)\b/i.test(text))
        groups.push('overview-catalogue-backend');
      if (/\b(game|games|early|desktop|school)\b/i.test(text))
        groups.push('overview-catalogue-early');
      return {
        ids: [...groups, 'overview-catalogue'],
        label: 'catalogue',
        extras: 1,
      };
    }
  }
  return undefined;
}

// ------------------------------------------------------------------ search --

type Scored = {
  index: number;
  score: number;
  covered: Set<string>;
  strong: Set<string>;
};

function runSearch(terms: string[], contentWanted: string[]) {
  const scored = new Map<number, Scored>();
  // Coverage (which of the visitor's words an indexed term equals) decides
  // whether a question is answerable. Prefix and fuzzy matches rank results
  // but never count: "super" is not "supervised".
  const run = (
    query: string[],
    weight: number,
    fuzzy: boolean,
    wanted: string[] = contentWanted,
  ) => {
    if (!query.length) return;
    const results = search.search(query.join(' '), {
      prefix: (term) => term.length >= 4,
      fuzzy: fuzzy ? (term) => (term.length >= 6 ? 0.2 : false) : false,
      combineWith: 'OR',
    });
    for (const result of results.slice(0, 60)) {
      const index = indexById.get(result.id as string)!;
      const entry = scored.get(index) ?? {
        index,
        score: 0,
        covered: new Set<string>(),
        strong: new Set<string>(),
      };
      entry.score += result.score * weight;
      for (const [indexed, fields] of Object.entries(result.match))
        if (wanted.includes(indexed)) {
          entry.covered.add(indexed);
          if ((fields as string[]).some((field) => field !== 'text'))
            entry.strong.add(indexed);
        }
      scored.set(index, entry);
    }
  };
  run(terms, 1, true);
  return { scored, run };
}

const FAMILY_BONUS = 1.12;
const OVERVIEW_PENALTY = 0.6;

// Evidence records and the case-study page are counted separately: three of
// each per project, never more than three from the same page.
const pageKey = (chunk: KnowledgeChunk) =>
  `${chunk.family === 'evidence' ? 'evidence:' : ''}${chunk.projectId ?? chunk.id}`;

function sentenceCut(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return end > max * 0.5 ? cut.slice(0, end + 1) : cut.trimEnd();
}

const technologySuggestions = [
  'Which technologies has Mohamed used?',
  'Which programming languages does Mohamed use?',
  'What has Mohamed built?',
];

/** Answerable questions near the topic of a refused one. */
function nearestSuggestions(input: RetrievalInput): string[] {
  const terms = meaningfulTerms(input.question).filter(
    (term) => !WEAK_TERMS.has(term),
  );
  const top = terms.length
    ? search
        .search(terms.join(' '), {
          prefix: true,
          fuzzy: 0.2,
          combineWith: 'OR',
        })
        .slice(0, 5)
        .map((result) => chunkById(result.id as string))
        .find((chunk) => chunk?.projectId && chunk.family !== 'overview')
    : undefined;
  const entity = entities.find(
    (candidate) =>
      candidate.kind === 'project' && candidate.projectId === top?.projectId,
  );
  if (entity)
    return [
      `What is ${entity.label}?`,
      `Which technologies does ${entity.label} use?`,
      `What did Mohamed build in ${entity.label}?`,
    ];
  return starterSuggestions[input.activeRole];
}

const refusal = (
  input: RetrievalInput,
  extra: Partial<RetrievalResult> & { generic?: boolean } = {},
): RetrievalResult => {
  const { generic, ...rest } = extra;
  return {
    query: input.question,
    chunks: [],
    topScore: 0,
    supported: false,
    category: 'unknown',
    refusalReason: 'out-of-scope',
    suggestions: generic
      ? starterSuggestions[input.activeRole]
      : nearestSuggestions(input),
    ...rest,
  };
};

export function retrieveEvidence(input: RetrievalInput): RetrievalResult {
  const raw = input.question;
  const normalized = normalizeQuery(raw);
  const { projectHits, techHits } = findEntities(raw);
  const projectNamed = projectHits.length > 0;
  const techNamed = techHits.length > 0;

  if (checkQuestion(raw, projectNamed || techNamed) === 'refuse')
    return refusal(input, { generic: true });
  if (!projectNamed && !techNamed) {
    const unknown = unknownSubject(raw, normalized);
    if (unknown)
      return refusal(input, {
        refusalReason: unknown.kind,
        unknownSubject: unknown.name,
        suggestions:
          unknown.kind === 'unknown-technology'
            ? technologySuggestions
            : [
                'Who has Mohamed worked for?',
                ...starterSuggestions[input.activeRole].slice(0, 2),
              ],
      });
  }

  const carriedIds = new Set(
    input.history.flatMap((turn) => turn.citationIds ?? []),
  );
  const priorUsers = input.history
    .filter((turn) => turn.role === 'user')
    .slice(-2)
    .map((turn) => turn.content);
  const ownContent = meaningfulTerms(raw).filter(
    (term) => !WEAK_TERMS.has(term),
  );
  const carriesContext = carriedIds.size > 0 && ownContent.length <= 4;
  const query = carriesContext ? [raw, ...priorUsers].join(' ') : raw;
  const allTerms = meaningfulTerms(query);
  const contentWanted = allTerms.filter((term) => !WEAK_TERMS.has(term));
  // "Tell me about Mohamed" has no content words: only then do the weak ones
  // take part in the search.
  const terms = contentWanted.length ? contentWanted : allTerms;
  const route = detectRoutes(raw, input.activeRole, projectNamed, techNamed);

  const { scored, run } = runSearch(terms, contentWanted);
  const synonyms = synonymTerms(raw);
  run(synonyms, 0.4, false, synonyms);

  const projectIds = new Set(projectHits.map((hit) => hit.projectId));
  const pinnedIds = new Set([
    ...(route?.ids ?? []),
    ...techHits.map((hit) => hit.chunkId!),
  ]);
  const ranked = [...scored.values()]
    .map((entry) => {
      const chunk = chunks[entry.index]!;
      let score = entry.score;
      if (chunk.roles.includes(input.activeRole)) score += 0.25;
      if (chunk.projectId && projectIds.has(chunk.projectId)) score += 8;
      if (chunk.family === 'evidence') score = score * FAMILY_BONUS + 0.3;
      // Overview and technology chunks answer broad questions; elsewhere they
      // only crowd out the specific record.
      else if (chunk.family === 'overview' && !pinnedIds.has(chunk.id))
        score *= OVERVIEW_PENALTY;
      return { ...entry, chunk, score };
    })
    .sort((a, b) => b.score - a.score);

  // Included first: overview routes and the technologies the question names.
  const pinned = [...pinnedIds]
    .map((id) => chunkById(id))
    .filter((chunk): chunk is KnowledgeChunk => Boolean(chunk));
  const carry = carriesContext
    ? ranked
        .filter(({ chunk }) =>
          chunk.citations.some((citation) => carriedIds.has(citation.sourceId)),
        )
        .slice(0, 3)
        .map(({ chunk }) => chunk)
    : [];

  const top = ranked[0];
  const coverage = ranked.slice(0, 8).reduce(
    (best, entry) => ({
      covered: Math.max(best.covered, entry.covered.size),
      strong: Math.max(best.strong, entry.strong.size),
    }),
    { covered: 0, strong: 0 },
  );
  const supported = Boolean(
    pinned.length ||
    projectNamed ||
    carry.length ||
    (top &&
      top.score >= SUPPORT_SCORE_THRESHOLD &&
      (coverage.strong >= 1 || coverage.covered >= 2)),
  );
  if (!supported) return refusal(input, { query, topScore: top?.score ?? 0 });

  // Select: pinned, then carried context, then ranked results, with at most
  // three chunks per page and a total evidence budget.
  const limit = Math.min(MAX_CHUNKS, Math.max(1, input.limit));
  const selected: KnowledgeChunk[] = [];
  const perPage = new Map<string, number>();
  let used = 0;
  const take = (chunk: KnowledgeChunk, capped: boolean) => {
    if (selected.length >= limit || selected.some((s) => s.id === chunk.id))
      return;
    const key = pageKey(chunk);
    if (capped && (perPage.get(key) ?? 0) >= MAX_CHUNKS_PER_PAGE) return;
    const size = chunk.title.length + chunk.text.length + 40;
    if (used + size > EVIDENCE_BUDGET_CHARS && selected.length) return;
    selected.push(
      used + size > EVIDENCE_BUDGET_CHARS
        ? {
            ...chunk,
            text: sentenceCut(
              chunk.text,
              Math.max(200, EVIDENCE_BUDGET_CHARS - chunk.title.length - 40),
            ),
          }
        : chunk,
    );
    used += Math.min(size, EVIDENCE_BUDGET_CHARS);
    perPage.set(key, (perPage.get(key) ?? 0) + 1);
  };
  pinned.forEach((chunk) => take(chunk, false));
  carry.forEach((chunk) => take(chunk, true));
  const room = route ? pinned.length + route.extras : limit;
  for (const { chunk } of ranked) {
    if (selected.length >= room) break;
    // Overview and technology chunks only enter when a route or a named
    // technology pins them; a named project keeps the answer on its own pages.
    if (chunk.family === 'overview' && !pinnedIds.has(chunk.id)) continue;
    if (projectNamed && !(chunk.projectId && projectIds.has(chunk.projectId)))
      continue;
    take(chunk, true);
  }

  return {
    query,
    chunks: selected,
    topScore: top?.score ?? 0,
    supported: true,
    category: selected[0]?.category ?? 'unknown',
    route: route?.label ?? (techNamed ? 'technology' : undefined),
  };
}

/**
 * Follow-up questions offered after an answer. They are built from templates
 * the evaluation set proves answerable, never taken from the model.
 */
export function followUpsFor(
  result: RetrievalResult,
  activeRole: RetrievalInput['activeRole'],
): string[] {
  const projectId = result.chunks.find((chunk) => chunk.projectId)?.projectId;
  const entity = entities.find(
    (candidate) =>
      candidate.kind === 'project' && candidate.projectId === projectId,
  );
  if (!entity) return starterSuggestions[activeRole];
  return [
    `Which technologies does ${entity.label} use?`,
    `What did Mohamed learn from ${entity.label}?`,
    `What is ${entity.label}?`,
  ];
}
