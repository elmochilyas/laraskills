# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Test Suite Profiling
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Test suite profiling identifies slow tests, hot files, and performance bottlenecks in the test suite. Laravel's `--profile` flag and Pest's built-in profiler show per-test execution times, enabling targeted optimization. A 10-minute test suite with 3 slow tests spending 8 minutes of that time is common—profiling reveals which tests to optimize, split, or mark as slow. Without profiling, teams optimize blindly and miss the highest-impact changes.

# Core Concepts
- **Per-test timing**: Each test's wall-clock time from `setUp()` to `tearDown()`. Includes application boot, database operations, and assertion evaluation.
- **`--profile` flag**: Available in both `php artisan test --profile` and `vendor/bin/pest --profile`. Outputs top-N slowest tests with execution times.
- **Slow test threshold**: Tests exceeding a configurable threshold (default 500ms) are flagged. Configurable via `phpunit.xml` `<parameter name="slowThreshold" value="500"/>`.
- **Profiling granularity**: Test-level timing (per `it()`/`test()` block), not assertion-level. For assertion-level timing, use Xdebug profiling or Tideways.
- **Output formats**: CLI table (terminal), JUnit XML (CI integration), or custom formatters.
- **Warm vs cold test times**: First run after cache clear is always slower (config loading, route registration). Subsequent runs are faster. Profile warm runs for optimization targets.

# Mental Models
- **Pareto principle in testing**: 80% of total test suite time comes from 20% of tests. Profile to find that 20%.
- **Test speed vs test value**: A test that takes 5 seconds but catches critical regressions is more valuable than 50 fast tests that test trivial logic. Profile to identify, not just optimize.
- **Cold vs warm execution**: Test times vary based on OpCache status, filesystem cache, and database connection pooling. Measure multiple runs for reliable data.
- **Trend monitoring**: Track p95 test execution time over time. A suite that was 3 minutes last month and is 6 minutes now has a problem, even if individual tests are still fast.

# Internal Mechanics
- **`--profile` timing**: PHPUnit's `TestRunner` hooks into `startTest()` and `endTest()` callbacks. Elapsed time is measured via `hrtime(true)` (monotonic clock, nanosecond precision).
- **Slow threshold reporting**: Tests exceeding `slowThreshold` are reported as "slow" in output. The threshold is checked at the PHPUnit level; Pest passes it through.
- **Output buffering overhead**: Profiling adds ~0.1% runtime overhead per test (start/stop timer calls). Negligible for CI runs.
- **XML JUnit profiling**: The `time` attribute on JUnit XML `<testcase>` elements contains per-test execution time in seconds. CI tools parse this for trend tracking.
- **`--compact-timing`**: Pest's compact timing mode shows a timeline of test execution, helping identify parallel execution bottlenecks.

# Patterns
- **Pattern: Profile-on-fail CI pipeline**
  - Purpose: Capture slow test data from every CI run without manual profiling
  - Benefits: Continuous performance data, trend detection
  - Tradeoffs: Adds ~$0.01/minute to CI storage costs for XML
  - Implementation: Store JUnit XML as CI artifact; parse `time` attributes for trend reporting

- **Pattern: Slow test quarantine**
  - Purpose: Isolate tests that exceed a time threshold to a separate CI job
  - Benefits: Fast feedback from the main suite; slow tests don't block PRs
  - Tradeoffs: Slow tests may be ignored and never optimized
  - Implementation: Run `--profile`, capture slow tests, add `@group slow` automatically, run slow group in separate CI pipeline

- **Pattern: Weekly profiling review**
  - Purpose: Proactive optimization before suite becomes unmanageably slow
  - Benefits: Team awareness of test performance as a metric
  - Tradeoffs: Requires dedicated time; can become ritual without action
  - Implementation: Schedule a weekly CI run with `--profile --verbose`, report changes to team

