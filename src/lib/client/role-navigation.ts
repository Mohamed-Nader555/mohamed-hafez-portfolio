import type { RoleId } from '@/types/content';

const roleSelector = 'a[data-lens][href*="role="]';

export function installRoleNavigation() {
  // Each switch awaits a short exit animation before it swaps content. If the
  // visitor clicks again inside that window, only the latest request may swap;
  // otherwise the earlier one swaps first and the later one targets a detached
  // node, leaving the old role on screen under the new role's URL.
  let latestNavigation = 0;

  async function renderRole(url: URL, pushHistory: boolean) {
    const navigation = ++latestNavigation;
    document.documentElement.dataset.roleNavigating = 'true';

    try {
      const requestedRole = url.searchParams.get('role') ?? 'aiml';
      const template = document.querySelector<HTMLTemplateElement>(
        `template[data-role-template="${requestedRole}"]`,
      );
      const currentContent = document.querySelector<HTMLElement>(
        '[data-role-content]',
      );
      const nextContent = template?.content.firstElementChild?.cloneNode(
        true,
      ) as HTMLElement | undefined;
      if (!currentContent || !nextContent || !template) {
        throw new Error('The requested role template is unavailable.');
      }

      const nextRole = nextContent.dataset.role as RoleId;
      const swapContent = () => {
        (
          document.querySelector<HTMLElement>('[data-role-content]') ??
          currentContent
        ).replaceWith(nextContent);
        document.title = nextContent.dataset.roleTitle ?? document.title;
        document
          .querySelector('[data-shell]')
          ?.setAttribute('data-active-role', nextRole);
        document
          .querySelectorAll<HTMLAnchorElement>('[data-lens]')
          .forEach((link) => {
            if (link.dataset.lens === nextRole) {
              link.setAttribute('aria-current', 'page');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        if (pushHistory) history.pushState({ role: nextRole }, '', url);
        document.dispatchEvent(
          new CustomEvent<RoleId>('portfolio:role-change', {
            detail: nextRole,
          }),
        );
        document.dispatchEvent(new Event('portfolio:content-updated'));
      };

      const reducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;
      if (reducedMotion || !currentContent.animate) {
        swapContent();
      } else {
        await currentContent
          .animate(
            [
              { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
              {
                opacity: 0,
                filter: 'blur(0.7rem)',
                transform: 'scale(0.995)',
              },
            ],
            { duration: 90, easing: 'ease-in', fill: 'forwards' },
          )
          .finished.catch(() => undefined);
        if (navigation !== latestNavigation) return;
        swapContent();
        nextContent.animate(
          [
            {
              opacity: 0,
              filter: 'blur(0.8rem)',
              transform: 'scale(1.005)',
            },
            { opacity: 1, filter: 'blur(0)', transform: 'scale(1)' },
          ],
          {
            duration: 180,
            easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          },
        );
      }
    } catch {
      window.location.assign(url);
    } finally {
      if (navigation === latestNavigation) {
        delete document.documentElement.dataset.roleNavigating;
      }
    }
  }

  document.addEventListener(
    'click',
    (event) => {
      if (
        !(event.target instanceof Element) ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>(roleSelector);
      if (!link || link.target || link.hasAttribute('download')) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname !== '/') return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (url.href !== window.location.href) void renderRole(url, true);
    },
    true,
  );

  window.addEventListener('popstate', () => {
    if (window.location.pathname === '/') {
      void renderRole(new URL(window.location.href), false);
    }
  });
}
