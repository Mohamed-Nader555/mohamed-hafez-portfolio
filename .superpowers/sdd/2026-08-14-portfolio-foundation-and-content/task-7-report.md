# Task 7 Report: Approved assets, résumé downloads, and direct contact actions

## Status

Implementation, verification, and the scoped commit are complete. The linked worktree is clean.

## Approved résumé assets

The four approved role PDFs were copied byte-for-byte to the stable public paths expected by `roles.ts`; no PDF content was rewritten.

| Public file | Bytes | SHA-256 |
| --- | ---: | --- |
| `public/resumes/Mohamed-Hafez-AI-ML-Engineer.pdf` | 83,004 | `874A5D7887563CB14A84C779EBE4FDDEDC0560AA534EF4EDA523B2A0932C947B` |
| `public/resumes/Mohamed-Hafez-Software-Engineer.pdf` | 83,254 | `1FD0A3B85E63C037772062368E3F9A03BA9ADCDC1FAB91A59DAEF36173287B91` |
| `public/resumes/Mohamed-Hafez-Android-Developer.pdf` | 75,283 | `563EE431FB9BC92553041F31C801F3BCFFC2230F9E279E077D5C668A386D5F6E` |
| `public/resumes/Mohamed-Hafez-TA-Instructor.pdf` | 73,857 | `FFD9954082B995CFA184BE4A69349C83ECBAB4E3BE00D30AB705F543F82B2EBB` |

Source and public SHA-256 hashes match for every role.

### PDF validation and visual QA

- `pdfinfo` confirmed all four public PDFs are valid, unencrypted PDF 1.5 files with exactly two US Letter pages each.
- Text extraction returned readable text on all eight pages. Extracted character counts per résumé were AI/ML `[4798, 4231]`, Software `[4282, 4466]`, Android `[4213, 4004]`, and Teaching `[4493, 4108]`.
- Both pages of all four byte-identical PDFs were rendered to ignored `tmp/pdfs/task-7/` PNGs at 120 DPI and visually inspected.
- Visual review found readable typography, intact bullets and rules, complete margins, no clipped or overlapping content, no black squares, and no missing glyphs on any page.

## Approved screenshot selection and derivatives

I visually inspected all four approved Dive candidates and all eight approved Dostava candidates. I selected a small, complementary recruiter-useful set rather than duplicating splash or promotional screens:

- Dive location capture: demonstrates nearby-hospital discovery on a map.
- Dive emergency capture: demonstrates accident reporting and emergency actions.
- Dostava restaurant capture: demonstrates merchant discovery within the ordering flow.
- Dostava produce capture: demonstrates a free-form category-specific ordering workflow.

I excluded splash screens and near-duplicate category screens. I also excluded the Dostava order-history candidate because it visibly contained a customer name, even though the supplied screenshots were approved.

`scripts/optimize-project-images.ts` reproducibly creates metadata-stripped AVIF and WebP outputs at 480, 768, and 1110 pixels wide. The 1110-pixel derivative preserves the approved source dimensions and quality. The output contains 24 derivatives totaling 1,188,957 bytes. Sharp inspection confirmed every file has the expected 1:2 dimensions and has no EXIF, ICC, or XMP metadata. Representative 768-pixel WebP outputs were visually inspected and remained sharp and readable.

The public-safe source-label-to-output mapping is in `public/images/projects/README.md`; it contains no private source path. `src/data/project-images.ts` supplies reusable alt text, captions, explicit dimensions, and responsive source sets. Dive and Dostava case studies render the evidence in responsive `<picture>` elements with lazy loading below the fold and fixed aspect ratios to prevent layout shift.

## Stable résumé and contact actions

- Added `ResumeLink.astro` with role-specific `download` filenames and normalized `data-analytics-*` hooks.
- Added `ContactLinks.astro` for the public email, phone, LinkedIn, and GitHub destinations.
- Replaced inline Hero, final ContactSection, and About contact markup with the reusable actions.
- LinkedIn and GitHub open in a new tab with `noopener noreferrer`; email and phone retain their native `mailto:` and `tel:` behavior.
- No analytics events are emitted yet, no JavaScript was added, and no form or scheduler was introduced.
- Primary controls retain 44-pixel touch targets and verified 320-pixel fit.

## TDD record

### RED

- `tests/unit/public-assets.test.ts` first failed because the verifier did not exist; after adding only the API skeleton, 10 policy cases failed because missing, malformed, oversized, prohibited, and unexpected assets were not rejected.
- The real-public-directory case then failed loudly for all four missing résumé paths.
- A later nested-resume mutation test failed because an unexpected nested file was not rejected.
- `tests/e2e/contact-and-resume.spec.ts` initially produced seven expected failures: four missing stable download actions, missing analytics/external-link behavior, and missing Dive/Dostava responsive image evidence.

### GREEN

