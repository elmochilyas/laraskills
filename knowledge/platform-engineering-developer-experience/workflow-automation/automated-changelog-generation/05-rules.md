# Rules: Automated Changelog Generation

## Metadata
- **Source KU:** automated-changelog-generation
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CHANGELOG-RULE-001: **Use PR labels or Conventional Commits** as source of truth for changelog categorization.
- CHANGELOG-RULE-002: **Generate changelog at release time** (tag or workflow dispatch) — Not per-commit.
- CHANGELOG-RULE-003: **Maintain both CHANGELOG.md in repo** (versioned, searchable) and GitHub Releases (notifications).
- CHANGELOG-RULE-004: **Use "Keep a Changelog" format** — Sections: Breaking Changes, Added, Changed, Deprecated, Removed, Fixed, Security.
- CHANGELOG-RULE-005: **Clearly mark breaking changes with migration instructions** — Users check changelog first when upgrading.

## Architecture Rules
- CHANGELOG-RULE-006: **Release Drafter pattern:** .github/release-drafter.yml with categories for breaking, feature, bug, maintenance.
- CHANGELOG-RULE-007: **Generate at release** (tag or workflow dispatch) rather than per-commit.
- CHANGELOG-RULE-008: **Manual curation before release** — Add context, explanations, links.
- CHANGELOG-RULE-009: **Maintain Unreleased section** during development for running log of changes.

## Decision Rules
- CHANGELOG-RULE-010: **Use for every Laravel package or application** released to users.
- CHANGELOG-RULE-011: **Skip for internal tools with single user** where changelog overhead isn't justified.
