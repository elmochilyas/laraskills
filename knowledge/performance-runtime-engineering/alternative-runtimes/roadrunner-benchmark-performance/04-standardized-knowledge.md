# Standardized Knowledge: RoadRunner Benchmark Performance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | RoadRunner Benchmark Performance |
| Difficulty | Intermediate |
| Lifecycle | Evaluate, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Independent benchmarks consistently show RoadRunner delivering 41-111% throughput improvement over PHP-FPM across various PHP frameworks. The gain comes almost entirely from eliminating per-request bootstrap. Once the Go scheduler and PHP workers are warmed up, every request avoids the 10-40ms framework initialization cost. RoadRunner's performance advantage is most pronounced for fast API endpoints (<100ms) and holds across mixed workloads.

## Core Concepts

- **Benchmark Methodology**: Sources include PHPBenchLab (2026), Deploynix (2026), toadbeatz/PHP-Runtime-Benchmark (2026). Test configurations use Laravel/Symfony with varying I/O profiles in warm state.
- **Light I/O (sub-1ms DB)**: RoadRunner: 2,200 RPS. PHP-FPM: 1,300 RPS. Improvement: 69%.
- **Mixed I/O (5-20ms DB)**: RoadRunner: 1,800 RPS. PHP-FPM: 1,100 RPS. Improvement: 64%.
- **Heavy I/O (50ms+ DB)**: RoadRunner: 950 RPS. PHP-FPM: 450 RPS. Improvement: 111%.
- **Latency Improvement**: p50 latency drops from ~80ms (FPM) to ~15ms (RoadRunner) for fast endpoints.

## When To Use

- Evaluating runtime options for Laravel Octane or Symfony Runtime
- Building a business case for migrating from PHP-FPM to a memory-resident runtime
- Setting performance benchmarks and SLOs for RoadRunner deployments
- Comparing RoadRunner against Swoole, FrankenPHP, and FPM for specific workload profiles

## When NOT To Use

- When benchmarks are the sole selection criterion — workload-specific testing is essential
- For teams without the expertise to properly warm up systems and measure latency distributions
- When the expected improvement doesn't exceed the migration cost (typically <25% expected gain)

## Best Practices

- **Always benchmark your specific workload**: Published benchmarks are directional. Your application's I/O profile, framework, and dependencies determine actual gains.
- **Warm up before measuring**: Cold caches, JIT, and OpCache produce misleading results. Run 1000+ warm-up requests before recording metrics.
- **Measure latency distributions, not just averages**: Track p50, p95, p99, and max latency. Average latency hides tail latency problems.
- **Account for coordinated omission**: Use open-loop load testing (wrk2) for accurate tail latency measurements. Closed-loop tools underreport latency.
- **Monitor error rate under load**: High throughput with high errors is worse than low throughput. Track HTTP error codes and PHP worker crashes.

## Architecture Guidelines

- **Benchmark in Warm State**: RoadRunner's advantage is most pronounced when workers are warm. Cold-state benchmarks (after deploy) underestimate production performance.
- **Match Concurrency to Production**: Use `wrk -t N -c M` with N threads and M connections matching your production concurrency profile. Single-threaded benchmarks for multi-threaded systems mislead.
- **Isolate Variables**: When comparing RoadRunner vs FPM vs Swoole vs FrankenPHP, keep all other variables (PHP version, OpCache config, hardware) identical.
- **Test Memory Under Load**: Monitor RSS, heap usage, and OpCache status during benchmarks. Performance improvements that cause OOM are not wins.

## Performance Considerations

- RoadRunner's advantage over Swoole under low I/O: Go goroutine scheduler has dedicated OS threads; Swoole coroutines share a single thread
- Bottleneck shifts from bootstrap to PHP execution — further optimization requires JIT or algorithmic improvements
- RoadRunner's memory advantage over FPM: fewer total processes (PHP workers) due to no per-request bootstrap need
- Performance gains diminish when response times exceed 500ms as I/O wait dominates

## Security Considerations

- Benchmarked numbers should be treated as sensitive business metrics — do not expose raw benchmark results publicly
- Load testing tools can trigger security monitoring thresholds. Coordinate with security teams before running benchmarks on production-like environments.
- Benchmark data from production traffic captures real user behavior — ensure data is anonymized if published.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Ignoring coordinated omission | Using closed-loop load testing tools | Latency measurements are artificially low | Use wrk2 (open-loop) for tail latency; k6 for user-journey tests |
| Not warming up the system | Benchmarking immediately after deploy | Cold caches/JIT/OpCache produce misleading results | Run 1000+ warm-up requests before recording |
| Benchmarking with unrealistic data | Using small datasets | Inflated performance numbers | Use production-sized datasets in benchmarks |
| Single-threaded load generation | Insufficient load generator capacity | Cannot saturate multi-CPU system | Match load generator threads to production concurrency |
| Not measuring error rate | Focusing only on throughput | High throughput with high errors is worse than low throughput | Track error rate alongside throughput and latency |

## Anti-Patterns

- **Benchmarking RoadRunner against FPM without tuning FPM first**: An unoptimized FPM configuration makes RoadRunner look better than it is. Tune FPM properly before comparing.
- **Publishing benchmark results without methodology**: Without methodology details (warm-up, sample size, hardware specs), benchmarks are misleading. Always document the full methodology.
- **A/B testing with different hardware**: Comparing RoadRunner on one server against FPM on another introduces hardware variance. Always use the same hardware.
- **Using production traffic for benchmarks**: Real user traffic introduces uncontrolled variables. Use synthetic load with production-representative patterns.

## Examples

```bash
# Warm-up phase (1000 requests)
wrk -t 4 -c 64 -d 30s http://app:8080/api/status

# Benchmark phase (60s, record HDR histogram)
wrk2 -t 4 -c 64 -d 60s -L -R 2000 http://app:8080/api/endpoint

# Compare: same test against PHP-FPM
wrk2 -t 4 -c 64 -d 60s -L -R 2000 http://fpm:8080/api/endpoint
```

## Related Topics

- Runtime Comparison Overview
- RoadRunner Architecture and Goridge
- Laravel Octane Driver Selection
- Benchmarking Methodology

## AI Agent Notes

- RoadRunner benchmarks consistently show 41-111% improvement over FPM, but actual results depend on the specific application workload profile.
- The p50 latency improvement (80ms FPM → 15ms RoadRunner) is often more impactful than throughput gains for user-facing applications.
- Benchmark comparisons should always include Swoole and FrankenPHP to provide context, as each runtime has specific workload sweet spots.
- Coordinated omission is the most common methodological error in PHP benchmarks — default to open-loop tools (wrk2, k6) for accurate tail latency.

## Verification

- [ ] Warm-up phase completed (1000+ requests)
- [ ] Open-loop load testing tool used (wrk2 or k6)
- [ ] Latency distributions recorded (p50, p95, p99, max)
- [ ] Error rate monitored during benchmark
- [ ] All variables (PHP version, OpCache, hardware) controlled
- [ ] Production-representative data and workload used
- [ ] Coordinated omission accounted for in methodology
