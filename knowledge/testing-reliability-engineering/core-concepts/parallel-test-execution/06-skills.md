# Skill: Optimize Parallel Test Distribution and Worker Resources

## Purpose
Tune parallel test execution parameters — worker count, batch size, timeouts, and file distribution — to maximize throughput and minimize resource contention.

## When To Use
- Parallel test suite is slower than expected
- Workers are idling while others are overloaded
- Need to determine optimal worker count for specific CI runner
- Diagnosing transient failures in parallel mode

## When NOT To Use
- First-time parallel setup (use the basic configuration skill first)
- Sequential test suites
- When test distribution is already balanced and timing is acceptable

## Prerequisites
- Parallel test execution already configured and running
- Access to CI runner specifications (CPU, RAM)
- Profile data from `php artisan test --parallel --profile`

## Inputs
- CI runner CPU count and available RAM
- Profile output showing per-file execution times
- Average test file count and size distribution
- Database engine and connection limits

## Workflow
1. Run `php artisan test --parallel --profile` on warm cache to get baseline per-file timings
2. Identify the slowest file(s) — if any file takes >20% of total suite time, split it into smaller files
3. Test worker counts at 50%, 100%, and 150% of CPU count to find the sweet spot (diminishing returns)
4. Adjust `maxBatchSize` — decrease to 10-20 if files vary wildly in size, increase to 100+ if files are small and uniform
5. Set `timeout` parameter to 2-3x the expected maximum worker runtime to catch hung processes
6. For MySQL, verify `max_connections` > `worker_count * 2 + 20`
7. Enable retry (`--retry`) with count of 1-2 to handle transient worker crashes
8. Store JUnit XML results and compare wall time before/after each tuning change

## Validation Checklist
- [ ] All workers complete within similar timeframes (no stragglers)
- [ ] No worker starves (sits idle while others run)
- [ ] Retry recovers from transient worker failures
- [ ] Timeout prevents hung workers from blocking suite completion
- [ ] Worker count validated by benchmarking different values
- [ ] MySQL connection pool not exhausted

## Common Failures
- Worker starvation due to single large file monopolizing one worker
- Oversubscription causing context switching overhead
- Retries masking genuinely broken tests
- Timeout too low, killing valid slow tests

## Decision Points
- Increase workers for I/O-bound tests (HTTP calls, file operations); decrease for CPU-bound
- Lower `maxBatchSize` when file sizes vary; raise when files are uniform and small
- Quarantine tests that consistently need high timeouts to a separate CI job

## Performance Considerations
- Paratest queue-based distribution is default; use `--suffix` to group similar-sized files
- Each worker process consumes ~30-50MB RAM; ensure CI runner has sufficient memory
- pcov is stable for parallel coverage; Xdebug is not — run coverage sequentially

## Security Considerations
- Timeout termination may leave databases or temp files; ensure cleanup hooks run
- Retry logs should not expose internal paths or credentials in failure output

## Related Rules (from 05-rules.md)
- Rule 1: Always verify database isolation before enabling parallel execution
- Rule 2: Never assume linear speedup from adding workers
- Rule 4: Set `maxBatchSize` to prevent worker starvation
- Rule 5: Configure `slowThreshold` to flag unexpectedly slow tests
- Rule 7: Run parallel suites with process-level timeout protection

## Success Criteria
- All workers complete within 20% of each other's runtime
- Wall-clock time is within 10-20% of theoretical optimum (total sequential time / workers)
- No transient failures attributable to parallel execution
- Retry count stays below 2% of total tests
