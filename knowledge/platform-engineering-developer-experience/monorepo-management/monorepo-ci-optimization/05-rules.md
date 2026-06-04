# Rules: Monorepo CI Optimization

## Metadata
- **Source KU:** monorepo-ci-optimization
- **Subdomain:** Monorepo Management
- **Phase:** 5 (Rule Extraction)
- **Date:** 2026-06-02

## Design Rules
- CIRULE-001: **Test changed packages AND their dependents** — If Package A changes and B depends on A, both must be tested. Resolve transitive dependency closure.
- CIRULE-002: **Use CI setup job to generate test matrix** — Setup job detects changes, resolves dependency graph, outputs JSON matrix. Separates detection from execution.
- CIRULE-003: **Run full suite nightly** — Change-aware CI is fast but partial. Nightly full suite catches cross-package interaction bugs.
- CIRULE-004: **Cache Composer dependencies per package** — Cache `vendor/` per package with cache keys including lock file hash.
- CIRULE-005: **Include shared infrastructure in change detection** — CI config, Docker files, test helpers. Include these paths in detection scope.

## Architecture Rules
- CIRULE-006: **Change detection** — GitHub Actions: `dorny/paths-filter`. GitLab CI: `rules:changes`. Git diff vs base branch.
- CIRULE-007: **Dependency resolution** — Parse `composer.json` across monorepo to build dependency graph. Compute transitive dependents.
- CIRULE-008: **Job matrix generation** — Setup → detect → resolve deps → generate JSON matrix → downstream test jobs consume matrix.
- CIRULE-009: **Parallel execution** — Independent packages run in parallel. Dependent packages wait for dependencies' tests first.
- CIRULE-010: **Test levels** — Unit tests (changed packages), integration tests (infra changes), full suite (nightly/release).

## Performance Rules
- CIRULE-011: **CI pipeline target: under 10 min** — Change detection + test execution for main pipeline.
- CIRULE-012: **Composer install biggest contributor** — Optimize with caching, `--prefer-dist`, root-level install, path repos.
- CIRULE-013: **Matrix optimization** — Reduce full matrix (10 pkgs × 4 PHP × 3 Laravel = 120 jobs) with LTS-only combos.

## Common Mistakes
- CIRULE-014: **Not testing dependent packages** — A changes, B (depends on A) breaks, CI passes. Broken packages merged.
- CIRULE-015: **Overly aggressive caching** — Cache key not including composer.lock hash. Tests pass with stale cache.
- CIRULE-016: **Ignoring shared infrastructure changes** — CI config changes but doesn't trigger full test suite.
- CIRULE-017: **Slow package holding up pipeline** — No optimization for slow test packages.

## Anti-Pattern Rules
- CIRULE-018: **Avoid full suite on every commit** — 45 min CI, developers wait or merge without CI. Use change-aware testing.
- CIRULE-019: **Avoid no-cache pipeline** — Clean `composer install` every run wastes 30-60 seconds.
- CIRULE-020: **Avoid false negative machine** — So aggressive that packages break silently. Test dependents + nightly full suite.
