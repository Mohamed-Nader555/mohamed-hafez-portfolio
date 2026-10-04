/**
 * Progressive enhancement for screenshot rails (`ProjectGallery`, `ScreenFlow`).
 *
 * Without this script a rail is a plain horizontally scrolling strip with a
 * thin styled scrollbar. With it: no native scrollbar, edge fades, previous
 * and next buttons, a progress thumb, a "03 / 09" counter, an entrance
 * animation, mouse dragging and a lightbox. Position and progress are written
 * through the CSSOM (custom properties), never as style attributes in markup,
 * because the site's CSP is `style-src 'self'`.
 */

const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const behavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');
const pad = (value: number) => String(value).padStart(2, '0');
const DRAG_THRESHOLD = 5;

type Slide = {
  element: HTMLElement;
  caption: string;
  avif: string;
  webp: string;
  fallback: string;
  alt: string;
  width: string | null;
  height: string | null;
  zoom?: HTMLButtonElement;
};

/** The largest candidate in a `url 480w, url 1110w` srcset (never upscaled). */
export function largestCandidate(srcset: string | null | undefined): string {
  let best = { url: '', width: -1 };
  for (const part of (srcset ?? '').split(',')) {
    const [url, descriptor] = part.trim().split(/\s+/);
    const parsed = Number.parseInt(descriptor ?? '', 10);
    const width = Number.isNaN(parsed) ? 0 : parsed;
    if (url && width > best.width) best = { url, width };
  }
  return best.url;
}

function readSlide(element: HTMLElement): Slide {
  const source = (type: string) =>
    largestCandidate(
      element
        .querySelector(`picture source[type="${type}"]`)
        ?.getAttribute('srcset'),
    );
  const img = element.querySelector('img');
  const webp = source('image/webp');
  return {
    element,
    caption: element.dataset.railCaption ?? '',
    avif: source('image/avif'),
    webp,
    fallback: webp || (img?.getAttribute('src') ?? ''),
    alt: img?.getAttribute('alt') ?? '',
    width: img?.getAttribute('width') ?? null,
    height: img?.getAttribute('height') ?? null,
  };
}

// ---------------------------------------------------------------- lightbox --

type RailState = {
  slides: Slide[];
  reveal(index: number): void;
  focusSlide(index: number): void;
};
type Lightbox = {
  dialog: HTMLDialogElement;
  show(rail: RailState, index: number): void;
};
let lightbox: Lightbox | undefined;

