# Rules: Static Analysis CI Integration

## Metadata
- **Source KU:** static-analysis-ci-integration
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- SACIR-RULE-001: **Separate stages** — Style → static analysis → quality — each stage independent.
- SACIR-RULE-002: **Parallel execution** — Static analysis runs alongside test suite.
- SACIR-RULE-003: **PHP matrix** — `strategy.matrix.php: [8.2, 8.3]` for multi-version compatibility.
- SACIR-RULE-004: **Cache strategy** — Restore `.php-cs-fixer.cache`, `tmpDir` from previous run.
- SACIR-RULE-005: **PR annotations** — `--format=github` for PHPStan and Pint inline feedback.
- SACIR-RULE-006: **Baseline enforcement** — Fail CI if new errors exceed baseline.

## Architecture Rules
- SACIR-RULE-007: **Pipeline order**: Composer install → Pint (10s) → PHPStan (2-5min) → Rector --dry-run (2-5min) → PHPUnit (1-3min).
- SACIR-RULE-008: **Stage independence** — If Pint fails, PHPStan still runs (separate jobs or continue-on-error).
- SACIR-RULE-009: **Memory limit** — Explicit `--memory-limit=1G` prevents OOM.
- SACIR-RULE-010: **Parallel processing** — `phpstan analyse -j 4` for multi-core CI runners.
- SACIR-RULE-011: **Baseline freshness** — Regenerate baseline on main branch monthly via cron job.

## Decision Rules
- SACIR-RULE-012: **Static analysis CI gate** for every Laravel project in production.
- SACIR-RULE-013: **Skip Rector in CI** if automated refactoring isn't part of the team workflow.
