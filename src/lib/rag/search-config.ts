import type { Options } from 'minisearch';
import { indexTerm } from './normalize-query';

/**
 * The index is serialized at build time and loaded in the Worker, so both
 * sides must construct MiniSearch with exactly these options (functions are
 * not part of the serialized index).
 */
export const FIELD_BOOSTS = { title: 4, aliases: 6, topics: 3, text: 1 };

export const miniSearchOptions: Options = {
  fields: ['title', 'text', 'topics', 'aliases'],
  storeFields: ['id'],
  processTerm: indexTerm,
  searchOptions: { boost: FIELD_BOOSTS },
};
