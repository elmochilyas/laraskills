# Metadata
- **Domain:** Testing & Reliability Engineering
- **Subdomain:** CI/CD Pipeline Integration
- **Knowledge Unit:** CI Test Execution
- **KU Code:** ku-05-ci-test-execution
- **Last Updated:** 2026-06-02

---

# Executive Summary
CI test execution covers how test suites are run in continuous integration pipelines: parallel sharding, matrix builds across PHP/database variants, path-based triggering to run only relevant tests, quality gates (coverage, static analysis), artifact caching, and profiling for trend tracking. Without deliberate CI design, test suites degrade into slow, unreliable feedback loops. Industry standard (2026) is a staged pipeline: lint → static analysis → tests (parallel) → deploy, with matrix strategies and JUnit XML artifact storage for trend analysis.

---

# Core Concepts
- **Parallel sharding:** Splitting test files across CI runners via `--shard=N/M` so multiple runners finish faster than one.
- **Matrix testing:** Running the test suite across combinations of PHP versions and database engines (e.g., PHP 8.3 + MySQL, PHP 8.4 + PostgreSQL).
- **Path-based triggering:** CI `paths:` filters that restrict pipeline execution to tests relevant to the changed files.
- **Quality gates:** Enforceable thresholds (coverage min, PHPStan level, Pint compliance) that block merges when violated.
- **Artifact caching:** Persisting `vendor/`, `node_modules/`, and compiled views/configs across CI runs via lock-file-based cache keys.
- **Slow test quarantine:** Isolating tests that exceed a time threshold into a separate CI job so the main suite stays fast.
- **Test suite time budget:** A team-agreed maximum wall-clock time for the CI test stage (e.g., <10 minutes).

---

# Mental Models
- **Pareto in testing:** 80% of total suite time comes from 20% of tests. Profile before optimizing — the obvious slow test is rarely the true bottleneck.
- **Pipeline as assembly line:** Each stage (lint, static analysis, test) adds quality; a failure in an early stage stops the line so no time is wasted on later stages.
- **Cache as pre-heat:** CI caching is analogous to warming an engine before a race. A cold CI run wastes 2-5 minutes on setup that cache eliminates.
- **Shard as divide-and-conquer:** A 30-minute test suite sharded 6 ways becomes a 5-minute suite. The constraint is the slowest shard, not total time.

---

# Internal Mechanics
- **`--profile`:** Each test's wall-clock time is captured from setUp to tearDown. Output sorted by descending time. Negligible overhead (~0.1%).
- **Parallel sharding:** Pest/PHPUnit distributes test files across workers. Laravel's `--parallel` uses Paratest. Each worker runs independently with its own database connection.
- **JUnit XML:** Standardized format (`<testcase name="..." time="...">`) parsed by CI platforms (GitHub Actions, GitLab CI) for timing dashboards.
- **Cache key composition:** Typically `composer.lock` hash + PHP version hash. Invalidated when dependencies change.

---

# Patterns
- **Staged CI pipeline:** Lint (Pint) → Static analysis (PHPStan) → Tests (parallel) → Coverage → Deploy.
- **Slow test quarantine:** Fast tests block PRs immediately; slow tests run as separate non-blocking job with trend tracking.
- **Profile-on-every-run:** `--profile` runs on every CI execution. JUnit XML stored as CI artifact for trend analysis.
- **Warm-cache run pattern:** First CI step installs deps, caches vendor, warms config/view cache. Subsequent steps reuse cached state.

---

# Architectural Decisions
| Decision | Rationale |
|----------|-----------|
| Matrix PHP × DB variants | Catches engine-specific bugs (JSON, collation, transaction semantics) |
| Path-based triggers over full suite on every push | Reduces CI time for monorepos by 40-70% |
| JUnit XML over plain text output | Enables CI dashboard trend tracking |
| Slow test quarantine over `--exclude-group=slow` | Non-blocking isolation; slow tests still run but don't delay PRs |

