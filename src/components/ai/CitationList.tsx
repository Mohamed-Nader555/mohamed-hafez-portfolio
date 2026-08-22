import type { Citation } from '@/lib/rag/types';
export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <details className="chat-evidence-links">
      <summary>
        Supporting evidence <span>{citations.length}</span>
      </summary>
      <ul className="chat-citations" aria-label="Public sources">
        {citations.map((citation) => (
          <li key={citation.sourceId}>
            <a href={citation.href}>{citation.label}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}
