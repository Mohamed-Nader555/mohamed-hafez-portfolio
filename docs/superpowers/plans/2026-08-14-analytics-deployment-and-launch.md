# Analytics, Deployment, and Launch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add privacy-safe recruiter interaction analytics, configure the Cloudflare zero-budget runtime, establish CI/security controls, deploy to a free `workers.dev` hostname, and leave Mohamed with a practical monitoring and upgrade runbook.

**Architecture:** Cloudflare Web Analytics provides aggregate traffic and Core Web Vitals. A first-party event endpoint writes a constrained event schema and daily aggregates to D1 without raw chat text, IP addresses, or fingerprints. Static portfolio assets bypass Worker execution; only chat and custom events invoke the Worker.

**Tech Stack:** Cloudflare Web Analytics, D1, Workers Static Assets, Workers Builds, Wrangler, Turnstile, Workers AI dashboard, TypeScript, Astro Cloudflare adapter, GitHub Actions, CodeQL, Playwright, Lighthouse CI.

**Spec:** `docs/superpowers/specs/2026-08-14-recruiter-portfolio-design.md`

## Global Constraints

- Zero-budget launch with no billing method or paid Cloudflare plan enabled.
- Public launch uses a Cloudflare `workers.dev` hostname; custom domain is deferred.
- Cloudflare account setup begins from scratch and must include two-factor authentication.
- Cloudflare Web Analytics handles visits/performance only; D1 handles the approved custom event taxonomy.
- No raw questions, answers, transcripts, IP addresses, full user agents, fingerprints, or visitor names/contact details in analytics.
- Custom analytics respects Global Privacy Control, `Do Not Track`, and the site’s local opt-out.
- Raw anonymous events expire after 30 days; daily aggregate rows expire after 180 days.
- Static assets remain available if dynamic Worker or Workers AI free quotas are exhausted.
- Secrets exist only in Cloudflare/GitHub secret stores or local ignored files.
- Production deploys only from reviewed `main` after all automated gates pass.

---

## Planned file map

```text
migrations/0001_analytics.sql
scripts/{analytics-summary.sql,verify-no-secrets.ts}
src/lib/analytics/{types,event-schema,d1-repository,hash-session,record-event,privacy}.ts
src/components/analytics/{AnalyticsProvider,AnalyticsOptOut}.tsx
src/pages/api/events.ts
src/worker.ts
.github/workflows/{ci,codeql}.yml
wrangler.jsonc
.dev.vars.example
public/_headers
docs/implementation/{CLOUDFLARE_SETUP,LAUNCH_RUNBOOK,MONITORING}.md
tests/{unit,integration,e2e}/
vitest.worker.config.ts
```

### Task 1: Create the privacy-safe D1 schema and repository layer

**Files:**
- Create: `migrations/0001_analytics.sql`
- Create: `src/lib/analytics/types.ts`, `src/lib/analytics/d1-repository.ts`, `src/lib/analytics/hash-session.ts`
- Create: `vitest.worker.config.ts`, `tests/setup-workers.ts`
- Test: `tests/unit/analytics-schema.test.ts`, `tests/unit/hash-session.test.ts`, `tests/integration/d1-repository.worker.test.ts`

**Interfaces:**
- Produces `AnalyticsEventName`, `AnalyticsEvent`, `AnalyticsDimensions`, and `AnalyticsRepository`.
- Produces `hashSessionId(sessionId, secret): Promise<string>` using HMAC SHA-256.
- Produces repository methods `record(event)`, `prune(now)`, and `summary(days)`.

- [ ] **Step 1: Write the migration**

