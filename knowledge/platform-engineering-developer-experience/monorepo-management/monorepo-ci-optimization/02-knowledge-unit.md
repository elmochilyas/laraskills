# Knowledge Unit: Monorepo CI Optimization

## Metadata
- **Subdomain:** Monorepo Management
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** monorepo-management/monorepo-ci-optimization
- **Maturity:** Maturing
- **Related Technologies:** GitHub Actions, GitLab CI, symplify/monorepo-split, Composer

## Executive Summary

Monorepo CI optimization addresses the challenge that a single commit can change multiple packages, potentially triggering test suites for all packages. Without optimization, monorepo CI pipelines can take 30-60 minutes to complete. The core strategies are: change detection (only test packages affected by the PR), dependency graph resolution (test packages that changed AND packages that depend on changed packages), selective test execution (run unit tests for affected packages, full integration tests less frequently), and parallelized builds (run independent package tests concurrently). For Laravel monorepos specifically, Composer dependency resolution across packages adds complexity that must be managed in CI.

## Core Concepts

- **Change Detection:** Determining which packages have been modified in a given commit, branch, or PR, using Git diff or file path filtering
- **Dependency Graph Testing:** When Package A changes, also test Package B (which depends on A) and Package C (which depends on B); transitive dependency testing catches cross-package breakage
- **Selective Test Matrix:** Running different levels of testing based on the scope of changes: unit tests for all changed packages, integration tests for packages with infrastructure changes, full test suite on schedule or before release
- **Parallel Package Testing:** Running independent packages' test suites in parallel CI jobs; dependent packages wait for their dependencies to pass first

## Mental Models

- **Monorepo CI as a Directed Acyclic Graph:** Package changes propagate through the dependency graph; CI should mirror this propagation, testing all potentially affected packages
- **CI as a Gate:** Only green CI means the monorepo is in a consistent state; partial CI (only testing changed packages) is a weaker gate than full CI but is faster
- **Change Detection as a Filter:** Not every commit needs to trigger every test; change detection filters the noise, focusing CI resources on what actually changed
- **Dependency Graph as an Impact Map:** When package A changes, the dependency graph shows exactly which other packages might be affected; this guides test selection

## Internal Mechanics

1. **Change Detection Implementation:** GitHub Actions: `dorny/paths-filter` or `tj-actions/changed-files` reads the git diff and sets output variables for which packages changed. GitLab CI: `rules:changes` directive with file path patterns.
2. **Dependency Resolution:** Parse `composer.json` files across the monorepo to build the dependency graph; when `packages/admin/composer.json` requires `packages/core`, and `packages/core` changed, then `packages/admin` must also be tested.
3. **Job Matrix Generation:** A CI "setup" job detects changes, resolves dependencies, and generates a JSON job matrix that defines which packages to test. This matrix is consumed by subsequent test jobs.
4. **Artifact Caching:** Composer vendor directories are cached per-PHP-version per-package; cache keys include `composer.lock` hashes to invalidate on dependency changes.
5. **Parallel Execution:** CI workers run independent package tests in parallel; the total CI time is determined by the slowest package in the dependency chain, not the sum of all packages.

## Patterns

- **Baseline + Changed Tests Pattern:** Run a baseline test suite (linting, static analysis) on all packages, then run full test suites only on changed packages and their dependents. This catches style violations globally while running expensive tests only where needed.
- **Dependency-Aware Filter Pattern:** Instead of testing only changed packages, resolve the dependency graph and test: changed packages + packages that depend on changed packages + packages that depend on those packages (transitive closure).
- **Scheduled Full Test Pattern:** Run change-aware CI on every commit; run the full test suite (all packages, all PHP/Laravel versions) on a schedule (nightly) and before releases. This balances speed and safety.
- **Composer Lock per Package Pattern:** Maintain separate `composer.lock` files for each package to isolate dependency changes; CI uses the package-specific lock file unless overridden.
- **Merge Queue Pattern:** Use GitHub merge queues or GitLab merge trains to batch commits and run CI once on the merged result; this prevents CI thrashing from many small commits.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Change detection granularity | Package-level vs file-level | Package-level (changes to package directory → test that package) |
| Dependency resolution depth | Direct dependencies vs transitive closure | Direct + one level of transitive; full transitive is too expensive |
| CI triggers | Every push vs PR only vs schedule | PR + push to main; full suite nightly |
| Test execution order | Dependency-order vs parallel vs blocked | Parallel for independent packages; blocked for dependent packages |
| Cache strategy | Per-package vs shared vendor | Per-package for isolation; shared vendor for speed (with careful invalidation) |

## Tradeoffs