function ensureLightbox(): Lightbox {
  if (lightbox && document.body.contains(lightbox.dialog)) return lightbox;
  const dialog = document.createElement('dialog');
  dialog.className = 'shot-lightbox';
  dialog.setAttribute('aria-label', 'Screenshot viewer');
  dialog.innerHTML = `
    <div class="shot-lightbox__panel">
      <button type="button" class="shot-lightbox__close" aria-label="Close viewer"><span aria-hidden="true">×</span></button>
      <figure class="shot-lightbox__figure">
        <div class="shot-lightbox__image" data-lightbox-image></div>
        <figcaption class="shot-lightbox__caption" data-lightbox-caption></figcaption>
      </figure>
      <div class="shot-lightbox__nav">
        <button type="button" class="shot-rail__button" data-lightbox-prev aria-label="Previous screenshot"><span aria-hidden="true">←</span></button>
        <p class="shot-rail__counter" data-lightbox-counter></p>
        <button type="button" class="shot-rail__button" data-lightbox-next aria-label="Next screenshot"><span aria-hidden="true">→</span></button>
      </div>
    </div>`;
  document.body.append(dialog);
  const image = dialog.querySelector<HTMLElement>('[data-lightbox-image]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const counter = dialog.querySelector<HTMLElement>('[data-lightbox-counter]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lightbox-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lightbox-next]')!;
  let current: { rail: RailState; index: number } | undefined;

  const render = () => {
    if (!current) return;
    const { rail, index } = current;
    const slide = rail.slides[index]!;
    // The picture offers the largest existing variant as a single, 1x
    // candidate, so the browser shows it at natural size and never upscales.
    const picture = document.createElement('picture');
    for (const [type, url] of [
      ['image/avif', slide.avif],
      ['image/webp', slide.webp],
    ] as const)
      if (url) {
        const sourceElement = document.createElement('source');
        sourceElement.type = type;
        sourceElement.srcset = url;
        picture.append(sourceElement);
      }
    const img = document.createElement('img');
    img.src = slide.fallback;
    img.alt = slide.alt;
    if (slide.width) img.width = Number(slide.width);
    if (slide.height) img.height = Number(slide.height);
    picture.append(img);
    image.replaceChildren(picture);
    caption.textContent = slide.caption;
    counter.textContent = `${pad(index + 1)} / ${pad(rail.slides.length)}`;
    prev.disabled = index === 0;
    next.disabled = index === rail.slides.length - 1;
  };
  const move = (delta: number) => {
    if (!current) return;
    const index = Math.min(
      current.rail.slides.length - 1,
      Math.max(0, current.index + delta),
    );
    if (index !== current.index) {
      current.index = index;
      render();
    }
  };
  prev.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  dialog
    .querySelector('.shot-lightbox__close')!
    .addEventListener('click', () => dialog.close());
  // The dialog fills the viewport, so a click on it (not on the panel) is a
  // click on the backdrop.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      move(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      move(1);
    }
  });
  dialog.addEventListener('close', () => {
    if (!current) return;
    const { rail, index } = current;
    current = undefined;
    // Focus returns to the slide that was on show, scrolled into view.
    rail.reveal(index);
    rail.focusSlide(index);
  });

  lightbox = {
    dialog,
    show(rail, index) {
      current = { rail, index };
      render();
      if (!dialog.open) dialog.showModal();
    },
  };
  return lightbox;
}

// -------------------------------------------------------------------- rail --

