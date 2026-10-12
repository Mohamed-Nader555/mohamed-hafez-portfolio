import { expect, test } from '@playwright/test';

import { roleBriefs } from '../../src/data/claims/role-briefs';
import { namedGaps } from '../../src/data/claims/wording-rules';
import { roles } from '../../src/data/roles';
import { gapTerms } from '../../scripts/role-brief-rules';
import { findVerdictPhrases } from '../../src/lib/rag/claim-checks';

test('the hiring page lists every role and links to its page', async ({
  page,
}) => {
  await page.goto('/hiring');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const brief of roleBriefs)
    await expect(
      page.locator(`main a[href="/hiring/${brief.slug}"]`),
    ).toHaveCount(1);
});

for (const brief of roleBriefs) {
  test.describe(brief.slug, () => {
    test('shows his answer, the direct and related evidence and no verdict', async ({
      page,
    }) => {
      await page.goto(`/hiring/${brief.slug}`);

      await expect(page.locator('h1')).toHaveText(brief.title);
      for (const name of brief.alsoCalled.slice(0, 2))
        await expect(page.getByText(name).first()).toBeVisible();

      // His answer, quoted and labelled.
      const summary = page.getByRole('region', { name: /in mohamed’s words/i });
      await expect(summary.getByText('Mohamed’s answer')).toBeVisible();
      await expect(summary.locator('blockquote')).toContainText(
        brief.summary.text.slice(0, 60),
      );

      const direct = page.getByRole('region', { name: 'Direct experience' });
      await expect(direct.locator('article')).toHaveCount(brief.direct.length);
      const related = page.getByRole('region', { name: 'Related experience' });
      if (brief.related.length)
        await expect(related.locator('article')).toHaveCount(
          brief.related.length,
        );
      else await expect(related).toHaveCount(0);

      for (const requirement of [...brief.direct, ...brief.related]) {
        await expect(
          page.getByRole('heading', { level: 3, name: requirement.text }),
        ).toBeVisible();
        await expect(
          page
            .getByText(requirement.evidence[0]!.text, { exact: true })
            .first(),
        ).toBeVisible();
      }

      // Three prompts, each a link to his answer on /about.
      for (const prompt of brief.askHim)
        await expect(
          page.locator(`main a[href="/about#${prompt.answerId}"]`),
        ).toContainText(prompt.question);

      // The résumé for the role's lens.
      const lens = roles.find((role) => role.id === brief.lens)!;
      await expect(
        page.locator(`main a[href="${lens.resumeHref}"]`).first(),
      ).toBeVisible();

      // No verdict, no named gap, anywhere on the page.
      const text = await page.locator('main').innerText();
      expect(findVerdictPhrases(text)).toEqual([]);
      for (const term of gapTerms(namedGaps))
        expect(text.toLowerCase()).not.toContain(term.toLowerCase());
    });

    test('is a page of its own that can be indexed and fits the screen', async ({
      page,
    }) => {
      await page.goto(`/hiring/${brief.slug}`);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        'content',
        'index, follow',
      );
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
    });
  });
}
