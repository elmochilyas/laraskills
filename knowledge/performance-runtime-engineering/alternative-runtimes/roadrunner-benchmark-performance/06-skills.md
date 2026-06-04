# Skill: Benchmark RoadRunner Performance for a Specific Workload

## Purpose

Run a systematic benchmark comparing RoadRunner and PHP-FPM throughput for a specific application workload to quantify the migration benefit.

## When To Use

- Evaluating RoadRunner migration for an application
- Building a business case for runtime migration
- Validating that RoadRunner meets throughput requirements

## When NOT To Use

- When the decision to use RoadRunner is already made
- Without first profiling the application's bootstrap overhead
- For applications where I/O wait dominates (>80% of wall time)

## Prerequisites

- PHP-FPM and RoadRunner both deployed in staging
- Benchmarking tools (wrk2 or k6)
- Application-specific test endpoints
- Monitoring for resource metrics (CPU, memory)

## Inputs

- Application endpoints to benchmark (3-5 representative)
- PHP-FPM configuration (workers, memory)
- RoadRunner configuration (workers, goroutines)
- Expected throughput target

## Workflow (numbered steps)

1. Configure identical PHP settings for both runtimes (same OpCache, JIT, memory_limit)
2. Deploy the same application code to both environments
3. Warm up both systems: 30-60 seconds of traffic to populate OpCache/JIT
4. Benchmark using wrk2 with open-loop model on each environment
5. Benchmark both runtimes on the same 3-5 endpoints
6. Record throughput (RPS), latency distribution (p50/p95/p99), and error rate
7. Record resource metrics: CPU, memory per worker/process, and system load
8. Calculate improvement: (RoadRunner_RPS - FPM_RPS) / FPM_RPS × 100
9. Run each benchmark 3 times to assess variance
10. Document the benchmark results with full environment details

## Validation Checklist

- [ ] Identical PHP configuration for both runtimes
- [ ] Same application code deployed
- [ ] Warm-up completed before measurement
- [ ] wrk2 open-loop model used for latency
- [ ] Multiple endpoints benchmarked
- [ ] Resource metrics captured alongside throughput
- [ ] Minimum 3 runs per configuration
- [ ] Improvement percentage calculated
- [ ] Results documented with environment details

## Common Failures

- **Benchmarking with Hello World endpoints**: Results 10-100x better than production — not representative
- **Not warming up FPM**: Cold OpCache inflates FPM latency — unfair comparison
- **Using different OpCache configurations**: Both must have identical OpCache and JIT settings
- **Not measuring resource utilization**: RoadRunner may use 2x memory for the same throughput — must compare resource efficiency

## Decision Points

- Improvement >50%: strong case for migration
- Improvement 20-50%: moderate case — evaluate operational complexity trade-off
- Improvement <20%: weak case — may not justify migration effort
- Memory per request higher with RoadRunner: may need larger servers
- CPU usage comparable or lower: validates efficiency

## Performance Considerations

- RoadRunner typical improvement: 41-111% over PHP-FPM
- Bootstrap elimination: largest gain for fast endpoints (<50ms)
- I/O-bound endpoints: RoadRunner's concurrent worker model provides more benefit
- CPU-bound endpoints: improvement comes from worker reuse, not concurrency
- Memory: RoadRunner may use more memory (persistent workers) but fewer total workers for same throughput

## Security Considerations

- Benchmark in isolated staging environment, not production
- Use anonymized or synthetic data for benchmarks
- Coordinate with operations team before running benchmarks
- Document benchmark methodology for reproducibility

## Related Rules (from 05-rules.md)

- Start with RoadRunner for Laravel Octane
- Run 24-Hour Soak Tests Before Production
- Benchmark with Realistic Workloads, Not Synthetic Endpoints

## Related Skills

- RoadRunner Architecture and Goridge
- RoadRunner Installation and Configuration
- Benchmark Design and Execution
- Runtime Comparison Overview

## Success Criteria

- RoadRunner vs FPM benchmark completed for application workload
- Throughput improvement quantified (RPS and latency)
- Resource utilization compared (CPU, memory)
- Decision supported by data
- Benchmark methodology documented
