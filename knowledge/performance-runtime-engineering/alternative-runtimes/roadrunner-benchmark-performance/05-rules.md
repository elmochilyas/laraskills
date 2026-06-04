## Always warm up the system with 1000+ requests before recording benchmark metrics
---
Category: Testing
---
Run a warm-up phase of at least 1000 requests or 30 seconds before recording any benchmark data for RoadRunner or any alternative runtime.
---
Reason: Cold caches (OpCache, JIT, filesystem cache) produce artificially low throughput and high latency in the first seconds of a benchmark. Without warm-up, the benchmark measures cache population cost, not steady-state performance. RoadRunner's advantage — eliminating per-request bootstrap — is most apparent in warm state after all workers are fully initialized and OpCache is populated.
---
Bad Example:
```bash
# No warm-up — measures cold-start performance
wrk -t 4 -c 64 -d 60s http://app:8080/api  # First 30s are cold — invalid data
```

Good Example:
```bash
# Warm-up first
wrk -t 4 -c 64 -d 30s http://app:8080/api/status  # Warm-up phase
# Then benchmark
wrk2 -t 4 -c 64 -d 60s -L -R 2000 http://app:8080/api/endpoint  # Warm — valid data
```
---
Exceptions: When the benchmark is specifically designed to measure cold-start behavior (e.g., serverless cold-start analysis), skip warm-up intentionally.
---
Consequences Of Violation: Benchmark data reflects cache population, not steady-state throughput, leading to incorrect runtime selection decisions based on invalid data.

## Use open-loop load testing tools (wrk2, k6) for accurate tail latency measurements
---
Category: Testing
---
Select wrk2 or k6 for latency measurements in benchmark comparisons; avoid closed-loop tools that suffer from coordinated omission.
---
Reason: Closed-loop tools (ab, siege) wait for a response before sending the next request, artificially reducing measured latency during congestion. Open-loop tools send requests at a fixed rate regardless of responses, capturing the true latency distribution including queuing delay. Without open-loop testing, tail latency (p95, p99) is underreported by 30-50%, hiding the very performance characteristics that matter most in production.
---
Bad Example:
```bash
# Closed-loop tool — underestimates tail latency
ab -c 64 -n 10000 http://app:8080/api
```

Good Example:
```bash
# Open-loop tool — accurate latency distribution
wrk2 -t 4 -c 64 -d 60s -L -R 2000 http://app:8080/api
```
---
Exceptions: When measuring maximum achievable throughput (not latency), closed-loop tools are acceptable for the throughput metric only.
---
Consequences Of Violation: Artificially low latency measurements, hidden tail latency problems, benchmark shows acceptable performance but production experiences latency degradation.

## Measure latency distributions (p50, p95, p99, max) alongside average throughput
---
Category: Testing
---
Record and report p50, p95, p99, and maximum latency for every benchmark run, not just average latency or requests per second.
---
Reason: Average latency hides tail-latency problems. A benchmark might show 2000 RPS at 15ms average, but with p99 at 500ms — 50x the average. This tail latency directly affects user experience, timeout rates, and SLO compliance. Publishing only averages misleads stakeholders into believing performance is better than it is.
---
Bad Example:
```bash
# Average-only reporting — misleading
# "RoadRunner: 15ms average latency" — p99 might be 500ms
```

Good Example:
```bash
# Full latency distribution reporting
# RoadRunner: p50=12ms, p95=45ms, p99=120ms, max=500ms
# FPM: p50=80ms, p95=200ms, p99=450ms, max=2000ms
```
---
Exceptions: Internal benchmarks used solely for capacity planning may prioritize throughput metrics over full latency distributions.
---
Consequences Of Violation: Misleading performance reporting, teams make decisions based on incomplete data, production surprises from tail latency that was hidden in benchmarks.

## Benchmark your specific application workload, not generic endpoints
---
Category: Testing
---
Use production-representative request patterns, data sizes, and database query profiles in benchmarks — not simplified "hello world" endpoints.
---
Reason: Generic benchmarks measure the runtime's raw throughput, not its behavior under your specific application's I/O profile. An application with many small database queries will show different runtime performance than one with large file uploads. Without workload-specific benchmarking, you may select a runtime that excels on generic tests but underperforms on your actual traffic patterns.
---
Bad Example:
```bash
# Generic endpoint — doesn't reflect application's I/O profile
wrk2 http://app:8080/hello  # Sub-1ms response, no database queries
```

Good Example:
```bash
# Application-specific endpoints with actual database load
wrk2 http://app:8080/api/products?page=1  # Real query patterns
wrk2 http://app:8080/api/orders  # Real data sizes and database queries
```
---
Exceptions: Initial runtime evaluation may use simple endpoints for a quick directional comparison, but the final selection decision requires workload-specific data.
---
Consequences Of Violation: Selecting a runtime that performs well on generic benchmarks but worse than alternatives on the application's actual workload.
