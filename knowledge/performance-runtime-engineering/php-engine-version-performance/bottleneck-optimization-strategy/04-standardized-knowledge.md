# Standardized Knowledge: Bottleneck Optimization Strategy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Bottleneck Optimization Strategy |
| Difficulty | Foundation |
| Lifecycle | Diagnose, Optimize |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

The optimization strategy depends entirely on where the bottleneck lies. CPU-bound workloads benefit from JIT (+80-95%), I/O-bound workloads require architectural changes (coroutines, persistent workers), and memory-bound scenarios demand OpCache tuning and GC management. Applying the wrong optimization yields zero or negative results.

## Core Concepts

- **CPU-bound bottleneck**: Heavy computation, image processing, encryption, complex algorithms. Lever: JIT compilation, algorithmic improvements, opcode reduction.
- **I/O-bound bottleneck**: Database queries, HTTP API calls, file reads, network waits. Lever: Coroutines (Swoole), persistent workers (Octane), connection pooling, caching.
- **Memory-bound bottleneck**: Large object graphs, data set processing, memory leaks. Lever: GC tuning, memory_limit, OpCache sizing, pm.max_requests.
- **Framework overhead bottleneck**: Bootstrap cost dominating fast requests. Lever: Octane/persistent workers, preloading, Composer optimization.

## When To Use

- Always — before any optimization, diagnose the bottleneck type
- When deciding between JIT enablement, runtime migration, or configuration tuning
- For performance review and capacity planning discussions
- When building a performance optimization roadmap

## When NOT To Use

- When the system is already well-characterized and the bottleneck is known
- As a substitute for profiling — bottleneck classification requires measurement
- When applying obvious fixes (e.g., missing indexes) — fix the obvious first, then classify

## Best Practices (WHY)

- **Diagnose before optimizing**: Measure p50 vs p95 latency gap (I/O variability), check CPU utilization during peak (CPU vs I/O bound), monitor RSS growth across requests (memory leak), profile a representative request.
- **JIT for CPU-bound, not I/O-bound**: JIT provides 61-95% gain for CPU-bound workloads but 0-5% for I/O-bound. Enable JIT universally (harmless overhead) but don't expect gains for database-heavy apps.
- **Octane for framework-bound, not CPU-bound**: Octane eliminates bootstrap overhead for fast APIs but provides minimal gain if the bottleneck is CPU computation.
- **Right-size workers, don't over-size**: More FPM workers for CPU-bound workloads degrades performance due to context switching overhead.

## Architecture Guidelines

- **Bottleneck diagnosis hierarchy**: 1) Measure p50 vs p95 latency gap, 2) Check CPU utilization during peak, 3) Monitor RSS growth across requests, 4) Profile a representative request.
- **Bottleneck-first approach**: Profile to find bottleneck. If CPU-bound: optimize loops, enable JIT, cache results. If I/O-bound: reduce query count, add Redis cache, implement async processing.

## Performance

- JIT with I/O-bound workload: 0-5% gain, 0-2% overhead
- Octane with CPU-bound workload: minimal gain (bootstrap was not the problem)
- More FPM workers for CPU-bound workload: degrades performance (context switching)
- More FPM workers for I/O-bound workload: improves throughput (workers share CPU during wait)

## Security

- Bottleneck misclassification can lead to wrong optimization investments, creating security debt
- Performance optimizations (e.g., disabling validate_timestamps) have security implications
- Always verify that security controls are not the bottleneck before changing them

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Enabling JIT for I/O-bound app | Assuming JIT always helps | No gain, wasted 128MB+ RAM | Profile first; classify bottleneck |
| Migrating to Octane for CPU-bound app | Assuming memory-resident always faster | Marginal gain with added complexity | Check if bootstrap overhead is the bottleneck |
| Increasing workers for CPU-bound workload | "More workers = more throughput" | Context switching overhead degrades perf | Right-size workers; profile CPU utilization |
| Tuning OpCache when bottleneck is I/O | Focusing on easy configuration | No improvement on actual bottleneck | Diagnose before tuning |

## Anti-Patterns

- **Applying the same optimization to every bottleneck**: Each bottleneck type requires a different lever. JIT won't fix I/O, and Octane won't fix CPU.
- **Optimizing without measurement**: Guessing the bottleneck leads to wasted effort. Always profile first.
- **Chasing the easy optimization**: OpCache tuning is easy but irrelevant if the bottleneck is database queries. Prioritize by impact, not convenience.

## Examples

```php
<?php
// CPU-bound: Heavy computation benefits from JIT
function calculatePrimes(int $limit): array {
    $primes = [];
    for ($i = 2; $i <= $limit; $i++) {
        $isPrime = true;
        for ($j = 2; $j * $j <= $i; $j++) {
            if ($i % $j === 0) { $isPrime = false; break; }
        }
        if ($isPrime) { $primes[] = $i; }
    }
    return $primes;
}

// I/O-bound: Database queries need async or caching
function getUserOrders(int $userId): array {
    // This blocks during I/O — needs coroutines or connection pooling
    return DB::table('orders')->where('user_id', $userId)->get();
}
```

## Related Topics

- Profiling vs Monitoring
- JIT Workload Benefit Assessment
- Engine Version Performance Deltas
- CPU vs I/O Bound Worker Ratios
- Profiling Tools Comparison

## AI Agent Notes

- The single most critical performance insight is that optimization strategy depends on bottleneck location.
- CPU-bound: JIT + algorithmic improvements. I/O-bound: coroutines + caching. Memory-bound: GC + OpCache.
- Framework overhead: Octane/persistent workers.
- Always measure before and after each change to verify the bottleneck was addressed.
- The bottleneck diagnosis hierarchy provides a systematic approach to performance analysis.

## Verification

- [ ] CPU utilization measured during peak load to classify workload
- [ ] p50 vs p95 latency gap analyzed for I/O variability
- [ ] Worker RSS monitored for memory drift
- [ ] Representative request profiled before optimization
- [ ] Optimization selected matches bottleneck type
- [ ] Before/after measurement confirms improvement
