# Skill: Benchmark and Monitor Octane Performance with Metrics-Driven Validation

## Purpose
Measure, benchmark, and monitor Laravel Octane's throughput and latency improvements by running realistic workload benchmarks with proper warm-up and percentile reporting, tracking worker RSS growth over soak tests, and integrating performance regression detection into the CI/CD pipeline.

## When To Use
- Validating Octane's performance gain before or after production deployment
- Comparing Octane drivers (RoadRunner, Swoole, FrankenPHP) for your specific workload
- Detecting performance regressions after code changes or Octane version upgrades
- Troubleshooting memory leaks or performance degradation in long-running workers
- Capacity planning — sizing worker counts, memory allocation, and connection pools
- Setting up continuous performance monitoring for production Octane deployments

## When NOT To Use
- Without a dedicated or isolated benchmarking environment (shared environments give unreliable results)
- Before stabilizing the Octane deployment (benchmark first, tune, benchmark again)
- Using unrealistic workloads (hello-world endpoints overstate gains by 3-5×)
- For single-metric optimization (always measure RPS + latency percentiles + memory together)

## Prerequisites
- Laravel application running under Octane in a staging environment
- Benchmarking tools: `wrk` or `wrk2` installed (or `ab` as fallback)
- PHP-FPM baseline benchmarks (for before/after comparison)
- Monitoring infrastructure capable of tracking per-worker RSS
- CI/CD pipeline with ability to run benchmark comparisons
- Understanding of workload characteristics (API-heavy vs mixed vs UI-heavy)

## Inputs
- PHP-FPM baseline metrics: RPS, p50/p95/p99 latency, error rate at different concurrency levels
- Worker count, max_requests, and driver configuration
- Target endpoints for benchmarking (production-representative)
- Expected throughput and latency SLOs
- Server specifications: CPU cores, RAM, database max_connections
- Benchmark results from previous runs (for regression detection)

## Workflow

### 1. Establish PHP-FPM Baseline
- Run benchmarks against the current PHP-FPM deployment before Octane migration
- Use production-representative endpoints (not hello-world)
- Test at multiple concurrency levels: 10, 25, 50, 100 concurrent connections
- Record: RPS, p50, p95, p99 latency, error rate, worker RSS
- Example command: `wrk -t4 -c100 -d60s --latency http://fpm-app/api/users`
- Store results as the baseline for Octane comparison

### 2. Benchmark Octane with Realistic Workloads
- Deploy Octane in staging with the same application code
- Warm up workers: run 30s or 1000 requests before recording data
- Benchmark the same endpoints used for the FPM baseline
- Test at the same concurrency levels
- Record: RPS, p50, p95, p99 latency, error rate, per-worker RSS
- Run with different drivers if comparing RoadRunner vs Swoole vs FrankenPHP
- Calculate gain: `octane_rps / fpm_rps` and latency reduction per percentile

### 3. Measure and Report Full Percentile Distribution
- Never report average latency alone — always include p50, p95, p99, max
- Use `wrk2` (open-loop) for accurate tail latency measurement
- Open-loop tools prevent coordinated omission (where closed-loop tools hide tail latency)
- Report format:
  ```
  Octane: RPS=2500, p50=12ms, p95=45ms, p99=120ms, max=500ms
  FPM:    RPS=500,  p50=80ms, p95=200ms, p99=450ms, max=2000ms
  Gain:   5× RPS,   p50: 6.7×, p95: 4.4×, p99: 3.75×
  ```
- Track tail latency trends over time — tail regression is often the first sign of issues

### 4. Run 24-Hour Soak Test with RSS Monitoring
- Deploy Octane to staging with production-representative traffic generation
- Measure per-worker RSS every 5-10 minutes for 24 hours
- Plot RSS over time for each worker
- Alert criteria:
  - >10% RSS growth per hour sustained over 2+ hours → memory leak
  - Any worker RSS >150% of average worker RSS → per-worker leak
  - Total worker RSS + overhead approaching server RAM limit → capacity issue
- If leak detected, use `octane:profile-memory` (Swoole) to identify the memory consumer
- RSS stable (flat or <5% growth over 24 hours) → worker is healthy

### 5. Profile Worker Memory with octane:profile-memory
- Run `php artisan octane:profile-memory` during staging benchmarks
- This shows per-service memory consumption (Swoole driver)
- Identify services with unexpectedly high memory usage
- Compare memory profiles across workers to detect uneven distribution
- Investigate services that grow over time (accumulating data)

### 6. Monitor OpCache Hit Rate
- Check OpCache hit rate under load: `opcache_get_status()['opcache_statistics']['hits']`
- Hit rate must be >99% for optimal Octane performance
- A 1% hit rate decrease adds ~0.5-1% CPU usage from recompilation
- If hit rate drops: increase `opcache.memory_consumption` or `opcache.max_accelerated_files`
- Verify preloading is working: `opcache_get_status()['preload_statistics']`

### 7. Integrate Benchmark Regression Detection into CI/CD
- Add automated benchmarks to CI pipeline on every commit
- Compare RPS and p99 latency against the baseline commit
- Fail the pipeline if:
  - Throughput drops >10%
  - p99 latency increases >20%
  - Error rate increases >1%
