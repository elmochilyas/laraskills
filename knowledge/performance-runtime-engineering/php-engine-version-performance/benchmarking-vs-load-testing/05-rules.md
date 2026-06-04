---
## Rule Name

Warm Up Before Measuring

## Category

Testing

## Rule

Always run at least 30 seconds of warm-up traffic before recording benchmark results.

## Reason

Cold cache results (post-deployment) include compilation time that does not exist in steady-state operation. Without warm-up, benchmarks are not reproducible and overestimate latency.

## Bad Example

```bash
# No warm-up — includes compilation time
wrk -t 4 -c 100 -d 30s http://localhost/api/health
```

## Good Example

```bash
# Warm-up phase then measurement
wrk -t 4 -c 100 -d 30s http://localhost/api/health  # Warm-up (discard)
wrk -t 4 -c 100 -d 60s http://localhost/api/health  # Measurement
```

## Exceptions

Benchmarks specifically designed to measure cold-start performance (document this intent).

## Consequences Of Violation

Non-reproducible results, overestimated latency, incorrect baselines, wasted optimization effort on phantom issues.

---

## Rule Name

Report Both p50 and p95/p99 Latency, Not Just Average

## Category

Testing

## Rule

Never report average latency alone. Always include at least p50, p95, and p99 latency distributions.

## Reason

Average latency hides tail performance. A system can show excellent average latency while 5% of requests take 10x longer due to I/O variability, garbage collection, or saturation effects.

## Bad Example

```bash
# Average: 45ms — looks great!
# p95: 450ms — ten times worse, completely hidden
```

## Good Example

```bash
# Complete latency profile
p50: 32ms
p95: 78ms
p99: 145ms
Average: 38ms
```

## Exceptions

Quick smoke tests where the goal is verifying the system is not broken, not measuring performance.

## Consequences Of Violation

Missed tail latency problems, SLA violations discovered in production, incorrect capacity planning.

---

## Rule Name

Benchmark with Realistic Workloads, Not Synthetic Endpoints

## Category

Testing

## Rule

Never use Hello World or empty endpoint benchmarks for production capacity planning or performance comparison.

## Reason

Realistic workloads include database queries, template rendering, framework bootstrap, and caching layers. Synthetic endpoints produce results 10-100x better than production and hide real bottlenecks.

## Bad Example

```bash
# Benchmarking an empty health endpoint — 100,000 RPS
# Production API does database queries and model hydration — 2,000 RPS
```

## Good Example

```bash
# Benchmarking a production-representative endpoint
# Same middleware, database queries, and response formatting
wrk -t 4 -c 100 -d 60s http://localhost/api/orders?limit=50
```

## Exceptions

Microbenchmarks of specific isolated components (individual function performance) where the goal is algorithmic comparison, not capacity planning.

## Consequences Of Violation

Overestimated capacity by 10-100x, insufficient hardware provisioned, production performance that does not match benchmarks.

---

## Rule Name

Use Open-Loop Models for Tail Latency

## Category

Testing

## Rule

Always use open-loop load generation (constant-rate, wrk2) when the primary goal is measuring tail latency under saturation.

## Reason

Closed-loop tools (wrk, ab) issue the next request only after the previous completes, which underestimates tail latency by 2-5x under saturation. Open-loop models maintain a constant request rate regardless of response time, producing realistic latency distributions.

## Bad Example

```bash
# wrk (closed-loop) — underestimates tail latency under saturation
wrk -t 4 -c 100 -d 60s http://localhost/api/health
```

## Good Example

```bash
# wrk2 (open-loop, constant rate) — accurate tail latency
wrk2 -t 4 -c 100 -d 60s -R 1000 http://localhost/api/health
```

## Exceptions

Queueing system benchmarks where the closed-loop behavior (request-wait-response) is the intended production pattern.

## Consequences Of Violation

Tail latency underestimated by 2-5x, production SLA violations despite passing benchmark, unnoticed saturation effects.

---

## Rule Name

Benchmark Against a Known Baseline

## Category

Testing

## Rule

Never draw conclusions from a single benchmark run. Always compare against a known baseline under identical conditions.

## Reason

Individual benchmark runs are affected by system noise (GC, background processes, network jitter). A single run cannot distinguish improvement from variance.

## Bad Example

```bash
# Run 1: 5000 RPS — "optimization works!"
# Run 2 (same conditions): 4800 RPS — variance, not improvement
```

## Good Example

```bash
# 5 baseline runs: mean 4900 RPS, stddev 100 RPS
# 5 post-change runs: mean 5400 RPS, stddev 80 RPS
# Improvement is statistically significant
```

## Exceptions

Exploratory testing where the goal is directional understanding, not statistical validation.

## Consequences Of Violation

False positives from noise, incorrect conclusions, performance regression deployed because "benchmark looked good."

---

## Rule Name

Isolate Benchmark Environment from Production

## Category

Security

## Rule

Never run write-heavy benchmarks against production databases or shared infrastructure.

## Reason

Benchmark workloads can trigger rate limiting, DDoS protections, and database contention. Write-heavy benchmarks corrupt production data and affect real users.

## Bad Example

```bash
# Load testing the production order submission endpoint
# Real orders are created during the test — data integrity compromised
```

## Good Example

```bash
# Dedicated staging environment with production-like data (anonymized)
# Database restored from production backup (scrubbed)
# Isolated network — no impact on production
```

## Exceptions

Read-only benchmarks against production replicas with minimal resource impact, coordinated with operations.

## Consequences Of Violation

Production data corruption, real user impact, rate-limit triggering, DDoS protection activation against legitimate traffic.
