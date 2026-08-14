# Portfolio Foundation and Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the adaptive, evidence-led Astro portfolio with four recruiter lenses, verified case studies, public résumés, contact actions, and production-quality accessibility/SEO.

**Architecture:** Astro pre-renders public content while React is limited to stateful recruiter-lens and assistant entry-point islands. A Zod-validated evidence model feeds every page so visible claims, case studies, metadata, and the later AI index share one source of truth.

**Tech Stack:** Node.js 22 LTS, npm, Astro, TypeScript strict, React, Astro Content Collections, MDX, Zod, CSS layers/custom properties, Lucide, Vitest, Testing Library, Playwright, axe-core, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-08-14-recruiter-portfolio-design.md`

## Global Constraints

- One repository and one shared site; role lenses are `/`, `/software`, `/android`, and `/teaching`.
- AI/ML is the default narrative; role routes change emphasis and matching résumé without duplicating facts.
- Use the locked source-precedence and attribution rules in spec §3 verbatim.
- Credit Dive’s end-to-end implementation to Mohamed and do not attribute it to a presenter or unrelated collaborator.
- SPRINT-PP must be “submitted and under review”; CEH must be “training,” not certification.
- Historical Play Store apps must not be presented as currently downloadable.
- No headshot, testimonials, contact form, CMS, Tailwind, heavy 3D, or job-description matching.
- Equal-quality desktop, laptop, tablet, and smartphone behavior; target WCAG 2.2 AA.
- Pre-render all public pages; JavaScript budgets are 120 KB gzip normally and 180 KB gzip where the assistant hydrates.
- Commit only the four role résumés and approved public imagery; keep raw supplementary sources private.

---

## Planned file map

```text
src/
├── components/
│   ├── case-study/{CaseStudyCard,CaseStudyEvidence}.astro
│   ├── layout/{Header,Footer,RecruiterLensNav}.astro
│   ├── lenses/RecruiterLensSwitcher.tsx
│   └── sections/{Hero,EvidencePanel,ExperienceSection,ContactSection}.astro
├── content/case-studies/*.mdx
├── data/
│   ├── evidence/*.ts
│   ├── profile.ts
│   ├── projects.ts
│   ├── roles.ts
│   ├── screening.ts
│   └── sources.ts
├── layouts/{BaseLayout,LensLayout,CaseStudyLayout}.astro
├── lib/content/{resolve-lens,resolve-sources}.ts
├── pages/{index,software,android,teaching,work,experience,about,privacy}.astro
├── pages/work/[slug].astro
├── pages/research/asc-pie.astro
├── styles/{tokens,reset,global,components,motion}.css
└── types/content.ts
tests/{unit,integration,e2e}/
```

### Task 1: Scaffold the Cloudflare-ready Astro application and quality toolchain

**Files:**
- Create: `package.json`, `package-lock.json`, `astro.config.mjs`, `tsconfig.json`
- Create: `vitest.config.ts`, `playwright.config.ts`, `eslint.config.js`, `.prettierrc.json`
- Create: `src/pages/index.astro`, `src/env.d.ts`
- Test: `tests/unit/smoke.test.ts`, `tests/e2e/home.spec.ts`

**Interfaces:**
- Produces scripts: `dev`, `build`, `check`, `lint`, `format:check`, `test`, `test:unit`, `test:e2e`, `test:a11y`.
- Produces an Astro project that later tasks can import from `src/*` using the `@/*` alias.

- [ ] **Step 1: Initialize the existing planning repository and install pinned dependency families**

Run:

```bash
npm init -y
npm install astro @astrojs/cloudflare @astrojs/react @astrojs/mdx @astrojs/sitemap react react-dom zod minisearch lucide-react
npm install -D typescript @types/react @types/react-dom wrangler tsx vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom playwright @axe-core/playwright eslint eslint-plugin-astro typescript-eslint prettier prettier-plugin-astro @astrojs/check @lhci/cli
```

Expected: `npm install` completes and `package-lock.json` records all versions.

Create `astro.config.mjs` with the Cloudflare adapter, `session: false`, React, MDX, and sitemap integrations. Set `output: 'server'`; every public content route must declare `export const prerender = true`, while `/api/chat` and `/api/events` remain on-demand. Create strict `tsconfig.json` extending `astro/tsconfigs/strict` with the `@/*` alias mapped to `src/*`.

- [ ] **Step 2: Add the script contract to `package.json`**

Use these values:

```json
{
  "scripts": {
    "dev": "wrangler types && astro dev",
    "build": "npm run knowledge:build && wrangler types && astro check && astro build",
    "check": "wrangler types && astro check",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "test": "npm run test:unit && npm run test:e2e",
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/e2e/accessibility.spec.ts",
    "knowledge:build": "tsx scripts/build-knowledge-index.ts",
    "knowledge:evaluate": "tsx scripts/evaluate-retrieval.ts",
    "deploy:dry": "wrangler deploy --dry-run --outdir bundled",
    "deploy": "wrangler deploy"
  }
}
```

- [ ] **Step 3: Write the failing smoke tests**

```ts
// tests/unit/smoke.test.ts
import { describe, expect, it } from 'vitest';

describe('test toolchain', () => {
  it('executes TypeScript tests', () => expect(true).toBe(true));
});
```

```ts
// tests/e2e/home.spec.ts
import { expect, test } from '@playwright/test';

test('home identifies Mohamed and the default role', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('AI');
  await expect(page.getByText('Mohamed Hafez', { exact: true })).toBeVisible();
});
```

- [ ] **Step 4: Configure Vitest and Playwright, then run the tests**

`vitest.config.ts` must use `environment: 'jsdom'`, include `tests/unit/**/*.test.ts?(x)`, and load `tests/setup.ts` containing `import '@testing-library/jest-dom/vitest'`. `playwright.config.ts` must launch `npm run dev -- --host 127.0.0.1` and test Chromium at desktop and mobile widths.

Run:

```bash
npm run test:unit
npm run test:e2e
npm run check
```

Expected: the unit test passes; the E2E test fails until the real homepage heading and name are added in Task 5.

- [ ] **Step 5: Commit the toolchain**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json vitest.config.ts playwright.config.ts eslint.config.js .prettierrc.json src tests
git commit -m "build: scaffold Astro portfolio toolchain"
```

