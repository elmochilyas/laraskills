# Rules: PR Template Patterns

## Metadata
- **Source KU:** pr-template-patterns
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PRTEMP-RULE-001: **Keep template under 30 lines** with clear section headers — Templates over 50 lines cause checkbox fatigue.
- PRTEMP-RULE-002: **Include checklist items CI enforces** as reminders — Author runs checks before creating PR.
- PRTEMP-RULE-003: **Include "Deployment Notes" section** — Migrations, queue restarts, env vars, cache clears.
- PRTEMP-RULE-004: **Single template for most teams** with "if applicable" language; multiple templates for diverse PR types.
- PRTEMP-RULE-005: **Store in `.github/PULL_REQUEST_TEMPLATE.md`** — GitHub convention, auto-detected.
- PRTEMP-RULE-006: **Review and update quarterly** — Stale templates reference outdated tools.

## Architecture Rules
- PRTEMP-RULE-007: **Standard sections:** Description, ticket reference, type of change, testing checklist, quality checklist, deployment notes, screenshots.
- PRTEMP-RULE-008: **Multiple template pattern:** `.github/PULL_REQUEST_TEMPLATE/bug_fix.md`, `feature.md`, `hotfix.md`.
- PRTEMP-RULE-009: **Enable "require template" setting** in GitHub repository settings.

## Decision Rules
- PRTEMP-RULE-010: **Use for every project with multiple contributors** — Ensures consistent PR quality.
- PRTEMP-RULE-011: **Skip for solo projects** where single developer controls all PRs.
