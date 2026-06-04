# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: CI Test Execution
 KU Code: ku-05-ci-test-execution
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Test suite profiling identifies slow tests, hot files, and performance bottlenecks in the test suite. Laravel's `--profile` flag and Pest's built-in profiler show per-test execution times, enabling targeted optimization. A 10-minute test suite with 3 slow tests spending 8 minutes of that time is common — profiling reveals which tests to optimize, split, or mark as slow. CI test execution strategies include parallel sharding, matrix builds, path-based triggering, and quality gates. Without profiling and CI optimization, teams optimize blindly and miss the highest-impact changes.

# Core Concepts
- **Per-test timing**: Each test's wall-clock time from setUp to tearDown.
- **`--profile` flag**: Available in `php artisan test --profile` and `vendor/bin/pest --profile`. Outputs top-N slowest tests.
- **Slow test threshold**: Configurable (default 500ms). Tests exceeding threshold are flagged.
- **Pareto principle in testing**: 80% of total test suite time comes from 20% of tests.
- **CI test stages**: Lint → Static analysis → Tests (parallel) → Coverage → Deploy.
- **Parallel sharding**: Splitting tests across multiple CI runners for faster execution.
- **Matrix testing**: Running tests across PHP version × database engine combinations.
- **Path-based triggering**: Running only tests relevant to changed files.

# When To Use
- Identifying slow tests for optimization in any test suite
- CI pipelines where test execution time is a bottleneck
- Setting up performance budgets for test suites (p95 time targets)
- Before and after major refactors to measure test performance impact
- Tracking test suite health trends over time (weekly/monthly comparisons)

# When NOT To Use
- Single-test debugging sessions (use `--filter` instead)
- Test suites under 50 tests (profile noise exceeds signal)
- When immediate test results are needed and profiling overhead is unacceptable
- As a replacement for understanding test logic (profile identifies symptoms, not causes)

# Best Practices (WHY)
- **Always profile before optimizing tests**: Reason: teams often guess which tests are slow and optimize the wrong ones. Profile data reveals the actual 20% of tests consuming 80% of time.
- **Profile warm runs for optimization targets**: Reason: cold runs include cache warming (config loading, route registration) that won't be optimized. Warm runs reflect realistic CI-with-cache performance.
- **Use JUnit XML for CI trend tracking**: Reason: JUnit XML includes per-test timing. CI platforms parse this for trend dashboards. Track p95 test time over weeks.
- **Implement slow test quarantine**: Reason: isolate tests exceeding threshold to a separate CI job. Main suite stays fast; slow tests don't block PRs.
- **Combine `--profile` with `--parallel`**: Reason: parallel profiling reveals distribution imbalances. A 30-second file blocks all workers; splitting it to 3×10-second files improves throughput.
- **Run profiling on every CI execution**: Reason: profiling adds ~0.1% overhead. The data is valuable for trend detection. Store JUnit XML as CI artifacts.
- **Set a test suite time budget**: Reason: "The test suite must complete in under 10 minutes" forces teams to address slowdowns proactively rather than reactively.

# Architecture Guidelines
- **CI pipeline stages**: Lint (Pint, 1-2 min) → Static analysis (PHPStan, 2-5 min) → Tests (parallel, variable) → Coverage (1-2 min) → Deploy.
- **Matrix strategy**: PHP versions (8.3, 8.4) × Database engines (SQLite, MySQL, PostgreSQL). Use `include` for additional variants.
- **Parallel sharding**: Distribute test files across CI matrix cells. Each cell runs a subset of tests in parallel.
- **Path-based triggering**: Use `paths:` filters in CI triggers to run only relevant test suites for changed code.
- **Artifact caching**: Cache vendor, node_modules, and build output. Use cache keys based on lock file hashes.
- **Quality gates**: Enforce minimum coverage (`--min=80`), PHPStan level (max), and Pint compliance.

# Performance
- **Profiling overhead**: `--profile` adds ~0.1% runtime overhead. Negligible. Safe to always run.
- **Output volume**: `--profile --verbose` produces significantly more output. Use JUnit XML for CI.
- **Parallel profiling**: Works with `--parallel`. Each worker reports its own slow tests.
- **Memory impact**: Timing data for 10,000 tests ~5MB. Acceptable.
- **CI caching**: Warm OpCache, view cache, and config cache shave 20-40% off CI test time.

# Security
- **CI artifact storage**: JUnit XML artifacts may contain test data. Ensure CI artifact retention policy is configured.
- **Coverage reports**: May reveal code structure. Restrict access to coverage reports in CI.
- **CI secret injection**: Database passwords and API keys come from CI secrets, not committed config.
- **Path-based triggers**: Ensure path patterns are correct to avoid skipping security-critical tests.

