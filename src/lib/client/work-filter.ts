const FOCUS_LABELS: Record<string, string> = {
  all: 'All',
  aiml: 'AI & ML',
  software: 'Software',
  android: 'Android',
  teaching: 'Teaching',
};

function init() {
  const chips =
    document.querySelectorAll<HTMLButtonElement>('[data-focus-chip]');
  const cards = document.querySelectorAll<HTMLElement>('[data-focus]');
  const liveRegion = document.querySelector<HTMLElement>('[data-focus-live]');
  const techPill = document.querySelector<HTMLElement>('[data-tech-pill]');
  const techPillLabel = document.querySelector<HTMLElement>(
    '[data-tech-pill-label]',
  );
  const techPillClear = document.querySelector<HTMLButtonElement>(
    '[data-tech-pill-clear]',
  );
  if (chips.length === 0 || cards.length === 0) return;

  function announce(count: number) {
    if (liveRegion)
      liveRegion.textContent = `${count} project${count === 1 ? '' : 's'} shown.`;
  }

  function applyFilter(focus: string, tech: string | null) {
    let visible = 0;
    cards.forEach((card) => {
      const cardFocus = (card.dataset.focus ?? '').split(' ');
      const cardTech = (card.dataset.tech ?? '').split('|');
      const focusMatch = focus === 'all' || cardFocus.includes(focus);
      const techMatch = !tech || cardTech.includes(tech);
      const show = focusMatch && techMatch;
      card.hidden = !show;
      if (show) visible += 1;
    });
    announce(visible);
  }

  function setActiveChip(focus: string) {
    chips.forEach((chip) => {
      const isActive = chip.dataset.focusChip === focus;
      chip.setAttribute('aria-pressed', String(isActive));
    });
  }

  function currentParams() {
    return new URLSearchParams(window.location.search);
  }

  function updateUrl(focus: string, tech: string | null) {
    const params = currentParams();
    if (focus === 'all') params.delete('focus');
    else params.set('focus', focus);
    if (tech) params.set('tech', tech);
    else params.delete('tech');
    const query = params.toString();
    window.history.replaceState(
      null,
      '',
      query ? `?${query}` : window.location.pathname,
    );
  }

  function updateTechPill(tech: string | null) {
    if (!techPill || !techPillLabel) return;
    if (tech) {
      techPillLabel.textContent = `Filtered by ${tech}`;
      techPill.hidden = false;
    } else {
      techPill.hidden = true;
    }
  }

  let activeFocus = currentParams().get('focus') ?? 'all';
  if (!(activeFocus in FOCUS_LABELS)) activeFocus = 'all';
  let activeTech = currentParams().get('tech');

  setActiveChip(activeFocus);
  updateTechPill(activeTech);
  applyFilter(activeFocus, activeTech);

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      activeFocus = chip.dataset.focusChip ?? 'all';
      setActiveChip(activeFocus);
      updateUrl(activeFocus, activeTech);
      applyFilter(activeFocus, activeTech);
    });
  });

  techPillClear?.addEventListener('click', () => {
    activeTech = null;
    updateTechPill(null);
    updateUrl(activeFocus, null);
    applyFilter(activeFocus, null);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
