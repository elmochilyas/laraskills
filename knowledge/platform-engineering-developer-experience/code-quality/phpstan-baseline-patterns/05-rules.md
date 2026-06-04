# Rules: PHPStan Baseline Patterns

## Metadata
- **Source KU:** phpstan-baseline-patterns
- **Subdomain:** Code Quality
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- BASELINE-RULE-001: **Start comprehensive, reduce aggressively** — Capture all errors, then fix methodically.
- BASELINE-RULE-002: **Set reduction targets** — Quarterly 10-15% reduction in baseline size.
- BASELINE-RULE-003: **Regenerate regularly** — Monthly cleanup removes stale entries and tracks progress.
- BASELINE-RULE-004: **Fail CI on new errors** — Compare regenerated baseline against committed version.
- BASELINE-RULE-005: **Baseline at strict level** — Generate at target level, not lowest (capture full debt).

## Architecture Rules
- BASELINE-RULE-006: **Commit baseline to version control** — Visible debt tracker.
- BASELINE-RULE-007: **Use separate file** — `phpstan-baseline.neon` included from main config.
- BASELINE-RULE-008: **Level graduation** — Level 2 → fix → level 4 → fix → level 6 → fix → level 9.
- BASELINE-RULE-009: **Assign baseline ownership** — Specific team members responsible for reduction.
- BASELINE-RULE-010: **Dedicated cleanup PRs** — Not mixed with feature work.

## Decision Rules
- BASELINE-RULE-011: **Use baseline** for existing codebases adopting strict PHPStan levels.
- BASELINE-RULE-012: **No baseline needed** for new projects with zero existing errors.
