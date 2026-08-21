# Personal Profile Revision Design

## Goal

Reframe the portfolio as Mohamed's personal engineering profile rather than a recruiter-only verification interface, while preserving the four role views, important current-status facts, grounded AI behavior, and existing technical foundation.

## Approved scope

- Keep the four role views and their current navigation structure.
- Keep availability, location, work authorization, and sponsorship information, but present it as a personal "At a glance" section rather than recruiter screening or evidence.
- Use first-person voice throughout the website. Only AI assistant answers use "Mohamed" and third person.
- Rewrite the hero around a confident personal engineering identity.
- Remove visible source citations from general pages and case-study evidence sections. Preserve internal source metadata for grounding and validation.
- Rename and rewrite the Work index as a project portfolio.
- Restructure project pages around Overview, Challenge, My role, What I built, Architecture, Results, Lessons, and Project links.
- Rewrite Experience, Research, Teaching, About, Privacy, Contact, and AI interface language for a general audience.
- Improve motion with sequenced entrance, scroll reveals, hover feedback, page transitions, and reduced-motion support.
- Improve slow route navigation using Astro's client router and route prefetching.
- Defer the full automated test and review pass until the user requests it.

## Voice rules

- Public website: first-person singular.
- AI assistant answers: third person using "Mohamed."
- Interface labels must describe content or actions, never the visitor type.
- Avoid the words recruiter, evidence, verified, inspect, verification, and source in public-facing framing except where technically meaningful to the Northstar RAG project or AI citations.

## Content architecture

The homepage retains role-specific content ordering. The screening panel becomes "At a glance." Featured work becomes project storytelling. Source links are removed from fact, experience, research, and teaching cards. Research records, papers, repositories, and resumes remain available as natural actions rather than citations.

Case-study pages retain the existing validated content collection and architecture diagrams. Their visible structure and copy are rewritten into a first-person engineering narrative, and the repeated verification panel is removed.

## Navigation and motion

Astro ClientRouter will provide client-side page navigation and view transitions. Primary and role links will be prefetched. Motion will remain CSS-first, lightweight, and disabled under `prefers-reduced-motion`.

## Out of scope

- New project media or an overall visual redesign.
- Analytics.
- Cloudflare deployment.
- Full automated regression, accessibility, Lighthouse, or cross-browser testing.
