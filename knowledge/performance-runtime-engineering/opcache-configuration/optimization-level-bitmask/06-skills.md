# Skill: Configure OpCache Optimization Level Bitmask

## Purpose

Select and apply the appropriate `opcache.optimization_level` bitmask to balance compilation time against runtime optimization benefits.

## When To Use

- Advanced OpCache tuning for specific performance objectives
- Debugging optimization-induced bugs (disable specific passes)
- Maximizing throughput for CPU-bound workloads
- Reducing compilation time in containers with frequent restarts

## When NOT To Use

- For initial OpCache configuration (default 0x7FFFBFFF is optimal for most cases)
- Without profiling to determine which optimization passes matter
- When OpCache memory or hit rate are not yet optimized

## Prerequisites

- OpCache enabled and configured
- Understanding of PHP optimization passes (pass numbering 1-10)
- Benchmarking capability for before/after comparison

## Inputs

- Current optimization_level value
- PHP version (passes vary between versions)
- Profiling data showing compilation vs execution time

## Workflow (numbered steps)

1. Check current optimization level: `opcache_get_configuration()['directives']['opcache.optimization_level']`
2. Document the default value (0x7FFFBFFF for most PHP 8.x versions = all optimization passes enabled)
3. If debugging optimization-related bugs, disable individual passes by removing them from the bitmask
4. To reduce compilation time (containers, frequent restarts), disable pass 10 (SSA optimization) if compilation time is a bottleneck
5. Apply the modified bitmask: `opcache.optimization_level=0x7FFFBFFE` (disable pass 10 as example)
6. Benchmark throughput: compare default vs modified bitmask — if throughput drops, the pass was important
7. Benchmark compilation time: measure first-request latency with default vs modified bitmask
8. If compilation time improves but throughput does not degrade, the modified bitmask is acceptable
9. Document the selected bitmask and the rationale based on benchmarks

## Validation Checklist

- [ ] Current optimization level documented
- [ ] Bitmask modification rationale defined (bug debug, compilation time, throughput)
- [ ] Modified bitmask applied in php.ini
- [ ] PHP-FPM restarted
- [ ] Before/after benchmark completed (throughput and compilation time)
- [ ] No optimization-related bugs observed
- [ ] Bitmask configuration documented

## Common Failures

- **Disabling passes without benchmarking**: Removing optimization passes may reduce throughput significantly — always measure
- **Applying arbitrary bitmask values**: The bitmask is a hex value where each bit controls a pass — use carefully
- **Not testing for bugs after optimization changes**: Some optimizations can expose PHP bugs — test thoroughly
- **Assuming more optimization is always better**: More passes = more compilation time — for short-lived containers, fewer passes may be better

## Decision Points

- Default (0x7FFFBFFF): all passes enabled — best for steady-state production
- Debugging optimization bug: disable passes one at a time to identify the problematic pass
- Container with frequent restarts: consider disabling pass 10 (SSA) to reduce compilation time
- CPU-bound workload: keep all passes enabled for maximum runtime optimization

## Performance Considerations

- Each optimization pass adds 2-10% to compilation time
- Passes 1-9 are basic optimizations; pass 10 is SSA-based advanced optimization
- SSA optimization (pass 10) provides 5-15% runtime improvement but adds 20-50% compilation time
- For servers with long uptime (days), compilation time is amortized and all passes are beneficial
- For containers with hourly restarts, compilation time may outweigh runtime benefit

## Security Considerations

- Optimization levels do not affect PHP's security model
- Some optimizations may change error message behavior in edge cases — test thoroughly
- Disabling optimization passes does not introduce security vulnerabilities

## Related Rules (from 05-rules.md)

- Enable OpCache First, Tune Later
- Configure OpCache Before JIT

## Related Skills

- OpCache Overview and Configuration
- OpCache Memory Sizing
- OpCache Monitoring and Hit Rate Analysis

## Success Criteria

- Optimization level bitmask rationale documented
- Before/after benchmark validates the selected level
- No optimization-induced bugs observed
- Compilation time vs runtime throughput trade-off understood