function initRail(root: HTMLElement) {
  if (root.hasAttribute('data-enhanced')) return;
  const track = root.querySelector<HTMLElement>('[data-rail-track]');
  const elements = [
    ...(track?.querySelectorAll<HTMLElement>('[data-rail-slide]') ?? []),
  ];
  if (!track || !elements.length) return;
  const slides = elements.map(readSlide);
  const prev = root.querySelector<HTMLButtonElement>('[data-rail-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-rail-next]');
  const counter = root.querySelector<HTMLElement>('[data-rail-counter]');
  root.setAttribute('data-enhanced', '');
  // The roving zoom buttons become the rail's single tab stop, so the
  // scroller itself no longer needs one (or its label).
  track.removeAttribute('tabindex');
  track.removeAttribute('aria-label');

  const max = () => Math.max(0, track.scrollWidth - track.clientWidth);
  const scrollToIndex = (index: number) =>
    track.scrollTo({
      left: Math.min(max(), Math.max(0, elements[index]!.offsetLeft)),
      behavior: behavior(),
    });
  const centred = () => {
    const middle = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let distance = Infinity;
    elements.forEach((element, index) => {
      const gap = Math.abs(
        element.offsetLeft + element.offsetWidth / 2 - middle,
      );
      if (gap < distance) {
        distance = gap;
        best = index;
      }
    });
    return best;
  };

  let frame = 0;
  const update = () => {
    frame = 0;
    const range = max();
    const position = track.scrollLeft;
    root.style.setProperty(
      '--rail-visible',
      String(track.scrollWidth ? track.clientWidth / track.scrollWidth : 1),
    );
    root.style.setProperty(
      '--rail-progress',
      String(range ? Math.min(1, position / range) : 0),
    );
    root.toggleAttribute('data-fade-start', position > 1);
    root.toggleAttribute('data-fade-end', position < range - 1);
    root.toggleAttribute('data-static', range <= 1);
    if (prev) prev.disabled = position <= 1;
    if (next) next.disabled = position >= range - 1;
    if (counter)
      counter.textContent = `${pad(centred() + 1)} / ${pad(elements.length)}`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  track.addEventListener('scroll', schedule, { passive: true });
  new ResizeObserver(schedule).observe(track);
  update();

  prev?.addEventListener('click', () => {
    const target = elements.findLastIndex(
      (element) => element.offsetLeft < track.scrollLeft - 4,
    );
    scrollToIndex(Math.max(0, target));
  });
  next?.addEventListener('click', () => {
    const target = elements.findIndex(
      (element) => element.offsetLeft > track.scrollLeft + 4,
    );
    scrollToIndex(target < 0 ? elements.length - 1 : target);
  });

  // Entrance: slides fade and rise in, staggered, the first time the rail is
  // in view. CSS removes the animation under prefers-reduced-motion.
  elements.forEach((element, index) =>
    element.style.setProperty('--rail-index', String(index)),
  );
  const reveal = () => root.setAttribute('data-revealed', '');
  if (reducedMotion() || !('IntersectionObserver' in window)) reveal();
  else {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(root);
  }

  // Dragging with a mouse. Snapping is suspended while dragging, and the
  // click that ends a drag must not open the lightbox.
  let drag: { x: number; scroll: number; moved: boolean } | undefined;
  let swallowClick = false;
  track.addEventListener('pointerdown', (event) => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
    drag = { x: event.clientX, scroll: track.scrollLeft, moved: false };
  });
  track.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const delta = event.clientX - drag.x;
    if (!drag.moved && Math.abs(delta) < DRAG_THRESHOLD) return;
    if (!drag.moved) {
      drag.moved = true;
      track.setAttribute('data-dragging', '');
      track.setPointerCapture(event.pointerId);
    }
    track.scrollLeft = drag.scroll - delta;
  });
  const endDrag = () => {
    if (!drag) return;
    const moved = drag.moved;
    drag = undefined;
    if (!moved) return;
    swallowClick = true;
    window.setTimeout(() => (swallowClick = false), 0);
    track.removeAttribute('data-dragging');
    scrollToIndex(centred());
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener(
    'click',
    (event) => {
      if (swallowClick) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
  track.addEventListener('dragstart', (event) => event.preventDefault());

  // Lightbox buttons, one per slide, with a roving tab stop so the rail is a
  // single stop in the tab order; Left and Right move one slide.
  const state: RailState = {
    slides,
    reveal: (index) => {
      const element = elements[index]!;
      if (
        element.offsetLeft < track.scrollLeft ||
        element.offsetLeft + element.offsetWidth >
          track.scrollLeft + track.clientWidth
      )
        scrollToIndex(index);
    },
    focusSlide: (index) => {
      slides.forEach((slide, i) =>
        slide.zoom?.setAttribute('tabindex', i === index ? '0' : '-1'),
      );
      slides[index]?.zoom?.focus({ preventScroll: true });
    },
  };
  slides.forEach((slide, index) => {
    const frameElement =
      slide.element.querySelector<HTMLElement>('.shot-rail__frame') ??
      slide.element;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'shot-rail__zoom';
    button.setAttribute('tabindex', index === 0 ? '0' : '-1');
    button.setAttribute(
      'aria-label',
      `Enlarge screenshot ${index + 1} of ${slides.length}: ${slide.caption || slide.alt}`,
    );
    button.addEventListener('click', () => ensureLightbox().show(state, index));
    button.addEventListener('keydown', (event) => {
      const target =
        event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? slides.length - 1
            : event.key === 'ArrowRight'
              ? index + 1
              : event.key === 'ArrowLeft'
                ? index - 1
                : undefined;
      if (target === undefined || target < 0 || target >= slides.length) return;
      event.preventDefault();
      state.reveal(target);
      state.focusSlide(target);
    });
    frameElement.append(button);
    slide.zoom = button;
  });
}

function initAll() {
  document
    .querySelectorAll<HTMLElement>('[data-shot-rail]')
    .forEach((root) => initRail(root));
}

document.addEventListener('astro:page-load', initAll);
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initAll);
else initAll();
