import { useEffect, useId, useState } from 'react';
import type { RoleBrief } from '@/data/claims/types';
import { BriefCard } from './BriefCard';
import { roleBriefToCard } from './brief-card-data';

/**
 * "Hiring for a role?": pick one of the 11 roles and see its stored brief at
 * once. Nothing is sent anywhere, so there is no human check and no model
 * call. The briefs load when the picker opens, not with the chat.
 */
export function RolePicker({ onClose }: { onClose(): void }) {
  const titleId = useId();
  const [briefs, setBriefs] = useState<readonly RoleBrief[]>();
  const [selected, setSelected] = useState<string>();

  useEffect(() => {
    let live = true;
    void import('@/data/claims/role-briefs').then((module) => {
      if (live) setBriefs(module.roleBriefs);
    });
    return () => {
      live = false;
    };
  }, []);

  const chosen = briefs?.find((brief) => brief.slug === selected);

  return (
    <section className="chat-role-picker" aria-labelledby={titleId}>
      <header>
        <h3 id={titleId}>Hiring for a role?</h3>
        <button type="button" className="chat-action" onClick={onClose}>
          Back to chat
        </button>
      </header>
      {!briefs && <p role="status">Loading the roles…</p>}
      {briefs && chosen && (
        <>
          <button
            type="button"
            className="chat-action"
            onClick={() => setSelected(undefined)}
          >
            All roles
          </button>
          <BriefCard card={roleBriefToCard(chosen)} />
        </>
      )}
      {briefs && !chosen && (
        <>
          <p>
            Choose the role you are hiring for to see what the site shows
            against it. It is shown straight away and sends nothing.
          </p>
          <ul className="chat-role-list">
            {briefs.map((brief) => (
              <li key={brief.slug}>
                <button type="button" onClick={() => setSelected(brief.slug)}>
                  {brief.title}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
