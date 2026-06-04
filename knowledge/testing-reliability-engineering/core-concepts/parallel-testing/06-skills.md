# Skill: Configure Parallel Test Execution

## Purpose
Configure and run Laravel's parallel test execution with proper database isolation, worker count optimization, and resource management.

## When To Use
- Test suites exceeding 500 tests or 5 minutes runtime
- CI pipelines where test execution is the bottleneck
- Projects with multi-CPU CI runners
- Database-heavy test suites that benefit from parallel database operations

## When NOT To Use
- Suites under 100 tests (parallel overhead exceeds benefit)
- CI runners with 1-2 CPUs only
- Tests with `@depends` inter-test dependencies
- Without database isolation configured
- Collecting coverage (run sequentially or use pcov)

## Prerequisites
- Test suite with database isolation (RefreshDatabase or ParallelTesting setup)
- Knowledge of CI runner CPU count
- MySQL `max_connections` configuration access (if using MySQL)
- pcov installed for parallel coverage (optional)

## Inputs
- CI runner CPU count
- Database engine type (SQLite, MySQL, PostgreSQL)
- Estimated test count and file distribution

## Workflow
1. Verify every test file has database isolation (`RefreshDatabase`, `DatabaseMigrations`, or process-specific databases via `ParallelTesting`)
2. Set parallel process count in `phpunit.xml`: `<parameter name="processes" value="N"/>` where N = CPU cores minus 1
3. Configure `maxBatchSize=25-50` and `slowThreshold=500` in `<parameters>` section
4. Configure `ParallelTesting` facade for process-specific database names using `ParallelTesting::token()`
5. Set MySQL `max_connections` to `worker_count * 2 + 20` if using MySQL
6. Add cleanup via `ParallelTesting::tearDownProcess()` or `--recreate-databases` flag
7. Run `php artisan test --parallel` and profile with `--profile` to identify file imbalances
8. Split any test file that takes significantly longer than the average into smaller files

## Validation Checklist
- [ ] Parallel execution works with `php artisan test --parallel`
- [ ] Each worker has isolated database (process-specific naming)
- [ ] Worker count matches CI runner CPUs minus 1
- [ ] No tests use `@depends` or global state that blocks parallelism
- [ ] Large test files are split for balanced distribution
- [ ] MySQL `max_connections` configured for worker count
- [ ] Retry enabled for transient worker failures
- [ ] Databases cleaned up after parallel runs

## Common Failures
- No database isolation: workers share a database, causing random failures
- Oversubscribing CPU: more workers than cores causes slowdown
- Database connection exhaustion: workers fail with "Too many connections"
- File size imbalance: one large file limits total wall time

## Decision Points
- Set workers = CPU minus 1 for CPU-bound tests; add 1-2 extra for I/O-bound tests
- Run coverage in a separate sequential pass with pcov, not in parallel
- Enable retry (`--retry`) for transient failures but monitor for flaky test masking

## Performance Considerations
- Linear speedup until CPU-bound; I/O-bound tests benefit from more workers
- Each worker uses ~30-50MB RAM; 8 workers = ~240-400MB
- File size imbalance limits speedup — profile and split large files
- Cold CI cache adds 20-40% per-worker time (no OpCache)

## Security Considerations
- Worker-specific databases prevent cross-test data leaks; ensure cleanup after suite completion
- Use `ParallelTesting::token()` for port offsets in browser tests to prevent collisions
- Token is accessible in test code; not for security-sensitive operations

## Related Rules (from 05-rules.md)
- Rule 1: Always verify database isolation before enabling parallel execution
- Rule 2: Never assume linear speedup from adding workers
- Rule 3: Use pcov for parallel coverage collection, not Xdebug
- Rule 4: Set `maxBatchSize` to prevent worker starvation
- Rule 5: Configure `slowThreshold` to flag unexpectedly slow tests
- Rule 6: Isolate tests that use global state or singletons
- Rule 7: Run parallel suites with process-level timeout protection

## Success Criteria
- Test suite wall-clock time reduced proportionally to worker count
- No intermittent failures from data collisions between workers
- Balanced file distribution across all workers
- Clean database state after every parallel run
