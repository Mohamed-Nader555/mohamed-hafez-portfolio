import { writeKnowledgeIndex } from '../scripts/build-knowledge-index';

// The retriever loads the generated index (src/generated is git-ignored), so
// the unit and integration suites build it once before any test imports it.
export default async function setup() {
  await writeKnowledgeIndex();
}