# Architectural Decisions
- **Pest `--profile` vs raw PHPUnit profiling**: Pest `--profile` provides cleaner output. For raw data extraction, parse JUnit XML from PHPUnit.
- **CI artifact storage vs database logging**: Store JUnit XML as CI artifacts (simple). For cross-build trends, parse and insert into a database table.
- **Slow test threshold tuning**: Start with 500ms default. For suites with many database tests, raise to 1s. For unit-test-heavy suites, lower to 200ms.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Identifies optimization targets quickly | Profiling adds ~0.1% overhead per test run | Not meaningful; keep always on |
| Trend tracking catches regressions early | Requires CI artifact storage and trend analysis tool | Set up automated JUnit XML parsing |
| Slow test quarantine maintains CI speed | Quarantined tests may be ignored | Automatically un-quarantine after N successful runs |
| Per-test timing data is granular | No assertion-level timing | Use Xdebug or Tideways for deeper analysis |

# Performance Considerations
- **Profiling overhead**: `--profile` adds negligible overhead (~0.1%). Safe to run on every CI execution.
- **Output volume**: `--profile --verbose` produces significantly more output. Use JUnit XML for CI to avoid terminal buffer issues.
- **Memory impact**: Profiling stores per-test timing in memory until test suite completes. For 10,000+ test suites, memory usage peaks at ~5MB for timing data.
- **Parallel profiling**: `--profile` works with `--parallel`. Each worker reports its own slow tests. Parent process aggregates.

# Production Considerations
- **CI integration**: Parse JUnit XML output for automated slow test tracking. Most CI platforms (GitHub Actions, GitLab CI) have built-in test reporting that shows timing.
- **Benchmarking vs profiling**: Profiling measures current performance. Benchmarking compares performance across versions. Use profiling for optimization, benchmarks for regression detection.
- **Threshold configurability**: Set `slowThreshold` in `phpunit.xml` to match team's acceptable test speed. Adjust as suite evolves.
- **Developer workflow**: `php artisan test --profile --top=20` during development to see if added tests are reasonable.

# Common Mistakes
- **Mistake: Profiling a single run in isolation**
  - Why: Test times vary due to system load, OpCache state
  - Why harmful: Optimizing based on an outlier run
  - Better: Run profiling 3 times and take median values

- **Mistake: Ignoring database test overhead**
  - Why: Database-heavy tests dominate profiles
  - Why harmful: Optimizing non-database code while 80% of time is in DB operations
  - Better: Profile with `expectsDatabaseQueryCount` to correlate slow tests with N+1 queries

- **Mistake: Optimizing before profiling**
  - Why: Assumption about which tests are slow without data
  - Why harmful: Time spent optimizing tests that contribute 2% to total time
  - Better: Always profile first; optimize the top 5 slow tests

# Failure Modes
- **Timer drift on long-running suites**: Monotonic clock (`hrtime`) is immune to system clock adjustments. No drift concerns for test suites <1 hour.
- **Parallel profile aggregation failure**: In rare cases, worker output may not include timing data. Check JUnit XML for complete timing.
- **Test time inflation from profiling**: Profiling adds negligible overhead. If concerned, verify with `--no-profile` timing comparison.
- **JUnit XML time attribute precision**: Times are in seconds with microsecond precision. For sub-millisecond tests, precision may be limited.

# Ecosystem Usage
- **Laravel artisan test**: `php artisan test --profile` includes the `--profile` integration built into Laravel's test runner.
- **Pest**: `--profile` flag produces a clean sorted table of slowest tests.
- **PHPUnit**: Raw `--verbose` output includes test durations. JUnit XML always includes timing.
- **CI platforms**: GitHub Actions renders test timing from JUnit XML. GitLab CI shows test duration trends.

# Related Knowledge Units
- **Prerequisites**: Pest/PHPUnit fundamentals, Test suite organization
- **Related Topics**: N+1 query detection, Slow query identification, Parallel test execution
- **Advanced Follow-up**: Xdebug profiling integration, Tideways continuous profiling

# Research Notes
- Pest 4's `--profile` now shows timeline visualization, not just sorted list
- `--compact-timing` is useful for identifying parallel distribution bottlenecks
- CI trend tracking of test suite time is a leading indicator of technical debt growth
