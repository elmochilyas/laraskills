# Standardized Knowledge: JIT Workload Benefit Assessment

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | JIT Compilation |
| Knowledge Unit | JIT Workload Benefit Assessment |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Measure |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

JIT benefit is primarily determined by the CPU-bound proportion of the request lifecycle. Applications spending >50% of time in PHP execution benefit significantly (61-95% throughput gain). Applications spending >80% waiting on I/O (database, network, disk) see minimal gain (0-5%). The industry rule: benchmark before enabling, don't assume.

## Core Concepts

- **CPU-Bound Proportion**: Time spent in PHP opcode execution / total request time. Template rendering, data transformation, encryption, image processing are CPU-bound.
- **I/O-Bound Proportion**: Time waiting for external resources. Database queries, HTTP API calls, file reads, session storage are I/O-bound.
- **Break-Even Point**: JIT becomes net-positive when CPU-bound time > ~15% of total request time (including JIT compilation overhead).
- **Workload Categories**: API endpoints (mixed), cron jobs (often CPU-bound), queue workers (mixed), report generation (CPU-bound), static page serving (I/O-bound).

## When To Use

- Deciding whether to enable JIT for a specific application
- Benchmarking JIT benefit before/after deployment
- Characterizing workload types across different endpoints
- Building a business case for JIT investment

## When NOT To Use

- When JIT is already enabled and performing well (no need to reassess)
- For purely I/O-bound utilities that don't need optimization
- When the profiling overhead distorts the measurement

## Best Practices

- **JIT assessment checklist**: Profile a representative request, calculate CPU-time ratio (PHP execution / total wall time), if >30% enable JIT and benchmark. Compare p50 and p95 pre/post.
- **Benchmark specific endpoints**: Different endpoints have different CPU-bound proportions. Measure the most critical few, not just the average.
- **Include background jobs**: Cron tasks, queue workers, and batch processing are often more CPU-bound than web requests. Don't assess only web traffic.
- **Use sampling profilers**: Xdebug adds 50-200% overhead, distorting CPU-time measurement. Use sampling profilers (Blackfire, Tideways, SPX) for accurate assessment.
- **Reassess after changes**: Application changes affect CPU-bound proportion. Re-run the assessment after major feature releases or framework upgrades.

## Architecture Guidelines

- **CPU-Time Ratio Formula**: CPU_time / (CPU_time + I/O_wait_time) = CPU-bound proportion. I/O wait time = total wall time - CPU time - network latency.
- **Typical Ratios**: Laravel CRUD API: 20-40% CPU-bound (framework bootstrap + template rendering). Image processing: 80-95% CPU-bound. Static page: <10% CPU-bound.
- **JIT Break-Even**: Below 15% CPU-bound, JIT overhead (compilation, buffer management) exceeds benefit. Above 30%, JIT provides meaningful gains.
- **Workload Mix Impact**: Even if average API request is I/O-bound, specific endpoints (report generation, data export) may benefit significantly.

## Performance Considerations

- JIT enabled universally is harmless (0-2% overhead on I/O-bound paths) and beneficial for cron/queue/batch workloads
- CPU-bound example: Image processing pipeline → 80% throughput increase with JIT
- I/O-bound example: Standard CRUD API with 200ms DB queries → 3-5% throughput increase with JIT
- Break-even point: JIT becomes net-positive when CPU-bound time > ~15%

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming JIT helps all requests | Not understanding JIT mechanics | Mistaken conclusion that JIT is broken | Profile CPU-bound proportion before assessment |
| Testing only web requests | Forgetting other execution paths | Background jobs miss optimization | Include cron, queue, and batch workloads |
| Using Xdebug for CPU-time measurement | Convenience | Distorted timing data (50-200% overhead) | Use sampling profilers (Blackfire, SPX) |
| Not benchmarking after JIT enablement | Trusting published benchmarks | Unknown actual benefit for specific workload | Always measure before/after on your application |

## Anti-Patterns

- **Disabling JIT because web requests don't benefit**: Background processing may see 50%+ gains. Enable JIT at the server level; individual SAPI configs can disable if needed.
- **Expecting linear scaling**: JIT benefit doesn't scale linearly with CPU proportion. Other factors (cache misses, compilation overhead) affect the relationship.
- **Micro-benchmarking JIT**: PHPBench JIT benchmarks (61-95% gains) represent the upper bound. Real application gains are typically 3-15% for mixed workloads.

## Examples

```bash
# JIT assessment workflow
# 1. Profile a representative request
blackfire curl http://app/api/endpoint
# 2. Extract CPU vs I/O time from profile
# 3. If CPU > 30%:
#    a. Enable JIT (1254, 128MB)
#    b. Warm up (1000 requests)
#    c. Benchmark before and after
wrk2 -t4 -c64 -d60s -R 2000 --latency http://app/api/endpoint
```

## Related Topics

- JIT Concepts and Terminology
- JIT Configuration for Production
- Profiling Observability
- Benchmarking Methodology

## AI Agent Notes

- JIT benefit is 0-5% for I/O-bound web apps and 61-95% for CPU-bound workloads.
- Profile your specific workload. Don't assume based on published benchmarks.
- JIT is harmless on I/O-bound paths (0-2% overhead). Enable universally.
- Background jobs (cron, queues) benefit more from JIT than web requests.
- The break-even point is ~15% CPU-bound proportion. Above 30%, JIT provides meaningful gains.

## Verification

- [ ] Representative request profiled (CPU vs I/O time)
- [ ] CPU-bound proportion calculated
- [ ] JIT enabled if CPU > 15% (or universally)
- [ ] Before/after benchmark completed
- [ ] Background workloads included in assessment
- [ ] Sampling profiler used (not Xdebug)
- [ ] Assessment re-run after significant application changes
