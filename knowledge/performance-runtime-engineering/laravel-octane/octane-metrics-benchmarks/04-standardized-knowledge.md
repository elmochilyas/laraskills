# Octane Metrics and Benchmarks — Benchmark Ranges, Performance Measurement, Observation

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Octane Metrics and Benchmarks — Benchmark Ranges, Performance Measurement, Observation |
| Difficulty | Intermediate |
| Last Updated | 2026-06-02 |

## Overview

Laravel Octane delivers 2.5–20× throughput improvements over PHP-FPM depending on workload characteristics. Understanding how to measure, benchmark, and monitor Octane's performance is critical for validating gains and detecting regressions. Key metrics include requests per second (RPS), latency percentiles (p50/p95/p99), worker memory (RSS), connection pool utilization, and GC telemetry. Octane provides built-in commands (`octane:status`, `octane:profile-memory`) and integrates with profiling tools for deeper analysis.

## Core Concepts

- **Throughput (RPS)**: Requests per second the server can handle. Varies dramatically by workload — API endpoints achieve 10–20× gains, while full-page rendering achieves 2.5–3×.
- **Latency percentiles**: p50 (median), p95 (slowest 5%), p99 (slowest 1%). Octane's bootstrap elimination reduces the floor, making tail latency more dependent on I/O variability.
- **Worker memory (RSS)**: Resident Set Size per worker. Baseline ~65MB, growing with request count. Stable RSS indicates no memory leak; growing RSS indicates a leak.
- **`octane:status`**: Shows worker count, request count, and status. Quick health check for Octane servers.
- **`octane:profile-memory`**: Profiles memory usage per service provider, identifying providers that consume excessive memory in persistent workers.
- **Connection pool utilization**: Database and Redis connection usage. In Octane, workers hold persistent connections — monitor pool exhaustion.
- **GC telemetry**: `gc_status()` output — root buffer entries, collection count, GC time. Essential for detecting cycle accumulation in long-running workers.
- **Hit rate**: OpCache hit rate must remain >99% under Octane. Cache eviction forces recompilation, defeating Octane's purpose.

## When To Use

- You need to validate Octane's performance gain before production deployment.
- You want to monitor performance regressions after code changes or Octane version upgrades.
- You are troubleshooting memory leaks or performance degradation in long-running workers.
- You need to compare driver performance (RoadRunner vs Swoole vs FrankenPHP) for your specific workload.
- You are capacity planning — sizing worker counts, memory allocation, and connection pools.

## When NOT To Use

