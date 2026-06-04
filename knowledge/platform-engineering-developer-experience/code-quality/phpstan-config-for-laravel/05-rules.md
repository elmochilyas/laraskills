# Rules: PHPStan Config for Laravel

## Metadata
- **Source KU:** phpstan-config-for-laravel
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PSCONF-RULE-001: **Minimum level 6** — Catches mixed type issues without excessive ceremony.
- PSCONF-RULE-002: **Exclude vendor and storage** — Prevents long analysis and false positives.
- PSCONF-RULE-003: **Set explicit memory limit** — `memoryLimit: 1024M` prevents OOM crashes.
- PSCONF-RULE-004: **Use separate baseline file** — `includes: [phpstan-baseline.neon]` for clean separation.
- PSCONF-RULE-005: **Bootstrap for legacy code** — Create `phpstan-bootstrap.php` for constants/globals.
- PSCONF-RULE-006: **Separate CI config** — `phpstan.ci.neon` with stricter settings for pipeline.

## Architecture Rules
- PSCONF-RULE-007: **Level 6 for new projects; level 9 for critical modules**.
- PSCONF-RULE-008: **Use includes hierarchy** — Base config → CI config → local overrides.
- PSCONF-RULE-009: **Exclude test files from strict rules** or use per-directory level configs.
- PSCONF-RULE-010: **Enable parallel processing** for large codebases.

## Decision Rules
- PSCONF-RULE-011: **Every Laravel project** needs PHPStan configuration for static analysis.
- PSCONF-RULE-012: **Skip for projects using Psalm** or other alternative static analysis tools.