```sql
CREATE TABLE analytics_events (
  id TEXT PRIMARY KEY,
  occurred_at TEXT NOT NULL,
  session_hash TEXT NOT NULL,
  event_name TEXT NOT NULL,
  route TEXT NOT NULL,
  lens TEXT,
  target_id TEXT,
  question_category TEXT,
  outcome TEXT,
  source_ids TEXT,
  latency_bucket TEXT,
  model_id TEXT
);

CREATE INDEX idx_analytics_events_time ON analytics_events(occurred_at);
CREATE INDEX idx_analytics_events_name_time ON analytics_events(event_name, occurred_at);

CREATE TABLE analytics_daily (
  day TEXT NOT NULL,
  event_name TEXT NOT NULL,
  lens TEXT NOT NULL DEFAULT '',
  target_id TEXT NOT NULL DEFAULT '',
  outcome TEXT NOT NULL DEFAULT '',
  event_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY(day, event_name, lens, target_id, outcome)
);

CREATE TABLE analytics_maintenance (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

- [ ] **Step 2: Write failing privacy and repository tests**

Assert that the public event type has no keys named `question`, `answer`, `content`, `ip`, `userAgent`, `email`, `phone`, or `name`; the HMAC output is deterministic for one secret and changes for another; recording an event inserts one raw row and increments exactly one daily aggregate row.

- [ ] **Step 3: Implement the repository contract**

```ts
export interface AnalyticsRepository {
  record(event: StoredAnalyticsEvent): Promise<void>;
  prune(now: Date): Promise<{ rawDeleted: number; aggregateDeleted: number }>;
  summary(days: number): Promise<AnalyticsSummaryRow[]>;
}
```

Use a D1 batch for raw insert plus daily upsert. Serialize `sourceIds` as a validated JSON array with at most eight source IDs. `prune` deletes raw rows older than 30 days and aggregate rows older than 180 days.

- [ ] **Step 4: Configure Cloudflare’s fully local Workers test pool and run the tests**

```bash
npm install -D @cloudflare/vitest-pool-workers
npm run test:unit -- tests/unit/analytics-schema.test.ts tests/unit/hash-session.test.ts
npm run test:workers -- tests/integration/d1-repository.worker.test.ts
```

Add `test:workers: "vitest run --config vitest.worker.config.ts"` to `package.json`. Configure `cloudflareTest()` with a local `ANALYTICS_DB` D1 binding, load `readD1Migrations('./migrations')` into a test-only binding, and call `applyD1Migrations` in `tests/setup-workers.ts`. This uses Miniflare/workerd locally and does not require a Cloudflare account or remote database.

Expected: migration applies cleanly and all tests pass against isolated per-test-file D1 state.

- [ ] **Step 5: Commit**

```bash
git add migrations src/lib/analytics vitest.worker.config.ts tests package.json package-lock.json
git commit -m "feat: add privacy-safe analytics store"
```

### Task 2: Implement the constrained `/api/events` endpoint

**Files:**
- Create: `src/lib/analytics/event-schema.ts`, `src/lib/analytics/record-event.ts`
- Create: `src/pages/api/events.ts`
- Modify: `src/types/cloudflare-env.d.ts`, `wrangler.jsonc`, `.dev.vars.example`
- Test: `tests/unit/event-schema.test.ts`, `tests/integration/events-api.worker.test.ts`

**Interfaces:**
- Consumes D1 binding `ANALYTICS_DB` and secret `ANALYTICS_HASH_SECRET`.
- Produces `POST /api/events` returning `204 No Content` for accepted events.

- [ ] **Step 1: Define the exact event schema**

```ts
export const eventNameSchema = z.enum([
  'lens_selected', 'case_study_opened', 'resume_downloaded',
  'contact_clicked', 'linkedin_clicked', 'github_clicked',
  'chat_opened', 'chat_submitted', 'chat_answered',
  'chat_refused', 'chat_fallback', 'chat_error',
]);

