# Rules: Dependency Update Automation

## Metadata
- **Source KU:** dependency-update-automation
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- DEPAUTO-RULE-001: **Start with Dependabot for simplicity** — Zero-config, GitHub-native. Migrate to Renovate for advanced needs.
- DEPAUTO-RULE-002: **Use type-based grouping** — Non-breaking (patch+minor) in one PR, major updates in separate PRs.
- DEPAUTO-RULE-003: **Auto-merge for patch and minor updates** only when CI passes. Major always requires human review.
- DEPAUTO-RULE-004: **Security updates bypass regular schedule** — Review and deploy within 24h.
- DEPAUTO-RULE-005: **Ensure test suite is reliable before enabling auto-merge** — Flaky tests cause false failures.
- DEPAUTO-RULE-006: **Always commit composer.lock** — Required for dependency update PRs and security scanning.

## Architecture Rules
- DEPAUTO-RULE-007: **Weekly schedule for most projects** — Balance freshness vs noise.
- DEPAUTO-RULE-008: **Full CI pipeline runs on every dependency update PR** — Tests, Pint, PHPStan.
- DEPAUTO-RULE-009: **Exclude or pin packages with unstable versioning** — Handle manually.

## Decision Rules
- DEPAUTO-RULE-010: **Use for every Laravel project with external dependencies.**
- DEPAUTO-RULE-011: **Skip for projects in maintenance mode** where dependencies are intentionally frozen.
- DEPAUTO-RULE-012: **Skip for prototypes** where dependency management isn't a priority.
