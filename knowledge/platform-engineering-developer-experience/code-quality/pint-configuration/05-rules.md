# Rules: Pint Configuration

## Metadata
- **Source KU:** pint-configuration
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PINT-CONF-RULE-001: **Start minimal** — Preset-only config; add rules only when team disagrees with a specific convention.
- PINT-CONF-RULE-002: **Exclude generated code** — `bootstrap/cache`, `storage/framework/views` prevent large diffs.
- PINT-CONF-RULE-003: **Commit pint.json** — All team members and CI must use the same configuration.
- PINT-CONF-RULE-004: **Review config in PRs** — Rule changes affect entire codebase formatting.
- PINT-CONF-RULE-005: **Use glob patterns for exclusions** — `notPath: ["app/Legacy/*"]` for broad directory exclusion.

## Architecture Rules
- PINT-CONF-RULE-006: **Place pint.json in project root** with explicit preset.
- PINT-CONF-RULE-007: **Use nested pint.json** for subdirectories needing different standards.
- PINT-CONF-RULE-008: **Lock Pint version** — Prevent rule behavior changes via composer.json.
- PINT-CONF-RULE-009: **Validate JSON** — Trailing commas cause silent failures.

## Decision Rules
- PINT-CONF-RULE-010: **No config needed** for default Laravel projects teams are happy with preset defaults.
- PINT-CONF-RULE-011: **Use config** for team-specific conventions, legacy code exclusion, or monorepo subdirectory standards.
