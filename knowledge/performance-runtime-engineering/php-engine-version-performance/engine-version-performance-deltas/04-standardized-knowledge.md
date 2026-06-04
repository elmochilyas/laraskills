# Standardized Knowledge: Engine Version Performance Deltas

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Engine Version Performance Deltas |
| Difficulty | Intermediate |
| Lifecycle | Evaluate, Migrate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP 8.x delivers cumulative throughput gains of 48.6% over PHP 7.4 in real-world benchmarks. Incremental gains between 8.2 through 8.5 are marginal (~1-3% per version) for typical web applications. PHP 8.0 (JIT introduction) and 8.1 (fibers, readonly properties, Enums) were the most impactful releases. PHP 8.5 added property hooks and JIT refinements but no major engine-level throughput boost.

## Core Concepts

- **PHP 7.4 to 8.0**: ~26% throughput gain. JIT compiler, named arguments, match expression, union types, mixed type.
- **PHP 8.0 to 8.1**: ~10-15% gain. Fibers, readonly properties, Enums, intersection types, array unpacking with string keys.
- **PHP 8.1 to 8.2**: ~8-10% gain. Readonly classes, standalone types (true, null, false), random extension improvements, opcode optimizations.
- **PHP 8.2 to 8.3**: ~3-5% gain. Lazy objects (RFC), json_validate(), typed class constants, opcode improvements.
- **PHP 8.3 to 8.4**: ~3% gain (with noted 5.2% regression under light I/O in some benchmarks). Property hooks, asymmetric visibility, lazy objects stabilization.
- **PHP 8.4 to 8.5**: Minimal throughput change (~1-2%). Pipe operator, JIT blacklist function, GC improvements for Enums/closures.

## When To Use

- Planning PHP version upgrade cycles and estimating performance impact
- Building a business case for version migration investment
- Benchmarking application performance across PHP versions
- Deciding whether to skip intermediate versions (leapfrog strategy)

## When NOT To Use

- When the primary performance bottleneck is I/O-bound (database, network) — version upgrades have minimal impact
- For legacy applications on unsupported versions where migration risk outweighs performance gain
- As a replacement for proper OpCache tuning or runtime architecture improvements (which yield larger gains)

## Best Practices (WHY)

- **Jump multiple versions**: Upgrade from 7.4 directly to 8.2+ rather than stepping through each version. Each upgrade requires a testing cycle; minimize cycles by leapfrogging.
- **Benchmark before migrating**: Capture baseline throughput and latency before upgrading. Verify the expected gain materializes for your specific workload.
- **Prioritize OpCache and runtime over version bumps**: The 48.6% cumulative gain from 7.4 to 8.3 is dwarfed by OpCache tuning (2-4x) and runtime migration (3-15x). Optimize the bigger levers first.
- **Monitor for regressions**: PHP 8.4 showed a 5.2% regression under light I/O. Always benchmark in a staging environment before production rollout.

## Architecture Guidelines

- **Shared-nothing architecture (FPM)**: Each request isolated in a separate process. Maximizes fault isolation at cost of per-request bootstrap overhead.
- **Memory-resident architecture (Octane/Swoole)**: Boot once, handle many. Reduces latency 60-90% for framework-heavy apps. Introduces state management complexity.
- **Event-driven coroutines (Swoole/FrankenPHP)**: Single process handles many concurrent requests via coroutine switching. Requires non-blocking I/O for all operations.

## Performance

- PHP 8.4 computed goto opcode dispatch: ~5-8% synthetic improvement, ~2-4% real-world
- PHP 8.5 JIT improvements and property access optimizations: ~3-5% over 8.4
- Cumulative 48.6% from 7.4 to 8.3 for real-world benchmarks
- Optimization effort better spent on OpCache tuning and runtime architecture than chasing minor version bumps

## Security

- Always run a supported PHP version (currently 8.1+). Unsupported versions receive no security patches.
- PHP 7.4 and 8.0 have reached End of Life — no security fixes for known CVEs.
- Upgrade within 3 months of a new minor release to maintain security coverage.
- CVE exploits targeting known PHP vulnerabilities appear regularly for EOL versions.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Upgrading without testing | Assuming minor versions are fully backward compatible | BC breaks in production | Run full test suite before each version upgrade |
| Assuming all opcodes equal | Not understanding Zend VM dispatch | Misallocating optimization effort | Profile to identify actual opcode-level bottlenecks |
| Not using typed properties | Legacy coding patterns | Missed 5-15% engine optimization | Type all new properties; refactor incrementally |
| Ignoring OpCache in dev | Focus on production only | Slower feedback during development | Enable OpCache with validate_timestamps=1 in dev |
| Under-sizing memory for large apps | Using default 128MB | OpCache thrashing, OOM errors | Set 256-512MB for Laravel/Symfony; measure actual usage |

## Anti-Patterns

- **Chasing every minor version upgrade**: Upgrading from 8.3 to 8.4 to 8.5 sequentially wastes testing cycles for marginal gains. Leapfrog to the version you need.
- **Assuming JIT solves all performance problems**: JIT provides 61-95% gains for CPU-bound workloads but 0-5% for I/O-bound web apps. Profile first, optimize second.
- **Neglecting OpCache tuning while upgrading PHP**: A well-tuned OpCache on PHP 8.0 outperforms default OpCache on PHP 8.5. Tune configuration, not just version.

## Examples

```bash
# Check current PHP version
php -v

# Check OpCache status
php -r "print_r(opcache_get_status());"

# Compare performance between versions (using Apache Bench)
ab -n 1000 -c 10 http://your-app.test/benchmark
```

## Related Topics

- PHP Version Numbering
- Bytecode vs Native Code
- PHP Execution Lifecycle
- JIT Concepts and Terminology
- Version Migration Planning

## AI Agent Notes

- The largest performance jumps were PHP 8.0 (~26%) and PHP 8.1 (~10-15%). Later versions offer diminishing returns.
- Tideways benchmarks show 8.2 to 8.5 moves <3% for Laravel, Symfony, WordPress on standard configurations.
- Bottleneck location determines optimization strategy — CPU-bound workloads benefit from JIT, I/O-bound from architectural changes.
- The pipeline model (lexing -> parsing -> compilation -> execution) helps reason about where optimization applies.
- OpCache provides 2-4x throughput uncached. JIT adds 0-95% depending on CPU-boundedness. Both compound with version improvements.

## Verification

- [ ] Current PHP version is supported (8.1+ as of 2026)
- [ ] Version upgrade plan includes baseline benchmark and post-upgrade validation
- [ ] Leapfrog strategy used when upgrading across multiple versions
- [ ] OpCache properly sized for application (memory_consumption, max_accelerated_files)
- [ ] Typed properties used throughout codebase
- [ ] Profiling performed to identify actual bottlenecks before optimization
- [ ] Security support timeline verified for target PHP version
