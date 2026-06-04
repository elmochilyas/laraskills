## Always report four core metrics together: throughput, latency percentiles, error rate, and resource utilization
---
Category: Testing
---
Report throughput (RPS), latency distribution (p50, p95, p99), error rate (%), and resource utilization (CPU, memory per request) in every benchmark — never report any single metric in isolation.
---
Reason: Each metric captures a different dimension of performance. High throughput with high error rate is worse than low throughput with zero errors. Low average latency with 500ms p99 hides tail-latency problems. Good latency with 90% CPU means no headroom for spikes. Reporting metrics in isolation creates systematically misleading performance pictures that lead to wrong decisions.
---
Bad Example:
```bash
# Only throughput reported — misleading
# "2000 RPS!" — but error rate is 15% and p99 is 5 seconds
```

Good Example:
```bash
# All four metrics
# Throughput: 2000 RPS, Latency: p50=45ms p95=120ms p99=350ms
# Errors: 0.1%, CPU: 65%, Memory: 72MB/worker
```
---
Exceptions: Quick ad-hoc tests for a single hypothesis may focus on one or two metrics, but the final benchmark report must include all four.
---
Consequences Of Violation: Misleading performance conclusions, incorrect capacity planning, hidden tail-latency problems undetected until production.

## Use open-loop tools (wrk2, k6) for latency measurement to avoid coordinated omission
---
Category: Testing
---
Select wrk2 with the `--rate` flag or k6 for all latency benchmarks — never use closed-loop tools (ab, wrk, siege) for latency measurement.
---
Reason: Closed-loop tools wait for a response before sending the next request, which means they stop measuring when the system is overloaded — systematically underreporting tail latency by 30-60%. Open-loop tools send requests at a fixed rate regardless of responses, capturing the true latency distribution including queuing delay. The latency that closed-loop tools hide is exactly the latency that users experience under load.
---
Bad Example:
```bash
# Closed-loop — hides tail latency
ab -c 100 -n 10000 http://target/api
```

Good Example:
```bash
# Open-loop — accurate latency
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: When measuring maximum achievable throughput (not latency), closed-loop tools are acceptable for the throughput metric.
---
Consequences Of Violation: Artificially low latency measurements by 30-60%, hidden queuing delay, misleading benchmark conclusions, production latency surprises.

## Warm up the system for 30-60 seconds before recording any benchmark data
---
Category: Testing
---
Run a warm-up phase of at least 30 seconds or 1000 requests before starting the recorded benchmark measurement — discard warm-up data entirely.
---
Reason: Cold caches (OpCache, JIT, filesystem cache, database buffer pool) produce 20-50% higher latency and lower throughput than steady-state performance. Including cold-start data in the benchmark underrepresents the system's true capability. The warm-up phase ensures all caches are populated, connections are established, and the system is operating at steady state before measurement begins.
---
Bad Example:
```bash
# No warm-up — includes cold-start in data
wrk2 -t4 -c64 -d60s -R 2000 http://target/api  # First 30s are cold
```

Good Example:
```bash
# Warm-up, then benchmark
wrk -t4 -c64 -d30s http://target/api/status  # Warm-up
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api  # Benchmark
```
---
Exceptions: When the benchmark is specifically designed to measure cold-start behavior (serverless cold starts), skip warm-up intentionally.
---
Consequences Of Violation: Inflated latency numbers (20-50% higher), underestimated throughput, incorrect performance baseline, over-provisioned infrastructure.

## Collect a minimum of 1000 samples per latency percentile being reported
---
Category: Testing
---
Ensure the benchmark collects at least 1000 samples for p95, 10,000 for p99, and 100,000 for p99.9 — shorter runs produce unreliable percentile estimates.
---
Reason: Percentile estimates are only as reliable as the sample size. With 100 samples, the p95 estimate has high variance — the 95th value out of 100 is not stable. With 1000+ samples, percentile estimates converge to stable values. Insufficient samples produce noisy benchmarks that show regressions where none exist or hide real regressions.
---
Bad Example:
```bash
# 500 samples — unreliable p95
wrk2 -t2 -c8 -d10s http://target/api  # ~500 samples, p95 unreliable
```

Good Example:
```bash
# 6000+ samples — stable percentiles
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: Exploratory or quick-check benchmarks may use fewer samples, but never base production decisions on <1000 samples per percentile.
---
Consequences Of Violation: Unreliable percentile estimates, false positives from noisy data, real regressions hidden in measurement noise.

## Never use Apache Bench (ab) for production-representative benchmarking
---
Category: Testing
---
Reserve Apache Bench for quick smoke tests and local development checks only — never use it for production-representative throughput or latency measurements.
---
Reason: ab is single-threaded, closed-loop, and cannot saturate modern multi-core systems. It systematically underestimates tail latency by 30-50% (coordinated omission) and overestimates capacity by 30-50% because its single-threaded design cannot generate enough load to reveal saturation effects. Benchmarks from ab are consistently misleading and should never inform capacity or performance decisions.
---
Bad Example:
```bash
# ab for production benchmarking — unreliable
ab -c 100 -n 10000 http://target/api  # Results not representative
```

Good Example:
```bash
# wrk2 for production benchmarking
wrk2 -t4 -c64 -d60s -R 2000 --latency http://target/api
```
---
Exceptions: Quick local validation of a single endpoint's basic functionality before running a proper benchmark.
---
Consequences Of Violation: Systematically overestimated capacity and underestimated latency, leading to under-provisioned infrastructure and production performance surprises.
