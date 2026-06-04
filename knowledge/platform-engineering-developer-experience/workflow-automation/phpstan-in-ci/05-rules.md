# Rules: PHPStan in CI

## Metadata
- **Source KU:** phpstan-in-ci
- **Subdomain:** Workflow Automation
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- PSICI-RULE-001: **Use baseline for legacy codebases** — Generate before enabling PHPStan in CI to capture existing errors.
- PSICI-RULE-002: **Cache .phpstan.result.cache** between CI runs — Without caching, full analysis takes 2-5min instead of 5-10s.
- PSICI-RULE-003: **Use level 6 for Laravel projects** — Balances strictness with practicality for magic methods and facades.
- PSICI-RULE-004: **Use `--error-format=github`** for GitHub Actions — Errors appear inline on PR diff.
- PSICI-RULE-005: **Set explicit memory limit** — `php -d memory_limit=2G` prevents OOM on large projects.
- PSICI-RULE-006: **PHPStan passing must be a required status check** for PR merge.

## Architecture Rules
- PSICI-RULE-007: **Baseline generation:** `phpstan analyse --generate-baseline` to capture all current errors.
- PSICI-RULE-008: **Baseline regeneration** in dedicated cleanup PRs — Never use `--generate-baseline` to hide new errors.
- PSICI-RULE-009: **Level increment pattern** — Generate baseline at new level, then fix errors incrementally.

## Decision Rules
- PSICI-RULE-010: **Use for every Laravel project with multiple contributors.**
- PSICI-RULE-011: **Skip for prototypes** where analysis overhead isn't justified.
- PSICI-RULE-012: **Level 5 starting point** for teams new to static analysis; level 6+ for mature teams.
