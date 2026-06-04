# Skill: Profile and Optimize Test Suite Performance

## Purpose
Identify the slowest tests in the suite using Laravel's `--profile` flag, correlate slow tests with database query counts, and optimize the highest-impact files.

## When To Use
- Test suite execution time is increasing and needs optimization
- Before and after a major refactoring to measure impact
- Establishing a performance baseline for the test suite
- CI pipeline where tests have become a bottleneck

## When NOT To Use
- Test suites under 100 tests (profiling data provides minimal value)
- Single-test debugging (focus on that test's logic instead)
- When test suite timing is already acceptable

## Prerequisites
- PHPUnit or Pest configured with `slowThreshold` in `phpunit.xml`
- Ability to write test files with `expectsDatabaseQueryCount()` (for query correlation)

## Inputs
- Test suite size and current wall-clock time
- CI runner specifications
- Historical suite timing data (if available)

## Workflow
1. Run a warm-up pass: `php artisan test` once to populate caches and OpCache
2. Profile on warm cache: `php artisan test --profile --top=20` to identify the 20 slowest tests
3. Export JUnit XML: `php artisan test --parallel --profile --log-junit=test-results.xml`
4. Apply Pareto principle — focus on the top 20% of slowest tests (80% of total time comes from 20% of tests)
5. For each slow test, check database query count using `expectsDatabaseQueryCount()` to identify N+1 issues
6. Split large test files (>50 tests or >5 seconds) into smaller files for better parallel distribution
7. Optimize identified bottlenecks: add eager loading, reduce iterations, mock external services
8. Profile again to verify improvement; repeat steps 4-7 as needed
9. Quarantine tests consistently exceeding 5 seconds to a separate nightly CI job
10. Track p95 suite time over time by storing JUnit XML as CI artifacts

## Validation Checklist
- [ ] Profile run on warm cache, not cold start
- [ ] Top 5 slowest tests identified and analyzed
- [ ] Slow tests correlated with database query counts
- [ ] Large test files split for better parallel distribution
- [ ] p95 suite time tracked and alerting on >20% weekly increase
- [ ] Slow test threshold configured in `phpunit.xml` (500ms default)
- [ ] JUnit XML stored as CI artifacts for trend analysis

## Common Failures
- Profiling cold cache (first run after clear) — timings inflated by 2x
- Optimizing tests that contribute negligibly to total time
- Ignoring database query count — optimizing code when N+1 is the real bottleneck
- Removing valuable slow tests instead of optimizing or quarantining them

## Decision Points
- Quarantine consistently slow tests (>5s) to a separate nightly job vs optimizing them in place
- Split large test files vs keeping them intact if they test a cohesive feature
- Use pcov for parallel coverage (stable) vs Xdebug (unstable in parallel)

## Performance Considerations
- `--profile` adds ~0.1% overhead — safe to run on every CI execution
- JUnit XML storage for 10,000+ tests uses ~5MB of timing data in memory
- Parallel profiling works with `--parallel` — each worker reports its own slow tests

## Security Considerations
- JUnit XML files may reveal application structure; restrict CI artifact access
- Test timing data could reveal performance characteristics; treat as internal

## Related Rules (from 05-rules.md)
- Rule 1: Always profile before optimizing the test suite
- Rule 2: Profile warm runs, not cold cache runs
- Rule 3: Track p95 test suite execution time over time
- Rule 4: Optimize the top 20% of slow tests (Pareto principle)
- Rule 5: Correlate slow tests with database query counts
- Rule 6: Quarantine slow tests to a separate CI job
- Rule 7: Configure `--profile` and JUnit output in CI pipeline
- Rule 8: Run profiling 3 times and use median values

## Success Criteria
- Test suite execution time reduced by measurable amount (documented before/after)
- Top 5 slowest tests are under 2 seconds each (or quarantined)
- p95 suite time is tracked and stable week-over-week
- Optimization effort focused on highest-impact files (Pareto)
