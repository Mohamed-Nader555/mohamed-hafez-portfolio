import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { publicRoutes } from './public-routes';

for (const route of publicRoutes) {
  test(`${route.path} has no serious or critical accessibility violations`, async ({
    page,
  }) => {
    const response = await page.goto(route.path);
    expect(response?.status()).toBe(200);

    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations
        .filter((violation) =>
          ['serious', 'critical'].includes(violation.impact ?? ''),
        )
        .map(({ id, impact, help, nodes }) => ({
          id,
          impact,
          help,
          targets: nodes.map((node) => node.target),
        })),
    ).toEqual([]);
  });
}
