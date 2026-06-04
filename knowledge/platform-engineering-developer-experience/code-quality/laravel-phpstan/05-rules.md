# Rules: Laravel PHPStan

## Metadata
- **Source KU:** laravel-phpstan
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PSR-RULE-001: **Start at level 6** — Catches mixed type issues without excessive ceremony.
- PSR-RULE-002: **Use baseline for existing code** — Capture current errors, fix new code strictly.
- PSR-RULE-003: **Add PHPDoc to models** — `@property` and `@method` annotations help PHPStan understand Eloquent.
- PSR-RULE-004: **Use generic collections** — `@return Collection<User>` over `@return Collection`.
- PSR-RULE-005: **Run in CI with --memory-limit=1G** — Prevents OOM crashes.
- PSR-RULE-006: **Lock Larastan version** — Prevent analysis changes from breaking CI unexpectedly.

## Architecture Rules
- PSR-RULE-007: **PHPStan config in phpstan.neon or phpstan.neon.dist**.
- PSR-RULE-008: **Exclude vendor/, storage/, bootstrap/cache/** from analysis.
- PSR-RULE-009: **Run after Pint, before PHPUnit** — Style, then analysis, then tests.
- PSR-RULE-010: **Cache result** — Configure `tmpDir` for persistent storage.
- PSR-RULE-011: **Generate baseline** for existing projects to enable incremental adoption.

## Decision Rules
- PSR-RULE-012: **Every Laravel project** should use Larastan for catching type errors before runtime.
- PSR-RULE-013: **Skip for prototypes** or throwaway code where type annotation investment isn't justified.
- PSR-RULE-014: **Level 9 for critical modules** — Payment, auth, compliance systems.