- Store benchmark history to track performance over time
- Alert on trends even within thresholds (e.g., 3 consecutive runs with decreasing RPS)

### 8. Create Octane Performance Dashboard
- Set up Prometheus/Grafana dashboard (or APM equivalent) with:
  - RPS (by endpoint)
  - p50/p95/p99 latency
  - Worker count and status
  - Per-worker RSS (average, max, per-worker breakdown)
  - Connection pool utilization
  - OpCache hit rate
  - GC telemetry (root count, collection frequency)
- Set up alert rules:
  - Worker count drops below expected (critical)
  - Any worker RSS >150% of baseline (warning)
  - p99 latency > SLO threshold (critical)
  - OpCache hit rate <99% (warning)
- Review dashboard weekly for trend analysis

## Validation Checklist
- [ ] PHP-FPM baseline captured at multiple concurrency levels
- [ ] Octane benchmarked with realistic workloads after warm-up
- [ ] Full percentile distribution reported (p50, p95, p99, max) not just average
- [ ] 24-hour soak test completed with RSS growth <10% per hour
- [ ] `octane:profile-memory` run and top memory consumers identified
- [ ] OpCache hit rate >99% verified under load
- [ ] CI/CD benchmark regression detection configured with thresholds
- [ ] Performance dashboard created with key Octane metrics
- [ ] Alert rules configured for worker count drop, RSS anomalies, p99 SLO
- [ ] Benchmark history stored for trend analysis

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Benchmarks show lower gain than expected | 1.5× instead of 5× | Unrealistic expectations from hello-world benchmarks | Use real endpoints, account for I/O proportion |
| RSS grows during soak | 10%+ per hour memory increase | Memory leak from static property or singleton | Profile with octane:profile-memory, fix leak source |
| p99 latency spikes under load | Tail latency 10× p50 | Coordinated omission from closed-loop benchmark | Use wrk2 (open-loop) for accurate tail latency |
| OpCache hit rate <95% | High CPU from recompilation | opcache.memory_consumption too small | Increase to 512MB, verify max_accelerated_files |
| CI benchmark variance >20% | Same code shows different performance | Shared benchmark environment, noisy neighbors | Use dedicated benchmark environment |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| wrk vs wrk2 vs k6 | wrk: quick throughput benchmarks. wrk2: accurate tail latency (open-loop). k6: user-journey simulation |
| Benchmark concurrency level | Start at 10, increase to 25, 50, 100. Stop when throughput plateaus or latency exceeds SLO |
| CI benchmark threshold | 10% throughput drop or 20% p99 increase as fail threshold. Track trends even within thresholds |
| Soak test duration | 24 hours minimum. 72 hours for critical applications. 7 days for detecting slow leaks (<2%/hour) |

## Performance Considerations
- Octane's 2.5-20× gain is workload-dependent — benchmark with real endpoints, not hello-world
- Worker RSS grows with request count — monitor over time, not just at start
- OpCache hit rate must remain >99% or Octane's advantage erodes from recompilation
- Connection pool utilization matters — monitor alongside throughput and latency
- Staging benchmarks must use production-scale data to be representative
- Post-Octane, database queries become the dominant bottleneck — benchmark query performance separately

## Security Considerations
- Health check endpoints should expose minimal information (worker count, status only)
- Benchmark endpoints must not be accessible from the public internet
- APM tools capturing request data must have data scrubbing for sensitive fields (passwords, tokens, PII)
- `octane:profile-memory` output may reveal internal application structure — restrict access
- Benchmark results (RPS, latency) could be used by attackers to infer infrastructure capacity

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Benchmark with realistic workloads, not hello-world | `05-rules.md:1` | Step 2: use production-representative endpoints |
| Always warm up workers and discard first 100-1000 requests | `05-rules.md:25` | Step 2: warm-up phase |
| Measure and report p50, p95, p99 alongside throughput | `05-rules.md:51` | Step 3: full percentile reporting |
| Monitor worker RSS growth over 24-hour soak tests | `05-rules.md:76` | Step 4: soak test methodology |
| Integrate Octane benchmark comparisons into CI/CD | `05-rules.md:101` | Step 7: CI/CD regression detection |

## Related Skills

| Skill | Relation |
|-------|----------|
| Estimate Octane Performance Gain | Estimation methodology informs benchmark expectations |
| Configure Octane Workers by Driver | Worker count affects benchmark results |
| Manage and Prevent Octane State Leaks | RSS monitoring detects state leaks |
| Tune Octane for Sub-50ms Response | Post-benchmark optimization |
| Perform FPM-to-Octane Migration | Benchmarking validates migration success |

## Success Criteria
- FPM baseline captured and Octane improvement quantified with realistic workloads
- Full percentile distribution reported (not just average)
- 24-hour soak test confirms stable RSS (<10% growth per hour)
- OpCache hit rate >99% verified under sustained load
- CI/CD pipeline catches performance regressions (RPS drop >10%, p99 increase >20%)
- Performance dashboard provides real-time visibility into Octane metrics
- Team can identify and investigate memory leaks from RSS monitoring data
- Benchmark history enables trend analysis and capacity planning
