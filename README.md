# Mohamed Hafez — Portfolio

My official portfolio, built to present my work across AI/ML engineering, software engineering, Android development, and technical teaching without splitting those paths into separate websites.

The experience is designed as a role-aware research console: visitors can change the professional lens instantly, explore evidence-rich case studies, download a tailored resume, and ask a grounded AI assistant questions about my public work and background.

## What the site includes

- Instant role switching for AI/ML, software, Android, and teaching perspectives
- Shareable role URLs such as `/?role=android`, with no page reload required
- A persistent role switcher that remains available while scrolling
- Responsive layouts for desktop, tablet, and mobile
- Detailed project case studies with context, decisions, implementation, outcomes, and media
- Experience, skills, research, education, teaching, and professional background
- Four role-specific downloadable resumes
- A strict, RAG-style AI assistant grounded only in curated public portfolio evidence
- Server-side AI calls, Turnstile verification, per-session/global rate limits, and an extractive fallback
- SEO metadata, sitemap, robots rules, structured data, security headers, and a privacy page
- Reduced-motion support and automated accessibility coverage

## Featured work

- **NorthStar RAG** — grounded retrieval and answer-generation system
- **ASC-PIE** — awarded academic research published through YorkSpace
- **Mind's Eye** — AI-assisted accessibility project
- **DIVE** — football-talent platform delivered end to end as a client project
- **Dostava** — production Android client application

Additional projects and role-specific evidence are available throughout the site.

## Architecture

The portfolio is intentionally content-driven and mostly server-rendered.

- **Astro 7** provides routing, layouts, content rendering, and the Cloudflare deployment target.
- **React 19** powers the interactive AI assistant.
- **MDX** stores long-form case studies.
- **TypeScript and Zod** provide typed content and API validation.
- **MiniSearch** builds a curated lexical retrieval index from public evidence at build time.
- **Cloudflare Workers AI** generates grounded answers in production.
- **Cloudflare Turnstile and rate-limit bindings** protect the chat endpoint.
- **Vitest, Playwright, axe, and Lighthouse CI** cover logic, browser behavior, accessibility, and performance.

The role switcher changes emphasis and ordering rather than hiding the rest of my background. Project pages use stable URLs, while the home-page lens is encoded in the query string so a specific professional view can be shared directly.

## AI assistant behavior

The assistant is not a fixed FAQ. It retrieves relevant facts from the curated knowledge base and can answer supported questions about projects, technologies, responsibilities, research, teaching, experience, location, availability, work authorization, and contact details.

The assistant follows three important boundaries:

1. It answers only from approved public evidence in this repository.
2. It refuses unrelated or unsupported questions instead of guessing.
3. If the model is unavailable, it returns a clearly labeled extractive summary of verified facts.

Raw resumes, local file paths, prompts, chat questions, and generated answers are not stored in the generated knowledge artifact. Production provider calls happen only on the server.

See [AI operations](docs/implementation/AI_OPERATIONS.md) for runtime and failure-handling details.

## Local development

### Requirements

- Node.js 22 or newer
- npm
- Git

### Setup

```bash
git clone https://github.com/Mohamed-Nader555/mohamed-hafez-portfolio.git
cd mohamed-hafez-portfolio
npm install
```

Copy `.dev.vars.example` to `.dev.vars` for Cloudflare's local Turnstile test values. Never commit `.dev.vars`.

Start the site:

```bash
npm run dev
```

Then open [http://localhost:4321](http://localhost:4321).

The static portfolio works locally without a Cloudflare account. Live Workers AI generation requires the production Cloudflare bindings; the assistant retains its verified fallback behavior when the provider is unavailable.

## Useful commands

```bash
npm run dev                 # Start local development
npm run build               # Build the knowledge index and production site
npm run check               # Run Astro and TypeScript checks
npm run lint                # Run ESLint
npm run format:check        # Check formatting
npm run test:unit           # Run unit and integration tests
npm run test:e2e            # Run browser tests
npm run test:a11y           # Run focused accessibility tests
npm run knowledge:evaluate  # Evaluate retrieval against the fixture set
npm run deploy:dry          # Validate the Cloudflare Worker bundle
```

Install Playwright's browser once before the browser suite if needed:

```bash
npx playwright install chromium
```

## Content organization

```text
src/
  components/          UI and interactive components
  content/case-studies Long-form MDX project stories
  data/                Profile, roles, projects, and curated evidence
  layouts/             Shared profile and case-study layouts
  lib/                 Retrieval, AI, security, SEO, and client behavior
  pages/               Site routes and the chat API
  styles/              Design tokens, responsive layouts, and motion
public/
  images/projects/     Optimized project media
  resumes/             Public role-specific resume PDFs
tests/
  unit/                Logic and content-contract tests
  integration/         Build and API integration tests
  e2e/                 Responsive browser, accessibility, and SEO tests
docs/
  implementation/      Operational notes and deferred work
  superpowers/         Product specifications and implementation plans
```

## Deployment to Cloudflare

The project targets Cloudflare Workers and can begin on Cloudflare's free allocation.

Before the first production deployment:

1. Create and secure a Cloudflare account.
2. Connect this GitHub repository or authenticate Wrangler locally.
3. Configure the Workers AI binding and unique rate-limit namespaces.
4. Create a Turnstile widget restricted to the production hostname.
5. Store `TURNSTILE_SECRET_KEY` and `RATE_LIMIT_HASH_SECRET` as Cloudflare secrets.
6. Set `PUBLIC_TURNSTILE_SITEKEY` and the selected `AI_MODEL` in the Worker configuration.
7. Set `PUBLIC_SITE_URL` to the assigned HTTPS production origin.
8. Run `npm run deploy:dry`, then `npm run deploy`.
9. Smoke-test role links, resumes, project pages, contact actions, and supported/refused AI questions.

Do not enable a paid AI plan automatically. Observe real usage first, then make any billing decision manually.

## Repository safety

Safe to commit:

- Application source, tests, documentation, and configuration
- Curated public portfolio content and evidence
- Approved project images and public resumes
- `.dev.vars.example` with Cloudflare's official test values

Never commit:

- `.env`, `.dev.vars`, API keys, or Cloudflare secrets
- Signing keys or credentials
- Raw analytics exports or visitor-level data
- Private source documents or unapproved client material
- Generated local knowledge artifacts, prompts, questions, or answers

## Current launch scope

The portfolio, responsive role experience, case studies, resume downloads, direct contact actions, and grounded assistant implementation are complete. Cloudflare account connection and production deployment remain environment-specific launch steps. Custom analytics, job-description matching, testimonials, a custom domain, and several final manual QA passes are intentionally deferred and recorded in the [review and enhancement backlog](docs/implementation/DEFERRED_REVIEW_BACKLOG.md).

## License and content

The source code is provided as portfolio evidence. Personal content, resumes, project media, branding, and case-study materials remain the property of Mohamed Hafez and may not be reused as another person's portfolio or identity.
