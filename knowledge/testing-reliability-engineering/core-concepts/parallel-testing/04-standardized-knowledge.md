# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Parallel Testing
 KU Code: ku-03-parallel-testing
ECC Phase: 4
Last Updated: 2026-06-02

---

# Overview
Parallel test execution (via Paratest or Pest's `--parallel`) splits the test suite across multiple PHP processes, reducing CI wall-clock time proportionally to worker count. For a suite that takes 10 minutes sequentially, 4 workers can reduce it to ~3 minutes. Laravel's parallel infrastructure handles process isolation, database naming, and test output aggregation. Without parallelism, test suites beyond ~500 tests become a CI bottleneck that slows development feedback loops.

# Core Concepts
- **Process-level parallelism**: Each worker is a separate PHP process with its own autoloader, container, and database connection.
- **Test file as distribution unit**: Tests distributed at file level. Workers claim files from a shared queue.
- **Paratest**: The underlying parallel engine used by both Pest and PHPUnit.
- **Process-per-worker database naming**: Laravel suffixes the database name with process ID (`myapp_test_1`, `myapp_test_2`).
- **Output aggregation**: Worker output is buffered and replayed after all workers complete.
- **Token management**: `PEST_PARALLEL_TOKEN` so each worker knows its index for database isolation.

# When To Use
- Test suites exceeding 500 tests or 5 minutes runtime
- CI pipelines where test execution is the bottleneck
- Teams practicing CI/CD with frequent deployments
- Projects with dedicated CI runners (multiple CPUs available)
- Database-heavy test suites that benefit from parallel database operations

# When NOT To Use
- Test suites under 100 tests (sequential is simpler and fast enough)
- CI runners with only 1-2 CPUs (parallel overhead exceeds benefit)
- Tests that cannot run independently (shared state, ordered tests)
- Without database isolation configured (parallel tests share DB)
- With extensions that are incompatible with parallel execution (Xdebug)

# Best Practices (WHY)
- **Match worker count to available CPU cores minus 1**: Reason: `nproc - 1` leaves one core for OS/IO operations. Oversubscribing causes context switching overhead that slows the suite.
- **Always use `RefreshDatabase` or database isolation in parallel mode**: Reason: without isolation, parallel workers write to the same database, causing random test failures from data collisions.
- **Profile with `--profile` to identify file size imbalances**: Reason: one 5-minute test file in a 4-worker suite limits total time to 5 minutes. Split large test files for balanced distribution.
- **Use 4 workers for GitHub Actions hosted runners**: Reason: default GitHub Actions runners have 2 CPUs. 4 workers is optimal for IO-bound tests. 2 workers for CPU-bound tests.
- **Run coverage in a separate sequential pass**: Reason: parallel coverage merges are complex and error-prone. Run `--coverage` on a single worker or in a dedicated CI job.
- **Configure `max_connections` for MySQL parallel testing**: Reason: each worker needs 1+ database connections. Set `max_connections` to `worker_count * 2 + 20`.
- **Use `ParallelTesting` facade for custom per-worker setup**: Reason: `setUpProcess()`, `tearDownProcess()` hooks enable database creation, temp directory setup, and port allocation.

# Architecture Guidelines
- **Database isolation**: Use `ParallelTesting` facade for process-specific database names. `ParallelTesting::token()` returns the worker index.
- **Worker count configuration**: Set in `phpunit.xml` `<parameter name="processes" value="4"/>` or CLI `--processes=4`.
- **Token-based resource naming**: Use `ParallelTesting::token()` for unique database names, temp directories, ports, and email addresses.
- **File distribution strategy**: Paratest queue-based distribution is default. For suites with varying file sizes, use `--suffix` to group similar files.
- **Coverage collection**: Coverage in parallel mode uses temporary files per worker, merged after completion. Use pcov for stability (Xdebug is unstable in parallel).
- **Graceful degradation**: If a worker crashes, Paratest retries the file on another worker (configurable retry count).

# Performance
- **Optimal worker count**: Linear improvement until CPU-bound. IO-bound tests benefit from more workers.
- **Memory per worker**: ~30-50MB RSS each. 8 workers = ~240-400MB RAM.
- **Database connections**: Each worker needs 1+ connections. MySQL default (151) supports ~140 workers.
- **File size imbalance**: A single slow file limits total wall time. Break large test files into smaller ones.
- **Cold cache**: CI cold starts increase per-worker time by 20-40% (no OpCache, no view cache).

# Security
- **Database isolation**: Worker-specific databases prevent cross-test data leaks. Ensure databases are dropped after test suite completion.
- **Port allocation**: Tests binding to ports (Dusk, HTTP servers) must use `ParallelTesting::token()` for port offset. Prevent port collisions.
- **Temporary files**: Workers writing to temp directories must use process-specific paths. Prevent file collisions.
- **Token exposure**: `ParallelTesting::token()` is accessible in test code. Don't use it for security-sensitive operations.

# Common Mistakes

**Mistake: Running parallel tests without database isolation**
- Description: Using `--parallel` without `RefreshDatabase` or process-specific databases
- Cause: "Parallel should just work with the default database config"
- Consequence: Workers share a single database; tests create/delete the same records, causing random failures
- Better: Always use `RefreshDatabase` or configure `ParallelTesting` for process-specific databases.

**Mistake: Assuming linear speedup**
- Description: Adding more workers expecting proportional time reduction
- Cause: Amdahl's Law misunderstanding
- Consequence: Increasing workers beyond the slowest file's serial portion yields no benefit
- Better: Profile with `--profile` to identify slow files. Split large test files into smaller ones.

**Mistake: Oversubscribing CPU on shared runners**
- Description: Setting `--processes=8` on a 2-CPU GitHub Actions runner
- Cause: "More workers = faster tests"
- Consequence: Massive context switching; test suite runs slower than sequential
- Better: Match worker count to available CPUs. 2-4 workers on standard GitHub Actions runners.

**Mistake: Database connection exhaustion**
- Description: Running 20 parallel workers without increasing MySQL `max_connections`
- Cause: Default MySQL configuration (151 connections) seems sufficient
- Consequence: Workers fail to connect; tests fail with "Too many connections" error
- Better: Set `max_connections` to `worker_count * 2 + 20`.

# Anti-Patterns
- **Sequential test dependencies**: `@depends` annotations in parallel mode create ordering requirements that block parallelism.
- **Global state mutation**: Tests modifying static properties, singletons, or global config that affect other tests.
- **No retry strategy**: Worker crashes mark tests as failed permanently. Enable retry for transient failures.
- **Parallel mode for tiny suites**: 50 tests running in parallel add process spawning overhead without meaningful time savings.
- **Skipping `--recreate-databases`**: Without it, stale databases from previous runs may exist, causing test failures.

# Examples

**Parallel test execution command**
```bash
# Run with 4 workers
php artisan test --parallel --processes=4

# Run with auto-detected CPU count
php artisan test --parallel

# Profile parallel execution
php artisan test --parallel --profile
```

**Database isolation via ParallelTesting**
```php
<?php

use Illuminate\Support\Facades\ParallelTesting;

ParallelTesting::setUpProcess(function (int $token) {
    $database = "myapp_test_{$token}";
    // Create database for this worker
    DB::statement("CREATE DATABASE IF NOT EXISTS {$database}");
});

ParallelTesting::tearDownProcess(function (int $token) {
    $database = "myapp_test_{$token}";
    DB::statement("DROP DATABASE IF EXISTS {$database}");
});
```

**Port offset for parallel browser tests**
```php
test('browser test with port offset', function () {
    $port = 8000 + ParallelTesting::token();
    $this->browse(function (Browser $browser) use ($port) {
        $browser->visit("http://localhost:{$port}/login")
            ->assertSee('Login');
    });
});
```

# Related Topics
- Parallel sharding in CI
- Matrix CI testing (PHP × DB variants)
- Database testing lifecycle
- CI/CD pipeline integration
- Test suite profiling

# AI Agent Notes
- Always include `RefreshDatabase` or database isolation when generating code for parallel test suites.
- Worker count should match CI runner CPU count minus 1. Default to 4 for GitHub Actions.
- When generating database setup code for parallel tests, use `ParallelTesting::token()` for unique database names.
- Never generate tests with `@depends` or global state dependencies when parallel execution is expected.
- For port-based tests (Dusk, HTTP servers), always generate port offsets using `ParallelTesting::token()`.
- Document the parallel execution configuration in the project's `phpunit.xml` and CI configuration.

# Verification
- [ ] Parallel execution works with `php artisan test --parallel`
- [ ] Each worker has its own database (process-specific naming via `ParallelTesting::token()`)
- [ ] Worker count matches available CPU cores (or CI runner capacity)
- [ ] No tests use `@depends` or global state that blocks parallelism
- [ ] Large test files are split for balanced distribution
- [ ] MySQL `max_connections` is configured for `worker_count * 2 + 20`
- [ ] Coverage works in parallel mode (using pcov, not Xdebug)
- [ ] Parallel test output is correctly aggregated and reported
