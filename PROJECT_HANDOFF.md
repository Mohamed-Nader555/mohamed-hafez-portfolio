# Mohamed Hafez Portfolio — Project Handoff

**Snapshot date:** 2026-09-26

**Repository:** `Mohamed-Nader555/mohamed-hafez-portfolio`

**Git remote:** `https://github.com/Mohamed-Nader555/mohamed-hafez-portfolio.git`

**Local checkout used for this snapshot:** `D:\ChatGPT\My Portfolio Website\mohamed-hafez-portfolio\.worktrees\portfolio-implementation`

**Snapshot commit:** `50b3f39` (`refactor: remove duplicate status section`)
**Configured production origin:** `https://mohamed-hafez-portfolio.mohamed-m-nader555.workers.dev`

This is a description of the **code as it exists at the snapshot**, not a promise that every earlier plan is complete. The production URL and Cloudflare dashboard state were not rechecked while writing this document. Check `git status`, the current branch, and the deployed build before making changes. The local checkout is a Git worktree on `agent/portfolio-implementation`; at this snapshot `origin/main` pointed to the same commit. This file itself is a new handoff artifact, not part of that snapshot commit until committed.

## Update — 2026-09-27, `feat/project-stories` branch (not yet merged to `main`)

The project portfolio was rebuilt per `docs/PROJECTS_REWRITE_BRIEF.md` (private, git-ignored). This section records the facts in this document that changed; the rest of this file still describes the `main`-branch state at the `50b3f39` snapshot above until the branch merges.

