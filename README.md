# Mohamed Hafez — Recruiter Portfolio

Official portfolio for Mohamed Hafez: an evidence-led recruiter experience spanning AI/ML engineering, software engineering, Android development, and technical teaching.

## Current status

The product direction and responsive design are approved. This initial repository commit contains the architecture specification and the implementation plans; application implementation begins in the next phase.

## Planning documents

- [Approved product and architecture specification](docs/superpowers/specs/2026-08-14-recruiter-portfolio-design.md)
- [Portfolio foundation and content plan](docs/superpowers/plans/2026-08-14-portfolio-foundation-and-content.md)
- [Grounded AI assistant plan](docs/superpowers/plans/2026-08-14-grounded-ai-assistant.md)
- [Analytics, deployment, and launch plan](docs/superpowers/plans/2026-08-14-analytics-deployment-and-launch.md)
- [Codex implementation brief](docs/implementation/CODEX_IMPLEMENTATION_BRIEF.md)
- [Repository agent instructions](AGENTS.md)

## Repository policy

Commit source code, tests, curated public content, the four role-specific public résumés, approved screenshots, database migrations, documentation, and example configuration files.

Never commit API keys, Cloudflare secrets, `.env` or `.dev.vars` files, raw analytics exports, signing keys, private supplementary source files, or copied credential files from older repositories. See `.gitignore` and the architecture specification for the full boundary.

## Canonical production origin

Canonical links, Open Graph URLs, structured data, `robots.txt`, and the sitemap all use the single validated `PUBLIC_SITE_URL` build variable. Cloudflare production builds must set it to the real assigned HTTPS origin before deployment. The repository deliberately does not contain an invented `workers.dev` hostname. Local builds use the explicit `https://portfolio.test` fallback; browser tests set the same deterministic origin.
