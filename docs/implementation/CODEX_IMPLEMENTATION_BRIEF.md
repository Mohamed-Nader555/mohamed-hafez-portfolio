# Codex Implementation Brief

## Mission

Build and launch Mohamed Hafez’s official recruiter portfolio as one adaptive, evidence-led product with four recruiter lenses and a live, strictly grounded AI assistant. The site must help a recruiter verify fit quickly and contact Mohamed directly; visual novelty is subordinate to trustworthy evidence and recruiter action.

Read these files completely before changing code:

1. `docs/superpowers/specs/2026-08-14-recruiter-portfolio-design.md`
2. `docs/superpowers/plans/2026-08-14-portfolio-foundation-and-content.md`
3. `docs/superpowers/plans/2026-08-14-grounded-ai-assistant.md`
4. `docs/superpowers/plans/2026-08-14-analytics-deployment-and-launch.md`

Execute the plans in that order. Use test-driven development for each behavior and make the scoped commit at the end of each plan task. Do not begin deployment until content, AI, analytics, accessibility, and security gates all pass locally.

## Product shape

- Default `/`: AI/ML Engineer lens.
- `/software`: Software Engineer lens.
- `/android`: Android Developer lens.
- `/teaching`: TA / Instructor lens.
- These routes share one data model, design system, shell, and project corpus.
- Each route changes the summary, evidence priority, matching résumé, metadata, and analytics lens.
- Detailed routes cover ASC-PIE/SPRINT-PP, Northstar RAG, Mind’s Eye, Dive, and Dostava.
- Supporting evidence covers BASS, Mercato, other approved Android work, and teaching.
- Direct contact includes public email, phone, LinkedIn, and GitHub. Do not add a form or scheduler.
- Do not add a headshot or testimonials in the launch version.

## Non-negotiable content rules

- Public name: Mohamed Hafez.
- M.A. at York University: completed and officially awarded in 2026.
- Thesis: “ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition,” linked to YorkSpace.
- SPRINT-PP: submitted and under review; not published or accepted.
- Northstar: independently built end-to-end RAG engineering project; do not present it as an assessment.
- Dive: client project implemented and owned end to end by Mohamed; do not attribute it to a presenter or unrelated collaborator.
- Mercato: football-talent platform.
- CEH: training only, not certification.
- Historical Android apps were previously on Google Play and are no longer available; do not render live-store CTAs.
- Use only verified claims with source IDs. User confirmations override older source wording.

## Technology decisions

- Node.js 22 in CI; local Node 24 is acceptable after dependencies and Wrangler pass.
- npm and committed `package-lock.json`.
- Astro + strict TypeScript + Cloudflare adapter.
- React only for recruiter-lens enhancements, assistant UI, analytics opt-out, and genuinely stateful interactions.
- Astro content collections/MDX + Zod for case studies and source validation.
- Bespoke CSS layers/custom properties; no Tailwind and no heavy animation library by default.
- MiniSearch lexical retrieval over a build-generated curated knowledge index.
- Workers AI generation with `@cf/meta/llama-3.1-8b-instruct-fast` as launch default, verified against the free model catalog before production.
- Cloudflare Turnstile + Workers rate-limit bindings before each model call.
- Cloudflare D1 for constrained custom event analytics.
- Cloudflare Web Analytics for page traffic and Core Web Vitals.
- Vitest, Testing Library, Playwright, axe-core, Lighthouse CI, ESLint, Prettier, CodeQL.

## Runtime architecture

1. Pre-render all public content pages.
2. Serve matching static assets without invoking the Worker.
3. `/api/chat` validates input, Turnstile, and limits.
4. Retrieval combines the current question, limited recent session context, aliases, and active lens.
5. Unsupported retrieval returns a deterministic refusal without calling AI.
6. Supported retrieval sends only approved chunks to Workers AI.
7. Validate the structured model response and citation IDs before showing it.
8. On quota/capacity/model/schema failure, return a labeled extractive evidence fallback.
9. Keep chat history in browser session storage only.
10. Send only normalized chat outcome metadata to analytics—never question or answer text.

## Repository boundary

Commit:

- application source and tests;
- structured public evidence and case-study content;
- four role-specific public résumé PDFs;
- approved optimized screenshots;
- migrations, documentation, and non-secret Cloudflare configuration;
- `.dev.vars.example`/`.env.example` containing fake values only.

Never commit:

- master/comprehensive CV or raw supplementary source documents;
- `.env`, `.dev.vars`, API tokens, Turnstile secret, Cloudflare/GitHub credentials;
- Android keystores/signing files or credential files copied from older repos;
- raw questions, answers, transcripts, analytics exports, local D1 files;
- generated build/index output, test reports, or `.wrangler` state.

The public GitHub history must remain clean from the first commit. Run the repository secret-policy check before every push.

## Implementation sequence

### Phase 1 — Foundation and verified content

