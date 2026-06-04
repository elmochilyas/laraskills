# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Test Framework & Runner Infrastructure |
| Knowledge Unit | Test Suite Profiling |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Pest/PHPUnit fundamentals, Test suite organization |
| Related KUs | N+1 query detection, Parallel test execution |
| Source | domain-analysis.md K058 |

# Overview

Test suite profiling identifies slow tests, hot files, and performance bottlenecks in the test suite. Laravel's `--profile` flag and Pest's built-in profiler show per-test execution times, enabling targeted optimization. A 10-minute test suite with 3 slow tests spending 8 minutes of that time is common—profiling reveals which tests to optimize, split, or mark as slow. Without profiling, teams optimize blindly and miss the highest-impact changes.

# Core Concepts

- **Per-test timing**: Each test's wall-clock time from `setUp()` to `tearDown()`. Includes application boot, database operations, and assertion evaluation.
- **`--profile` flag**: Available in both `php artisan test --profile` and `vendor/bin/pest --profile`. Outputs top-N slowest tests with execution times.
- **Slow test threshold**: Tests exceeding a configurable threshold (default 500ms) are flagged. Configurable via `phpunit.xml`.
- **Profiling granularity**: Test-level timing (per `it()`/`test()` block), not assertion-level.
- **Output formats**: CLI table (terminal), JUnit XML (CI integration), or custom formatters.
- **Warm vs cold test times**: First run after cache clear is always slower. Profile warm runs for optimization targets.

# When To Use

- Optimizing test suite execution time in CI
- Identifying slow tests for quarantine or optimization
- Establishing performance baselines for the test suite
- Monitoring test suite performance trends over time
- Before and after a major refactoring effort

# When NOT To Use

- For assertion-level performance analysis (use Xdebug or Tideways)
- On every single CI run if test suite is small (<100 tests)
- As a replacement for benchmarking (profiling = current state, benchmarking = comparison)
- When test suite timing is not a concern

# Best Practices (WHY)

- **Profile warm runs, not cold runs**: Reason: first-run timing includes cache population. Warm runs reflect real CI performance after caching.
- **Track p95 execution time over time**: Reason: a suite that was 3 minutes and is now 6 minutes has a problem, even if individual tests are still fast.
- **Use Pareto principle—optimize the top 20%**: Reason: 80% of suite time comes from 20% of tests. Focus on the slowest tests first.
- **Profile before optimizing**: Reason: assumptions about which tests are slow are often wrong. Always profile first.
- **Store JUnit XML as CI artifacts**: Reason: enables trend tracking and historical comparison.
- **Combine profiling with query count expectations**: Reason: slow tests are often slow due to N+1 queries or excessive database operations.

# Architecture Guidelines

- **CI integration**: Parse JUnit XML output for automated slow test tracking. Most CI platforms have built-in test reporting that shows timing.
- **Threshold configuration**: Set `slowThreshold` in `phpunit.xml` to match team's acceptable test speed. Start at 500ms, adjust based on suite profile.
- **Slow test quarantine**: Isolate tests exceeding a time threshold to a separate CI job. Fast feedback from main suite; slow tests analyzed separately.
- **Trend monitoring**: Schedule a weekly CI run with `--profile --verbose`. Report changes to the team.

# Performance Considerations

- **Profiling overhead**: `--profile` adds negligible overhead (~0.1%). Safe to run on every CI execution.
- **Output volume**: `--profile --verbose` produces significantly more output. Use JUnit XML for CI.
- **Memory impact**: Profiling stores per-test timing in memory until test suite completes. For 10,000+ test suites, memory peaks at ~5MB for timing data.
- **Parallel profiling**: `--profile` works with `--parallel`. Each worker reports its own slow tests. Parent process aggregates.

# Security Considerations

- **CI artifact storage**: JUnit XML files may contain test data that reveals application structure. Restrict access in CI configuration.
- **Performance data exposure**: Test timing data could reveal information about application performance characteristics. Treat as internal data.

# Common Mistakes

**Mistake: Profiling a single run in isolation**
- Description: Making optimization decisions based on one profile run
- Cause: Test times vary due to system load, OpCache state
- Consequence: Optimizing based on an outlier run
- Better: Run profiling 3 times and take median values.

**Mistake: Ignoring database test overhead**
- Description: Optimizing non-database code while 80% of time is in DB operations
- Cause: Not correlating profile results with query counts
- Consequence: Optimizing the wrong bottleneck
- Better: Profile with `expectsDatabaseQueryCount` to correlate slow tests with N+1 queries.

**Mistake: Optimizing before profiling**
- Description: Making assumptions about which tests are slow
- Cause: Intuition rather than data
- Consequence: Time spent optimizing tests that contribute 2% to total time
- Better: Always profile first; optimize the top 5 slow tests.

# Anti-Patterns

- **Ignoring profile output**: Running `--profile` but never acting on the results.
- **Over-optimizing fast tests**: Spending effort to make a 5ms test into a 4ms test.
- **Removing valuable slow tests**: Deleting slow tests that provide critical regression coverage. Optimize, don't remove.
- **Single-metric focus**: Only looking at total suite time without considering individual test value.

# Examples

**Basic profiling command**
```bash
php artisan test --profile
php artisan test --profile --top=20
vendor/bin/pest --profile
```

**JUnit XML output for CI**
```bash
php artisan test --parallel --profile --log-junit=test-results.xml
```

**Slow threshold configuration in phpunit.xml**
```xml
<phpunit>
    <parameters>
        <parameter name="slowThreshold" value="500"/>
    </parameters>
</phpunit>
```

**PHPUnit test timing parsing (pseudo-code)**
```php
$xml = simplexml_load_file('test-results.xml');
foreach ($xml->testsuite->testcase as $test) {
    if ((float) $test['time'] > 0.5) {
        echo "Slow test: {$test['name']} - {$test['time']}s";
    }
}
```

# Related Topics

- N+1 query detection
- Slow query identification
- Parallel test execution
- Database query count expectations
- Test suite organization

# AI Agent Notes

- Always include `--profile` in generated CI configurations. The overhead is negligible and the data is valuable.
- When generating test code, avoid creating intentionally slow tests. Use `#[UnitTest]` for framework-less tests.
- For database tests, always include `expectsDatabaseQueryCount` to prevent N+1 query regressions.
- Profile output should be reviewed during code review for test files that add significant execution time.

# Verification

- [ ] `--profile` is configured in the CI pipeline
- [ ] Slow test threshold is configured in `phpunit.xml`
- [ ] JUnit XML output is stored as CI artifacts
- [ ] Top 5 slowest tests are reviewed quarterly
- [ ] Test suite execution time is tracked over time (p95 metric)
- [ ] Slow tests are quarantined or optimized, not removed
- [ ] Profiling is performed on warm runs (after cache population)