export const analyticsEventSchema = z.object({
  eventName: eventNameSchema,
  sessionId: z.string().uuid(),
  route: z.string().startsWith('/').max(120),
  lens: roleIdSchema.optional(),
  targetId: z.string().regex(/^[a-z0-9-]{1,80}$/).optional(),
  questionCategory: z.enum(['project', 'experience', 'research', 'teaching', 'screening', 'skills', 'unknown']).optional(),
  outcome: z.enum(['answered', 'refused', 'fallback', 'error']).optional(),
  sourceIds: z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(8).optional(),
  latencyBucket: z.enum(['lt-500ms', '500ms-2s', '2s-5s', 'gt-5s']).optional(),
  modelId: z.string().max(100).optional(),
}).strict();
```

- [ ] **Step 2: Write failing endpoint tests**

Cover accepted event (204), wrong method (405), wrong content type (415), malformed/extra field (400), oversized body (413), invalid event/dimension combinations (400), and repository outage (503). Assert the response never echoes the payload.

- [ ] **Step 3: Implement event-dimension policies**

Only chat outcome events may include question category, source IDs, latency, or model ID. Only project/resume/contact/profile events may include `targetId`. Normalize route by discarding query strings and fragments before validation.

- [ ] **Step 4: Implement the endpoint**

Reject bodies above 4 KiB before parsing. Hash the session ID with `ANALYTICS_HASH_SECRET`, generate a server-side UUID and timestamp, call `record`, and return 204 with `Cache-Control: no-store`. Do not log the body on validation or storage errors.

- [ ] **Step 5: Run and commit**

```bash
npm run test:unit -- tests/unit/event-schema.test.ts
npm run test:workers -- tests/integration/events-api.worker.test.ts
git add src/lib/analytics src/pages/api/events.ts src/types wrangler.jsonc .dev.vars.example tests
git commit -m "feat: expose constrained analytics events"
```

### Task 3: Add client tracking, opt-out, and navigation-safe delivery

**Files:**
- Create: `src/components/analytics/AnalyticsProvider.tsx`, `src/components/analytics/AnalyticsOptOut.tsx`
- Create: `src/lib/analytics/privacy.ts`, `src/lib/analytics/client.ts`
- Modify: lens, case-study, résumé, contact, profile, and assistant components
- Modify: `src/pages/privacy.astro`
- Test: `tests/unit/analytics-client.test.ts`, `tests/e2e/analytics-privacy.spec.ts`, `tests/e2e/analytics-events.spec.ts`

**Interfaces:**
- Produces `analyticsAllowed(): boolean`, `setAnalyticsOptOut(value: boolean): void`, and `track(event): Promise<void>`.
- Uses the session UUID already created for chat or creates the same session-only key when chat has not been opened.

- [ ] **Step 1: Write failing privacy tests**

Test that Global Privacy Control, `navigator.doNotTrack === '1'`, or local opt-out prevents all `/api/events` requests. Test that no analytics cookie/local identifier is created and the session UUID is stored only in `sessionStorage`.

- [ ] **Step 2: Implement the privacy gate**

Use local storage only for the Boolean opt-out key `mh_portfolio_analytics_opt_out_v1`; do not store an identifier there. The privacy page toggle changes this value and immediately updates its accessible status text.

- [ ] **Step 3: Implement non-blocking delivery**

For ordinary events, use `fetch('/api/events', { method: 'POST', keepalive: true, ... })`. For navigation-triggering contact/profile/resume clicks, use `navigator.sendBeacon` when available and never delay or cancel the user’s navigation if analytics fails.

- [ ] **Step 4: Wire the approved taxonomy**

Use explicit component event calls rather than a global click collector. Chat analytics receives only normalized `questionCategory`, outcome, source IDs, latency bucket, and model ID from the server response—never the user’s question or generated answer.

- [ ] **Step 5: Run and commit**

```bash
npm run test:unit -- tests/unit/analytics-client.test.ts
npm run test:e2e -- tests/e2e/analytics-privacy.spec.ts tests/e2e/analytics-events.spec.ts
git add src/components src/lib/analytics src/pages/privacy.astro tests
git commit -m "feat: track recruiter actions with privacy controls"
```

### Task 4: Add retention maintenance and analytics summaries

**Files:**
- Create: `src/worker.ts`
- Create: `scripts/analytics-summary.sql`
- Modify: `astro.config.mjs`, `wrangler.jsonc`, `package.json`
- Test: `tests/integration/analytics-retention.worker.test.ts`

**Interfaces:**
- Custom Worker delegates HTTP traffic to Astro and handles one daily scheduled event.
- Produces `npm run analytics:summary` for a human-readable remote D1 query.

- [ ] **Step 1: Write the failing retention test**

Seed raw rows at 31 and 29 days old plus aggregate rows at 181 and 179 days old. Call `repository.prune(now)` and assert only the expired rows are deleted.

- [ ] **Step 2: Implement the custom Cloudflare entry point**

```ts
import { astro, FetchState } from 'astro/fetch';
import { cf } from '@astrojs/cloudflare/fetch';
import { createAnalyticsRepository } from '@/lib/analytics/d1-repository';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const state = new FetchState(request);
    const asset = await cf(state, env, ctx);
    if (asset) return asset;
    return astro(state);
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(createAnalyticsRepository(env.ANALYTICS_DB).prune(new Date()));
  },
} satisfies ExportedHandler<Env>;
```

Configure one UTC daily cron trigger in `wrangler.jsonc`. Verify this entry point against the installed Astro Cloudflare adapter before commit.

- [ ] **Step 3: Add the summary query**

`scripts/analytics-summary.sql` returns daily counts grouped by lens/event/outcome for the last 30 days plus total contact, résumé, case-study, and chat outcomes. Add:

```json
{
  "scripts": {
    "analytics:summary": "wrangler d1 execute mh-portfolio-analytics --remote --file scripts/analytics-summary.sql"
  }
}
```

- [ ] **Step 4: Run and commit**

```bash
npm run test:workers -- tests/integration/analytics-retention.worker.test.ts
npm run build
npm run deploy:dry
git add src/worker.ts scripts/analytics-summary.sql astro.config.mjs wrangler.jsonc package.json package-lock.json tests
git commit -m "feat: automate analytics retention and summaries"
```

### Task 5: Establish GitHub CI, dependency, and secret safeguards

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/codeql.yml`
- Create: `scripts/verify-no-secrets.ts`
- Modify: `package.json`, `.gitignore`
- Test: `tests/unit/repository-policy.test.ts`

