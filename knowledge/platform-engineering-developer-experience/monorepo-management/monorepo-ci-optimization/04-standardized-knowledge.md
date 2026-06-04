# Experience Curation: Monorepo CI Optimization

## Metadata
- **KU ID:** monorepo-management/monorepo-ci-optimization
- **Phase:** 4 (Experience Curation)
- **ECC Version:** 1.0
- **Curator:** Phase 4 Standardization Process
- **Date Curation Completed:** 2026-06-02
- **Maturity:** Maturing
- **Dependencies:** laravel-monorepo-tools, shared-library-extraction-patterns, composer-path-repository-usage
- **Related Technologies:** GitHub Actions, GitLab CI, symplify/monorepo-split, Composer
- **Target Audience:** DevOps engineers, Laravel developers, platform engineers

## Overview

Monorepo CI optimization addresses the challenge that a single commit can change multiple packages, potentially triggering test suites for all packages. Without optimization, monorepo CI pipelines can take 30-60 minutes to complete. The core strategies are: change detection (only test packages affected by the PR), dependency graph resolution (test packages that changed AND packages that depend on changed packages), selective test execution (run unit tests for affected packages, full integration tests less frequently), and parallelized builds (run independent package tests concurrently). For Laravel monorepos specifically, Composer dependency resolution across packages adds complexity that must be managed in CI.

## Core Concepts

- **Change Detection:** Determining which packages changed in a commit/PR using Git diff or file path filtering
- **Dependency Graph Testing:** When Package A changes, also test Package B (which depends on A) — transitive dependency testing
- **Selective Test Matrix:** Different test levels based on change scope: unit tests for changed packages, integration tests for infrastructure changes, full suite on schedule
- **Parallel Package Testing:** Independent packages' tests run in parallel CI jobs; dependent packages wait for dependencies to pass
- **Baseline + Changed Tests Pattern:** Baseline (lint, static analysis) on all packages; full tests only on changed packages and dependents
- **Scheduled Full Test Pattern:** Change-aware CI on every commit; full suite nightly and before releases

## When To Use

- Monorepo has 3+ packages and CI time exceeds 15 minutes
- PRs typically change only a subset of packages
- Team wants fast feedback for small changes while maintaining safety
- CI budget (cost, runner availability) is a concern
- Packages have dependency relationships (some depend on others)

## When NOT To Use

- Single package in the monorepo — standard CI is sufficient
- All packages change in every commit (tightly coupled) — change detection provides no benefit
- CI pipeline is already under 10 minutes without optimization
- Team can't invest in configuring change detection and dependency resolution
- Packages have no dependency relationships (no cross-package testing needed)

## Best Practices (WHY)

1. **Test Changed Packages AND Their Dependents (Why):** Testing only changed packages misses breakage in packages that depend on changed code. If Package A changes, and Package B depends on A, B must also be tested. Resolve the transitive dependency closure for safety.

2. **Use a CI Setup Job to Generate Test Matrix (Why):** A "setup" job detects changes, resolves the dependency graph, and outputs a JSON matrix. This matrix defines exactly which packages to test. The pattern separates detection logic from execution, making the CI pipeline modular and debuggable.

3. **Run Full Suite Nightly (Why):** Change-aware CI is fast but partial. Nightly full suite catches cross-package interaction bugs that change detection might miss. Release builds also run the full suite for maximum confidence.

4. **Cache Composer Dependencies Per Package (Why):** Each package may have different `composer.lock` files or different dependency sets. Cache `vendor/` per package with cache keys including the lock file hash. This prevents cache poisoning and ensures accurate resolution.

5. **Include Shared Infrastructure in Change Detection (Why):** Changes to CI config files, Docker files, or shared test helpers affect all packages. Include these paths in the change detection scope to trigger appropriate testing when shared infrastructure changes.

## Architecture Guidelines

- **Change Detection Implementation:** GitHub Actions: `dorny/paths-filter` or `tj-actions/changed-files`. GitLab CI: `rules:changes` directive. Read git diff comparing against the base branch.
- **Dependency Resolution:** Parse `composer.json` files across the monorepo to build the dependency graph. When a package changes, compute its transitive dependents for testing.
- **Job Matrix Generation:** Setup job → detect changes → resolve deps → generate JSON matrix → downstream test jobs consume the matrix.
- **Parallel Execution:** Independent packages run in parallel. Dependent packages wait for their dependencies' tests to pass first.
- **Test Levels:** Unit tests (all changed packages), integration tests (packages with infra changes), full suite (nightly, release).
- **Merge Queue:** Use GitHub merge queues or GitLab merge trains to batch commits and run CI once on the merged result.

## Performance

- **CI Pipeline Target:** Under 10 minutes for main pipeline (change detection + test execution).
- **Composer Install Time:** Biggest contributor. Optimize with caching, `--prefer-dist`, root-level install, path repositories.
- **Test Database:** Use SQLite in-memory for CI speed unless dialect-specific testing is required.
- **Job Distribution Overhead:** For 10+ packages, job spawning overhead adds 1-3 minutes. Batch small packages into a single job.
- **Matrix Optimization:** Reduce full matrix (10 packages × 4 PHP × 3 Laravel = 120 jobs) with LTS-only combinations and "min and max" strategy.

## Security

