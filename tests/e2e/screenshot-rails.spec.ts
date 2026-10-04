import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Dive and Dostava both have real screenshots. The galleries are the rails
// under test; Dive also has a ScreenFlow rail.
const pages = ['dive', 'dostava'] as const;

const rail = (page: Page) =>
  page.locator('.project-gallery [data-shot-rail]').first();
const track = (page: Page) => rail(page).locator('[data-rail-track]');

async function open(page: Page, slug: string) {
  await page.goto(`/work/${slug}`);
  await expect(rail(page)).toHaveAttribute('data-enhanced', '', {
    timeout: 15_000,
  });
  // Centre the rail so a fixed header or launcher never sits on top of it.
  await track(page).evaluate((element) =>
    element.scrollIntoView({ block: 'center' }),
  );
}

const scrollLeft = (page: Page) =>
  track(page).evaluate((element) => element.scrollLeft);

for (const slug of pages) {
  test.describe(`/work/${slug} screenshot rail`, () => {
    test('is enhanced: no native scrollbar, labelled group, counter and progress', async ({
      page,
    }) => {
      await open(page, slug);
      await expect(rail(page)).toHaveAttribute('role', 'group');
      await expect(rail(page)).toHaveAttribute('aria-label', /rail/);
      expect(
        await track(page).evaluate(
          (element) => getComputedStyle(element).scrollbarWidth,
        ),
      ).toBe('none');
      const slides = await track(page).locator('[data-rail-slide]').count();
      await expect(rail(page).locator('[data-rail-counter]')).toHaveText(
        new RegExp(`^\\d{2} / ${String(slides).padStart(2, '0')}$`),
      );
      const visible = await rail(page).evaluate((element) =>
        Number(element.style.getPropertyValue('--rail-visible')),
      );
      expect(visible).toBeGreaterThan(0);
      expect(visible).toBeLessThan(1);
    });

    test('scrolling updates the counter, the progress thumb and the edge fades', async ({
      page,
    }) => {
      await open(page, slug);
      const counter = rail(page).locator('[data-rail-counter]');
      const before = await counter.textContent();
      await expect(rail(page)).not.toHaveAttribute('data-fade-start', '');
      await expect(rail(page)).toHaveAttribute('data-fade-end', '');
      await track(page).evaluate((element) => {
        element.scrollTo({ left: element.scrollWidth, behavior: 'instant' });
      });
      await expect(counter).not.toHaveText(before!);
      await expect(rail(page)).toHaveAttribute('data-fade-start', '');
      await expect(rail(page)).not.toHaveAttribute('data-fade-end', '');
      await expect
        .poll(() =>
          rail(page).evaluate((element) =>
            Number(element.style.getPropertyValue('--rail-progress')),
          ),
        )
        .toBeGreaterThan(0.95);
    });

    test('has no horizontal page overflow and no layout shift', async ({
      page,
    }) => {
      await page.addInitScript(() => {
        (window as unknown as { shifts: number }).shifts = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as Array<{
            value: number;
            hadRecentInput: boolean;
          }>)
            if (!entry.hadRecentInput)
              (window as unknown as { shifts: number }).shifts += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await open(page, slug);
      await track(page).evaluate((element) =>
        element.scrollTo({ left: element.scrollWidth, behavior: 'instant' }),
      );
      await page.waitForTimeout(800);
      expect(
        await page.evaluate(
          () =>
            document.documentElement.scrollWidth <=
            document.documentElement.clientWidth,
        ),
      ).toBe(true);
      expect(
        await page.evaluate(
          () => (window as unknown as { shifts: number }).shifts,
        ),
      ).toBeLessThan(0.05);
    });

    test('the buttons move the rail one slide and disable at the ends', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Buttons are hidden on coarse pointers.');
      await open(page, slug);
      const prev = rail(page).getByRole('button', {
        name: 'Previous screenshot',
      });
      const next = rail(page).getByRole('button', { name: 'Next screenshot' });
      await expect(prev).toBeDisabled();
      await expect(next).toBeEnabled();
      await next.click();
      await expect.poll(() => scrollLeft(page)).toBeGreaterThan(20);
      await expect(prev).toBeEnabled();
      for (let i = 0; i < 20 && (await next.isEnabled()); i += 1) {
        await next.click();
        await page.waitForTimeout(350);
      }
      await expect(next).toBeDisabled();
      await prev.click();
      await expect(next).toBeEnabled({ timeout: 5000 });
    });

    test('mouse dragging scrolls the rail without opening the lightbox', async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, 'Mouse dragging is for fine pointers.');
      await open(page, slug);
      const box = (await track(page).boundingBox())!;
      const y = box.y + box.height / 2;
      await page.mouse.move(box.x + box.width - 40, y);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, y, { steps: 8 });
      await expect(track(page)).toHaveAttribute('data-dragging', '');
      await page.mouse.up();
      await expect.poll(() => scrollLeft(page)).toBeGreaterThan(20);
      await expect(page.locator('dialog.shot-lightbox[open]')).toHaveCount(0);
    });

    test('the lightbox opens, traps focus, navigates and closes with Escape', async ({
      page,
    }) => {
      await open(page, slug);
      const zoom = rail(page).locator('.shot-rail__zoom').first();
      await zoom.focus();
      await page.keyboard.press('Enter');
      const dialog = page.locator('dialog.shot-lightbox[open]');
      await expect(dialog).toBeVisible();
      await expect(dialog.locator('[data-lightbox-counter]')).toHaveText(
        /^01 \/ \d{2}$/,
      );
      await expect(dialog.locator('[data-lightbox-caption]')).not.toBeEmpty();

      // Never upscaled: the image is shown at no more than its natural size.
      const image = dialog.locator('img');
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      expect(
        await image.evaluate(
          (element: HTMLImageElement) =>
            element.clientWidth <= element.naturalWidth + 1,
        ),
      ).toBe(true);

      await page.keyboard.press('ArrowRight');
      await expect(dialog.locator('[data-lightbox-counter]')).toHaveText(
        /^02 \/ \d{2}$/,
      );
      await page.keyboard.press('ArrowLeft');
      await expect(dialog.locator('[data-lightbox-counter]')).toHaveText(
        /^01 \/ \d{2}$/,
      );

      // The page behind is inert: however many times Tab is pressed, focus is
      // inside the dialog (or has left the page for the browser's own UI).
      for (let i = 0; i < 8; i += 1) {
        await page.keyboard.press('Tab');
        expect(
          await page.evaluate(() => {
            const active = document.activeElement;
            return (
              !active ||
              active === document.body ||
              Boolean(active.closest('dialog.shot-lightbox'))
            );
          }),
        ).toBe(true);
      }

      await page.keyboard.press('Escape');
      await expect(page.locator('dialog.shot-lightbox[open]')).toHaveCount(0);
      await expect(zoom).toBeFocused();
    });

    test('a backdrop click closes the lightbox', async ({ page }) => {
      await open(page, slug);
      await rail(page).locator('.shot-rail__zoom').first().click();
      const dialog = page.locator('dialog.shot-lightbox[open]');
      await expect(dialog).toBeVisible();
      await dialog.click({ position: { x: 4, y: 4 } });
      await expect(page.locator('dialog.shot-lightbox[open]')).toHaveCount(0);
    });

    test('reduced motion removes the entrance animation', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await open(page, slug);
      const slide = track(page).locator('[data-rail-slide]').first();
      expect(
        await slide.evaluate((element) => {
          const style = getComputedStyle(element);
          return [style.animationName, style.opacity];
        }),
      ).toEqual(['none', '1']);
    });

    test('animates the slides in when motion is allowed', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await open(page, slug);
      await expect(rail(page)).toHaveAttribute('data-revealed', '');
      const slide = track(page).locator('[data-rail-slide]').first();
      expect(
        await slide.evaluate(
          (element) => getComputedStyle(element).animationName,
        ),
      ).toBe('shot-rail-in');
    });

    test('has no serious accessibility violations, with the viewer open too', async ({
      page,
    }) => {
      await open(page, slug);
      const serious = async () =>
        (await new AxeBuilder({ page }).analyze()).violations
          .filter((violation) =>
            ['serious', 'critical'].includes(violation.impact ?? ''),
          )
          .map(({ id, nodes }) => ({
            id,
            targets: nodes.map((node) => node.target),
          }));
      expect(await serious()).toEqual([]);
      await rail(page).locator('.shot-rail__zoom').first().click();
      await expect(page.locator('dialog.shot-lightbox[open]')).toBeVisible();
      expect(await serious()).toEqual([]);
    });
  });
}

test('the Dive screen-flow rail keeps its ordered list, step numbers and arrows', async ({
  page,
}) => {
  await page.goto('/work/dive');
  const flow = page.locator('.screen-flow [data-shot-rail]');
  await expect(flow).toHaveAttribute('data-enhanced', '', { timeout: 15_000 });
  await expect(flow.locator('ol.screen-flow__track > li')).toHaveCount(3);
  await expect(flow.locator('.screen-flow__index').first()).toHaveText('01');
  await expect(flow.locator('.screen-flow__arrow')).toHaveCount(2);
  await flow.locator('.shot-rail__zoom').first().click();
  const dialog = page.locator('dialog.shot-lightbox[open]');
  await expect(dialog.locator('[data-lightbox-caption]')).toContainText(
    'Check',
  );
  await page.keyboard.press('Escape');
});
