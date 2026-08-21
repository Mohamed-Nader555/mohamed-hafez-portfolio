# Personal Profile Revision Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the complete portfolio as a first-person personal engineering profile, reduce citation and recruiter framing, improve project storytelling, and make navigation feel immediate.

**Architecture:** Preserve the existing Astro content, role-ranking, RAG, and source-validation layers. Replace only public-facing copy and page composition, remove citation rendering from general pages, and add Astro client routing plus CSS-first motion.

**Tech Stack:** Astro 7, MDX, React 19, CSS, Astro ClientRouter

**Spec:** `docs/superpowers/specs/2026-08-21-personal-profile-revision-design.md`

## Global Constraints

- Keep the four role views and current role navigation structure.
- Use first-person voice everywhere except AI assistant answers.
- Keep availability, location, work authorization, and sponsorship facts.
- Keep source data internally but remove repeated visible citations.
- Do not add analytics, dependencies, project claims, or fabricated outcomes.
- Defer the full automated test suite until explicitly requested.

---

### Task 1: Personal voice and homepage framing

**Files:**
- Modify: `src/components/sections/Hero.astro`
- Modify: `src/components/sections/EvidencePanel.astro`
- Modify: `src/components/sections/FeaturedWork.astro`
- Modify: `src/components/sections/ExperienceSection.astro`
- Modify: `src/components/sections/TeachingSection.astro`
- Modify: `src/components/layout/Header.astro`
- Modify: `src/components/layout/Footer.astro`
- Modify: `src/data/**/*.ts`

- [ ] Rewrite visible language in first person and remove recruiter-only framing.
- [ ] Rename the screening section to "At a glance" while retaining all four facts.
- [ ] Remove inline source links and replace evidence-oriented project actions with "View project."
- [ ] Preserve source resolution internally for the AI and validation layers.

### Task 2: Work index and case-study narrative

**Files:**
- Modify: `src/pages/work/index.astro`
- Modify: `src/layouts/CaseStudyLayout.astro`
- Modify: `src/components/case-study/CaseStudyCard.astro`
- Modify: `src/content/case-studies/*.mdx`

- [ ] Rename the Work index and rewrite its introduction.
- [ ] Replace case-study framing with Overview, Challenge, My role, What I built, Architecture, Results, Lessons, and Project links.
- [ ] Convert all ownership and narrative copy to first person.
- [ ] Remove the repeated public-evidence panel from case-study pages.

### Task 3: Supporting pages and assistant interface

**Files:**
- Modify: `src/pages/about.astro`
- Modify: `src/pages/experience.astro`
- Modify: `src/pages/research/asc-pie.astro`
- Modify: `src/pages/privacy.astro`
- Modify: `src/components/ai/ChatLauncher.tsx`
- Modify: `src/components/ai/ChatPanel.tsx`
- Modify: `src/components/ai/ChatMessage.tsx`
- Modify: `src/components/ai/PortfolioAssistant.tsx`

- [ ] Rewrite supporting pages for a general audience in first person.
- [ ] Replace citation labels with natural thesis, résumé, repository, and project actions only where useful.
- [ ] Present the assistant as a way to ask about the portfolio, while keeping third-person answers and citations.

### Task 4: Faster navigation and coordinated motion

**Files:**
- Modify: `src/layouts/BaseLayout.astro`
- Modify: `src/components/layout/Header.astro`
- Modify: `src/components/lenses/RecruiterLensSwitcher.tsx`
- Modify: `src/styles/motion.css`

- [ ] Add Astro ClientRouter to avoid full document reloads.
- [ ] Prefetch primary and role routes.
- [ ] Add sequenced entrance, scroll reveal, card hover, and page-transition styles.
- [ ] Preserve reduced-motion behavior.

### Task 5: Focused content audit

**Files:**
- Modify: any public-facing file still containing obsolete framing.

- [ ] Search visible source for recruiter-only, verification, citation, and third-person wording.
- [ ] Correct remaining public copy while preserving legitimate RAG terminology.
- [ ] Run formatting and Astro type-check only; leave the full test suite deferred.
- [ ] Commit the revision as one cohesive presentation-layer change.
