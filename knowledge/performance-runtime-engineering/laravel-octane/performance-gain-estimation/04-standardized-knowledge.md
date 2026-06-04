# Standardized Knowledge: Performance Gain Estimation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Laravel Octane Performance |
| Knowledge Unit | Performance Gain Estimation Methodology — 2.5-3.1x Mixed to 15-20x API Workloads |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Plan |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Octane's throughput gain is inversely proportional to request duration: **faster requests see larger gains**. For sub-50ms API endpoints, bootstrap was 60-80% of total time → Octane eliminates that → 5-15x improvement. For 500ms+ requests, bootstrap was 5-10% of total time → 10-20% improvement. Estimate gains by measuring bootstrap overhead as a proportion of total request time.

## Core Concepts

- **Gain formula**: `speedup = 1 / (1 - bootstrap_proportion)`. If bootstrap is 80% of request time, speedup = 1/(1-0.8) = 5x. If bootstrap is 10%, speedup = 1/(1-0.1) = 1.11x.
- **Bootstrap measurement**: Profile a request that does minimal work (empty controller, return 200). Time = bootstrap. Full request time = bootstrap + I/O + computation.
- **I/O impact**: Octane does not make I/O faster — database queries take the same time. Octane eliminates the CPU time spent on bootstrap.
- **Concurrent request scaling**: Octane workers handle requests sequentially within each worker but concurrently across workers. Worker count matters.

## When To Use

- Evaluating whether to migrate an application to Octane
- Building a business case for Octane adoption
- Setting performance targets for Octane migration
- Comparing expected vs actual performance gains post-migration

## When NOT To Use

- Without profiling the application first (guessing bootstrap proportion leads to wrong estimates)
- For applications where database queries dominate (>80% of request time)
- When the primary bottleneck is external (network, third-party API latency)
- As a substitute for actual benchmarking (always benchmark after migration)

## Best Practices

- **Measure, don't guess**: Profile an empty endpoint and a real endpoint. Compute bootstrap proportion. Apply formula.
- **Use Amdahl's Law**: Octane speeds up only the bootstrap portion. The I/O-bound portion remains unchanged. Benchmark to validate.
- **Consider concurrent request patterns**: Gains are highest under concurrent load, not single-request latency.
- **Account for worker overhead**: Each Octane worker consumes 30-80MB RSS. Total gain depends on available memory for worker count.
- **Estimation process**: 1) Profile empty endpoint = bootstrap, 2) Profile real endpoint = total, 3) Compute bootstrap proportion, 4) Apply speedup formula, 5) Cross-check with published benchmarks.

## Architecture Guidelines

- **Bootstrap dominance**: For API endpoints returning in <50ms, bootstrap accounts for 60-80% of total time. Octane's gain is highest here.
- **I/O-bound limits**: If 80% of request time is database queries, maximum theoretical gain is 1/(1-0.2) = 1.25x. Optimize queries first.
- **Worker scaling**: More workers = more concurrency = more throughput, up to memory or connection pool limits. Each worker adds ~50MB RSS.

## Performance Considerations

- Octane delivers 2.5-20x throughput over PHP-FPM; API endpoints with <50ms response see biggest gains
- Each worker uses 30-80MB RSS; total memory = workers × per-worker memory
- Each worker maintains persistent DB/Redis connections; total = workers × connections-per-worker
- Under Octane, database queries become primary bottleneck (bootstrap is eliminated)
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations

- Higher throughput means more requests per second hitting the database — ensure connection pool limits are respected
- More workers = more concurrent database connections. Plan for max_connections × workers ≤ database max_connections

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Expecting Octane to speed up database queries | Misunderstanding Octane's scope | Disappointment when I/O-bound app sees <2x gain | Optimize queries before Octane |
| Guessing bootstrap proportion without profiling | Laziness | Wrong gain estimate | Profile empty endpoint |
| Ignoring concurrent request scaling | Single-threaded thinking | Underestimating real-world gain | Benchmark under concurrent load |
| Applying Amdahl's Law without measuring I/O portion | Theory without data | Incorrect speedup calculation | Profile both empty and real endpoints |

## Anti-Patterns

- **Benchmarking Octane with hello-world endpoints**: Hello-world shows maximum theoretical gain (bootstrap = 100% of time, so 15-20x). Real applications have lower gains.
- **Assuming gain is linear with workers**: Double the workers = double the throughput only until memory or connection pool is exhausted.
- **Migrating to Octane without baseline benchmarks**: Without before/after measurements, you can't quantify the improvement. Always benchmark FPM first.

## Examples

```text
// Gain estimation example
// Empty endpoint: 40ms (bootstrap)
// Real endpoint: 50ms
// Bootstrap proportion: 40/50 = 80%
// Estimated speedup: 1/(1-0.8) = 5x
// Expected throughput: 5 × FPM throughput

// For a 500ms endpoint with 40ms bootstrap:
// Bootstrap proportion: 40/500 = 8%
// Estimated speedup: 1/(1-0.08) = 1.09x
// Conclusion: Optimize database queries first
```

## Related Topics

- Octane Architecture and Execution Model
- Driver Selection Comparison
- Bottleneck Optimization Strategy
- Benchmarking Methodology

## AI Agent Notes

- Gain formula: `speedup = 1 / (1 - bootstrap_proportion)`.
- Fast endpoints (<50ms) see 5-15x gains. Slow endpoints (500ms+) see 10-20% gains.
- Octane eliminates PHP bootstrap time only. Database queries still take the same time.
- Profile empty endpoint to measure bootstrap proportion — don't guess.
- Benchmark under concurrent load, not single-request latency.
- Consider memory and connection pool limits when estimating total gain.

## Verification

- [ ] Bootstrap proportion measured (empty endpoint vs real endpoint)
- [ ] Speedup formula applied with measured values
- [ ] I/O-bound proportion assessed to set realistic expectations
- [ ] Pre-migration benchmark completed (PHP-FPM baseline)
- [ ] Concurrent load test planned for post-migration comparison
- [ ] Memory and connection pool limits calculated for worker count