---

# Tradeoffs
| Tradeoff | Pros | Cons |
|----------|------|------|
| Matrix testing (4+ variants) | Catches engine/version bugs | 4× CI minutes per run; can delay feedback |
| Path-based triggering | Faster feedback for focused changes | Misses cross-boundary regressions |
| Parallel sharding | Linear speedup up to worker count | Setup complexity; database isolation needed |
| Always-on profiling | Rich trend data | ~0.1% overhead; noise in small suites |

---

# Performance Considerations
- **Profiling overhead:** ~0.1%. Safe to always enable.
- **Cold vs warm runs:** Cold CI (no cache) adds 2-5 minutes for dependency install + compilation. Cache reduces this to <30s.
- **Shard imbalance:** One slow test file at 5 minutes blocks a shard while other shards finish in 1 minute. Use `--shard` with even file distribution.
- **Database per worker:** Each parallel worker needs its own database/connection. Laravel handles this with process-specific DB naming.

---

# Production Considerations
- **CI artifact retention:** JUnit XML artifacts contain test data (model IDs, attribute values). Set retention policy (30-90 days typical).
- **Secret injection:** Database passwords, API keys come from CI secrets, not committed `.env` files.
- **Coverage report access:** Coverage HTML reports may reveal code structure. Restrict access in CI artifact storage.
- **Path trigger validation:** Ensure `paths:` patterns are correct to avoid skipping security-critical tests.

---

# Common Mistakes
- **Optimizing before profiling:** Guessing which tests are slow instead of measuring.
- **No suite time budget:** Letting CI test time creep from 5 min to 30 min over months without alerting.
- **Blind `--min` coverage:** Setting 80% coverage without ensuring meaningful paths are covered.
- **No CI caching:** Wasting 2-5 min per run on cold dependency install.
- **Monolithic CI job:** Running all stages (lint, tests, deploy) sequentially in one job.

---

# Failure Modes
- **Flaky tests in CI:** Non-deterministic failures erode trust. Quarantine or fix before they block merges.
- **Cache poisoning:** Stale cache (outdated vendor, stale config) causes false positives/negatives. Pin cache keys to lock file hashes.
- **Shard timeout:** One shard hitting CI timeout (6h default) due to test leak. Set per-shard timeout limits.
- **Matrix explosion:** 4 PHP × 4 DB × 3 shards = 48 jobs. Unnecessary matrix dimensions waste CI credits. Limit to production-relevant variants plus one additional.

---

# Ecosystem Usage
- **Pest:** `pest --profile --parallel --shard=1/4`
- **PHPUnit:** `phpunit --verbose --coverage-text --log-junit junit.xml`
- **GitHub Actions:** `shivammathur/setup-php`, matrix strategies, `actions/cache`
- **GitLab CI:** Parallelization via `parallel: 5`, JUnit report parsing
- **CircleCI:** Test splitting via `circleci tests split`, parallelism key

---

# Related Knowledge Units
- ku-01-ci-cd-pipeline (CI/CD pipeline design)
- ku-03-parallel-sharding (Parallel test sharding)
- ku-04-matrix-testing (Matrix CI testing)
- ku-06-flaky-test-detection (Flaky test detection)
- ku-07-path-based-triggering (Path-based CI triggering)
- ku-08-quality-gates (Quality gates enforcement)

---

# Research Notes
- Benjamin Crozat (2026): "Always profile before optimizing test suites — teams consistently guess wrong about which tests are slow."
- Steven Richardson (2025): GitHub Actions matrix testing for Laravel: include only production-equivalent DB engines; SQLite-only CI creates production blind spots.
- Ahmed Nagi (2026): Parallel test sharding with `find` command gives 3-4× speedup on typical Laravel suites.
- Pest documentation (2026): `--profile` flag available in both `pest` and `php artisan test` commands.
