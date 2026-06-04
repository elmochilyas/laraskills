# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Parallel Testing

---

### Rule 1: Always use database isolation when running parallel tests

| Field | Value |
|-------|-------|
| **Name** | Use database isolation for parallel execution |
| **Category** | Database Isolation |
| **Rule** | Always use `RefreshDatabase` trait or configure `ParallelTesting` for process-specific databases when running tests with `--parallel`. |
| **Reason** | Without isolation, parallel workers write to the same database simultaneously. Tests create, modify, and delete the same records, causing random failures that are impossible to reproduce sequentially. |
| **Bad Example** | Running `php artisan test --parallel` without `RefreshDatabase` trait on any test files. |
| **Good Example** | Configuring `ParallelTesting::setUpProcess()` to create a unique database per worker using `ParallelTesting::token()`, or applying `RefreshDatabase` to all feature tests. |
| **Exceptions** | Read-only test suites that never write to the database. Extremely rare in Laravel applications. |
| **Consequences Of Violation** | Intermittent test failures. Tests that pass sequentially fail in parallel. Debugging requires identifying data collisions between workers. |

---

### Rule 2: Match worker count to available CPU cores minus one

| Field | Value |
|-------|-------|
| **Name** | Set worker count to CPU cores minus one |
| **Category** | Resource Allocation |
| **Rule** | Set the parallel worker count to the number of available CPU cores minus one. On GitHub Actions default runners (2 CPUs), use 1-2 workers. On 4-core CI runners, use 3 workers. |
| **Reason** | Oversubscribing causes context switching overhead that can make parallel execution slower than sequential. Reserving one core for OS and I/O operations prevents system thrashing. |
| **Bad Example** | `--processes=8` on a 2-CPU GitHub Actions runner — massive context switching, slower than sequential. |
| **Good Example** | `--processes=3` on a 4-core dedicated runner — optimal throughput. |
| **Exceptions** | For I/O-bound test suites (many HTTP calls, file operations), adding 1-2 extra workers beyond CPU count can improve throughput because workers spend time waiting on I/O. |
| **Consequences Of Violation** | Test suite runs slower than necessary. CI pipeline throughput is reduced 30-60%. |

---

### Rule 3: Profile with `--profile` to identify file size imbalances

| Field | Value |
|-------|-------|
| **Name** | Profile test distribution for balanced parallelism |
| **Category** | Performance Optimization |
| **Rule** | Run `php artisan test --parallel --profile` to identify test files with disproportionately long execution times. Split files that take significantly longer than the average. |
| **Reason** | A single 5-minute test file in a 4-worker suite limits total wall time to 5 minutes, regardless of how many workers are available. Parallel execution is only as fast as the slowest file. |
| **Bad Example** | One test file containing 50 tests taking 3 minutes, while all other files average 10 seconds — suite limited to 3 minutes. |
| **Good Example** | The large file split into 5 files of ~10 tests each, distributed across workers. Suite time drops from 3 minutes to 45 seconds. |
| **Exceptions** | Tests that are inherently slow (integration tests with external services) and cannot be split further. These should be moved to a separate suite. |
| **Consequences Of Violation** | Parallel execution provides minimal speedup despite many workers. CI bottleneck persists. |

---

### Rule 4: Run coverage in a separate sequential pass, not parallel

| Field | Value |
|-------|-------|
| **Name** | Collect coverage in a sequential pass |
| **Category** | Code Coverage |
| **Rule** | Run coverage collection in a separate sequential test pass or a dedicated CI job. Do not combine coverage with parallel execution. |
| **Reason** | Parallel coverage collection requires merging coverage data from multiple processes, which is complex and error-prone. Xdebug is unstable in parallel mode. |
| **Bad Example** | `php artisan test --parallel --coverage` — coverage merge may produce incorrect results or crash. |
| **Good Example** | A dedicated CI job running `php artisan test --coverage --min=80` sequentially with pcov. |
| **Exceptions** | When using pcov with explicit merge configuration. Even then, validate coverage results against a sequential run. |
| **Consequences Of Violation** | Coverage reports are incomplete or inaccurate. False positives in coverage enforcement. CI pipeline instability. |

---

### Rule 5: Configure MySQL `max_connections` for parallel worker count

| Field | Value |
|-------|-------|
| **Name** | Increase MySQL `max_connections` for parallel testing |
| **Category** | Database Configuration |
| **Rule** | Set MySQL `max_connections` to `worker_count * 2 + 20` when running parallel tests against MySQL. |
| **Reason** | Each parallel worker needs at least one database connection, plus connections for migrations, seeding, and assertions. Default MySQL `max_connections` (151) is sufficient for up to 65 workers, but custom configurations or shared databases may have lower limits. |
| **Bad Example** | 20 parallel workers with default MySQL config — workers fail with "Too many connections" error. |
| **Good Example** | `SET GLOBAL max_connections = 60;` for 20 workers (20 * 2 + 20 = 60). |
| **Exceptions** | When using SQLite in-memory databases, connection limits are not a concern. |
| **Consequences Of Violation** | Workers fail to connect to the database. Tests fail consistently with connection errors. |

