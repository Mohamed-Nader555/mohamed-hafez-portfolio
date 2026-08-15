import { expect, test } from '@playwright/test';

const lenses = [
  {
    route: '/',
    label: 'AI/ML Engineer',
    roleId: 'aiml',
    file: 'Mohamed-Hafez-AI-ML-Engineer.pdf',
  },
  {
    route: '/software',
    label: 'Software Engineer',
    roleId: 'software',
    file: 'Mohamed-Hafez-Software-Engineer.pdf',
  },
  {
    route: '/android',
    label: 'Android Developer',
    roleId: 'android',
    file: 'Mohamed-Hafez-Android-Developer.pdf',
  },
  {
    route: '/teaching',
    label: 'TA / Instructor',
    roleId: 'teaching',
    file: 'Mohamed-Hafez-TA-Instructor.pdf',
  },
] as const;

for (const lens of lenses) {
  test(`${lens.label} offers its matching stable resume download`, async ({
    page,
  }) => {
    await page.goto(lens.route);

    const resume = page.getByRole('link', {
      name: `Download ${lens.label} résumé`,
    });
    await expect(resume).toHaveAttribute('href', `/resumes/${lens.file}`);
    await expect(resume).toHaveAttribute('download', lens.file);
    await expect(resume).toHaveAttribute(
      'data-analytics-event',
      'resume_downloaded',
    );
    await expect(resume).toHaveAttribute(
      'data-analytics-target',
      `resume-${lens.roleId}`,
    );
    await expect(resume).toHaveAttribute('data-analytics-lens', lens.roleId);
  });
}

test('direct contact actions use public destinations and normalized analytics hooks', async ({
  page,
}) => {
  await page.goto('/');
  const contact = page.getByRole('navigation', {
    name: 'Direct contact options',
  });

  const email = contact.getByRole('link', { name: /Email/ });
  const phone = contact.getByRole('link', { name: /Phone/ });
  const linkedIn = contact.getByRole('link', { name: /LinkedIn/ });
  const github = contact.getByRole('link', { name: /GitHub/ });

  await expect(email).toHaveAttribute(
    'href',
    'mailto:mohamed.m.nader555@gmail.com',
  );
  await expect(phone).toHaveAttribute('href', 'tel:+16479292480');
  await expect(linkedIn).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/mohamed-nader555',
  );
  await expect(github).toHaveAttribute(
    'href',
    'https://github.com/Mohamed-Nader555',
  );

  await expect(email).toHaveAttribute(
    'data-analytics-event',
    'contact_clicked',
  );
  await expect(phone).toHaveAttribute(
    'data-analytics-event',
    'contact_clicked',
  );
  await expect(linkedIn).toHaveAttribute(
    'data-analytics-event',
    'linkedin_clicked',
  );
  await expect(github).toHaveAttribute(
    'data-analytics-event',
    'github_clicked',
  );

  for (const externalLink of [linkedIn, github]) {
    await expect(externalLink).toHaveAttribute('target', '_blank');
    await expect(externalLink).toHaveAttribute('rel', /noopener/);
    await expect(externalLink).toHaveAttribute('rel', /noreferrer/);
  }
});

test('contact actions remain usable at 320px without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto('/about');

  const contact = page.getByRole('navigation', {
    name: 'Public contact channels',
  });
  await expect(contact.getByRole('link')).toHaveCount(4);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );

  for (const link of await contact.getByRole('link').all()) {
    const box = await link.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
    await expect(link).toHaveCSS('flex-direction', 'column');
    await expect(link).not.toHaveCSS('row-gap', '0px');
  }

  await expect(page.locator('form')).toHaveCount(0);
  await context.close();
});

for (const project of [
  {
    route: '/work/dive',
    alt: /Dive map showing nearby hospitals and emergency planning locations/i,
  },
  {
    route: '/work/dostava',
    alt: /Dostava restaurant list for choosing an order destination/i,
  },
] as const) {
  test(`${project.route} presents responsive, dimensioned feature evidence`, async ({
    page,
  }) => {
    await page.goto(project.route);

    const image = page.getByRole('img', { name: project.alt }).first();
    await expect(image).toBeVisible();
    await expect(image).toHaveAttribute('width', /^\d+$/);
    await expect(image).toHaveAttribute('height', /^\d+$/);
    await expect(image).toHaveAttribute('loading', 'lazy');

    const picture = image.locator('xpath=..');
    await expect(picture.locator('source[type="image/avif"]')).toHaveAttribute(
      'srcset',
      /\.avif/,
    );
    await expect(picture.locator('source[type="image/webp"]')).toHaveAttribute(
      'srcset',
      /\.webp/,
    );
  });
}
