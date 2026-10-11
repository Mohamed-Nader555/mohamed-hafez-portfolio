import { useId, useState } from 'react';
import { briefToText, type BriefCardData } from './brief-card-data';

/**
 * A brief shown inside the chat panel: his answer, the groups of evidence, the
 * prompts, and a button that copies the whole brief as plain text. Printing
 * the page prints just this card (see assistant.css).
 */
export function BriefCard({ card }: { card: BriefCardData }) {
  const titleId = useId();
  const [copy, setCopy] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyBrief = async () => {
    try {
      await navigator.clipboard.writeText(
        briefToText(card, window.location.origin),
      );
      setCopy('copied');
    } catch {
      setCopy('failed');
    }
  };

  return (
    <article className="brief-card" aria-labelledby={titleId}>
      <header>
        <h3 id={titleId}>{card.title}</h3>
      </header>
      {card.summary && (
        <div className="brief-card-summary">
          <span className="brief-card-label">{card.summary.label}</span>
          <blockquote>
            <p>{card.summary.text}</p>
          </blockquote>
        </div>
      )}
      {card.groups
        .filter((group) => group.items.length > 0)
        .map((group) => (
          <section
            className={`brief-card-group brief-card-group--${group.id}`}
            key={group.id}
          >
            <h4>{group.label}</h4>
            <ul>
              {group.items.map((item) => (
                <li key={item.text}>
                  <strong>{item.text}</strong>
                  {item.detail.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </li>
              ))}
            </ul>
          </section>
        ))}
      {card.askHim.length > 0 && (
        <section className="brief-card-group">
          <h4>Ask him about</h4>
          <ul>
            {card.askHim.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}
      <div className="brief-card-actions">
        <button type="button" className="chat-action" onClick={copyBrief}>
          Copy brief
        </button>
        {card.pageHref && (
          <a className="chat-action" href={card.pageHref}>
            Open the full page
          </a>
        )}
        <span className="brief-card-status" role="status">
          {copy === 'copied'
            ? 'Copied'
            : copy === 'failed'
              ? 'Could not copy; select the text instead'
              : ''}
        </span>
      </div>
    </article>
  );
}