- You haven't deployed Octane yet — don't benchmark prematurely. Deploy, stabilize, then measure.
- You are using shared hosting where you cannot control the benchmarking environment.
- You are comparing Octane vs FPM with unrealistic workloads (e.g., Hello World endpoints that don't exercise the application).
- You don't have a dedicated or isolated environment for benchmarking. Shared environments produce unreliable results.

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Benchmark with realistic application workloads | Hello World benchmarks show 15–20× gains but real apps show 2.5–5×. Use actual API or page endpoints. |
| Warm up workers before measuring | First 100–1000 requests trigger OpCache population, preloading, and connection pool warm-up. Ignore initial measurements. |
| Measure for 30–60 seconds minimum | Short benchmarks miss tail latency. Run for sufficient duration to collect enough samples for p95/p99. |
| Track p50, p95, and p99 latency | p50 shows typical performance. p95 and p99 reveal tail latency issues. |
| Monitor worker RSS over time | RSS growing >10% per 1000 requests indicates a memory leak. Collect RSS at request boundaries. |
| Benchmark at different concurrency levels | Test at 10, 25, 50, 100 concurrent connections to find the throughput peak and saturation point. |
| Compare driver performance for your specific app | RoadRunner, Swoole, and FrankenPHP have different performance profiles depending on workload. Benchmark all three. |
| Use open-loop load testing (wrk2) for tail latency | Closed-loop tools (ab, wrk) can hide tail latency issues. Open-loop tools measure true user experience. |

## Architecture Guidelines

- **Benchmarking methodology**: Use `wrk` or `wrk2` for HTTP-level benchmarking. Use `k6` for user-journey simulation. Use `phpbench` for micro-benchmarks.
- **Metrics collection**: Expose Prometheus metrics from Octane via the `laravel/prometheus` package or custom middleware. Track RPS, latency, worker count, connection pool size, and GC status.
- **Continuous benchmarking**: Integrate benchmarks into CI/CD. Compare against a baseline commit. Fail the pipeline if throughput drops by >10% or p99 increases by >20%.
- **Octane status command**: `php artisan octane:status` provides a snapshot of worker health. Use it in health check endpoints and monitoring dashboards.
- **Memory profiling**: Run `php artisan octane:profile-memory` during development to identify services that consume excessive memory in the persistent worker context.
- **Application performance monitoring**: Send Octane metrics to APM tools (Datadog, New Relic, Sentry). Set up dashboards for p50/p95/p99 latency, RPS, and error rate.

## Performance Considerations

- Octane's throughput improvement varies by framework version (Laravel 11 vs 12), driver (RoadRunner vs Swoole vs FrankenPHP), and workload (API vs full page).
- API-only endpoints see 10–20× gains. Full-stack pages with Blade rendering see 2.5–3× gains. The difference is proportional to the bootstrap-to-execution ratio.
- Each Octane worker uses 30–80MB RSS. Total memory = workers × per-worker RSS. Monitor closely — memory leaks accumulate.
- Octane drops 40–60% throughput when memory pressure triggers swap. Ensure adequate RAM for peak load.
- The primary bottleneck shifts from framework boot to database/API I/O under Octane. Optimize external calls after deploying Octane.
- OpCache hit rate must remain >99%. A 1% hit rate decrease adds ~0.5–1% CPU usage from recompilation.

## Security Considerations

- Benchmarking endpoints can overwhelm the server if exposed publicly. Use internal or authenticated endpoints for monitoring.
- `octane:profile-memory` output may reveal internal application structure. Do not expose this in production.
- APM tools that capture request data may inadvertently log sensitive information. Configure data scrubbing rules.
- Health check endpoints should return minimal information — worker count and status only, not detailed metrics.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Benchmarking with `php artisan serve` | The development server is single-threaded and not indicative of production performance. | Using the familiar development command. | Results are meaningless — orders of magnitude slower than production. | Benchmark against Octane running on the target production driver. |
| Ignoring warm-up phase | First requests include OpCache population, preloading, and worker bootstrap. | Running short benchmarks immediately after start. | Throughput appears lower than reality. Latency appears higher. | Discard first 100–1000 requests. Benchmark for 30s+ after warm-up. |
| Only measuring throughput (RPS) | RPS alone doesn't show user experience. A server can have high RPS with terrible tail latency. | Focusing on the easiest metric. | p99 latency may be 10× p50, causing poor user experience at the tail. | Always measure p50, p95, p99 alongside RPS. |
| Not monitoring worker memory | Memory leaks accumulate silently in long-running workers. | Assuming FPM's per-request cleanup. | Worker RSS grows until OOM, causing 40–60% throughput drop. | Monitor RSS per-worker over 24h soak test. |
| Benchmarking with unrealistic data | An empty database or cache yields unrealistically fast results. | Using a development dataset for performance testing. | Production performance is 2–10× worse than benchmarks. | Use production-scale data and traffic patterns. |

## Anti-Patterns

- **Single-metric optimization**: Optimizing only for RPS while ignoring memory, latency, and error rate. Always consider the full picture.
- **Comparing against a non-baseline**: Comparing Octane's unoptimized configuration to FPM's optimized configuration. Benchmark both with optimal settings.
- **Benchmarking on development hardware**: Development machines have different CPU, memory, and I/O characteristics than production. Always benchmark on production-equivalent hardware.
- **Ignoring coordinated omission**: Closed-loop benchmark tools (wrk, ab) can miss tail latency because they start the next request when the previous finishes. Use open-loop tools (wrk2) for accurate tail latency.

## Examples

```bash
# Basic throughput benchmark — Octane vs FPM
# PHP-FPM baseline
ab -n 10000 -c 10 http://localhost:8080/api/users

# Octane with RoadRunner
wrk -t4 -c100 -d30s --latency http://localhost:8080/api/users

# Tail latency with open-loop (wrk2)
wrk2 -t4 -c100 -d30s -R1000 --latency http://localhost:8080/api/users

# Memory profiling
php artisan octane:profile-memory

# Continuous health monitoring
php artisan octane:status
```

```
# Metrics to track per Octane worker:
{
  "request_count": 5000,
  "current_memory_mb": 72.3,
  "peak_memory_mb": 85.1,
  "gc_roots": 234,
  "gc_collected": 15000,
  "opcache_hit_rate": 99.8,
  "db_connections": 2,
  "redis_connections": 1
}
```

## Related Topics

- Octane Architecture and Execution Model
- Benchmarking Methodology (wrk/wrk2/k6)
- Worker Configuration by Driver
- State Management and Leak Prevention
- Profiling Tools (Blackfire, Tideways)

## AI Agent Notes

- Octane's 2.5–20× gain over FPM is real but heavily workload-dependent. API endpoints with <50ms response time see the largest gains because bootstrap was the dominant cost.
- The first thing to benchmark when deploying Octane is worker RSS growth — a 24-hour soak test reveals memory leaks that shorter benchmarks miss.
- A common pitfall: investing effort in Octane tuning when the real bottleneck is a single slow database query. Profile first, then optimize.
- Octane shifts the bottleneck from framework boot to I/O. After deploying Octane, focus optimization effort on database queries, API calls, and cache performance.

## Verification

- [ ] Run `php artisan octane:status` and verify all workers are in "ready" state.
- [ ] Run a 30-second warm-up phase followed by a 30-second benchmark with `wrk`.
- [ ] Measure p50/p95/p99 latency and compare against your SLO targets.
- [ ] Monitor worker RSS over a 1-hour soak test — verify growth <10%.
- [ ] Run `octane:profile-memory` and identify top memory consumers.
- [ ] Compare throughput with PHP-FPM baseline at the same concurrency level.
- [ ] Verify OpCache hit rate >99% under load.
- [ ] Set up Prometheus/Grafana dashboard for Octane metrics.
- [ ] Integrate benchmark comparison into CI/CD pipeline.
- [ ] Document baseline metrics and performance targets.
