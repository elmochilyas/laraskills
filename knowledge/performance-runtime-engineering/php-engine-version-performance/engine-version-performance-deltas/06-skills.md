# Skill: Measure and Validate PHP Engine Version Performance Deltas

## Purpose

Quantify the throughput and latency impact of upgrading PHP across major or minor versions for a specific application workload.

## When To Use

- Planning a PHP version upgrade (e.g., 8.2 to 8.3 or 8.3 to 8.4)
- Evaluating whether the performance gains from a new PHP version justify migration effort
- Establishing baseline metrics for the current PHP version before upgrade

## When NOT To Use

- When the application has known incompatibilities with the target PHP version
- When benchmarking environment is not production-representative
- When the upgrade is required for security patches (security benefit trumps performance measurement)

## Prerequisites

- Two identical environments with different PHP versions installed
- Benchmarking tools (wrk2, k6) configured on load generator
- OpCache and JIT configured identically on both environments
- Same application code deployed to both environments

## Inputs

- Current PHP version and target PHP version
- List of critical endpoints to benchmark
- Baseline performance metrics from production monitoring
- Application compatibility report with target version

## Workflow (numbered steps)

1. Ensure both PHP environments are identical except for the PHP version — same hardware, same application code, same OpCache/JIT configuration
2. Select 3-5 representative endpoints covering: simple API, database-heavy, and rendering-heavy workloads
3. Run a warm-up phase (30s) on each environment for each endpoint
4. Benchmark each endpoint using wrk2 with open-loop model, recording throughput and latency percentiles
5. Run the benchmark 3 times per endpoint per environment to assess variance
6. Calculate the mean throughput and p95 latency for each endpoint on each PHP version
7. Compute the performance delta: (new_value - old_value) / old_value * 100 for throughput and latency
8. Document the results including PHP versions, OpCache/JIT settings, and benchmark configuration
9. If throughput improves >=5% on critical endpoints, proceed with upgrade planning
10. If improvement is neutral or negative, investigate configuration differences or workload-specific regressions

## Validation Checklist

- [ ] Identical environments except for PHP version
- [ ] OpCache and JIT configured identically (or optimized per version)
- [ ] Minimum 3 benchmark runs per version per endpoint
- [ ] Variance within +/-5% across runs
- [ ] Performance delta calculated for throughput and latency
- [ ] Results documented with full environment metadata
- [ ] Decision made (upgrade or hold) based on data

## Common Failures

- **Comparing non-identical environments**: Different OpCache settings, extensions, or system packages invalidate the comparison
- **Insufficient runs**: Single-run benchmarks capture noise, not signal — 3+ runs minimum
- **Ignoring JIT differences**: Newer PHP versions may have different JIT defaults — standardize configuration
- **Testing only synthetic endpoints**: Hello World benchmarks show 5-8% gains that don't translate to production

## Decision Points

- If improvement >=10% on critical endpoints: upgrade is strongly justified
- If improvement 3-10%: upgrade is beneficial if migration effort is low
- If improvement <3%: upgrade only if needed for new features or security patches
- If regression detected: investigate before proceeding — may indicate extension incompatibility

## Performance Considerations

- PHP 8.4 computed goto dispatch: ~5-8% synthetic improvement, ~2-4% real-world
- Typed properties (PHP 7.4+): 5-15% improvement on property-heavy code
- JIT improvements between versions (8.0 -> 8.1 -> 8.2 -> 8.3 -> 8.4): each adds ~5-10% for CPU-bound workloads
- Real-world gains (mixed I/O) are typically 2-5% per minor version, 10-20% per major version

## Security Considerations

- Run benchmarks in isolated staging environment, not production
- Ensure no user data is processed during benchmarking
- Document all security-related changes between versions (deprecated functions, breaking changes)
- Test all third-party extensions for compatibility with target PHP version

## Related Rules (from 05-rules.md)

- Benchmark Against a Known Baseline
- Report Both p50 and p95/p99 Latency
- Isolate Benchmark Environment from Production

## Related Skills

- Benchmark Design and Execution
- Workload Benefit Assessment
- Bottleneck-Driven Optimization

## Success Criteria

- Performance delta measured and documented for all critical endpoints
- Variance across runs within acceptable range (<5%)
- Decision to upgrade or hold supported by data
- Migration plan includes rollback procedure if production performance doesn't match benchmarks
