# Rules — VoltTest Laravel Performance Testing

## Rule 1: Always Use VoltTest for Relative Comparison, Not Absolute Measurement
| Field | Value |
|-------|-------|
| **Name** | Always Use VoltTest for Relative Comparison, Not Absolute Measurement |
| **Category** | Methodology & Accuracy |
| **Rule** | Use VoltTest metrics for before/after comparisons only. Never treat VoltTest response times as predictions of production performance. |
| **Reason** | VoltTest bypasses the HTTP server and network layer. Production response times are 2-5x higher due to web server, PHP-FPM, and network overhead. VoltTest is excellent for measuring improvement ("the query optimization reduced response time by 30%") but the absolute numbers are not production-representative. |
| **Bad Example** | "VoltTest says the endpoint takes 50ms, so production will be 50ms too" — ignoring web server and network overhead. |
| **Good Example** | "The optimization reduced VoltTest response time from 200ms to 140ms (30% improvement) — production should see similar relative improvement." |
| **Exceptions** | Tests running through the full HTTP stack with VoltTest's HTTP mode (if available). |
| **Consequences Of Violation** | Incorrect production performance expectations; surprises during load testing. |

## Rule 2: Run Minimum 100 Iterations Per Configuration
| Field | Value |
|-------|-------|
| **Name** | Run Minimum 100 Iterations Per Configuration |
| **Category** | Statistical Validity |
| **Rule** | Configure at least 100 iterations per load test configuration. Never use fewer than 50 iterations. |
| **Reason** | Low iteration counts produce noisy P95 and P99 metrics that aren't statistically meaningful. A single slow outlier in 10 iterations distorts the average by 10%. 100+ iterations provide stable percentile measurements that can be reliably compared. |
| **Bad Example** | `php artisan volt:load-test --url=/api/users --iterations=10` — P95 metric is meaningless with 10 data points. |
| **Good Example** | `php artisan volt:load-test --url=/api/users --iterations=100` — stable percentiles for reliable comparison. |
| **Exceptions** | Quick smoke tests during development where only order-of-magnitude checks are needed. |
| **Consequences Of Violation** | Noisy metrics; unreliable before/after comparisons; false positives in CI gates. |

## Rule 3: Always Warm Up Before Collecting Metrics
| Field | Value |
|-------|-------|
| **Name** | Always Warm Up Before Collecting Metrics |
| **Category** | Methodology & Accuracy |
| **Rule** | Run 50 warm-up iterations before collecting load test metrics. Never include cold requests in measured data. |
| **Reason** | The first requests include Laravel boot time — config loading, route registration, service provider booting. These are not representative of steady-state performance where the application is already warmed. Including cold requests in metrics skews results toward slower values that don't reflect normal operation. |
| **Bad Example** | `php artisan volt:load-test --url=/api/users --iterations=100` — first request includes cold boot; metric is skewed. |
| **Good Example** | Run 50 warm-up iterations, then 100 measured iterations. Separate warm-up from measurement. |
| **Exceptions** | Tests specifically designed to measure cold-start performance (serverless environments). |
| **Consequences Of Violation** | Skewed metrics from cold-start overhead; improvements appear smaller than they are. |

## Rule 4: Test at Multiple Concurrency Levels
| Field | Value |
|-------|-------|
| **Name** | Test at Multiple Concurrency Levels |
| **Category** | Coverage & Accuracy |
| **Rule** | Test each endpoint at multiple concurrency levels (1, 10, 25, 50). Never test at concurrency 1 only. |
| **Reason** | An endpoint may be fast at concurrency 1 (single user) but degrade significantly at concurrency 25 (multiple simultaneous users) due to database connection pool exhaustion, PHP-FPM worker contention, or locking. Testing only single-user performance hides these degradation patterns. |
| **Bad Example** | `php artisan volt:load-test --url=/api/reports --concurrency=1` — 100ms response, but at concurrency 25 it's 2000ms. |
| **Good Example** | Test at concurrency 1, 10, 25, and 50 — see the latency curve and identify the degradation threshold. |
| **Exceptions** | Endpoints that are accessed by a single user at a time (e.g., scheduled task endpoints). |
| **Consequences Of Violation** | Concurrency bottlenecks go undetected; production degrades under real multi-user load. |

## Rule 5: Set Generous Thresholds for CI Assertions
| Field | Value |
|-------|-------|
| **Name** | Set Generous Thresholds for CI Assertions |
| **Category** | CI & Practicality |
| **Rule** | Set CI performance assertion thresholds with a 50% buffer over observed local performance. Tighten gradually as CI environment stability improves. |
| **Reason** | CI environments have variable performance due to shared resources, background processes, and runner variability. A threshold that matches local performance will cause frequent false-positive failures in CI. Starting with a generous buffer and tightening over time establishes reliable CI gates. |
| **Bad Example** | CI assertion: `response time < 200ms` — local tests show 190ms; CI environment variability causes 50% failure rate. |
| **Good Example** | CI assertion: `response time < 300ms` (50% buffer over 200ms local) — stable gate; tighten to 250ms next month. |
| **Exceptions** | Dedicated CI runners with guaranteed performance characteristics. |
| **Consequences Of Violation** | Flaky CI gates; false-positive failures erode trust in performance assertions. |

## Rule 6: Use Before/After Comparison for Optimization Validation
| Field | Value |
|-------|-------|
| **Name** | Use Before/After Comparison for Optimization Validation |
| **Category** | Methodology & Accuracy |
| **Rule** | Measure response time before and after a performance change in the same test to validate improvement. Use `assertLessThan($before, $after)` for direct comparison. |
| **Reason** | Absolute response time varies between CI runs and environments. Before/after comparison within a single test eliminates environmental variability and directly measures the improvement. This is more reliable than comparing separate CI runs. |
| **Bad Example** | "Yesterday's CI run was 200ms, today's is 180ms — 10% improvement" — environmental factors could account for the difference. |
| **Good Example** | Same test: measure before (200ms), apply optimization, measure after (140ms) — `assertLessThan(200, 140)` confirms improvement. |
| **Exceptions** | Optimizations that cannot be applied dynamically within a single test (e.g., infrastructure changes). |
| **Consequences Of Violation** | Inaccurate optimization assessment; false conclusions about performance improvements. |
