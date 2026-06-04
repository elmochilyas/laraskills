# Rules: CONTRIBUTING.md Patterns

## Metadata
- **Source KU:** contributing-dot-md-patterns
- **Subdomain:** Onboarding and Standards
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CONTRIB-RULE-001: **Place in project root** — GitHub and GitLab auto-detect and link to it when a contributor opens a PR.
- CONTRIB-RULE-002: **Provide the exact test command** — Specify exact command (`sail pest`, `vendor/bin/pest`) with common flags.
- CONTRIB-RULE-003: **Reference PR checklist** — PR template should mirror the CONTRIBUTING.md requirements for verification loop.
- CONTRIB-RULE-004: **Keep sections under 5 bullet points** — Sections should be scannable in under 30 seconds.
- CONTRIB-RULE-005: **Test setup instructions on every release** — Run setup steps from fresh checkout in CI.

## Architecture Rules
- CONTRIB-RULE-006: **Structure:** Introduction + Code of Conduct → Getting Started → Development Workflow → Coding Standards → PR Process → Questions.
- CONTRIB-RULE-007: **Tone:** Friendly but professional. Match Laravel ecosystem's welcoming tone.
- CONTRIB-RULE-008: **Branching convention:** `feature/short-description` for features; `bugfix/issue-number` for fixes.
- CONTRIB-RULE-009: **File size:** Under 10KB. Link to external docs for details.

## Decision Rules
- CONTRIB-RULE-010: **Use for public open-source Laravel packages or projects.**
- CONTRIB-RULE-011: **Use for internal projects with multiple contributors** not always co-located.
- CONTRIB-RULE-012: **Skip for private internal projects with a single team** that communicates directly.
