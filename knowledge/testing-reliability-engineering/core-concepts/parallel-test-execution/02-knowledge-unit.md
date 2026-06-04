# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Test Framework & Runner Infrastructure
Knowledge Unit: Parallel Test Execution
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Parallel test execution (via Paratest or Pest's `--parallel`) splits the test suite across multiple PHP processes, reducing CI wall-clock time proportionally to worker count. For a suite that takes 10 minutes sequentially, 4 workers can reduce it to ~3 minutes. Laravel's parallel infrastructure handles process isolation, database naming, and test output aggregation. Without parallelism, test suites beyond ~500 tests become a CI bottleneck that slows development feedback loops.

# Core Concepts
- **Process-level parallelism**: Each worker is a separate PHP process with its own autoloader, service container, and database connection. No shared mutable state between workers.
- **Test file as unit of distribution**: Tests are distributed at the file level (not individual test granularity). Workers claim test files from a shared queue.
- **Paratest**: The underlying parallel engine used by both Pest and PHPUnit. Reads `phpunit.xml` and distributes test files across `phpunit` processes.
- **Process-per-worker database naming**: Laravel suffixes the database name with the process ID (`myapp_test_1`, `myapp_test_2`) to prevent cross-worker database collisions.
- **Output aggregation**: Worker output is buffered and replayed in order after all workers complete. Failed tests are reported with their worker ID for debugging.
- **Token management**: Pest uses a token system (`PEST_PARALLEL_TOKEN`) so each worker knows its index. Used for database isolation and worker-specific temporary paths.

# Mental Models
- **Workers as independent test runners**: Each worker runs a subset of test files as if run via `vendor/bin/phpunit tests/Subset`. They share nothing.
- **File-level distribution granularity**: If one test file takes 5 minutes and others take 1 second, that file's CPU core determines total wall time. Break up large files.
- **Queue-based load balancing**: Workers pull next available test file from a shared queue. Fast workers handle more files; slow workers handle fewer.
- **Database isolation via name suffixing**: Each worker gets a unique database name. The `RefreshDatabase` trait drops and recreates tables independently per worker.

# Internal Mechanics
- **Paratest runner process**: The parent process reads `phpunit.xml`, discovers all test files, creates a shared queue of file paths, and spawns child PHP processes (workers).
- **Worker lifecycle**: Each worker: (1) boots a PHP process, (2) loads autoloader, (3) runs `\PHPUnit\TextUI\Command::main()` with a filtered test file list, (4) returns JUnit XML results to parent process, (5) dies.
- **Database naming convention**: Laravel's `ParallelTesting` feature appends `_{token}` to the database name. Token 1 gets `laravel_test_1`, token 2 gets `laravel_test_2`. Configurable via `parallelTesting` config.
- **Output ordering**: The parent process collects JUnit XML from each worker. It replays test names in their original order (as defined by `phpunit.xml`) but test output is grouped by worker.
- **Graceful degradation**: If a worker process crashes (segfault, out of memory), the parent process retries the file on another worker (configurable retry count). Test is marked as failed if all retries exhausted.
- **Coverage in parallel mode**: When `--coverage` is used, each worker collects code coverage data to a temporary file. The parent process merges coverage files using `phpunit/php-code-coverage` merge functionality.

# Patterns
- **Pattern: CI matrix + parallel sharding**
  - Purpose: Scale CI across both PHP/DB versions (matrix) and within each cell (parallel)
  - Benefits: Maximum utilization of CI runners
  - Tradeoffs: Matrix × parallel multiplicative cost in CI minutes
  - Implementation: Matrix for PHP×DB variants; `--parallel --processes=4` for each matrix cell

- **Pattern: Worker-count proportional to CPU cores**
  - Purpose: Maximize throughput without oversubscribing
  - Benefits: Optimal wall-clock time reduction
  - Tradeoffs: Too many workers causes context switching overhead
  - Rule: Set workers to number of available logical CPUs minus 1 (leave one core for OS/IO)

- **Pattern: Database-aware parallel setup**
  - Purpose: Ensure parallel tests don't collide on database state
  - Benefits: Safe parallel execution for database-heavy test suites
  - Tradeoffs: Requires `RefreshDatabase` or `DatabaseTruncation` trait per test
  - Implementation: `ParallelTesting` facade to customize database creation per worker

# Architectural Decisions
- **Worker count**: Set to `nproc - 1` for dedicated CI runners. For shared runners (GitHub Actions hosted), use 4 workers which balances speed vs resource contention.
- **File balancing strategy**: Paratest uses a queue-based approach by default. For suites with widely varying file sizes, consider the `--suffix` option to group similar files.
- **Parallel vs matrix**: Use parallel (`--parallel`) for within-version parallelism. Use matrix for cross-version/cross-DB testing. Combine both for maximum coverage.
- **Database driver for parallel tests**: MySQL/PostgreSQL with `RefreshDatabase` is fastest. SQLite with `:memory:` can be faster but may miss production-specific SQL behavior.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Reduces CI wall-clock time by 3-4x | Increased CI compute cost (parallel processes × minutes) | 4 workers cost ~4x compute minutes for same test count |
| Independent worker isolation catches state-leak bugs | Workers boot independently, increasing total CPU time | Sequential test suite CPU time is lower, but wall time is higher |
| Built-in Laravel database isolation | Worker count limited by available databases on server | MySQL/PostgreSQL may need connection limit tuning |
| Native Pest/PHPUnit integration | File-level granularity means unbalanced files limit speedup | Profile with `--profile` and split large test files |

# Performance Considerations
- **Optimal worker count**: Wall-clock time improves linearly until CPU-bound. IO-bound tests (database, HTTP) benefit from more workers than CPU-bound tests.
- **Database connection pooling**: Each worker needs its own database connection. MySQL `max_connections` must be ≥ worker count + headroom. Default MySQL (151 connections) supports ~140 workers.
- **Memory per worker**: Each worker loads the entire Laravel framework. Worker RSS is ~30-50MB per process. 8 workers = ~240-400MB RAM. Ensure CI runner has sufficient memory.
- **Test file size imbalance**: One 5-minute test file in a 10-minute suite running on 4 workers: 3 workers finish in ~2 minutes; the slow file blocks completion. Total time = 5 minutes.
- **Cold cache effects**: CI cold starts (no OpCache, no view cache) increase per-worker time by 20-40%.

# Production Considerations
- **CI runner selection**: Use dedicated runners (GitHub Actions larger runners, self-hosted) for consistent parallel performance. Shared runners may have variable CPU availability.
- **PHP configuration**: Ensure `memory_limit` is adequate per-worker (~256MB min). `max_execution_time` should exceed longest single test file by 2x.
- **Database provisioning**: For MySQL parallel testing, create databases preemptively or use `ParallelTesting::setUpProcess()` hook. Each worker needs its own database.
- **Test token in code**: Access `ParallelTesting::token()` in test code to create unique artifacts, directories, or email addresses per worker.
- **Output verbosity**: Parallel mode suppresses per-test progress output. Use `--verbose` to see worker-specific output. Use JUnit XML for CI reporting.

# Common Mistakes
- **Mistake: Running parallel tests without database isolation**
  - Why: Workers share a single database by default
  - Why harmful: Tests create/delete the same records, causing random failures
  - Better: Always use `RefreshDatabase` or configure `ParallelTesting` for process-specific databases

- **Mistake: Assuming linear speedup**
  - Why: Amdahl's Law applies—some test files are serial bottlenecks
  - Why harmful: Increasing workers beyond the slowest file's serial portion yields no benefit
  - Better: Profile with `--profile` to identify slow files; split large test files

- **Mistake: Running parallel tests on an undersized CI runner**
  - Why: GitHub Actions default runner has 2 CPUs
  - Why harmful: `--parallel --processes=8` causes massive context switching, slower than sequential
  - Better: Match worker count to available CPUs

# Failure Modes
- **Database connection exhaustion**: `max_connections` exceeded when too many workers connect simultaneously. Each worker uses 1+ connections. Set `max_connections` to `worker_count * 2 + 20`.
- **Worker process crash (segfault)**: PHP extension incompatibility under parallel load. Xdebug is notorious for instability in parallel mode. Use pcov for coverage instead.
- **Port exhaustion**: Tests that bind to ports (Dusk, HTTP tests with bound servers) may collide. Use `ParallelTesting::token()` for port offset.
- **Temporary file collision**: Workers writing to same temp directory cause random failures. Use process-specific temporary file paths.

# Ecosystem Usage
- **Laravel core**: Laravel's `ParallelTesting` facade provides `setUpProcess()`, `tearDownProcess()`, `setUpTestCase()`, and `tearDownTestCase()` hooks for customization.
- **Pest**: `pest --parallel` uses Paratest with sensible defaults. Configuration via `phpunit.xml` `<parameter name="processes" value="4"/>`.
- **GitHub Actions**: Community actions like `laravel-test-runner` and `shivammathur/setup-php` support parallel testing. Combine with matrix for PHP×DB variants.
- **Circle CI**: Supports parallel execution via `parallelism` key in config, splitting test files across containers.

# Related Knowledge Units
- **Prerequisites**: Pest/PHPUnit fundamentals, Database testing lifecycle
- **Related Topics**: CI/CD pipeline integration, Parallel sharding in CI, Matrix CI testing
- **Advanced Follow-up**: Custom `ParallelTesting` hooks, Database provisioning for parallel runs

# Research Notes
- Pest 4 `--parallel` now supports automatic CPU detection: `--parallel` without argument auto-detects CPU count
- Laravel's ParallelTesting facade `resolveDatabaseUsing()` allows custom DB resolution per process
- Paratest 7.x supports `--max-batch-size` to prevent memory issues with very large test suites
- GitHub Actions larger runners (8+ CPU) make parallel testing significantly more cost-effective than 2-CPU defaults