### Task 2: Define the evidence, source, role, project, and screening contracts

**Files:**
- Create: `src/types/content.ts`
- Create: `src/data/sources.ts`, `src/data/profile.ts`, `src/data/roles.ts`, `src/data/projects.ts`, `src/data/screening.ts`
- Create: `src/data/evidence/index.ts`
- Test: `tests/unit/content-schema.test.ts`, `tests/unit/content-rules.test.ts`

**Interfaces:**
- Produces `RoleId = 'aiml' | 'software' | 'android' | 'teaching'`.
- Produces `SourceRecord`, `EvidenceRecord`, `ProjectRecord`, `RoleLens`, `ScreeningFact` Zod schemas and inferred types.
- Produces `sources`, `evidence`, `projects`, `roles`, `profile`, and `screeningFacts` validated exports.

- [ ] **Step 1: Write failing contract tests**

```ts
import { describe, expect, it } from 'vitest';
import { evidence, projects, roles, screeningFacts, sources } from '@/data';

describe('portfolio content contracts', () => {
  it('keeps every evidence source resolvable', () => {
    const sourceIds = new Set(sources.map((source) => source.id));
    expect(evidence.flatMap((item) => item.sourceIds).every((id) => sourceIds.has(id))).toBe(true);
  });

  it('defines exactly four recruiter lenses', () => {
    expect(roles.map((role) => role.id)).toEqual(['aiml', 'software', 'android', 'teaching']);
  });

  it('maps every role to one public resume', () => {
    expect(roles.every((role) => role.resumeHref.startsWith('/resumes/'))).toBe(true);
  });

  it('locks Dive ownership to Mohamed', () => {
    const dive = projects.find((project) => project.id === 'dive');
    expect(dive?.ownership).toMatch(/Mohamed.*end.to.end/i);
    expect(dive?.ownership).not.toMatch(/presenter|unrelated collaborator/i);
  });
});
```

