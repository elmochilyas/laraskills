# Rules: Laravel Rector

## Metadata
- **Source KU:** laravel-rector
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- RECTOR-RULE-001: **Always use --dry-run first** — Review diffs before applying changes.
- RECTOR-RULE-002: **Apply one rule set at a time** — Incremental diffs are reviewable.
- RECTOR-RULE-003: **Run tests after Rector** — Rector can produce semantically wrong code.
- RECTOR-RULE-004: **Lock Rector version** — Prevent unexpected rule behavior changes.
- RECTOR-RULE-005: **Exclude vendor** — Rector should never process vendor files.
- RECTOR-RULE-006: **Incremental by directory** — Apply one directory at a time for large projects.

## Architecture Rules
- RECTOR-RULE-007: **Config in rector.php at project root**.
- RECTOR-RULE-008: **Use rectorphp/rector-laravel** for Laravel-specific rules.
- RECTOR-RULE-009: **Schedule as monthly CI task** for continuous modernization.
- RECTOR-RULE-010: **Run before PHPStan** — Fixes deprecated patterns that PHPStan would flag.
- RECTOR-RULE-011: **Use --parallel** for large codebases to reduce analysis time.

## Decision Rules
- RECTOR-RULE-012: **Use for Laravel version upgrades** — Automates 80%+ of upgrade changes.
- RECTOR-RULE-013: **Use for PHP modernization** — Type hints, match expressions, readonly properties.
- RECTOR-RULE-014: **Use Pint instead** for style-only changes (Rector is for structural refactoring).
- RECTOR-RULE-015: **Skip for critical codebases** without thorough test coverage.