- **CI Secret Management:** Use CI/CD secrets for authentication tokens. Never expose secrets in matrix configuration or test output.
- **Cache Security:** Composer caches may contain packages with known vulnerabilities. Periodically clear cache and rebuild with updated dependencies.
- **Split Authentication:** Split operations need SSH key or token access to target repositories. Use deploy keys with minimal permissions per repository.
- **Dependency Audit:** Run `composer audit` in CI to detect known vulnerabilities in dependencies across all packages.

## Common Mistakes

### Mistake 1: Not Testing Dependent Packages
- **Description:** Package A changes, Package B (depends on A) breaks, but CI passes because only A was tested
- **Cause:** Simple change detection without dependency graph resolution
- **Consequence:** Broken packages merged to main, breaking downstream consumers
- **Better:** Resolve dependency graph and test transitive dependents

### Mistake 2: Overly Aggressive Caching
- **Description:** Using stale Composer cache that doesn't reflect new dependencies
- **Cause:** Cache key not including composer.lock hash
- **Consequence:** Tests pass with cached dependencies but fail with fresh install
- **Better:** Include `composer.lock` hash in cache key. Periodically clear cache.

### Mistake 3: Ignoring Shared Infrastructure Changes
- **Description:** CI config, Docker files, test helpers change but don't trigger full test suite
- **Cause:** Change detection only monitors package directories
- **Consequence:** Infrastructure changes break packages but are not caught
- **Better:** Include shared infrastructure paths in change detection scope

### Mistake 4: Slow Package Holding Up Pipeline
- **Description:** One package's tests take 15 minutes while all others take 2 minutes
- **Cause:** No test suite optimization for slow packages
- **Consequence:** Pipeline time determined by slowest package
- **Better:** Identify and optimize slow test packages. Move slow tests to nightly.

## Anti-Patterns

- **The Full Suite on Every Commit:** Running all packages' tests on every PR. CI takes 45 minutes, developers wait or merge without CI. Implement change-aware testing.
- **The No-Cache Pipeline:** Every CI run does a clean `composer install` without caching. Wastes 30-60 seconds per run on package downloads. Implement Composer caching.
- **The False Negative Machine:** Change detection is so aggressive that packages break silently. Balance speed with safety by testing dependents and running full suite nightly.
- **The Hidden Failure:** CI passes for each package individually, but combined integration fails. Add a combined integration test step that runs all packages together.

## Examples

### Example 1: Change-Aware CI Pipeline
```yaml
name: Monorepo CI
jobs:
  setup:
    runs-on: ubuntu-latest
    outputs:
      changed-packages: ${{ steps.filter.outputs.changes }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            package-a: 'packages/package-a/**'
            package-b: 'packages/package-b/**'
            shared: '.github/**'

  test:
    needs: setup
    if: needs.setup.outputs.changed-packages != '[]'
    strategy:
      matrix:
        package: ${{ fromJson(needs.setup.outputs.changed-packages) }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
      - run: composer install
        working-directory: packages/${{ matrix.package }}
      - run: vendor/bin/phpunit
        working-directory: packages/${{ matrix.package }}

  nightly-full-suite:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package: [package-a, package-b, package-c]
    steps:
      # Full test suite for all packages
      - run: vendor/bin/phpunit
```

### Example 2: Dependency Graph Resolution
```php
// scripts/resolve-affected-packages.php
// Given: ['packages/core'] (changed packages)
// Parse all composer.json files to build dependency graph
// Resolve: packages that depend on 'packages/core'
// Output: ['packages/core', 'packages/admin', 'packages/api']
// This matrix is consumed by CI test jobs
```

## Related Topics

- **laravel-monorepo-tools:** Monorepo tooling for package management
- **shared-library-extraction-patterns:** Package dependencies in extracted libraries
- **composer-path-repository-usage:** Path repository resolution in CI
- **dependency-management-across-monorepo:** Version alignment strategy
- **github-actions-for-laravel:** GitHub Actions workflow design

## AI Agent Notes

- **Context Requirements:** When advising on monorepo CI, first understand the number of packages, dependency relationships, current CI duration, and available CI resources. The optimization strategy depends heavily on these factors.
- **Key Decision Points:** Change detection tooling, dependency resolution depth (direct vs transitive), test level selection, cache strategy, merge queue usage.
- **Common Pitfalls in AI Assist:** Don't recommend skipping dependent package testing. Always include shared infrastructure in change detection. Remember that nightly full suites are a safety net, not optional.
- **Laravel-Specific Nuances:** Composer's dependency resolution adds complexity not present in JS monorepos. The "affected packages" pattern originated in Google/Facebook and was popularized by Nx—concepts translate to Laravel.

## Verification

- [ ] KU accurately defines monorepo CI optimization strategies
- [ ] Core concepts cover change detection, dependency graph, selective testing
- [ ] When To Use / When NOT To Use provides clear guidance
- [ ] Best practices emphasize dependent testing and nightly full suites
- [ ] Architecture guidelines cover detection, resolution, matrix generation
- [ ] Performance targets are quantified (under 10 min)
- [ ] Security covers cache, secrets, and dependency audit
- [ ] Common Mistakes include cause/consequence/better
- [ ] Anti-patterns identify full suite on every commit
- [ ] Examples show change-aware CI pipeline
- [ ] Related topics cross-reference is accurate
- [ ] AI Agent Notes provide actionable guidance