- Public asset policy: 12/12 focused unit tests pass.
- Contact/resume/image behavior: 8/8 focused tests pass in Chromium desktop and 8/8 in Chromium mobile.
- The nested-resume mutation case passes after the verifier was tightened to reject every unexpected file below `public/resumes/`.

## Verification evidence

- Baseline before changes: 44 unit tests and 114 E2E tests passed in the clean linked worktree.
- `npm run assets:verify`: 4 résumé paths verified across 34 public files.
- Full unit suite: 9 files, 56 tests passed.
- Full E2E suite: 130 tests passed across desktop and mobile projects, including 320, 360, 820, and 1440 CSS-pixel coverage and 200% zoom checks.
- Final combined `npm test` gate: 56 unit and 130 E2E tests passed.
- `npm run check`: 71 files, 0 errors, 0 warnings, 0 hints.
- `npm run lint`: passed.
- `npm run format:check`: passed.
- `npm run build`: passed and prerendered all 13 public routes.
- `git diff --check`: passed.
- PDF source/public SHA-256 comparison, `pdfinfo`, render inspection, and text extraction: passed.
- Image format/dimension/metadata/size inspection: 24 files passed; total 1,188,957 bytes.
- Tracked/staged path and content privacy scan: 46 staged paths passed; exactly four approved resumes, 25 approved image paths (24 derivatives plus the public README), no prohibited filename, private source path, or high-risk key marker.

## Self-review

- Scope contains only the four approved role PDFs and selected Dive/Dostava image derivatives; no master/comprehensive CV, raw research documents, credential/signing material, source dump, or private analysis is present.
- The verifier checks exact required résumé paths, rejects extras anywhere under `public/resumes/`, checks `%PDF`, enforces the strict `<5 MiB` limit, and scans all public filenames for private/credential patterns.
- Public labels, alt text, filenames, and content do not add a presenter or unrelated collaborator identity.
- All action hooks use the later analytics taxonomy but no event-emitting client code exists.
- The image gallery is evidence-led, responsive, dimensioned, lazy-loaded, and usable without JavaScript.

## Commit

- Planned message: `content: add approved portfolio assets and resumes`
- Commit: `b240836b36e8dff58bb87973828125005501f08f`

## Concerns

- `npm run build` succeeds but retains the pre-existing Astro sitemap warning because `astro.config.mjs` does not yet define `site`; the plan assigns canonical/sitemap completion to Task 8.
- `npm install` reports 10 dependency-tree advisories (2 low, 1 moderate, 7 high). No forced dependency upgrades were made because they are outside this content/assets task and may be breaking.
- The first final combined test attempt hit the existing 60-second timeout in the nested `astro check` integration test under temporary system load. The isolated integration test immediately passed in 12.77 seconds, and a fresh complete `npm test` rerun passed all 186 tests.

## Fix Round 1

### RED

- Replaced the previous magic-only fixture with a deterministic structurally valid two-page PDF fixture and added behavioral mutations for a magic-only file, corrupt xref/trailer, valid one-page PDF, and valid encrypted/password-protected PDF. The focused unit run failed 10 tests before the verifier change: all four PDF mutations and six prefixed/infix privacy-token mutations were accepted.
- Added prefixed, infix, nested, and token-boundary privacy cases covering `master`, `comprehensive`, `private`, `raw-source`, `raw-data`, `raw-export`, `credential(s)`, `service-account`, and signing/key extensions. Added safe `_headers`, `_redirects`, and false-positive token cases.
- Added the 320px About contact geometry assertion for column layout and non-zero gap. The focused mobile E2E run failed with the existing `row` flex direction before the CSS change.

### GREEN

- `pdfjs-dist@^6.2.108` is now the maintained Node PDF parser dependency. The verifier opens each PDF with the worker disabled, rejects password callbacks/encrypted documents, requires exactly two pages, preserves the strict `<5 MiB` limit, and reports parse failures deterministically. Public-relative paths are normalized to POSIX separators and prohibited tokens are matched only at filename token boundaries.
- Focused unit: `36/36` passed in `tests/unit/public-assets.test.ts`.
- Focused E2E: `8/8` passed for Chromium desktop and `8/8` passed for Chromium mobile in `tests/e2e/contact-and-resume.spec.ts`.
- Full unit suite: `80/80` passed. Full E2E suite: `130/130` passed across desktop and mobile.
- `npm run assets:verify`: four actual role PDFs passed across 34 public files. No public PDF/image bytes were modified; `git diff --name-only -- public` is empty.
- `npm run check`, `npm run lint`, `npm run format:check`, `npm run build`, and `git diff --check` passed. `npm audit --omit=dev --audit-level=high` reports 0 vulnerabilities.

### Commit and concerns

- Focused fix commit: `51f02da` (`fix: harden public asset verification`).
- The existing build warning about the missing sitemap `site` option remains assigned to Task 8. The full dependency tree still reports the pre-existing development advisories; the production audit is clean.