- **SPRINT-PP status changed**: the paper (titled "ASC-PIE and SPRINT-PP: Evaluating Privacy-Safe Continual Learning for PII Extraction") is now **accepted to IEEE CASCON 2026** (Toronto, 10–12 Nov 2026), confirmed directly by Mohamed on 2026-09-27. This **replaces** the "submitted and under review" wording in the "Factual/attribution rules" table above and throughout the codebase (evidence records, the AI assistant's system prompt, structured data, and all locked tests). No author list is public yet; the IEEE Xplore link will be added once the proceedings publish (after Nov 2026) — do not call it "published" until then.
- **Android app count changed from 9 to 16**: the site's proof-strip value, the Android role summary, and the freelance-Android experience bullet in `career.ts` now all say 16 Android applications delivered. The public résumé PDFs (`public/resumes/`) were **not** regenerated and still say 9 — flag this to Mohamed.
- **Dostava's stack corrected**: it is **Firebase-only** (Java · Firebase Realtime Database · Firebase Auth (Facebook + Google) · Firebase Storage · Firebase Analytics · AndroidX Lifecycle · AdMob), not the Retrofit/Room/Google-Maps stack the public résumé PDFs describe. The résumé PDFs were **not** regenerated and still claim the wrong stack — flag this to Mohamed too.
- **Case-study pages expanded from 5 to 28**, plus a 5-project card library and a teaching shelf, replacing the old `project-archive.ts` twelve-item library entirely. `src/data/projects.ts` is now the single 34-entry catalogue (28 page-tier + 5 cards + `teaching-experience`); the `bass` project record was removed (its evidence stays under the BASS experience entry on `/experience`).
- The case-study MDX frontmatter schema changed shape: it no longer duplicates `title`/`summary`/`ownership`/`roles`/`technologies` (those now come from `projects.ts` by slug) and instead owns page-only fields (`passport`, `stats`, `features`, `decisions`, `challenges`, `stack`, `pipeline`, `screens`, `links`), validated against new `VERIFIED_TECH`/`ALLOWED_NUMBERS` allowlists in `src/data/`.
- `ResearchHighlights.astro`'s chart data corrected `BERT-base-cased` to `BERT-large-cased` and added the previously-omitted `BART-base` model.
- See `docs/content-review/RECONSTRUCTED_CLAIMS.md` and `docs/content-review/FINAL_REPORT.md` (both git-ignored, ask Mohamed for a copy if you need them) for the full decision log and verification output from this rewrite.

## 1. Product identity and non-negotiable decisions

- The site is Mohamed Hafez's **personal engineering portfolio**, not a site that addresses only recruiters. It presents one person through four professional focuses: **AI/ML Engineer**, **Software Engineer**, **Android Developer**, and **TA / Instructor**. AI/ML is the default focus.
- The current visual concept is **Research Console × Electric Studio**: structured, information-rich research presentation with a deep-navy, cyan, and neon-magenta atmosphere. It should feel technical and polished, not like a terminal gimmick.
- Public website prose should use **first person** (“I built…”). The AI assistant speaks **about Mohamed in third person**. Old internal identifiers such as `RecruiterLensNav` and `answerRecruiterQuestion` remain in code; they are not a directive to restore recruiter-only public copy.
- No headshot, testimonial section, contact form, or scheduler. Contact is direct via email, phone, LinkedIn, and GitHub. The hero also has a matching résumé action.
- The site must remain useful on desktop, tablet, and phone. Do not interpret this as a phone-only/mobile-first brief; each size gets the full information and chat capability.
- The user approved the pointer-following cyan/magenta glow and broader ambient background. A Firefox smoothness concern was discussed, but the user chose **not** to change the current effect at that point.
- The “Current status / At a glance” homepage section was removed because the location, availability, authorization, and sponsorship facts already appear in the hero. Do not accidentally restore that duplicate block. The separate `/about` page still has a practical-details section.
- Do not reintroduce prominent “source/evidence” panels or citations across normal site pages. Natural project/research links remain. AI answers retain supporting links inside a collapsible disclosure.

### Factual/attribution rules already approved by Mohamed

| Topic              | Approved statement / constraint                                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Public identity    | Use **Mohamed Hafez**. `Mohamed-Nader555` is only the GitHub handle.                                                                                                                                                                                  |
| Education          | York University M.A. in Information Systems & Technology was **completed and officially awarded in 2026**. Helwan University B.Sc. was Excellent with Honors, rank 2nd, GPA 3.72/4.0.                                                                 |
| Thesis             | **“ASC-PIE: An Evaluation Framework for PII-Aware Named-Entity Recognition.”** Official [YorkSpace record](https://yorkspace.library.yorku.ca/items/379ae5c1-63dc-4036-bd47-f27a01cd195e) and [permanent handle](https://hdl.handle.net/10315/43932). |
| SPRINT-PP          | Research paper **submitted and under review**. Never call it published or accepted.                                                                                                                                                                   |
| Northstar RAG      | Independently built end to end for hands-on RAG engineering. Public wording should not frame it as an assessment.                                                                                                                                     |
| Dive               | Client project implemented and integrated **end to end by Mohamed**. Do not mention or attribute work to the person who presented it.                                                                                                                 |
| Mind's Eye         | Mohamed delivered **more than 80%** of the system and built its Egyptian-currency recognition from scratch.                                                                                                                                           |
| Mercato            | Football-talent platform, not a generic marketplace.                                                                                                                                                                                                  |
| Google Play        | Four Android apps were **previously** published under client-owned listings. The listings are no longer available because clients did not continue maintenance/request updates; never offer a current Play Store download.                            |
| CEH                | **Training only**, not an official CEH certification.                                                                                                                                                                                                 |
| Employment details | Toronto; immediately available; open PGWP through June 2029; no sponsorship required; open to onsite/hybrid/remote in Canada and relocation within Canada/GTA. These may be public.                                                                   |

The original résumés and supplementary discovery material are outside this public repository under `D:\ChatGPT\My Portfolio Website\given-files`. Do not copy raw master CVs, notes, or private source dumps into the repo. `AGENTS.md`, `src/data/sources.ts`, and the approved specs document the claim policy. User confirmations take precedence over older documents if they conflict.

## 2. What is actually implemented

| Area                     | Current state                                                                                                                                                                                                                                                                                                     |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main website             | Implemented in Astro with all listed routes, role-aware home, detailed work, research, experience, about, privacy, contact, and four public résumé PDFs.                                                                                                                                                          |
| Responsive visual system | Custom CSS, adaptive grids, sticky navigation/role switcher, mobile chat sheet, self-hosted fonts, reduced-motion styles, and pointer-following ambient glow are in code. Full manual cross-browser/device review remains deferred.                                                                               |
| Role switching           | Instant on `/` using `?role=aiml\|software\|android\|teaching`, pre-rendered `<template>` copies of all four role contents, browser history, and a short blur transition. Dedicated `/software`, `/android`, `/teaching` entry routes also exist.                                                                 |
| AI chat                  | Implemented at `/api/chat` with Turnstile, two rate-limit bindings, local retrieval, Cloudflare Workers AI generation, strict refusal, and deterministic extractive fallback. Chat submit clears the input immediately; failed requests restore the draft.                                                        |
| Analytics                | **Not implemented.** There is no `/api/events`, D1 database binding/migration, first-party click telemetry, or active opt-out. Some `data-analytics-*` attributes are placeholders. Cloudflare Web Analytics is described as planned/enableable on `/privacy`; verify the dashboard before claiming it is active. |
| Job-description matching | Postponed.                                                                                                                                                                                                                                                                                                        |
| CI/security automation   | No `.github` workflow directory in this checkout. Local test/lint/build scripts exist; the full independent review and launch QA backlog is deferred.                                                                                                                                                             |
| Domain                   | Cloudflare `workers.dev` origin configured; custom domain postponed.                                                                                                                                                                                                                                              |

**Important architecture discrepancy:** `npm run knowledge:build` generates an ignored MiniSearch JSON artifact, but the current runtime retrieval in `src/lib/rag/retrieve.ts` calls `chunkEvidence()` directly and applies its own scoring. The generated MiniSearch index is **not** loaded by `/api/chat`. Do not describe the live assistant as using MiniSearch at request time without first changing that code.

## 3. Routes and navigation

| Route                                                                                    | Render mode                           | Purpose and visible content                                                                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                                                                                      | Server-rendered (`prerender = false`) | Primary home; defaults to AI/ML, accepts `?role=...`. Role hero, 5-number highlight strip, summary, four ranked projects, ranked experience timeline, ranked skills, teaching portfolio, education/certificates/awards, contact, and AI assistant. |
| `/software`, `/android`, `/teaching`                                                     | Pre-rendered                          | Matching-role entry pages using the same `LensLayout` and shared content. The in-page role switcher links back to `/?role=...`.                                                                                                                    |
| `/work`                                                                                  | Pre-rendered                          | “Selected work”: five detailed case-study cards and a 12-item additional-project library.                                                                                                                                                          |
| `/work/asc-pie`, `/work/northstar-rag`, `/work/minds-eye`, `/work/dive`, `/work/dostava` | Pre-rendered from MDX                 | Case studies with header, ownership/tech brief, Overview, Challenge, My role, What I built, Architecture, Results, Lessons, and links where applicable. Dive and Dostava have screenshot galleries.                                                |
| `/research/asc-pie`                                                                      | Pre-rendered                          | Thesis record/status, corpus and result charts, architecture, research facts, and official links. ASC-PIE therefore has both a work case study and a dedicated research page.                                                                      |
| `/experience`                                                                            | Pre-rendered                          | Responsibility-led groups: enterprise systems, product delivery, teaching/communication. This is **not** the home timeline.                                                                                                                        |
| `/about`                                                                                 | Pre-rendered                          | Engineering introduction, practical employment details, York education, and contact.                                                                                                                                                               |
| `/privacy`                                                                               | Pre-rendered                          | Plain-language privacy and future custom-event policy; currently includes an explicit inactive analytics opt-out placeholder.                                                                                                                      |
| `/robots.txt`                                                                            | Dynamic route                         | Crawler policy; sitemap is generated by the Astro sitemap integration.                                                                                                                                                                             |
| `/api/chat`                                                                              | Worker route                          | POST-only JSON assistant API.                                                                                                                                                                                                                      |

The sticky header has identity (“Mohamed Hafez”, “AI · software · mobile”), desktop links to Work, Research, **homepage anchors** for Experience and About, and Contact. A compact `<details>` menu appears at smaller widths. Footer has direct contact/profile links and Privacy. Astro `ClientRouter` enables client-side navigation and route view transitions; primary/work links use Astro viewport/hover prefetch. Header “Experience” and “About” currently target home anchors rather than `/experience` and `/about`; keep or change deliberately.

### Home composition and role behavior

`src/layouts/LensLayout.astro` renders `RoleContent`, a fixed `PersistentRoleSwitcher`, four hidden `<template data-role-template>` instances, then `TeachingPortfolio`, `EducationCredentials`, `ContactSection`, and the React assistant. Thus only the first six sections are role-swapped; the bottom teaching/education/contact sections remain common. `RoleContent.astro` owns this order:

1. `Hero`: role selector, “I’m Mohamed Hafez”, role-specific statement, Toronto/immediate-availability tags, cross-discipline line, email and matching résumé, project spotlight, and an aside showing location, PGWP, sponsorship.
2. `ProofStrip`: 9 Android apps delivered; 4 previously shipped to Google Play; 10+ applied ML projects; 200+ teaching hours; 3.72 undergraduate GPA.
3. `RoleSummary`: first-person, role-specific paragraph from `src/data/career.ts`.
4. `FeaturedWork`: four role-ranked project cards from `src/data/roles.ts`/`src/data/projects.ts`.
5. `CareerTimeline`: same seven experience entries, ranked by role-specific weights (not filtered out).
6. `SkillsMatrix`: eight prioritized skill groups, with remaining groups under “View all skill groups”.

`src/lib/client/role-navigation.ts` intercepts same-origin `/?role=` link clicks, clones the selected template, swaps only `[data-role-content]`, updates `document.title`, active-link state, history and assistant role via `portfolio:role-change`, then triggers reveal/sticky-switcher recalculation. It falls back to normal navigation if no template is available. Back/forward uses `popstate`. The hero selector is replaced by a fixed, scroll-visible selector after the hero selector passes under the sticky header. Reduced-motion users get an immediate swap. Query switching does not replace the entire document head, so only the title is updated on an instant swap; canonical/description/OG metadata are from the initial page response. Dedicated role URLs retain their own server-generated metadata.

Role-specific priorities:

| Role ID / label                | Hero theme                                                   | Featured project order                                           | Spotlight                  | Résumé                                |
| ------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------- | -------------------------- | ------------------------------------- |
| `aiml` / AI/ML Engineer        | Privacy-aware NLP, grounded AI, reproducible ML              | ASC-PIE, Northstar, Mind's Eye, Dive                             | ASC-PIE corpus/NER         | `Mohamed-Hafez-AI-ML-Engineer.pdf`    |
| `software` / Software Engineer | Services, APIs, enterprise workflows, client products        | Northstar, BASS, Dive, Dostava                                   | Northstar RAG flow         | `Mohamed-Hafez-Software-Engineer.pdf` |
| `android` / Android Developer  | Android architecture, APIs, offline data, maps, Firebase, ML | Mind's Eye, Dive, Dostava, Mercato                               | Mind's Eye wearable/vision | `Mohamed-Hafez-Android-Developer.pdf` |
| `teaching` / TA / Instructor   | Labs, workshops, assignments, mentoring                      | Teaching & Technical Instruction, ASC-PIE, Northstar, Mind's Eye | 200+ teaching hours        | `Mohamed-Hafez-TA-Instructor.pdf`     |

## 4. Content inventory and where to edit it

### Main public facts

- `src/data/profile.ts`: public name, GitHub handle, Toronto location, immediate availability, PGWP through June 2029, no sponsorship, work/relocation preferences, intermediate target level, full-time preference with contract openness, email `mohamed.m.nader555@gmail.com`, phone `+1 647 929 2480`, [LinkedIn](https://www.linkedin.com/in/mohamed-nader555), and [GitHub](https://github.com/Mohamed-Nader555).
- `src/data/screening.ts`: eight public fact records: location, availability, work authorization, sponsorship, arrangement, relocation, target level, and employment preference. These feed `/about` and AI knowledge; the removed duplicate homepage status section should not be restored.
- `src/data/roles.ts`: four role IDs, route titles/descriptions, résumé paths, featured-project order, depth evidence IDs, and source IDs.
- `src/data/career.ts`: exact home hero statements and summaries; five proof stats; seven experience entries; 16 skill groups; four teaching-material/workshop cards; three education records; nine certificate/training entries; three awards/honours entries; role weights/order. This is the primary file for most home-page copy.
- `src/data/projects.ts`: the eight canonical project records: five detailed case studies plus BASS, Mercato, and Teaching & Technical Instruction. Each has approved summary, ownership, technologies, roles, and source IDs.
- `src/data/project-archive.ts`: 12 shorter `/work` library items: SPRINT-PP, Applied ML Portfolio, Documentum Workflow & Lifecycle Optimization, PDF Document Processing Utilities, Internal REST Endpoints & Client PoCs, Mercato Star Finder, Your Life Is My Life, Healthy Habit / Food Planner, The Death Ninja, Shop on the Go, Weather Checker, Search for Eats.
- `src/data/evidence/*.ts`: atomic facts used for claim validation, experience/research pages, and AI grounding. `src/data/sources.ts` maps their provenance to public links. `github-northstar-rag` and `github-dostava` are marked non-public provenance and do not become public AI citations.
- `src/content/case-studies/*.mdx`: the five long-form case studies. Frontmatter is validated by `src/types/case-study.ts` via `src/content.config.ts` and must match canonical detailed project slugs. `src/pages/work/index.astro` and `[slug].astro` deliberately fail the build unless exactly five matching detailed studies exist; adding a sixth requires updating this guard.
- `src/data/project-images.ts` and `public/images/projects/`: approved Dive and Dostava screenshots with alt text, captions, and responsive AVIF/WebP variants at 480/768/1110 widths. No other project gallery images are currently present.
- `public/resumes/`: four public role-specific PDF résumés. Do not confuse these with raw private resumes/master sources outside the repo.

### Detailed project stories currently visible

| Project                                      | Current story and claims                                                                                                                                                                                                                                                                                                                                                   | Public links/media                                                                                           |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **ASC-PIE**                                  | M.A. privacy-aware NER evaluation framework; harmonizes five real/synthetic source datasets, 19 PII entity types, and 333,109 examples; Python/PyTorch/Hugging Face/scikit-learn/seqeval; thesis awarded; SPRINT-PP submitted/under review. Research page additionally displays 2,025,878 entity mentions, six strict-F1 model bars, and continual-learning strategy bars. | Work case study, separate `/research/asc-pie`, YorkSpace, permanent handle, public Thesis-Experiments repo.  |
| **Northstar RAG System**                     | Independently built ingestion, PDF extraction, chunking, local embeddings (`all-MiniLM-L6-v2`), Chroma, retrieval thresholds, grounded generation, citation/refusal, RAGAS evaluation, pytest, Docker/FastAPI. Case study notes 700-character chunks with 100-character overlap.                                                                                           | Case study and résumé links; no direct public Northstar GitHub link in current source registry.              |
| **Mind's Eye**                               | Assistive smart-glasses capstone linking Arduino wearable, Java Android app, REST recognition, OpenCV/Tesseract OCR, custom Egyptian-currency recognition, and text-to-speech; >80% delivered by Mohamed. No unsupported usage/accuracy metric.                                                                                                                            | Case study; no screenshot gallery in repo.                                                                   |
| **Dive Simulation & Safety Profile Planner** | Client-owned scuba-planning Android/ML application; Mohamed implemented end to end; Java/Retrofit/Gson, Python/scikit-learn safety classifier, Firebase auth/realtime/storage, Maps/Location/Places; integrated planner and recommendations.                                                                                                                               | Case study, two screenshot subjects (emergency actions and hospital map), public Diving-Simulation-App repo. |
| **Dostava Delivery**                         | On-demand courier Android app; Java/MVVM, Retrofit remote layer, Room local persistence, Firebase notifications, Google Maps tracking; prior client-owned Google Play listing no longer available.                                                                                                                                                                         | Case study and two screenshot subjects (produce order and restaurant list); no current Play Store CTA.       |

The work page's five cards lead into these case studies. `src/components/case-study/ArchitectureDiagram.astro` contains bespoke node/edge definitions for all five and outputs an accessible text summary. The MDX body has Overview → Challenge → My role → What I built → Architecture → Results → Lessons; some entries have Project links. The case-study prose now uses the full shell width with paragraphs capped at 64rem, wider than the former narrow centered column. `ProjectGallery.astro` renders lazy responsive images for Dive and Dostava.

### Professional, teaching, education, and research detail

Home experience entries in `career.ts`: York graduate researcher (Sep 2024–Apr 2026), BASS Software Engineer/ECM Consultant (Aug 2023–Sep 2024), DotPy AI & ML Specialist (Jun 2021–Aug 2023), freelance Android developer (Jul 2019–Jun 2024), private CS instructor (Jan 2023–Aug 2024), freelance Java developer (Sep 2019–Jun 2023), and York Teaching Assistant (Sep 2024–Apr 2026). They are sorted by focus, not chronology. `/experience` instead groups atomic evidence into enterprise systems, product delivery, and teaching/communication.

The common home teaching section covers 15+ workshops/coding clinics to 100+ attendees, Data Structures Lab Series, 10+ introductory AI/ML notebooks, and Android teaching mini-apps. The common education section covers York M.A., Helwan B.Sc., ITI mobile-development professional certificate; a separate certificate/training list and awards list follow. CEH is visibly labeled training-only. `/research/asc-pie` is more quantitative and includes official research links, not generic citation badges.

The 16 skill-group headings in `career.ts` are Programming languages; Machine learning; NLP & LLMs; Computer vision & OCR; Data & MLOps; Android; Mobile integration; Mobile test & release; Backend; Enterprise content management; Document processing; Databases; Cloud & platforms; Visualization; Engineering tools; and Professional strengths. Their full technology strings and per-role priority are in `career.ts`, and the home page shows eight immediately plus the remaining groups in a disclosure.

The certificate/training list contains AWS Machine Learning Foundations, Artificial Intelligence Foundations, Android Development (Udemy), Android Development Track (One Million Arab Coders/Udacity), Introduction to Android Diploma, **CEH training programme only**, AI & Machine Learning Workshop, Problem Solving Workshop, and Soft Skills Workshop. Awards/honours are Excellent with Honors/2nd in class, Mind's Eye capstone grade A+, and three consecutive ICPC contestant years. The research chart values in `ResearchHighlights.astro` are strict F1: RoBERTa-large 99.1%, FLAN-T5-base 98.7%, ModernBERT-large 84.6%, BERT-base-cased 80.7%, Llama 3.1 8B 69.0%, Qwen 2.5 7B 40.0%; continual-learning accuracy: SPRINT-PP 83.5%, Distillation 83.0%, Replay 76.5%, Baseline 14.6%. Do not change or extrapolate those figures without source review.

## 5. Visual system and UX behavior

Primary design files: `src/styles/tokens.css`, `reset.css`, `global.css`, `components.css`, `lenses.css`, `longform.css`, `motion.css`, `profile.css`; assistant visuals are in `src/components/ai/assistant.css`.

- Palette tokens: ink `#050817`, `#081126`, `#0b1530`, `#10203d`; near-white text `#e8f2ff`; muted blue-grays; cyan `#55dffd` (evidence/navigation), magenta `#ff4fd8` (AI/high-attention), restrained green `#69dba8` (available/grounded status). Deep surfaces use translucent gradients, thin cyan borders, selective glass blur, and subtle grid/radial textures.
- Typography: self-hosted variable **Familjen Grotesk** for display and **Source Sans 3** for body, with a monospace utility stack. WOFF2 files and licenses are in `public/fonts/`. `tokens.css` defines responsive type, spacing, radii, widths, shadows, and motion timings. The main shell width is `80rem`; typical reading width is `44rem`.
- Background: a full-viewport `.ambient-background` behind all pages uses layered cyan/magenta radial and conic gradients, a slow 42-second aurora, 18-second drift, rings/lines, and pointer-controlled CSS variables. `BaseLayout.astro` updates variables on `pointermove` through `requestAnimationFrame`; reduced-motion disables the animated layers. The global body also has quiet radial/linear gradients.
- Header: sticky, translucent navy; hero role selector is rounded/pill-like with cyan active state. Once it scrolls away, a second fixed role selector appears just below the header. On small screens it becomes horizontally scrollable. The switcher uses `aria-hidden`/`inert` while hidden.
- Hero: large left-aligned name/thesis, small NER-like labels for role/location/availability, direct actions. Right side combines a graphical project spotlight and compact location/authorization/sponsorship card, preventing an empty desktop corner. The spotlight changes with focus.
- Content sections: number strip, editorial headings, large project cards, vertical experience rail, ranked skill cards, teaching/education grids, and a direct-contact ending. Work cards have index numbers, ownership text, technology chips, and one main action.
- Motion: sequenced hero entry, short hover elevation, scroll reveal via IntersectionObserver, Astro route transitions, 90ms out/180ms in role blur, assistant aurora/neural signal/status pulses. `prefers-reduced-motion` removes animation and keeps content visible. Avoid scroll hijacking and heavy 3D.
- Responsive breakpoints appear primarily around 64rem, 56rem, 45rem, 40rem, 700px, and 430px. Main grids collapse intentionally; case-study galleries move from two columns to one below 45rem. Assistant becomes a near-full-width bottom sheet at ≤700px using `100dvh` and safe-area insets.
- Accessibility/SEO foundations: semantic sections, skip link, visible focus styles, labelled navigation, alt/captions for screenshots, architecture text equivalents, OG SVG image, canonical/meta/Twitter tags, Person/CreativeWork/Thesis JSON-LD, robots and sitemap, CSP/security headers in `public/_headers`. This describes code intent, not a freshly completed manual audit.

### AI assistant visual/interaction details

The fixed launcher is branded **“Ask Mohamed.AI”** with a “Grounded AI” kicker, neural glyph, cyan/magenta gradient border, dark glass surface, slow aurora, status dot, and arrow. Opening it displays a modal-style dark navy panel with backdrop blur, `MOHAMED.AI` header, “Grounded portfolio intelligence”, role context, short privacy line, welcome prompt, suggestion buttons, turn bubbles, animated retrieval state, and a bottom composer. Cyan signals assistant output; magenta marks the user's turn. The send button is a bright cyan gradient. Submitted text leaves the composer immediately and appears as the user's turn; on network/verification error it is restored for retry. Enter submits; Shift+Enter adds a line; Escape closes; Clear session removes session ID/history. Supporting source links are present only inside a collapsed “Supporting evidence” disclosure after answered/fallback turns. The current panel renders the most recent turn/result, while up to six conversation messages are retained in browser session storage for follow-up context; it is **not** a full visible transcript UI. Review focus trapping/restoration separately if improving dialog accessibility.

## 6. AI runtime architecture and limits

1. React `PortfolioAssistant.tsx` stores its temporary browser state and obtains a Turnstile token via `turnstile-client.ts` when submitting. Local development uses Cloudflare's official dummy test key/token.
2. It POSTs JSON to `/api/chat` (`src/pages/api/chat.ts`): `{question, activeRole, history, sessionId, turnstileToken}`. Zod requires 2–600 question characters, valid focus ID, ≤6 history turns, UUID session ID, and a token. The API accepts JSON POST only and returns no-store responses.
3. The Worker validates the Turnstile action `portfolio_chat` and configured production hostname, then checks a SHA-256 server-hashed session key against the 5-per-60-second limiter and a global 60-per-60-second limiter. Secrets are Cloudflare bindings, not frontend values.
4. `retrieveEvidence()` derives chunks from curated `src/data` evidence, project records, screening facts, career/skills/teaching/education, and project archive. It uses aliases, project names, topic/title/text overlap, role weighting, up to two earlier user messages, and prior cited IDs. Explicit unsupported patterns and insufficient matches return a deterministic refusal **without model use**.
5. Supported context is sent once to the Workers AI model configured by `AI_MODEL` (currently `@cf/meta/llama-3.1-8b-instruct-fast`) with a strict grounded prompt and JSON schema. The response is Zod-validated; citations are constrained to retrieved public source IDs. The assistant is English-only and does not browse or match job descriptions.
6. Model failure, quota, timeout, malformed output, or unusable citations yield `buildEvidenceFallback()` — currently the literal prefix **“Generated synthesis is temporarily unavailable. Verified facts:”** followed by extractive approved text and public citations. The user previously reported seeing that fallback; a later normalization fix is in commit history, but live reliability still deserves manual verification. Do not claim this is always a successful AI-generated answer.
7. Chat history and random session ID are in `sessionStorage` keys `mh_portfolio_chat_session_v1` and `mh_portfolio_chat_history_v1`; they are not in permanent portfolio storage. There is no current analytics endpoint that stores raw questions or answers.

Current initial suggestions: “How was Northstar built?”, “What technologies did Mohamed use in Dostava?”, and “Where is Mohamed located and when can he start?”. Strict refusal covers unsupported/private, compensation, medical, political, hidden-document, and invented-employment questions. A `telemetry` object is returned in the API response, but no custom-events pipeline currently consumes it.

Production configuration in `wrangler.jsonc`: Worker name `mohamed-hafez-portfolio`, `AI` binding, model var, public Turnstile site key, `TURNSTILE_EXPECTED_HOSTNAMES` (comma-separated: the custom domain, `www`, and the workers.dev name; the old singular `TURNSTILE_EXPECTED_HOSTNAME` is still read as a one-item fallback; off localhost an empty list makes `/api/chat` return 503), two rate-limit bindings. `GET /api/chat/health` returns `{ ok, ai, verification, hostnames, knowledgeChunks }` (no secrets, `no-store`) so the deployment's configuration can be checked from a browser. Production secrets required: `TURNSTILE_SECRET_KEY` and `RATE_LIMIT_HASH_SECRET`. Never put them in Markdown or Git. `src/env.d.ts`/`src/types/cloudflare-workers.d.ts` define bindings. `docs/implementation/AI_OPERATIONS.md` describes model/fallback operations but contains some pre-deployment wording; use code and Cloudflare dashboard as current truth.

## 7. Repository, build, and deployment

This is one Astro project, not separate frontend/backend repositories. Root layout:

```text
AGENTS.md                    Repository rules and required plans
README.md                    General project overview (some deployment wording is stale)
PROJECT_HANDOFF.md           This current-state handoff
astro.config.mjs             Astro adapter, integrations, canonical site URL
wrangler.jsonc               Cloudflare Worker, AI, Turnstile/public vars, rate limits
package.json / package-lock.json
src/pages/                  Page routes and chat API
src/layouts/                Base, role page, case-study shells
src/components/             Layout, sections, case study, research, React AI UI
src/content/case-studies/   Five validated MDX studies
src/data/                   Curated profile, roles, projects, career, evidence, sources
src/lib/                    Role navigation, retrieval, AI, security, SEO
src/styles/                 Site design system; AI CSS lives with its React component
public/                     Four résumé PDFs, approved optimized screenshots, fonts, OG art, headers
scripts/                    Knowledge build/evaluation, image optimization, asset and JS checks
tests/                      Unit, integration, Playwright E2E, RAG evaluation fixture
docs/implementation/        AI operations, original implementation brief, deferred backlog
docs/superpowers/            Approved initial and later personal-profile specs/plans
```

**Local prerequisites:** Node.js 22+ (local Node 24 has been used), npm, Git. Wrangler is a project dependency; no global Wrangler installation is needed. From the checkout:

```powershell
npm ci
npm run dev
```

Development runs at `http://localhost:4321/` by default. `.dev.vars.example` contains only Cloudflare dummy local keys. Do not place actual secrets in the example file.

**Chat locally.** `npm run dev` with no `.dev.vars` gives a working chat: on `localhost`, `127.0.0.1` and `[::1]` the browser always uses Cloudflare's test site key (`1x00000000000000000000AA`, see `resolveTurnstileSiteKey` in `turnstile-client.ts`) and the API accepts the matching dummy token. Local answers come from the extractive fallback, because the Workers AI binding is not available locally (`remoteBindings: false` in `astro.config.mjs`). To try the real model, temporarily set `remoteBindings: true` there, run `npx wrangler login`, restart `npm run dev`, and do not commit that change (it spends the account's Workers AI allowance).

Useful commands: `npm run check`, `npm run lint`, `npm run format:check`, `npm run knowledge:build`, `npm run knowledge:evaluate`, `npm run test:unit`, `npm run test:e2e`, `npm run test:a11y`, `npm run build`, `npm run deploy:dry`, `npm run deploy`. `npm run test` chains unit and E2E. Playwright currently defines Chromium desktop and Chromium mobile projects, not Firefox/WebKit. The repo has Lighthouse configs but no GitHub workflow in this snapshot.

The Astro build uses the Cloudflare adapter, React only where needed, MDX, sitemap, strict TypeScript/Zod, and `PUBLIC_SITE_URL` for canonical URLs. In CI, `PUBLIC_SITE_URL` is required; local builds may use `https://portfolio.test`. The root is server-rendered for `?role=`, while most informational pages are pre-rendered. `npm run build` also runs knowledge generation, Wrangler types, and Astro checking. Ignored generated paths include `dist/`, `bundled/`, `.astro/`, `.wrangler/`, `src/generated/`, reports, and `worker-configuration.d.ts`.

The project was connected to GitHub for Cloudflare automatic deployment from `main`. The intended build is `npm run build`, deploy command `npx wrangler deploy`, with `PUBLIC_SITE_URL` set to the workers.dev origin. Confirm actual build configuration and latest production deployment in the Cloudflare dashboard before editing deployment settings. Pushing `main` may trigger a deployment; a manual `npm run deploy` is available when necessary. Do not enable a paid plan or other vendor without Mohamed's explicit decision.

Commit application source, public structured facts, approved assets, tests, docs, lockfile, and non-secret configuration. Do **not** commit `.env`, `.dev.vars`, raw supplementary files, master CV, source dumps, chat transcripts, analytics exports, signing keys, service credentials, local D1 files, or generated outputs. The `given-files/` folder is outside and ignored by this repo. Public résumé PDFs are intentional exceptions: they are approved for the website.

## 8. Known gaps, deferred decisions, and next-agent cautions

1. **Analytics is deferred.** Click/download/chat outcome tracking desired by Mohamed is not live in this code. `docs/implementation/DEFERRED_REVIEW_BACKLOG.md` is the authoritative deferred list. The older original design/implementation brief describes D1/Web Analytics/CI as planned scope, not current implementation. The privacy page accurately marks first-party events as future; verify Web Analytics status separately.
2. **Full QA was intentionally deferred to conserve quota.** Existing automated tests cover many areas, but a recent full run is not recorded in this handoff. Run the complete local suite and manual responsive/accessibility/cross-browser checks before calling a new release fully verified.
3. **Firefox performance was not changed by request.** The pointer glow and blur/aurora may cost more in Firefox. If revisiting, get fresh measurements and Mohamed's approval before changing the approved visual character.
4. **The assistant has an important runtime/index mismatch.** MiniSearch is generated but not consumed by live retrieval. If retrieval quality work is requested, decide whether to use the generated index or remove the unused build artifact/dependency, with evaluation tests before/after.
5. **AI answer reliability and fallback wording deserve follow-up.** The source has an extraction fallback and recent generation/citation fixes; verify real production model responses and quota/Turnstile/error paths rather than assuming every answer is generated.
6. **Role switching and SEO metadata are asymmetric.** Instant query switches update content/title but not all head tags. Dedicated role routes have proper static metadata. Preserve smooth switching while considering this if SEO refinement is requested.
7. **The chat is not a visible multi-message transcript.** It remembers up to six turns for retrieval context but renders the latest exchange only. If changing this, preserve session-only privacy and mobile keyboard behavior.
8. **Navigation labels/anchors are intentional current behavior.** Header Experience/About point to homepage sections; `/experience` and `/about` still exist. Avoid silently replacing one with the other.
9. **Historical source wording can conflict with the approved personal-profile revision.** Initial `2026-08-14` docs use recruiter/evidence language; the later `2026-08-21` revision and current code are the better guide for public voice. Internal evidence/source IDs still serve grounding and validation.
10. **Future enhancements explicitly postponed:** job-description matching, testimonials (pending permissioned quotes), photo, custom domain, organized/expanded GitHub showcase, private analytics dashboard, multilingual assistant, semantic Vectorize retrieval only if measured recall requires it, and paid AI only after observed demand and manual approval.

## 9. Recommended first steps for the receiving agent

1. Read `AGENTS.md`, this handoff, the latest personal-profile spec/plan, and the deferred backlog. Read original specs/plans for provenance, but distinguish planned from shipped functionality.
2. Confirm `git status`, branch, `origin/main`, and the Cloudflare production deployment. Do not assume this new document has been committed or deployed.
3. Run `npm ci`, `npm run check`, `npm run knowledge:evaluate`, `npm run test:unit`, and `npm run build`; then perform targeted manual checks for the requested change. Do not claim the entire site passed tests unless the outputs were actually read.
4. Change content at its canonical source (`career.ts`, `projects.ts`, `project-archive.ts`, `evidence/*.ts`, `*.mdx`, `profile.ts`) rather than duplicating strings in components. Keep `sourceIds` and the public/private citation boundary intact.
5. For visual changes, use the existing tokens and adaptive breakpoints; protect first-person voice, role-switch speed, reduced-motion behavior, and desktop/tablet/phone parity.
6. For chat changes, preserve strict unsupported refusal, Turnstile/rate limits, public-source-only grounding, session-only history, and no raw transcript analytics.
