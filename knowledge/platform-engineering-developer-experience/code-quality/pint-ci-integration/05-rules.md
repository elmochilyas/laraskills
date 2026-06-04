# Rules: Pint CI Integration

## Metadata
- **Source KU:** pint-ci-integration
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PINT-CI-RULE-001: **Run Pint early in CI** — First step after dependency install for fast feedback.
- PINT-CI-RULE-002: **Pin Pint version** — `"laravel/pint": "1.18.*"` prevents unexpected rule changes.
- PINT-CI-RULE-003: **Use --format=github** — Provides inline annotations on PR diffs for developer visibility.
- PINT-CI-RULE-004: **Cache tokens** — Restore `.php-cs-fixer.cache` for 50-80% speed improvement.
- PINT-CI-RULE-005: **Auto-fix then test** — Run `pint` (fix) then `pint --test` (verify) for clean CI.

## Decision Rules
- PINT-CI-RULE-006: **Gate mode** (--test) for strict teams; auto-fix mode for flexible teams.
- PINT-CI-RULE-007: **Use pre-commit hooks locally** — CI should complement, not replace local quality checks.
