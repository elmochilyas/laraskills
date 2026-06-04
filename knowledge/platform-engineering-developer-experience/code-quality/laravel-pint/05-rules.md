# Rules: Laravel Pint

## Metadata
- **Source KU:** laravel-pint
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PINT-RULE-001: **Use --test in CI** — Exit code 0 (clean) or 1 (issues). Never auto-fix without verification.
- PINT-RULE-002: **Use --dirty locally** — `pint --dirty` formats only Git-tracked uncommitted changes.
- PINT-RULE-003: **Keep config minimal** — Start with preset defaults, add 3-5 custom rules max.
- PINT-RULE-004: **Commit pint.json** — All team members and CI must use the same configuration.
- PINT-RULE-005: **Initial formatting commit** — Run `pint` on full codebase in one isolated commit.

## Architecture Rules
- PINT-RULE-006: **Exclude generated code** — `bootstrap/cache`, `storage`, `vendor` included by default.
- PINT-RULE-007: **Run before PHPStan** — Fix style first, then analyze for type errors.
- PINT-RULE-008: **Nested config for monorepos** — Use per-package `pint.json` with appropriate presets.
- PINT-RULE-009: **Lock Pint version** — Prevent unexpected rule changes via `composer.json` version pin.

## Decision Rules
- PINT-RULE-010: **Use Pint for every Laravel project** for consistent code style.
- PINT-RULE-011: **Use PHP-CS-Fixer directly** for non-Laravel PHP projects (more flexible).
