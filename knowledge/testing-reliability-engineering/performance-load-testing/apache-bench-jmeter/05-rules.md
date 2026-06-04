# Rules — Apache Bench and JMeter

## Rule 1: Always Load Test on Staging, Never Local Machine
| Field | Value |
|-------|-------|
| **Name** | Always Load Test on Staging, Never Local Machine |
| **Category** | Environment & Validity |
| **Rule** | Always run load tests against a staging environment with production-equivalent hardware, software, and data. Never use local machine results as performance benchmarks. |
| **Reason** | Local machine performance is not production-equivalent — different CPU, memory, network latency, database size, and concurrent load. Results from local testing are misleading and may show 500ms response times that become 5000ms under production conditions. |
| **Bad Example** | Running `ab -n 1000 -c 10 http://localhost:8000/api/users` and using results for capacity planning. |
| **Good Example** | Running `ab -n 1000 -c 10 https://staging.example.com/api/users` against staging with production-equivalent specs. |
| **Exceptions** | Quick sanity checks during development to detect obvious performance regressions (e.g., N+1 queries). |
| **Consequences Of Violation** | Misleading benchmarks; production performance surprises; incorrect capacity planning. |

## Rule 2: Always Warm Up the Application Before Collecting Metrics
| Field | Value |
|-------|-------|
| **Name** | Always Warm Up the Application Before Collecting Metrics |
| **Category** | Methodology & Accuracy |
| **Rule** | Send 100+ warm-up requests before collecting load test metrics. Never include cold-cache requests in performance measurements. |
| **Reason** | The first requests hit cold caches — config, routes, views, and data are uncached. Cold performance is 2-10x slower than warm performance. Production servers operate in warm state. Metrics should reflect the stable, warm operating condition. |
| **Bad Example** | `ab -n 100 -c 10 https://staging.example.com/api/users` — includes the first request which is cold; skews all metrics. |
| **Good Example** | Run 100 warm-up requests, then `ab -n 1000 -c 10 https://staging.example.com/api/users` for measurement. |
| **Exceptions** | Tests specifically designed to measure cold-start performance (e.g., serverless cold boots). |
| **Consequences Of Violation** | Metrics include cold-cache overhead; reported performance is not production-representative. |

## Rule 3: Test Multiple Endpoint Types — Not Just the Happy Path
| Field | Value |
|-------|-------|
| **Name** | Test Multiple Endpoint Types — Not Just the Happy Path |
| **Category** | Coverage & Accuracy |
| **Rule** | Include success paths, validation errors, auth failures, and not-found responses in load tests. Each endpoint type has different performance characteristics. |
| **Reason** | Error pages often execute more code than success paths (exception handling, logging, session management). A validation error that takes 2 seconds while the success path takes 200ms represents a significant performance gap that should be optimized. |
| **Bad Example** | Only testing `GET /api/users` (success path) — validation errors at 2s go unmeasured. |
| **Good Example** | Testing `GET /api/users` (success), `GET /api/users?invalid=true` (validation error), `GET /api/nonexistent` (404). |
| **Exceptions** | Smoke tests where only basic availability is being verified. |
| **Consequences Of Violation** | Error paths perform poorly under load; users experience slow failures. |

## Rule 4: Use Keep-Alive (`-k`) for Realistic Benchmarks
| Field | Value |
|-------|-------|
| **Name** | Use Keep-Alive (`-k`) for Realistic Benchmarks |
| **Category** | Accuracy & Methodology |
| **Rule** | Always use the `-k` flag with Apache Bench to enable HTTP keep-alive. Without it, results are 2-5x slower and not production-representative. |
| **Reason** | Modern browsers reuse TCP connections for multiple requests. Without keep-alive, each request opens a new TCP connection, incurring SSL handshake and connection overhead that doesn't reflect real user behavior. |
| **Bad Example** | `ab -n 1000 -c 10 https://staging.example.com/` — no keep-alive; results show 500 RPS instead of actual 2000 RPS. |
| **Good Example** | `ab -n 1000 -c 10 -k https://staging.example.com/` — keep-alive enabled; results reflect realistic connection reuse. |
| **Exceptions** | Tests measuring worst-case performance for new connection overhead. |
| **Consequences Of Violation** | Underestimating application capacity by 2-5x; over-provisioning infrastructure. |

## Rule 5: Run JMeter in Non-GUI Mode for Actual Tests
| Field | Value |
|-------|-------|
| **Name** | Run JMeter in Non-GUI Mode for Actual Tests |
| **Category** | Methodology & Accuracy |
| **Rule** | Run JMeter tests using `jmeter -n -t plan.jmx -l results.jtl -e -o /report`. Use GUI only for test development, not for actual benchmarking. |
| **Reason** | The JMeter GUI consumes CPU and memory resources that skew load test results. Non-GUI mode eliminates this overhead and provides more accurate metrics. The GUI is a development interface, not a test runner. |
| **Bad Example** | Running load tests from the JMeter GUI — results include GUI resource contention; not production-representative. |
| **Good Example** | Develop test plan in GUI, then execute via `jmeter -n -t plan.jmx -l results.jtl -e -o /reports/report`. |
| **Exceptions** | Debugging sessions where GUI visualization helps identify configuration issues. |
| **Consequences Of Violation** | Inaccurate metrics from resource contention; non-representative performance results. |

## Rule 6: Monitor P99 Latency, Not Just Average Response Time
| Field | Value |
|-------|-------|
| **Name** | Monitor P99 Latency, Not Just Average Response Time |
| **Category** | Metrics & Analysis |
| **Rule** | Always measure and report P50, P95, and P99 latency percentiles in load test results. Never rely solely on average response time. |
| **Reason** | Average response time hides tail latency. A 200ms average could mean all requests take 200ms, or 99% take 100ms and 1% take 10 seconds. P99 latency determines real user experience — 1% of users experiencing 10-second load times is a critical issue. |
| **Bad Example** | "Average response time is 200ms" — hides that 1% of users experience 10-second timeouts. |
| **Good Example** | "P50: 150ms, P95: 400ms, P99: 1200ms" — clear picture of tail latency. |
| **Exceptions** | Quick baseline checks where only throughput (RPS) matters. |
| **Consequences Of Violation** | Tail latency issues go undetected; a percentage of users consistently have poor experience. |