1. Scaffold Astro/Cloudflare/React and the test/quality toolchain.
2. Define Zod contracts for roles, sources, evidence, projects, and screening facts.
3. Curate approved facts into atomic evidence records with public citation targets.
4. Write five launch case studies using Context → Ownership → Constraints → Architecture → Implementation → Outcome → Evidence → Reflection.
5. Build the deep-navy/cyan/magenta adaptive design system.
6. Implement shared role resolution and four role routes.
7. Add work/research/experience/about/privacy pages.
8. Add the four résumés, screenshots, contact actions, metadata, structured data, accessibility, and performance gates.

Exit condition: all content routes build; claim-policy, role, route, accessibility, and responsive tests pass; public assets contain no private material.

### Phase 2 — Grounded AI

1. Generate the MiniSearch index from validated public evidence.
2. Build a 36+ question retrieval fixture including paraphrases, follow-ups, and unsupported questions.
3. Implement strict retrieval thresholds and source carry-forward for follow-ups.
4. Implement the grounded prompt, response schema, and citation validator.
5. Implement Workers AI provider and deterministic evidence fallback.
6. Protect `/api/chat` with Turnstile, rate limits, length/history limits, timeouts, and safe errors.
7. Build the adaptive accessible assistant UI and session-only history.
8. Pass retrieval, adversarial, refusal, outage, device, and accessibility gates.

Exit condition: unsupported precision is 100% in the curated evaluation, supported source recall is at least 90%, screening questions all retrieve correctly, and quota/model failure still returns useful verified facts.

### Phase 3 — Analytics and launch

1. Create the D1 migration, repository, 30/180-day retention, and summary query.
2. Implement strict `/api/events` validation and HMAC-hashed session IDs.
3. Add explicit event calls for lenses, case studies, résumé/contact/profile actions, and normalized chat outcomes.
4. Honor Global Privacy Control, Do Not Track, and the local opt-out.
5. Add CI, CodeQL, secret-policy checks, Worker bundle dry run, and Lighthouse gates.
6. Guide Mohamed through Cloudflare account creation, 2FA, Wrangler authorization, D1, Turnstile, GitHub connection, and Web Analytics.
7. Deploy to `workers.dev` with no paid plan enabled.
8. Verify dashboards, one supported/refused chat turn, each custom event type, and static-site behavior during simulated dynamic failures.

Exit condition: the live URL passes the automated/manual launch runbook, free-usage dashboards are visible, the site works across the full device matrix, and no secret/private source appears in the repository or deployment.

## Adaptive design acceptance

Treat desktop, laptop, tablet, and smartphone as equal-quality experiences:

- Desktop/laptop uses richer multi-column evidence and a spacious assistant.
- Tablet has intentional portrait/landscape composition and touch controls.
- Smartphone stacks content and presents a keyboard-safe assistant sheet without removing evidence or actions.
- Large screens constrain line length and content width.
- Test widths: 320, 360, 390, 430, 768, 820, 1024, 1280, 1440, 1920.
- Test 200% zoom, keyboard-only, screen reader, reduced motion, touch, and tablet orientation changes.

## AI acceptance scenarios

At minimum, automated and manual tests must cover:

- “What technologies did Mohamed use in Dostava?” → answer cites the Android résumé/Dostava case study and includes Java, MVVM, Retrofit, Room, Firebase, and Maps.
- “How was Northstar built?” → answer cites its repository/case study and accurately describes ingestion, chunking, embeddings, Chroma, grounded generation, citations/refusals, evaluation, tests, and Docker.
- “Where is Mohamed located and when can he start?” → Toronto, immediate availability, PGWP through June 2029, no sponsorship, approved work-arrangement/relocation statement.
- A short follow-up such as “What else did he integrate?” retains the prior project context.
- Unsupported personal, confidential, compensation, medical, political, or invented-experience questions refuse without guessing.
- Workers AI quota/capacity failure produces a labeled evidence summary instead of a broken widget.
- No raw question/answer appears in D1, logs, URL, local storage, or analytics request.

## Install/setup requirements for Mohamed

Already available: Node.js, npm, Git, GitHub CLI, and authenticated GitHub access.

Required during implementation:

- Cloudflare free account with 2FA.
- Wrangler installed as a project dependency; no global Wrangler install is required.
- One browser set for cross-browser QA; Playwright installs its own test browsers.
- Cloudflare Turnstile widget and D1 database created through the runbook.
- No paid API key is required for launch.
- A custom domain is not required and can be attached later.

## Release discipline

- One plan task per review gate and scoped commit.
- Do not silently broaden content, dependencies, data collection, or hosting spend.
- Preserve a working static site at every phase.
- Fix factual-source failures before visual polish.
- Fix retrieval/refusal failures before changing models.
- Measure actual free-tier usage before proposing payment.
- Do not mark launch complete until verification output has been read and recorded.
