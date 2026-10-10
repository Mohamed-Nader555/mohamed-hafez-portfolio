# Deferred Review and Enhancement Backlog

**Recorded:** 2026-08-15  
**Reason:** Conserve the current Codex quota and launch the recruiter-facing portfolio sooner.  
**Resume this document after the quota refresh.**

## Launch decision

Finish the grounded AI assistant, inspect the complete site locally, fix only launch-blocking defects, and deploy to Cloudflare (production is now `https://mohamednhafez.com`; it first launched on a `workers.dev` hostname) without custom analytics. The portfolio, résumé downloads, direct contact actions, and grounded assistant do not depend on custom analytics.

## Reviews deferred

- Independent specification/code-quality review of foundation Task 8: accessibility, SEO, structured data, privacy copy, security headers, crawler files, JavaScript budgets, and Lighthouse configuration.
- Independent review of the complete grounded AI assistant implementation.
- Whole-branch/final-release review after all deferred changes are applied.
- Review intermediate commits `101d8a8` and `526e7ba` for optional history cleanup; they intentionally net to no tracked SDD report at HEAD.

## Manual QA deferred

- Full width matrix: 320, 360, 390, 430, 768, 820, 1024, 1280, 1440, and 1920 CSS pixels.
- Tablet portrait and landscape, phone landscape, laptop, large desktop, and 200% browser zoom.
- Keyboard-only navigation, screen-reader walkthrough, visible focus order, skip link, dialogs, and live regions.
- Reduced motion, high contrast/forced colors where available, touch input, and hardware keyboard.
- Slow network, offline state, software keyboard behavior, session refresh, and navigation during an in-flight chat request.
- All résumé downloads, `mailto:`, `tel:`, LinkedIn/GitHub links, official research links, sitemap, robots, canonical URLs, Open Graph previews, and JSON-LD.
- Clean-environment Lighthouse runs in CI/Cloudflare after the actual production URL is known.

## AI assistant QA deferred

- Independent adversarial review of retrieval thresholds, aliases, prompt-injection resistance, citation validation, and unsupported-question refusal coverage.
- Manual supported-question audit across projects, technologies, experience, research, teaching, skills, location, availability, PGWP, sponsorship, relocation, and contact details.
- Manual refusal audit for compensation, private history, politics, medical/legal advice, invented employers, client secrets, hidden documents, and unrelated people.
- Live Cloudflare checks for Turnstile failure/expiry, session and global rate limits, Workers AI timeout/quota exhaustion, malformed model output, fallback quality, and model availability/free-tier eligibility.
- Cross-device assistant layout, focus trapping/restoration, Escape/clear behavior, citations, follow-ups, session-only persistence, and software-keyboard-safe input.
- Re-run the full retrieval fixture and adversarial suite after any GitHub/content update.

## Analytics deferred entirely

- Cloudflare Web Analytics enablement and production verification.
- First-party `/api/events` endpoint, Zod event contract, GPC/DNT/local opt-out wiring, and non-blocking client dispatcher.
- D1 schema/migrations for raw anonymous events and daily aggregates.
- HMAC-hashed random session IDs; no IP, fingerprint, full user agent, raw question, or raw answer storage.
- Event taxonomy: lens selection, case-study opening, résumé download, contact/LinkedIn/GitHub clicks, and normalized chat opened/submitted/answered/refused/fallback/error outcomes.
- Retention jobs: 30-day raw events and 180-day daily aggregates.
- Local/preview D1 tests, production queries/dashboard runbook, privacy-copy finalization, and analytics operations documentation.

## Deployment work still required for the initial launch

- Create the free Cloudflare account, verify email, enable authenticator-based two-factor authentication, and confirm no paid plan/billing method is enabled.
- Create/connect the Worker project and public GitHub repository.
- Done: `PUBLIC_SITE_URL` is `https://mohamednhafez.com`, the production origin.
- Create the Turnstile widget and store only its public site key in public configuration; store its secret with Cloudflare secrets.
- Configure Workers AI and both rate-limiter bindings; store `RATE_LIMIT_HASH_SECRET` as a Cloudflare secret.
- Reconfirm the selected Workers AI model is eligible for the free allocation immediately before deployment.
- Run production build/dry-run, deploy, then smoke-test the four lenses, public routes, résumé downloads, direct contacts, assistant answer/refusal/fallback, CSP, and mobile/desktop layouts.

## Deferred product enhancements already approved for later consideration

- Job-description matching.
- Testimonials after permissioned quotes are available.
- Headshot/portrait treatment.
- Vectorize semantic retrieval only if measured evaluation shows lexical recall gaps.
- Paid Workers AI or another provider only after observed demand; no automatic upgrade.
- Expanded GitHub showcase after repository cleanup.
- Private analytics dashboard.
- Multilingual assistant.

## Resume criteria

After the quota refresh, start with a clean checkout, read the governing specification and all three plans, run the full automated suite, then work through this backlog in order: independent reviews, launch defects, analytics, complete manual QA, and final release review.
