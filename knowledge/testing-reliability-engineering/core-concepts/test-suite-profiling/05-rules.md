# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Test Framework & Runner Infrastructure
## Knowledge Unit: Test Suite Profiling

---

### Rule 1: Always profile before optimizing the test suite

| Field | Value |
|-------|-------|
| **Name** | Profile before optimizing |
| **Category** | Performance Optimization |
| **Rule** | Always run `php artisan test --profile` to identify the slowest tests before spending time on optimization. |
| **Reason** | Intuition about which tests are slow is frequently wrong. Profiling reveals the actual bottleneck — 80% of test time typically comes from 20% of tests (Pareto principle). |
| **Bad Example** | "Optimizing" a test that takes 5ms while ignoring a test that takes 5 seconds. |
| **Good Example** | Running `php artisan test --profile --top=10`, identifying the single 5-second test, and optimizing or splitting it. |
| **Exceptions** | None. Always profile before optimizing. |
| **Consequences Of Violation** | Development time is wasted optimizing tests that contribute negligibly to total suite time. |

---

### Rule 2: Profile warm runs, not cold cache runs

| Field | Value |
|-------|-------|
| **Name** | Profile warm runs for accurate timing |
| **Category** | Performance Measurement |
| **Rule** | Always profile after a warm-up run (so the cache is populated). Ignore the first run after cache clear. |
| **Reason** | First-run timing includes cache population, OpCache compilation, and filesystem cache building — all of which add time that is not representative of steady-state CI performance. |
| **Bad Example** | Profiling immediately after `php artisan pest:clear` — first run 2x slower than normal. |
| **Good Example** | Running `php artisan test` once to warm caches, then running `php artisan test --profile` for accurate timing. |
| **Exceptions** | When profiling cold-start performance specifically (e.g., for serverless or containerized environments). |
| **Consequences Of Violation** | Optimization decisions based on inflated timings. Effort spent on cache-related overhead that doesn't apply to CI. |

---

### Rule 3: Track p95 test suite execution time over time

| Field | Value |
|-------|-------|
| **Name** | Track p95 suite time trends |
| **Category** | Monitoring |
| **Rule** | Store JUnit XML test results as CI artifacts and track the p95 (or median) test suite execution time over time. Alert when it increases by more than 20% week-over-week. |
| **Reason** | A suite that was 3 minutes and is now 6 minutes has a problem, even if no individual test is flagged as slow. Trend tracking catches gradual performance degradation. |
| **Bad Example** | No timing history — team doesn't realize suite time has doubled over two months. |
| **Good Example** | Weekly CI report showing test suite execution time trend with alerts on significant increases. |
| **Exceptions** | Small teams (<5 developers) may not need formal trend tracking but should still review profile output periodically. |
| **Consequences Of Violation** | Test suite silently slows down over time. CI becomes a bottleneck without anyone noticing until it's too late. |

---

### Rule 4: Optimize the top 20% of slow tests (Pareto principle)

| Field | Value |
|-------|-------|
| **Name** | Focus optimization on the slowest 20% of tests |
| **Category** | Performance Optimization |
| **Rule** | When optimizing the test suite, focus exclusively on the slowest 20% of tests as identified by profiling. |
| **Reason** | 80% of total suite time comes from 20% of tests. Optimizing fast tests yields negligible returns. The Pareto principle ensures optimization effort has maximum impact. |
| **Bad Example** | Optimizing a test that takes 5ms to 3ms — saves 2ms across the entire suite. |
| **Good Example** | Optimizing a test that takes 5 seconds to 1 second — saves 4 seconds across the entire suite. |
| **Exceptions** | When a fast test is expected to become slow (e.g., a new feature adding database queries to an existing test). |
| **Consequences Of Violation** | Development time spent with minimal impact on total suite time. |

---

### Rule 5: Correlate slow tests with database query counts

| Field | Value |
|-------|-------|
| **Name** | Correlate slow tests with query counts |
| **Category** | Performance Analysis |
| **Rule** | When profiling reveals a slow test, check its database query count using `expectsDatabaseQueryCount()` to determine if N+1 queries are the cause. |
| **Reason** | Slow tests are often slow due to excessive database queries (N+1 or unoptimized joins). Reducing query count is usually the highest-impact optimization. |
| **Bad Example** | Optimizing PHP code in a slow test when 80% of its time is spent on N+1 database queries. |
| **Good Example** | Identifying a slow test with 500 queries, adding eager loading to reduce it to 5 queries, and verifying the improvement. |
| **Exceptions** | Tests that are slow due to external service calls, file I/O, or deliberate latency testing. |
| **Consequences Of Violation** | Optimization effort targets the wrong bottleneck. Test remains slow despite code changes. |

---

### Rule 6: Quarantine slow tests to a separate CI job

| Field | Value |
|-------|-------|
| **Name** | Quarantine slow tests to a separate job |
| **Category** | CI/CD |
| **Rule** | Move tests that consistently exceed a time threshold (e.g., >5 seconds) to a separate CI job or suite. Run them less frequently (e.g., nightly). |
| **Reason** | A few slow tests in the main suite block fast feedback for all developers. Quarantining them keeps the main CI pipeline fast while still running them with lower frequency. |
| **Bad Example** | A 30-second external API integration test runs on every commit, doubling CI time. |
| **Good Example** | The API integration test is moved to a nightly "slow tests" job. Main CI completes in 2 minutes. |
| **Exceptions** | Tests that are mission-critical (deployment gates) must run on every commit regardless of speed. |
| **Consequences Of Violation** | CI feedback loop is slow for all developers. Team productivity decreases. |

---

### Rule 7: Configure `--profile` and JUnit output in CI pipeline

| Field | Value |
|-------|-------|
| **Name** | Enable profiling and JUnit output in CI |
| **Category** | CI/CD |
| **Rule** | Include `--profile --log-junit=test-results.xml` in the CI test command and configure the CI platform to store JUnit XML as artifacts. |
| **Reason** | Profiling adds negligible overhead (~0.1%) and provides valuable data. JUnit XML enables CI platforms to show test timing in their UI and enables trend tracking. |
| **Bad Example** | CI runs `php artisan test` without `--profile` or `--log-junit` — no timing data available. |
| **Good Example** | `php artisan test --parallel --profile --log-junit=test-results.xml` with GitHub Actions step uploading the XML. |
| **Exceptions** | Test suites under 100 tests where profiling data provides minimal value. |
| **Consequences Of Violation** | No historical timing data. Team cannot identify when or why the suite slowed down. |

---

### Rule 8: Run profiling 3 times and use median values for optimization decisions

| Field | Value |
|-------|-------|
| **Name** | Use median timing from multiple runs |
| **Category** | Performance Measurement |
| **Rule** | Run profiling 3 times and use the median values when making optimization decisions. Never optimize based on a single run. |
| **Reason** | Test execution times vary due to system load, background processes, OpCache state, and I/O contention. A single run may be an outlier. |
| **Bad Example** | Optimizing based on a profile run where a background process temporarily slowed database queries. |
| **Good Example** | Running `--profile` 3 times, taking the median for each test, and using that data to prioritize optimization. |
| **Exceptions** | When profiling on isolated CI runners with consistent performance, fewer runs may suffice. |
| **Consequences Of Violation** | Optimization targets identified from outlier data. Effort spent on non-existent bottlenecks. |
