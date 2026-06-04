# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Parallel Test Execution

---

### Rule 1: Always verify database isolation before enabling parallel execution

| Field | Value |
|-------|-------|
| **Name** | Verify database isolation before going parallel |
| **Category** | Database Isolation |
| **Rule** | Before enabling `--parallel`, verify that every test file either uses `RefreshDatabase` / `DatabaseMigrations`, or the project has configured process-specific databases via `ParallelTesting`. |
| **Reason** | Running parallel tests without database isolation causes random data collisions between workers. These failures are non-deterministic and extremely hard to debug. |
| **Bad Example** | Adding `--parallel` to CI without checking that all feature tests use a database isolation trait. |
| **Good Example** | Auditing all test files to confirm database isolation is in place before enabling parallel mode. |
| **Exceptions** | Read-only test suites that never write to any database. |
| **Consequences Of Violation** | Intermittent CI failures. Team loses trust in CI results. Debugging requires reproducing parallel state locally. |

---

### Rule 2: Never assume linear speedup from adding workers

| Field | Value |
|-------|-------|
| **Name** | Do not assume linear parallel speedup |
| **Category** | Performance Expectations |
| **Rule** | Do not assume that doubling workers halves test execution time. Profile actual speedup when changing worker count. |
| **Reason** | Amdahl's Law applies: the serial portion of test execution (bootstrapping, database setup, slowest file) limits maximum speedup. Adding workers beyond Amdahl's sweet spot yields diminishing or negative returns. |
| **Bad Example** | Adding 16 workers to a suite whose slowest file takes 5 minutes — worst-case wall time is still 5 minutes. |
| **Good Example** | Profiling with different worker counts (2, 4, 8) and selecting the point of diminishing returns. |
| **Exceptions** | Suites with perfectly balanced, purely CPU-bound tests can approach linear speedup. |
| **Consequences Of Violation** | Wasted CI resources. Workers contend for resources, potentially making execution slower. |

---

### Rule 3: Use pcov for parallel coverage collection, not Xdebug

| Field | Value |
|-------|-------|
| **Name** | Use pcov for parallel coverage |
| **Category** | Code Coverage |
| **Rule** | Use pcov (PCOV) code coverage driver when collecting coverage in parallel mode. Do not use Xdebug. |
| **Reason** | Xdebug is unstable in parallel mode — it can deadlock workers, produce corrupted coverage data, and adds significant overhead. pcov is designed for parallel-safe coverage collection with lower overhead. |
| **Bad Example** | `php artisan test --parallel --coverage` with Xdebug enabled — coverage may crash or produce incorrect data. |
| **Good Example** | Installing pcov (`pecl install pcov`) and ensuring Xdebug is disabled during parallel coverage runs. |
| **Exceptions** | If pcov is not available on the CI runner, fall back to Xdebug but run coverage in a separate sequential pass (not parallel). |
| **Consequences Of Violation** | Unstable coverage collection. Corrupted coverage reports. CI jobs fail randomly. |

---

### Rule 4: Set `maxBatchSize` to prevent worker starvation

| Field | Value |
|-------|-------|
| **Name** | Configure max batch size for worker distribution |
| **Category** | Resource Allocation |
| **Rule** | Set the `maxBatchSize` parameter in `phpunit.xml` to a value that prevents workers from running out of files (worker starvation) while avoiding excessive queue overhead. A value of 25-50 is typical. |
| **Reason** | Without `maxBatchSize`, workers may claim too many files at once, leaving other workers idle when they finish their batch. With it set too low, queue communication overhead increases. |
| **Bad Example** | No `maxBatchSize` configured — one worker claims 80% of files, others sit idle. |
| **Good Example** | `<parameter name="maxBatchSize" value="50"/>` — workers refill from the queue in manageable chunks. |
| **Exceptions** | For suites with very small files (under 100ms each), increase batch size to 100+. For very large files, decrease to 10-20. |
| **Consequences Of Violation** | Poor worker utilization. Some workers idle while others are overloaded. Parallel efficiency drops. |

---

### Rule 5: Configure `slowThreshold` to flag unexpectedly slow tests

| Field | Value |
|-------|-------|
| **Name** | Set slow threshold for parallel profiling |
| **Category** | Performance Monitoring |
| **Rule** | Configure a `slowThreshold` (in milliseconds) in `phpunit.xml` to flag tests that take disproportionately long in parallel mode. Default to 500ms. |
| **Reason** | Slow tests limit parallel efficiency. Flagging them automatically surfaces candidates for splitting or optimization. |
| **Bad Example** | No `slowThreshold` — slow tests go unnoticed until they become the parallel bottleneck. |
| **Good Example** | `<parameter name="slowThreshold" value="500"/>` — any test over 500ms is flagged in output. |
| **Exceptions** | Integration tests with external APIs may legitimately exceed 500ms. Track these separately. |
| **Consequences Of Violation** | Test suite gradually slows down as slow tests accumulate without detection. |

---

### Rule 6: Isolate tests that use global state or singletons

| Field | Value |
|-------|-------|
| **Name** | Isolate global state mutation in tests |
| **Category** | Test Design |
| **Rule** | Identify and isolate any test that modifies static properties, service container bindings, facades, or globals. These tests must not share state with other tests. |
| **Reason** | Parallel workers are separate processes, so static state is naturally isolated. However, tests within the same file that run on the same worker still share state. Tests that depend on global state produce non-deterministic results. |
| **Bad Example** | A test that calls `Config::set('app.debug', true)` and another test that checks `Config::get('app.debug')` — order-dependent. |
| **Good Example** | Each test configures its own state using `$this->app->instance()` or `Config::set()` with `RefreshDatabase` resetting state between tests. |
| **Exceptions** | None. Global state in tests is always an anti-pattern. |
| **Consequences Of Violation** | Tests pass or fail based on execution order. Parallel execution produces different results than sequential. |

---

### Rule 7: Run parallel suites with process-level timeout protection

| Field | Value |
|-------|-------|
| **Name** | Set process timeout for parallel workers |
| **Category** | Reliability |
| **Rule** | Configure a per-process timeout for parallel workers (e.g., 300 seconds) to prevent hung workers from blocking the entire suite indefinitely. |
| **Reason** | A single hung test (infinite loop, deadlock, network timeout) in a parallel worker blocks completion of the entire suite. Timeout protection terminates the worker and reports the file as failed. |
| **Bad Example** | No timeout — a deadlocked database query hangs one worker forever, and the CI job never completes. |
| **Good Example** | `<parameter name="timeout" value="300"/>` — workers that exceed 300 seconds are terminated. |
| **Exceptions** | Integration tests with long-running external operations may need a higher timeout (600+ seconds). |
| **Consequences Of Violation** | CI jobs run indefinitely. Pipeline blocks deployment. |