---

### Rule 6: Never use `@depends` annotations in test suites intended for parallel execution

| Field | Value |
|-------|-------|
| **Name** | Avoid `@depends` annotations for parallel suites |
| **Category** | Test Design |
| **Rule** | Never use PHPUnit's `@depends` annotation to create test ordering dependencies when the test suite will run in parallel. |
| **Reason** | Parallel execution distributes test files across workers arbitrarily. `@depends` creates ordering requirements that may not be satisfied when tests run on different workers, causing unpredictable failures. |
| **Bad Example** | `test('create user', fn() => ...)->depends('test login')` — test B depends on test A running first. |
| **Good Example** | Each test is self-contained. Shared setup is handled via `beforeEach()` or trait setup, not inter-test dependencies. |
| **Exceptions** | Tests that explicitly opt out of parallel execution via `--filter` or being in a non-parallel suite. |
| **Consequences Of Violation** | Tests fail unpredictably in parallel. Same commit produces different results across CI runs. |

---

### Rule 7: Use `ParallelTesting::token()` for unique resource naming

| Field | Value |
|-------|-------|
| **Name** | Use token-based naming for worker-isolated resources |
| **Category** | Resource Isolation |
| **Rule** | When tests allocate resources per worker (databases, ports, temp directories, email addresses), append `ParallelTesting::token()` to ensure uniqueness across workers. |
| **Reason** | Without token-based naming, parallel workers collide on shared resources. Databases are truncated by another worker, ports are already in use, and temp files are overwritten. |
| **Bad Example** | Fixed port `8000` for Dusk tests — worker 2 fails because port is already bound by worker 1. |
| **Good Example** | `$port = 8000 + ParallelTesting::token()` — each worker gets a unique port. |
| **Exceptions** | When running without `--parallel`, `ParallelTesting::token()` returns `0`, so offsets work correctly in both modes. |
| **Consequences Of Violation** | Resource collisions cause random test failures. Debugging requires identifying which worker had which resource. |

---

### Rule 8: Only use parallel execution for suites exceeding 500 tests

| Field | Value |
|-------|-------|
| **Name** | Skip parallel execution for small test suites |
| **Category** | Resource Allocation |
| **Rule** | Do not use parallel execution for test suites with fewer than 100-500 tests or under 5 minutes runtime. |
| **Reason** | Parallel execution has overhead: spawning PHP processes (300-500ms each), creating databases, and aggregating output. For small suites, this overhead exceeds the time saved by parallelism. |
| **Bad Example** | Running `--parallel` for a 50-test suite that completes in 30 seconds sequentially. |
| **Good Example** | Running sequentially for small suites. Adding `--parallel` only when the suite exceeds 500 tests or 5 minutes. |
| **Exceptions** | When parallel execution is used to test resource isolation (e.g., verifying that tests work correctly in parallel). |
| **Consequences Of Violation** | CI pipeline wastes resources on process spawning overhead. Small changes trigger unnecessary resource allocation. |

---

### Rule 9: Enable retry for transientworker failures in parallel mode

| Field | Value |
|-------|-------|
| **Name** | Enable test retry for parallel execution |
| **Category** | Reliability |
| **Rule** | Configure a retry strategy (typically 1-2 retries) for parallel test execution to handle worker crashes and transient failures. |
| **Reason** | Worker processes can crash due to resource constraints, database connection timeouts, or external service unavailability. Retrying the test on a different worker recovers from transient failures automatically. |
| **Bad Example** | No retry configured — a single worker crash or transient timeout marks tests as failed, requiring a manual CI rerun. |
| **Good Example** | `php artisan test --parallel --retry` or configuring retry count in `phpunit.xml`. |
| **Exceptions** | Tests that must pass on first attempt (e.g., deployment gates, security tests). Retries may mask real flaky tests. |
| **Consequences Of Violation** | CI pipeline produces false negatives. Developers rerun CI manually, wasting time. |

---

### Rule 10: Clean up parallel databases between CI runs

| Field | Value |
|-------|-------|
| **Name** | Recreate databases between parallel runs |
| **Category** | Database Isolation |
| **Rule** | Use `--recreate-databases` flag or `ParallelTesting::tearDownProcess()` to drop worker-specific databases after test completion. |
| **Reason** | Stale databases from previous runs accumulate and may contain leftover data that interferes with the next run. Over time, disk space fills with abandoned test databases. |
| **Bad Example** | No cleanup — after 100 CI runs, the database server has 400 stale databases from parallel workers. |
| **Good Example** | `ParallelTesting::tearDownProcess(function (int $token) { DB::statement("DROP DATABASE IF EXISTS myapp_test_{$token}"); });` |
| **Exceptions** | If databases are created fresh each time (in-memory SQLite), cleanup is unnecessary. |
| **Consequences Of Violation** | Database server runs out of storage. Tests fail due to leftover data from previous runs. |