- [ ] **Step 2: Implement the Zod contracts**

```ts
// src/types/content.ts
import { z } from 'zod';

export const roleIdSchema = z.enum(['aiml', 'software', 'android', 'teaching']);
export type RoleId = z.infer<typeof roleIdSchema>;

export const sourceRecordSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(['resume', 'official', 'case-study', 'github', 'approved-source']),
  publicHref: z.string().url().or(z.string().startsWith('/')).optional(),
  isPublic: z.boolean(),
});

export const evidenceRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  statement: z.string().min(1),
  topics: z.array(z.string()).min(1),
  aliases: z.array(z.string()).default([]),
  roleWeights: z.record(roleIdSchema, z.number().int().min(0).max(5)),
  sourceIds: z.array(z.string()).min(1),
  public: z.literal(true),
});
```

Define matching schemas for projects, lenses, and screening facts. Validate arrays at module load with `.parse(...)`; do not export unvalidated literals.

- [ ] **Step 3: Populate the locked identity and source registry**

Include the official YorkSpace record, permanent handle, four résumé targets, selected GitHub repositories, and polished case-study targets. `profile.ts` must encode Toronto location, immediate availability, PGWP through June 2029, no sponsorship requirement, Canada/GTA work preferences, intermediate target level, full-time preference, contract openness, and public contact channels taken from the current résumés.

- [ ] **Step 4: Populate role/project/screening records and run tests**

Projects must include at least `asc-pie`, `northstar-rag`, `minds-eye`, `dive`, `dostava`, `bass`, and `mercato`. Use role weights to produce the lens ordering in spec §4.3.

Run:

```bash
npm run test:unit -- tests/unit/content-schema.test.ts tests/unit/content-rules.test.ts
```

Expected: PASS with exactly four lenses and no unresolved source IDs.

- [ ] **Step 5: Commit the content contracts**

```bash
git add src/types src/data tests/unit/content-schema.test.ts tests/unit/content-rules.test.ts
git commit -m "feat: define source-backed portfolio content model"
```

### Task 3: Curate the launch evidence and case-study content

**Files:**
- Create: `src/data/evidence/{research,northstar,minds-eye,dive,dostava,experience,teaching,screening}.ts`
- Create: `src/content.config.ts`
- Create: `src/content/case-studies/{asc-pie,northstar-rag,minds-eye,dive,dostava}.mdx`
- Test: `tests/unit/evidence-claims.test.ts`, `tests/integration/case-study-build.test.ts`

**Interfaces:**
- Consumes the schemas and source registry from Task 2.
- Produces validated case-study frontmatter with `slug`, `title`, `summary`, `roles`, `ownership`, `technologies`, `sourceIds`, `featured`, and `publishedAt`.
- Produces `getEvidenceForProject(projectId)` for pages and the later RAG index.

- [ ] **Step 1: Write failing evidence-policy tests**

```ts
import { expect, it } from 'vitest';
import { evidence } from '@/data/evidence';

it('locks sensitive wording and project status', () => {
  const text = evidence.map((item) => item.statement).join('\n');
  expect(text).toMatch(/submitted and (currently )?under review/i);
  expect(text).toMatch(/CEH training/i);
  expect(text).not.toMatch(/CEH certified|published SPRINT-PP|accepted SPRINT-PP/i);
});

it('keeps historical app availability accurate', () => {
  const app = evidence.find((item) => item.id === 'android-historical-play-store');
  expect(app?.statement).toMatch(/previously published/i);
  expect(app?.statement).toMatch(/no longer available/i);
});
```

- [ ] **Step 2: Curate evidence modules from approved sources**

Each statement must be atomic enough to cite independently. Keep private source filenames out of public labels. Encode Dive ownership directly, Northstar’s independent hands-on framing, Mercato’s football-talent purpose, thesis completion, and exact screening facts.

- [ ] **Step 3: Configure the case-study collection**

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { roleIdSchema } from '@/types/content';