- **Speed vs Safety:** Change-aware CI is fast (testing only what changed) but may miss cross-package interaction bugs. Full CI is comprehensive but slow. The tradeoff depends on package coupling: tightly coupled packages need more comprehensive testing.
- **Granular Filters vs Simple Filters:** Package-level filters are simple to implement but may miss changes in shared infrastructure (CI config, shared Docker images, shared test helpers). File-level filters are more precise but harder to configure.
- **Cached vs Fresh Dependencies:** Caching Composer dependencies speeds CI but can mask dependency issues (e.g., a removed package still in cache). Periodically clear the cache and run with fresh dependencies.
- **Merge Queue Complexity vs Developer Velocity:** Merge queues ensure the monorepo is always in a consistent state but can delay merging by several minutes. For small teams, direct merging with CI check is sufficient.

## Performance Considerations

- **CI Pipeline Duration:** Target < 10 minutes for the main CI pipeline (change detection + test execution). Implement parallel test jobs and caching to stay under this threshold.
- **Composer Install Time:** The biggest contributor to CI time. Optimize by: caching `vendor/`, using `composer install --prefer-dist`, running `composer install` once at root level, and using path repositories to avoid remote resolutions.
- **Test Database Setup:** For packages with database tests, use SQLite in-memory for CI speed; seed databases only with necessary test data. Avoid MySQL/PostgreSQL for CI unless dialect-specific testing is required.
- **Job Distribution Overhead:** For monorepos with 10+ packages, the overhead of spawning and distributing CI jobs can add 1-3 minutes. Batch small packages into a single job to reduce overhead.

## Production Considerations

- **CI Reliability:** Change detection mechanisms can fail (e.g., false negatives where a change isn't detected). Implement a fallback: if change detection is uncertain, run the full suite.
- **Dependency Graph Validation:** Validate that the package dependency graph is acyclic and consistent in CI; circular dependencies or unresolvable version conflicts should fail the build.
- **Composer.lock Consistency:** Ensure the root `composer.lock` is always consistent with all packages' `composer.json` files. Run `composer validate` and `composer install --dry-run` in CI to catch inconsistencies.
- **CI Cost Management:** Monorepo CI with many packages can be expensive (parallel workers, frequent runs). Use cost optimization: run full suites only on main branch and PRs to main; skip CI for documentation-only changes.

## Common Mistakes

- **Not testing dependent packages:** Package A changes, Package B (which depends on A) breaks, but CI passes because only A was tested; always resolve the dependency graph
- **Overly aggressive caching:** `composer install` uses cache from a previous lock file that doesn't reflect new dependencies; invalidate cache on `composer.lock` changes
- **Ignoring shared infrastructure:** CI config, Docker files, or shared test helpers change, affecting all packages, but only changed packages are tested; include shared files in the change detection scope
- **Parallel job timeout differences:** One package's tests take 15 minutes while all others take 2 minutes; the slow package determines the pipeline time. Identify and optimize slow test packages
- **Not testing the split:** CI passes in the monorepo, but the split package is broken (e.g., missing file in the split configuration). Add a CI step that validates the split output

## Failure Modes

- **False Negative in Change Detection:** A change to a shared trait or helper is not detected by package-level filters, and affected packages aren't tested. Mitigate: use file-level filters for shared infrastructure; monitor for undetected breakage patterns.
- **Dependency Graph Cycle:** Circular dependency between packages causes infinite test propagation. Mitigate: enforce acyclic dependency graph in CI using automated validation.
- **Cache Poisoning:** Corrupted Composer cache causes spurious test failures. Mitigate: periodic full-cache-invalidation CI runs; validate cache integrity before use.
- **CI Matrix Explosion:** 10 packages × 4 PHP versions × 3 Laravel versions = 120 CI jobs. Mitigate: reduce matrix to LTS-only combinations; use a "min and max" strategy instead of full matrix.

## Ecosystem Usage

- **Laravel Framework (indirect):** Laravel doesn't monorepo but provides example of coordinated multi-package CI with change-aware testing
- **Symfony:** Uses monorepo CI with change detection, dependency graph resolution, and split testing—the reference implementation for PHP monorepos
- **Nx (JavaScript):** Reference for monorepo CI optimization patterns (affected graph computation, parallel distribution, computation caching); many concepts translate to Laravel monorepos
- **Turborepo (JavaScript):** Pioneered "remote caching" for monorepo CI; the concept of caching test outputs across CI runs is applicable to Laravel monorepos

## Related Knowledge Units

- laravel-monorepo-tools
- shared-library-extraction-patterns
- composer-path-repository-usage
- dependency-management-across-monorepo

## Research Notes

- The "affected packages" pattern (testing only packages whose dependency graph has been touched) originated in Google and Facebook's monorepo tooling and was popularized by Nx in the JS ecosystem
- Laravel monorepos face a unique challenge: Composer's dependency resolution doesn't natively support monorepo structures the way npm workspaces or pip editable installs do
- The most successful Laravel monorepo CI setups use a "CI setup job → generate matrix → parallel test jobs" pattern, keeping the pipeline under 10 minutes for 5-15 packages
- Change detection using Git diff with path filtering is more reliable than commit-message-based detection and is the recommended approach
