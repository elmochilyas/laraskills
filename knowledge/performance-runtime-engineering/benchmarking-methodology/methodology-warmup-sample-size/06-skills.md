# Skill: Apply Correct Benchmark Methodology with Warm-Up and Sample Sizing

## Purpose
Design and execute benchmarks with proper warm-up (30-60 seconds, data discarded), statistically adequate sample sizes (1000+ for p95, 10000+ for p99), and garbage collection warm-up — eliminating transient cold-state bias that inflates latency by 20-50% and ensuring percentile accuracy.

## When To Use
- All performance benchmarks where results inform production decisions
- CI benchmark gates that must detect real regressions
- Latency benchmarks where tail percentiles are measured
- Capacity planning exercises

## When NOT To Use
- Quick exploratory measurements (if 20-50% variance is acceptable)
- Profiling, not benchmarking (profiling has different methodology)

## Prerequisites
- Benchmarking tool (wrk2, k6) with warm-up support
- Understanding of sample size requirements
- Target system in steady state before warm-up

## Inputs
- Target percentiles and acceptable error margin (+/-10%, +/-5%)
- Expected latency distribution (normal, multimodal)
- Tool capability for sample size control

## Workflow

### 1. Select Percentile and Calculate Required Sample Size
- For p95 at +/-5% precision: 1000+ samples
- For p99 at +/-5% precision: 10000+ samples
- For p99.9 at +/-5% precision: 100000+ samples
- For +/-10% precision above the median: 4x more samples
- Rule: tail percentile needs total sample count ≥ 10/tail_fraction

### 2. Include Warm-Up Phase
- Run 30-60 seconds of traffic before recording data
- Use a different endpoint or URL for warm-up than the benchmark
- This prevents warm-up traffic from caching data for the benchmark
- Discard warm-up data entirely — do not include in results
- Verify steady state by monitoring latency variance: stable when swings <5%

### 3. Execute Multiple Iterations
- Run minimum 3 iterations per configuration
- Take median of iterations (not mean) to handle outliers
- If any iteration has error rate >2%, discard and rerun
- Report all iterations in results appendix

### 4. Handle Garbage Collection Warm-Up
- PHP OpCache warms in 2-4 requests after deployment
- Database query cache needs 50-500 requests to populate
- Object cache (Redis) needs 1000+ requests for typical working set
- Run distinct warm-up phases for each caching layer

### 5. Account for System Variability
- Run benchmarks at same time of day (avoid cron jobs)
- Minimum 3 iterations across at least 2 different days
- If p95 varies >10% between same-config runs, environment is too noisy
- Investigate: same hardware? same load from other processes? same time of day?

## Validation Checklist
- [ ] Warm-up phase included (30-60s, data discarded)
- [ ] Sample size meets requirements: 1000+ for p95, 10000+ for p99
- [ ] Minimum 3 iterations per configuration, median reported
- [ ] GC/cache warm-up performed by layer
- [ ] System variability accounted for (same time, isolated environment)
- [ ] Error rate <2% in all iterations

## Related Rules
- Sample size: 1000+ p95, 10000+ p99 (`05-rules.md:1`)
- Warm-up 30-60s (`05-rules.md:28`)
- Minimum 3 iterations (`05-rules.md:56`)
- Discard warm-up data (`05-rules.md:85`)

## Related Skills
- Benchmarking Concepts
- Metrics Definition and Interpretation
- Coordinated Omission
- CI Integration and Baseline Comparison

## Success Criteria
- Warm-up phase included and data discarded in all benchmarks
- Sample size meets statistical requirements for target percentile
- Minimum 3 iterations per configuration, median reported
- System variability documented and within acceptable tolerance
- Benchmark methodology produces reproducible results