**Interfaces:**
- CI gates pull requests and `main` on format, lint, typecheck, content/index validation, unit/integration tests, production build, E2E, accessibility, and Worker dry-run size.

- [ ] **Step 1: Implement repository policy checks**

The script scans tracked paths and staged content for prohibited filename patterns and high-risk key markers without printing matched secret values. It fails on `.env`, `.dev.vars`, keystores, private source directories, raw analytics exports, or PEM/private-key headers.

- [ ] **Step 2: Create the CI workflow**

Use `actions/checkout`, `actions/setup-node` with Node 22 and npm cache, `npm ci`, Playwright Chromium installation, then the exact commands:

```bash
npm run format:check
npm run lint
npm run check
npm run knowledge:build
npm run knowledge:evaluate
npm run test:unit
npm run build
npm run test:e2e
npm run deploy:dry
npx lhci autorun
```

Upload Playwright/Lighthouse reports only on failure and retain them for seven days.

- [ ] **Step 3: Create CodeQL and dependency safeguards**

Run GitHub CodeQL for JavaScript/TypeScript on pull requests, pushes to `main`, and weekly. Enable Dependabot and GitHub secret scanning/push protection through repository settings; document the settings in the launch runbook.

- [ ] **Step 4: Verify locally and commit**

```bash
npm run test:unit -- tests/unit/repository-policy.test.ts
npm run lint
npm run check
git add .github scripts/verify-no-secrets.ts package.json package-lock.json .gitignore tests
git commit -m "ci: enforce quality and secret safeguards"
```

### Task 6: Write and execute the Cloudflare account/setup runbook

**Files:**
- Create: `docs/implementation/CLOUDFLARE_SETUP.md`
- Modify: `wrangler.jsonc`, `.dev.vars.example`, `README.md`
- Test: Cloudflare resource commands and preview deploy

**Interfaces:**
- Produces production resources named `mh-portfolio-analytics` and the Worker name `mohamed-hafez-portfolio`.
- Produces bindings `AI`, `ANALYTICS_DB`, `CHAT_SESSION_RATE_LIMITER`, and `CHAT_GLOBAL_RATE_LIMITER`.

- [ ] **Step 1: Create and secure the Cloudflare account**

Mohamed creates the free account, verifies the email address, enables an authenticator-based second factor, and confirms the Workers Free plan is active with no billing method required. Codex must stop at any CAPTCHA, password, or final account-creation confirmation that requires user control.

- [ ] **Step 2: Authenticate Wrangler and create D1**

```bash
npx wrangler login
npx wrangler d1 create mh-portfolio-analytics
npx wrangler d1 migrations apply mh-portfolio-analytics --remote
```

Insert the emitted D1 database ID into `wrangler.jsonc`; the ID is not a secret. Generate fresh binding types with `npx wrangler types`.

- [ ] **Step 3: Create Turnstile and production secrets**

Create a managed Turnstile widget restricted to the assigned production hostname. Store secrets using:

```bash
npx wrangler secret put TURNSTILE_SECRET_KEY
npx wrangler secret put ANALYTICS_HASH_SECRET
npx wrangler secret put RATE_LIMIT_HASH_SECRET
```

Set the public Turnstile sitekey and default AI model as non-secret environment variables. Never paste secret values into tracked files or command history documentation.

- [ ] **Step 4: Connect GitHub through Workers Builds**

Connect `Mohamed-Nader555/mohamed-hafez-portfolio`, select `main`, use `npm ci && npm run build` as the build command and `npx wrangler deploy` as the deploy command, and keep preview deployments enabled for pull requests. Cloudflare’s current free allowance of 3,000 build minutes/month is sufficient for this cadence.

- [ ] **Step 5: Enable Web Analytics and perform a preview deploy**

