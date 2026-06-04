# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Parallel Testing
KU Code: ku-03-parallel-testing
ECC Phase: 4
Last Updated: 2026-06-02

# Executive Summary
Parallel test execution splits the test suite across multiple PHP processes, reducing CI wall-clock time proportionally to worker count. For a suite that takes 10 minutes sequentially, 4 workers can reduce it to approximately 3 minutes. Laravel's parallel infrastructure handles process isolation, database naming, and test output aggregation. Without parallelism, test suites beyond approximately 500 tests become a CI bottleneck that slows development feedback loops.

# Core Concepts
- **Process-level parallelism**: Each worker is a separate PHP process with its own autoloader, container, and database connection.
- **Test file as distribution unit**: Tests distributed at file level. Workers claim files from a shared queue.
- **Paratest**: The underlying parallel engine used by both Pest and PHPUnit.
- **Process-per-worker database naming**: Laravel suffixes the database name with process ID.
- **Output aggregation**: Worker output is buffered and replayed after all workers complete.
- **Token management**: `PEST_PARALLEL_TOKEN` so each worker knows its index for database isolation.

# Mental Models
- **Amdahl's Law in testing**: Speedup is limited by the slowest serial portion. A single 5-minute test file limits total time to 5 minutes regardless of worker count.
- **Worker as independent test runner**: Each worker is a complete PHP environment. No shared state between workers by design.
- **File-level granularity**: Distribution happens at the file level, not the test level. One slow file blocks one worker.

# Internal Mechanics
- Paratest spawns N worker processes using `proc_open()`.
- Workers connect to a shared queue server (Redis/MySQL or file-based for testing).
- Each worker requests the next available test file from the queue.
- Laravel's `ParallelTesting` facade hooks into `setUpProcess`/`tearDownProcess` for worker-level setup.
- Worker output is captured via PHP's output buffering and replayed in order.
- Coverage in parallel mode uses temporary files per worker, merged after completion.

# Patterns
- **Database isolation pattern**: Use `ParallelTesting::token()` for process-specific database names and port offsets.
- **Worker count pattern**: Match worker count to available CPU cores minus 1. Default to 4 for GitHub Actions hosted runners.
- **Large file splitting pattern**: Profile with `--profile`, split files exceeding 30 seconds into multiple smaller files.
- **Coverage pass pattern**: Run coverage in a separate sequential pass to avoid parallel merge complexity.

# Architectural Decisions
- **Decision: File-level distribution over test-level**: Simpler queue management but can cause imbalance if file sizes vary significantly.
- **Decision: Process-level isolation over thread-level**: PHP's shared-nothing architecture makes process isolation necessary. No shared memory between workers.
- **Decision: Database suffix naming**: Worker-specific database names prevent cross-contamination without complex connection management.

# Tradeoffs
- **Worker count vs CPU oversubscription**: More workers can reduce time for IO-bound tests but increase context switching for CPU-bound tests.
- **Coverage in parallel vs sequential**: Parallel coverage is faster but complex and error-prone. Sequential coverage is simpler but slower.
- **Isolation overhead**: Process spawning adds approximately 2-5 seconds. Worthwhile for suites over 500 tests but wasteful for small suites.

# Performance Considerations
- Optimal worker count: Linear improvement until CPU-bound. IO-bound tests benefit from more workers.
- Memory per worker: Approximately 30-50MB RSS each.
- Database connections: Each worker needs 1+ connections. MySQL default (151) supports approximately 140 workers.
- File size imbalance: A single slow file limits total wall time. Break large test files into smaller ones.
- Cold cache: CI cold starts increase per-worker time by 20-40%.

# Production Considerations
- Database isolation: Worker-specific databases prevent cross-test data leaks. Ensure databases are dropped after completion.
- Port allocation: Tests binding to ports must use `ParallelTesting::token()` for port offset. Prevents port collisions.
- Temporary files: Workers writing to temp directories must use process-specific paths.
- Token exposure: `ParallelTesting::token()` is accessible in test code. Don't use it for security-sensitive operations.

# Common Mistakes
- **Running parallel tests without database isolation**: Workers share a single database; tests create/delete the same records, causing random failures.
- **Assuming linear speedup**: Adding workers beyond the slowest file's serial portion yields no benefit.
- **Oversubscribing CPU on shared runners**: Setting 8 workers on a 2-CPU runner causes massive context switching.
- **Database connection exhaustion**: Running 20 parallel workers without increasing MySQL `max_connections`.

# Failure Modes
- Database name collision: Workers with the same database name write to the same tables simultaneously.
- Port collision: Multiple workers binding to port 8000 for Dusk tests.
- Worker crash: A single worker crashing may leave databases or temporary files behind.
- Test ordering dependencies: Tests using `@depends` fail in parallel mode.

# Ecosystem Usage
- Paratest is the standard parallel engine for both Pest and PHPUnit.
- Laravel's `ParallelTesting` facade provides first-party hooks for parallel setup.
- GitHub Actions provides 2-CPU hosted runners. Self-hosted runners may have more.
- Coverage parallel mode uses pcov for stability (Xdebug is unstable in parallel).

# Related Knowledge Units
- Parallel sharding in CI
- Matrix CI testing (PHP times DB variants)
- Database testing lifecycle
- CI/CD pipeline integration
- Test suite profiling

# Research Notes
- Paratest has been the standard parallel testing tool for PHP since approximately 2014.
- Laravel's first-party parallel testing support was added in Laravel 8.
- PHP's lack of threading makes process-level parallelism the only viable approach for test isolation.
- The database suffix approach is specific to Laravel. Other frameworks may need different isolation strategies.
