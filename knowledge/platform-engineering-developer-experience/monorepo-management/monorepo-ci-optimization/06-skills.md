# Skill: Optimize Monorepo CI Pipeline with Change-Aware Testing

## Purpose
Configure a CI pipeline for a Laravel monorepo that intelligently detects changed packages, resolves transitive dependency impacts, and selectively executes tests to keep feedback under 10 minutes while maintaining safety.

## When To Use
- Monorepo has 3+ packages and CI time exceeds 15 minutes
- PRs typically change only a subset of packages
- Team wants fast feedback for small changes while ensuring cross-package compatibility
- CI budget (cost, runner availability) is a concern

## When NOT To Use
- Single package in the monorepo — standard CI is sufficient
- All packages change in every commit (tightly coupled) — change detection provides no benefit
- CI pipeline is already under 10 minutes without optimization
- Team can't invest in configuring change detection and dependency resolution

## Prerequisites
- Monorepo with 3+ packages having dependency relationships
- CI platform (GitHub Actions, GitLab CI, etc.)
- `composer.json` files for all packages
- Shared infrastructure files (CI config, Docker files, test helpers) identified

## Inputs
- CI configuration file (`.github/workflows/` or `.gitlab-ci.yml`)
- Package directory structure (e.g., `packages/*`)
- Inter-package dependency data from `composer.json` require sections
- Change detection tooling (e.g., `dorny/paths-filter` for GitHub Actions, `rules:changes` for GitLab CI)

## Workflow

1. **Implement Change Detection:** Configure path filters for each package directory. Include shared infrastructure paths (CI config `.github/`, Docker files, shared test helpers) in the detection scope. For GitHub Actions use `dorny/paths-filter`; for GitLab CI use `rules:changes`.

2. **Build Setup Job with Matrix Generation:** Create a CI setup job that detects changed packages, resolves the dependency graph (parsing `composer.json` to find packages that depend on changed packages), and outputs a JSON matrix defining exactly which packages to test.

3. **Implement Dependency Graph Testing:** When Package A changes, also test Package B if B declares a dependency on A. Resolve transitive dependents by parsing `require` sections across all package `composer.json` files. Output the full affected set to the test matrix.

4. **Configure Selective Test Levels:** Run unit tests for changed packages on every PR. Trigger integration tests when infrastructure changes. Schedule a full suite nightly and before releases.

5. **Set Up Parallel Execution:** Configure independent packages to run tests in parallel CI jobs. Dependent packages wait for their dependencies' tests to pass first using CI job dependencies.

6. **Optimize Composer Caching:** Cache `vendor/` per package with a cache key that includes the `composer.lock` hash. Use `--prefer-dist` and root-level install where possible. Avoid clean installs on every run.

7. **Add Nightly Full Suite:** Schedule a nightly workflow that runs the complete test suite for all packages. This catches cross-package interaction bugs that change-aware testing might miss.

8. **Implement Merge Queue (Optional):** Use GitHub merge queues or GitLab merge trains to batch commits and run CI once on the merged result before merging to main.

## Validation Checklist

- [ ] Change detection correctly identifies which packages changed in a PR
- [ ] Dependency graph resolution correctly identifies all affected packages (direct + transitive)
- [ ] Setup job outputs correct JSON matrix consumed by downstream test jobs
- [ ] Independent packages run in parallel; dependent packages wait correctly
- [ ] Composer cache key includes `composer.lock` hash for cache accuracy
- [ ] Nightly full suite is scheduled and runs all packages
- [ ] Shared infrastructure changes trigger appropriate test levels
- [ ] Main pipeline completes under 10 minutes

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Dependent packages not tested | CI passes but downstream packages break |
| Stale cache from missing lock hash | Tests pass locally but fail with fresh install |
| Infrastructure changes missed | CI config changes don't trigger full suite |
| Slow package blocks pipeline | Pipeline time determined by slowest package |

## Decision Points

- **Change detection depth:** File-path filtering (fast) vs git diff parsing (more accurate)
- **Dependency resolution scope:** Direct dependents only vs full transitive closure
- **Test level strategy:** Unit for changed packages; integration for infra; full nightly
- **Merge queue vs direct merge:** Merge queue for high-traffic repos; direct for small teams

## Performance/Security Considerations

- **Pipeline target:** Under 10 minutes for main pipeline (change detection + test execution)
- **Matrix explosion:** Reduce full matrix (10 packages × 4 PHP × 3 Laravel = 120 jobs) with LTS-only combos
- **Cache security:** Clear cache periodically to avoid using packages with known vulnerabilities
- **Dependency audit:** Run `composer audit` in CI to detect known vulnerabilities

## Related Rules

- CIRULE-001: Test changed packages AND their dependents
- CIRULE-002: Use CI setup job to generate test matrix
- CIRULE-003: Run full suite nightly
- CIRULE-004: Cache Composer dependencies per package
- CIRULE-005: Include shared infrastructure in change detection

## Related Skills

- Configure Monorepo Dependency Management
- Set Up Split Testing for Monorepo Packages
- Extract Shared Libraries from Monorepo

## Success Criteria

- Main CI pipeline consistently completes under 10 minutes
- PRs only trigger tests for affected packages (changed + dependents)
- Nightly full suite catches cross-package issues before release
- No broken packages merged due to missing dependent testing