Enable Web Analytics for the assigned hostname, add its required CSP origin, deploy a preview, and verify page metrics appear without custom-event expectations. Confirm D1 custom events independently.

- [ ] **Step 6: Commit non-secret resource configuration**

```bash
git add docs/implementation/CLOUDFLARE_SETUP.md wrangler.jsonc .dev.vars.example README.md
git commit -m "docs: add Cloudflare zero-budget setup"
```

### Task 7: Create monitoring, cost, failure, and manual-upgrade procedures

**Files:**
- Create: `docs/implementation/MONITORING.md`
- Create: `tests/e2e/production-fallback.spec.ts`
- Modify: `docs/implementation/AI_OPERATIONS.md`

**Interfaces:**
- Produces a repeatable weekly monitoring checklist and explicit decision rule for remaining free or manually upgrading.

- [ ] **Step 1: Document the dashboards and baselines**

Record where to inspect Worker requests/errors/CPU, Workers AI neuron usage/capacity errors, D1 reads/writes/storage, Turnstile outcomes, Web Analytics/Core Web Vitals, and GitHub build status. Capture a launch-day baseline without exporting visitor-level data into Git.

- [ ] **Step 2: Document zero-budget failure behavior**

The portfolio and static pages stay live if dynamic requests fail. Chat switches to verified retrieval fallback on AI quota/capacity errors. Analytics failures never block navigation. D1 limit errors are swallowed client-side and surfaced only through aggregate operational logs.

- [ ] **Step 3: Define the manual upgrade decision**

Stay free while quota failures are rare and recruiter use remains served. Consider Workers Paid only after observed repeated AI quota failures or sustained legitimate traffic, and only after Mohamed manually approves billing. Record the currently published plan minimum and per-neuron overage from the Cloudflare pricing page at the time of that decision; never auto-upgrade.

- [ ] **Step 4: Test production-like fallbacks**

The E2E test stubs Worker AI quota failure, D1 failure, and analytics network failure. It asserts readable chat fallback, working contact/résumé navigation, and no uncaught client error.

- [ ] **Step 5: Commit**

```bash
npm run test:e2e -- tests/e2e/production-fallback.spec.ts
git add docs/implementation tests/e2e/production-fallback.spec.ts
git commit -m "docs: define portfolio operations and upgrade gates"
```

### Task 8: Execute the launch verification and publish to `workers.dev`

**Files:**
- Create: `docs/implementation/LAUNCH_RUNBOOK.md`
- Modify: any file required by verified launch failures
- Test: complete automated and manual launch matrix

**Interfaces:**
- Produces the live Cloudflare URL, verified monitoring access, and a dated launch record in the runbook.

- [ ] **Step 1: Freeze and audit public content**

Verify every prominent claim against its source ID. Search the full build output for prohibited attribution, private filenames, raw source paths, secret patterns, inaccurate certification/publication wording, and current Play Store claims.

- [ ] **Step 2: Run the complete automated gate**

```bash
npm ci
npm run format:check
npm run lint
npm run check
npm run knowledge:build
npm run knowledge:evaluate
npm run test:unit
npm run build
npm run test:e2e
npm run deploy:dry
npx lhci autorun
```

Expected: every command exits zero and the compressed Worker bundle remains below the 3 MB free-plan limit.

- [ ] **Step 3: Run manual adaptive/accessibility QA**

Test 320, 360, 390, 430, 768, 820, 1024, 1280, 1440, and 1920 widths; tablet portrait/landscape; 200% zoom; keyboard-only; screen reader; reduced motion; slow network; software keyboard; resume download; `tel:`/`mailto:`; external links; chat answer/refusal/fallback; analytics opt-out; and no-JavaScript content navigation.

- [ ] **Step 4: Deploy and verify production resources**

```bash
npm run deploy
npx wrangler d1 execute mh-portfolio-analytics --remote --file scripts/analytics-summary.sql
```

Open the production `workers.dev` URL, perform one controlled event of every type, ask one supported and one unsupported AI question, verify D1/Web Analytics/Workers AI dashboards, and delete any deliberate test rows if they would distort launch metrics.

- [ ] **Step 5: Record and commit the launch**

Write the production URL, deployment date, commit SHA, model ID, checked dashboards, Lighthouse results, and any approved exceptions in `LAUNCH_RUNBOOK.md`.

```bash
git add docs/implementation/LAUNCH_RUNBOOK.md
git commit -m "docs: record production portfolio launch"
git push origin main
```
