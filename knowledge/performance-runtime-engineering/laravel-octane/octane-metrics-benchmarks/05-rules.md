## Benchmark Octane with realistic application workloads, not hello-world endpoints
---
Category: Testing
---
Use production-representative API or page endpoints with actual database queries, middleware, and authentication when benchmarking Octane — hello-world benchmarks overstate real gains by 3-5x.
---
Reason: Hello-world endpoints (returning a string with no database queries, no middleware) measure only the framework bootstrap cost — which Octane eliminates entirely. This shows 15-20x gains. Real application endpoints include database queries (unaffected by Octane), middleware chains, and view rendering. These real-world endpoints typically show 2.5-5x gains. Basing decisions on hello-world benchmarks leads to overestimating Octane's impact and disappointment in production.
---
Bad Example:
```bash
# Hello-world benchmark — 15x gain, unrealistic
wrk http://octane:8080/hello  # Returns "OK" — no real application logic
```

Good Example:
```bash
# Real endpoint — 3x gain, realistic
wrk http://octane:8080/api/products  # Database queries, middleware, auth
```
---
Exceptions: Framework-level performance comparisons may use minimal endpoints for isolating bootstrap impact.
---
Consequences Of Violation: Overestimated performance gains, misleading business case for Octane migration, disappointment when production gains are 3-5x lower than benchmarks.

## Always warm up workers and discard the first 100-1000 requests before recording metrics
---
Category: Testing
---
Run a warm-up phase of 30 seconds or 1000 requests before recording benchmark data to ensure OpCache, connection pools, and JIT are fully initialized.
---
Reason: Cold workers suffer from OpCache misses, unpopulated connection pools, and uninitialized service caches. The first requests on a cold worker are 2-5x slower than steady-state performance. Including these in benchmark data underrepresents Octane's true performance. Discarding the warm-up period ensures the benchmark measures steady-state throughput, which is what users experience under sustained load.
---
Bad Example:
```bash
# No warm-up — includes cold-start in measurements
# Results show 1500 RPS, but steady-state is 2200 RPS
wrk -t4 -c100 -d30s http://octane:8080/api
```

Good Example:
```bash
# Warm-up first
wrk -t4 -c100 -d30s http://octane:8080/api/status  # Warm-up
wrk -t4 -c100 -d60s --latency http://octane:8080/api  # Benchmark
```
---
Exceptions: When the benchmark is specifically designed to measure cold-start behavior (serverless scenarios), skip warm-up intentionally.
---
Consequences Of Violation: Artificially low throughput measurements, incorrect performance baseline, overcompensation by over-provisioning workers.

## Measure and report p50, p95, and p99 latency alongside throughput — never report average alone
---
Category: Testing
---
Record latency percentiles (p50, p95, p99, max) for every benchmark run and report them alongside requests-per-second — average latency alone hides tail-latency problems.
---
Reason: A benchmark showing 2000 RPS with 15ms average latency might have p99 at 500ms — 33x the average. Users in the 99th percentile experience 500ms latency, not 15ms. Average latency obscures the queuing delay, GC pauses, and resource contention that create tail latency. Without percentile reporting, performance regressions in the tail go undetected until users complain.
---
Bad Example:
```bash
# Average-only reporting — misleading
# "Octane: 15ms average latency" — p99 could be 500ms
```

Good Example:
```bash
# Full percentile reporting
# Octane: p50=12ms, p95=45ms, p99=120ms, max=500ms
# Comparison: FPM p50=80ms, p95=200ms, p99=450ms, max=2000ms
```
---
Exceptions: Internal infrastructure benchmarks used solely for capacity planning may prioritize throughput over detailed latency distributions.
---
Consequences Of Violation: Hidden tail-latency problems, SLO violations undetected until user impact, incorrect capacity planning based on misleading averages.

## Monitor worker RSS growth over 24-hour soak tests — alert on >10% growth per hour
---
Category: Monitoring
---
Track Octane worker RSS during 24-hour soak tests and alert if any worker shows >10% RSS growth per hour sustained over 2+ hours.
---
Reason: A worker growing at 5MB RSS per hour will exhaust 120MB of memory margin over 24 hours and OOM. This gradual growth is invisible in short benchmarks but inevitably causes production incidents. The 10%-per-hour threshold catches slow leaks early while ignoring the normal 1-3% variance from request-to-request memory allocation differences. Two consecutive hours of >10% growth confirms a trend, not an anomaly.
---
Bad Example:
```bash
# No RSS monitoring — leaks detected only at OOM
# Worker OOM at hour 14 of 24-hour peak traffic
```

Good Example:
```bash
# RSS trended during soak
# Hour 1: 72MB, Hour 2: 74MB (3%) — OK
# Hour 3: 82MB (11%), Hour 4: 92MB (12%) — ALERT, trend confirmed
```
---
Exceptions: Workers with legitimate per-request memory growth from caching (e.g., loading unique data for each request) should have RSS growth analyzed in context.
---
Consequences Of Violation: Undetected memory leaks cause OOM crashes during peak hours, emergency worker recycling, throughput degradation during recovery.

## Integrate Octane benchmark comparisons into CI/CD pipeline to catch regressions
---
Category: Maintainability
---
Add automated Octane benchmark runs to the CI/CD pipeline, comparing throughput and latency against a baseline commit, and fail the pipeline on >10% throughput drop or >20% p99 increase.
---
Reason: Code changes can silently degrade Octane performance — an added middleware, a new service provider, or a slower query in a hot path. Without automated regression detection, performance degrades incrementally over weeks until it becomes a user-facing problem. CI/CD benchmarking catches regressions within minutes of the commit, making the root cause obvious and the fix straightforward.
---
Bad Example:
```bash
# No regression testing — performance degrades silently
# Week 1: 2100 RPS, Week 4: 1700 RPS — 19% loss, no one noticed
```

Good Example:
```bash
# CI/CD performance gate
# Commit adds 5ms middleware — pipeline fails: throughput dropped 12%
# Developer investigates and optimizes before merge
```
---
Exceptions: Applications without a stable staging environment for benchmarking may rely on production monitoring instead.
---
Consequences Of Violation: Silent performance degradation over time, difficult root-cause analysis across multiple commits, production incidents from accumulated slowdowns.