# Common Mistakes

**Mistake: Profiling a single run in isolation**
- Description: Optimizing based on one profiling run
- Cause: "The profile shows which tests are slow"
- Consequence: Test times vary due to system load; optimizing based on an outlier run
- Better: Run profiling 3 times and take median values. Profile on dedicated CI runners for consistent results.

**Mistake: Ignoring database test overhead**
- Description: Optimizing non-database code while database operations dominate test time
- Cause: Focus on application code optimization
- Consequence: 80% of test time is in DB operations but effort is spent on PHP optimization
- Better: Profile with `expectsDatabaseQueryCount` to correlate slow tests with N+1 queries.

**Mistake: Optimizing before profiling**
- Description: Making assumptions about which tests are slow
- Cause: "I know which tests are slow without profiling"
- Consequence: Time spent optimizing tests that contribute 2% to total time
- Better: Always profile first. Optimize the top 5 slowest tests. Re-profile to measure impact.

**Mistake: No CI test time budgeting**
- Description: Letting test suite time grow without monitoring
- Cause: "Tests are just slow; nothing to be done"
- Consequence: Suite grows from 5 minutes to 30 minutes over months; CI feedback loop degrades
- Better: Set a suite time budget. Monitor p95 in CI. Alert when budget is exceeded.

# Anti-Patterns
- **Blind `--min` coverage enforcement**: Setting `--min=80` without ensuring the 80% covers meaningful paths. Leads to trivial tests that inflate coverage.
- **No cache strategy**: Running CI without caching vendor, views, or config. Wastes 2-5 minutes per run on setup.
- **Monolithic CI job**: Running lint, static analysis, tests, coverage, and deploy in one job. No parallelization, no early failure feedback.
- **Over-optimizing fast tests**: Spending time optimizing a 200ms test to 150ms while a 5-minute test is ignored.
- **Ignoring flaky tests**: Marking flaky tests as "expected to fail" instead of fixing or quarantining them.

# Examples

**CI profile capture**
```bash
# Capture profile data
php artisan test --profile --format=junit > test-results.xml

# Parse top 10 slowest tests
grep 'time="[0-9]\+\.[0-9]' test-results.xml | sort -t'"' -k2 -rn | head -10
```

**Pest --profile output interpretation**
```
  PASS  Tests\Feature\UserTest
  ✓ it lists users
  ✓ it creates users  0.45s  ⬇
  ✓ it shows user     2.30s  ⬇  ← slow test
  ✓ it deletes users  0.12s

  Slow tests: 1/4 (25%)
  Total time: 3.12s
  Slowest: Tests\Feature\UserTest > it shows user  2.30s
```

**GitHub Actions test matrix with sharding**
```yaml
jobs:
  tests:
    strategy:
      matrix:
        php: ['8.3', '8.4']
        db: ['sqlite', 'mysql', 'pgsql']
        shard: [1, 2, 3, 4]
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
      - run: php artisan test --parallel --shard=${{ matrix.shard }}/4
```

**Slow test quarantine workflow**
```yaml
jobs:
  fast-tests:
    runs-on: ubuntu-latest
    steps:
      - run: php artisan test --exclude-group=slow

  slow-tests:
    needs: fast-tests
    runs-on: ubuntu-latest
    steps:
      - run: php artisan test --group=slow
```

# Related Topics
- Parallel test execution
- Parallel sharding in CI
- Matrix CI testing
- CI/CD pipeline integration
- N+1 query detection

# AI Agent Notes
- Always include `--profile` in generated CI test commands. The overhead is negligible and the data is valuable.
- When generating CI workflows, include test result artifact upload (JUnit XML) for trend tracking.
- Set `slowThreshold` in `phpunit.xml` to 500ms. Generate a slow test quarantine workflow for tests exceeding it.
- For matrix testing, include at least the PHP version the project uses and the production database engine.
- When generating path-based triggers, include patterns for backend, frontend, and infrastructure changes.
- Cache vendor dependencies using `composer.lock` hash as the cache key.

# Verification
- [ ] `php artisan test --profile` identifies the slowest tests in the suite
- [ ] CI pipeline includes JUnit XML artifact storage for trend tracking
- [ ] Slow test threshold is configured (default 500ms)
- [ ] Test suite has a time budget (e.g., <10 minutes) with alerting when exceeded
- [ ] CI workflow uses matrix testing for relevant PHP/DB variants
- [ ] Parallel sharding distributes tests evenly across CI runners
- [ ] Path-based triggers run only relevant tests for changed code
- [ ] Vendor, view, and config caching is configured in CI