const caseStudies = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: './src/content/case-studies' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    roles: z.array(roleIdSchema).min(1),
    ownership: z.string(),
    technologies: z.array(z.string()),
    sourceIds: z.array(z.string()).min(1),
    featured: z.boolean(),
    publishedAt: z.coerce.date(),
  }),
});

export const collections = { caseStudies };
```

- [ ] **Step 4: Write the five case studies using the common sequence**

Each MDX file must contain Context, Ownership, Constraints, Architecture, Implementation, Outcome, Evidence, and Reflection sections. Use only verified metrics. The ASC-PIE page links YorkSpace and labels SPRINT-PP under review; Northstar lists its real stack; Dive credits Mohamed’s end-to-end implementation without unrelated attribution; Dostava says its Play Store listing is historical.

- [ ] **Step 5: Validate content and commit**

Run:

```bash
npm run test:unit -- tests/unit/evidence-claims.test.ts
npm run check
```

Expected: PASS and all content collection entries validate.

```bash
git add src/content.config.ts src/content src/data/evidence tests
git commit -m "content: curate verified launch evidence"
```

### Task 4: Build the Research Console × Electric Studio design system

**Files:**
- Create: `src/styles/{tokens,reset,global,components,motion}.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/components/layout/{Header,Footer,RecruiterLensNav}.astro`
- Create: `src/components/lenses/RecruiterLensSwitcher.tsx`
- Test: `tests/e2e/responsive-shell.spec.ts`, `tests/e2e/motion.spec.ts`

**Interfaces:**
- Produces `<BaseLayout title description roleId>` and shared skip-link/header/footer landmarks.
- Produces `<RecruiterLensSwitcher activeRole>` that navigates among the four real role URLs.
- Produces CSS tokens named `--color-ink-*`, `--color-evidence-*`, `--color-ai-*`, spacing/type/width/motion tokens.

- [ ] **Step 1: Write failing responsive-shell tests**

```ts
import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 360, height: 800 },
  { width: 820, height: 1180 },
  { width: 1440, height: 900 },
]) {
  test(`shell fits ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await expect(page.getByRole('navigation', { name: 'Recruiter lens' })).toBeVisible();
  });
}
```

- [ ] **Step 2: Implement tokens and global behavior**

Define the approved deep-navy/cyan/magenta hierarchy in `tokens.css`; define readable max widths, adaptive grids, focus rings, 44px primary touch targets, and `color-scheme: dark`. `motion.css` must disable non-essential animation under `prefers-reduced-motion: reduce`.

- [ ] **Step 3: Implement the semantic shared shell**

`BaseLayout.astro` must render a skip link, `<header>`, `<main id="main-content">`, and `<footer>`, plus canonical/Open Graph metadata passed by each route. Header navigation must collapse without losing access on phone/tablet.

- [ ] **Step 4: Implement and test role navigation**

The switcher uses real links for crawlability and works without JavaScript. React enhancement may add a short transition and record a custom event later; it must not trap focus or rewrite content client-side after navigation.

Run:

```bash
npm run test:e2e -- tests/e2e/responsive-shell.spec.ts tests/e2e/motion.spec.ts
```

Expected: PASS at phone, tablet, and desktop widths with no horizontal overflow.

- [ ] **Step 5: Commit the design system**

```bash
git add src/styles src/layouts src/components/layout src/components/lenses tests/e2e
git commit -m "feat: add adaptive research-console design system"
```

### Task 5: Implement the four recruiter-lens routes and homepage hierarchy

**Files:**
- Create: `src/lib/content/resolve-lens.ts`
- Create: `src/layouts/LensLayout.astro`
- Create: `src/components/sections/{Hero,EvidencePanel,FeaturedWork,ExperienceSection,TeachingSection,ContactSection}.astro`
- Modify: `src/pages/index.astro`
- Create: `src/pages/{software,android,teaching}.astro`
- Test: `tests/unit/resolve-lens.test.ts`, `tests/e2e/lenses.spec.ts`

**Interfaces:**
- Produces `resolveLens(roleId: RoleId): ResolvedLens` with summary, résumé, ranked projects, evidence, and metadata.
- Produces `<LensLayout roleId>` used by all four routes.

- [ ] **Step 1: Write the failing resolver test**

```ts
import { expect, it } from 'vitest';
import { resolveLens } from '@/lib/content/resolve-lens';

it('ranks evidence and selects the matching resume for every role', () => {
  expect(resolveLens('aiml').projects[0].id).toBe('asc-pie');
  expect(resolveLens('software').resumeHref).toContain('Software');
  expect(resolveLens('android').projects[0].id).toBe('minds-eye');
  expect(resolveLens('teaching').resumeHref).toContain('Teaching');
});
```

- [ ] **Step 2: Implement deterministic role resolution**

Sort by descending `roleWeights[roleId]`, then by each role’s explicit `featuredProjectIds`, then by title for stability. Return immutable arrays and throw on duplicate/missing project IDs.

- [ ] **Step 3: Implement the approved section hierarchy**

`LensLayout` renders hero/contact/résumé, source-backed proof, ranked work, experience/capabilities, research/teaching evidence, and final contact. The default hero leads with AI/ML while explicitly showing the software, Android, and teaching breadth.

- [ ] **Step 4: Create role routes and validate progressive enhancement**

Each route passes its `RoleId` to the same layout and produces distinct title/description copy. Disable client JavaScript in one Playwright test and verify the lens links, contact link, résumé link, and case-study links still work.

- [ ] **Step 5: Run and commit**

```bash
npm run test:unit -- tests/unit/resolve-lens.test.ts
npm run test:e2e -- tests/e2e/lenses.spec.ts tests/e2e/home.spec.ts
git add src tests
git commit -m "feat: implement four recruiter lenses"
```

Expected: all lens tests pass and the original Task 1 homepage test becomes green.

### Task 6: Build case-study, research, experience, about, and work routes

**Files:**
- Create: `src/layouts/CaseStudyLayout.astro`
- Create: `src/components/case-study/{CaseStudyCard,CaseStudyEvidence,ArchitectureDiagram}.astro`
- Create: `src/pages/work/index.astro`, `src/pages/work/[slug].astro`
- Create: `src/pages/research/asc-pie.astro`, `src/pages/experience.astro`, `src/pages/about.astro`
- Test: `tests/e2e/case-studies.spec.ts`, `tests/e2e/research-accuracy.spec.ts`

**Interfaces:**
- Consumes case-study content and `resolveSources(sourceIds)`.
- Produces pre-rendered detail routes and reusable public source links.

- [ ] **Step 1: Write failing accuracy/navigation tests**

```ts
test('thesis page states official and under-review statuses accurately', async ({ page }) => {
  await page.goto('/research/asc-pie');
  await expect(page.getByText(/completed and awarded/i)).toBeVisible();
  await expect(page.getByText(/submitted and (currently )?under review/i)).toBeVisible();
  await expect(page.getByRole('link', { name: /YorkSpace/i })).toHaveAttribute('href', /yorku\.ca/);
});
```

Add one test per detailed case study for heading, ownership, technology, and evidence link.

- [ ] **Step 2: Implement source resolution and case-study layout**

Every rendered `sourceId` must resolve to a public source. If a content entry references a private-only source, fail the build instead of omitting the source silently.

- [ ] **Step 3: Implement the work index and detail routes**

The work index defaults to curated role relevance and permits client-side filtering only as enhancement. `getStaticPaths()` must generate exactly the published case-study routes from the content collection.

- [ ] **Step 4: Implement research, experience, and about pages**

The research page links the official thesis. The experience page focuses on responsibility and outcomes, not a chronological résumé duplicate. The about page includes location, availability, work authorization, work arrangement, education, and direct contact.

- [ ] **Step 5: Run and commit**

```bash
npm run check
npm run test:e2e -- tests/e2e/case-studies.spec.ts tests/e2e/research-accuracy.spec.ts
git add src tests
git commit -m "feat: publish evidence-led case studies"
```

### Task 7: Add approved assets, four résumé downloads, and direct contact actions

**Files:**
- Create: `public/images/projects/**`
- Create: `public/resumes/Mohamed-Hafez-{AI-ML-Engineer,Software-Engineer,Android-Developer,TA-Instructor}.pdf`
- Create: `src/components/layout/ResumeLink.astro`, `src/components/layout/ContactLinks.astro`
- Create: `scripts/verify-public-assets.ts`
- Test: `tests/unit/public-assets.test.ts`, `tests/e2e/contact-and-resume.spec.ts`

**Interfaces:**
- Produces stable public résumé paths referenced by `roles.ts`.
- Produces `verify-public-assets.ts` that rejects missing, oversized, or prohibited files.

- [ ] **Step 1: Write failing asset-manifest tests**

The test must assert that all four résumé paths exist, are PDFs, are below 5 MiB each, and that public files do not match private-source or credential patterns (`master`, `comprehensive`, `.jks`, `.keystore`, `credential`, `service-account`).

- [ ] **Step 2: Copy only approved assets and optimize images**

Use the current role-specific resumes as-is unless a source fact must be corrected first. Generate AVIF and WebP derivatives for screenshots, preserve a high-quality source derivative, strip unnecessary metadata, and write descriptive alt text focused on the depicted feature.

- [ ] **Step 3: Implement stable download/contact components**

Résumé links use the `download` attribute and role-specific filenames. Contact links include public email, phone, LinkedIn, and GitHub; do not add a form or scheduler. Add analytics data attributes but do not emit events until the analytics plan.

- [ ] **Step 4: Verify on phone/tablet/desktop**

```bash
npm run test:unit -- tests/unit/public-assets.test.ts
npm run test:e2e -- tests/e2e/contact-and-resume.spec.ts
```

Expected: each lens downloads its matching file and every contact link has a valid scheme/URL.

- [ ] **Step 5: Commit public assets explicitly**

```bash
git add public/images/projects public/resumes src/components/layout scripts/verify-public-assets.ts tests
git commit -m "content: add approved portfolio assets and resumes"
```

### Task 8: Complete accessibility, SEO, structured data, and performance gates

**Files:**
- Create: `src/components/layout/Seo.astro`
- Create: `src/lib/seo/structured-data.ts`
- Create: `src/pages/robots.txt.ts`, `src/pages/privacy.astro`
- Create: `public/_headers`, `public/_redirects`
- Create: `tests/e2e/accessibility.spec.ts`, `tests/e2e/seo.spec.ts`, `lighthouserc.json`
- Modify: all routes/components failing the audits

**Interfaces:**
- Produces canonical metadata, sitemap integration, Open Graph metadata, and valid JSON-LD.
- Produces repeatable accessibility and Lighthouse commands used by CI.

- [ ] **Step 1: Write the accessibility and SEO gates**

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const path of ['/', '/software', '/android', '/teaching', '/research/asc-pie', '/work/northstar-rag']) {
  test(`${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))).toEqual([]);
  });
}
```

SEO tests must assert one H1, canonical URL, title, description, Open Graph fields, and parseable JSON-LD per public route.

- [ ] **Step 2: Implement SEO and privacy pages**

Generate `Person` data from the profile record, `CreativeWork` data for case studies, and `ScholarlyArticle` data only where publication status is represented accurately. The privacy page must describe Cloudflare Web Analytics, custom event fields, retention, no raw chat storage, and the opt-out control implemented in the analytics plan.

- [ ] **Step 3: Add headers and crawler files**

`_headers` sets CSP, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive `Permissions-Policy`, and framing protection. Allow the exact Cloudflare Web Analytics and Turnstile origins required by production; keep all other script/connect sources self-only.

- [ ] **Step 4: Run the complete foundation quality gate**

```bash
npm run format:check
npm run lint
npm run check
npm run test:unit
npm run test:e2e
npm run build
npx lhci autorun
```

Expected: all commands pass; representative routes meet the spec’s Lighthouse budgets.

- [ ] **Step 5: Commit the production content foundation**

```bash
git add src public tests lighthouserc.json
git commit -m "feat: complete accessible recruiter portfolio"
```
