# Standardized Knowledge: Runtime Selection Decision Tree

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Runtime Selection Decision Tree |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Design |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Selecting an alternative runtime depends on three factors: I/O latency profile, operational complexity tolerance, and Laravel Octane driver preference. RoadRunner dominates for high-throughput APIs with mixed I/O. Swoole excels when database/API latency is high (50ms+). FrankenPHP wins on operational simplicity. ReactPHP/AMPHP suit CLI/streaming workloads.

## Core Concepts

- **RoadRunner**: Best all-around performance for Laravel Octane. No PHP extension required. 41-111% improvement over FPM. Most stable enterprise option.
- **Swoole**: Best when I/O is the bottleneck. Coroutine model excels with high-latency database queries (>50ms). Requires PHP extension.
- **FrankenPHP**: Best operational simplicity. Single binary replaces Nginx + FPM + certbot. 3-5x improvement. HTTP/3 built-in.
- **ReactPHP/AMPHP**: Best for CLI tools, streaming, and single-process applications. Not suitable for high-throughput web serving.

## When To Use

- **Need maximum simplicity?** → FrankenPHP (single binary, no extension, automatic HTTPS)
- **Running Laravel Octane?** → RoadRunner (best all-around, stable, enterprise-proven)
- **Database latency > 50ms per query?** → Swoole (coroutine advantage dominates)
- **Database latency < 1ms?** → RoadRunner or FrankenPHP (Swoole overhead is net-negative)
- **Streaming / CLI tools?** → AMPHP (fiber-based structured concurrency)
- **Memory-constrained container?** → FrankenPHP (lower per-worker overhead than FPM)

## When NOT To Use

- Any runtime selection should not be based on benchmarks alone — always test your specific workload
- Avoid Swoole when the team cannot manage C extension dependencies
- Avoid FrankenPHP when ZTS-incompatible extensions are required
- Avoid RoadRunner when maximum operational simplicity is the top priority and FrankenPHP suffices

## Best Practices

- **Benchmark your specific workload**: Runtime performance varies dramatically by I/O profile. Always benchmark with production-representative traffic patterns.
- **Start conservatively**: RoadRunner is the safest first choice for most applications. Migrate to Swoole or FrankenPHP only if justified by specific requirements.
- **Factor team expertise**: The best runtime is the one your team can operate effectively. Consider training costs alongside performance gains.
- **Plan for migration time**: Moving from FPM to an alternative runtime requires 2-8 weeks for testing, state leak fixes, and deployment pipeline changes.
- **Test memory leak resistance**: All memory-resident runtimes require 24-hour soak tests. Memory leaks that surface at hour 6 will cause production incidents.

## Architecture Guidelines

- **Runtime Compatibility**: Swoole requires PHP extension, ZTS compilation, and coroutine-safe libraries. RoadRunner requires standard PHP CLI. FrankenPHP requires ZTS compilation.
- **Octane Abstraction**: Laravel Octane provides a unified API across Swoole, RoadRunner, and FrankenPHP. Use Octane rather than raw runtimes for Laravel applications.
- **Migration Path**: PHP-FPM → RoadRunner (easiest, no extension needed) → FrankenPHP (simpler operations) → Swoole (highest potential but most complex).
- **Multi-Runtime Architecture**: Use different runtimes for different microservices based on their workload profiles. An API gateway with RoadRunner + a background processor with Swoole is valid.

## Performance Considerations

- RoadRunner: 41-111% throughput improvement over FPM in benchmarks (light I/O, warm state)
- Swoole: Up to 5x improvement under high-latency I/O, but 0.9x (10% slower) under sub-1ms I/O
- FrankenPHP: 3-5x throughput vs FPM in worker mode, with significantly simpler infrastructure
- ReactPHP/AMPHP: Limited by single-process concurrency — not for high-traffic web serving

## Security Considerations

- Swoole's C extension must be from trusted sources and regularly updated
- FrankenPHP requires ZTS extension compatibility — verify extensions with security scanning
- RoadRunner's process isolation provides natural security boundaries between workers
- All runtimes need regular version updates for security patches

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Selecting runtime without benchmarking your workload | Following blog post recommendations | Suboptimal performance for specific I/O profile | Always benchmark with production traffic patterns |
| Choosing Swoole for low-I/O API workloads | Assuming coroutines are always better | Performance regression vs FPM | Use RoadRunner or FrankenPHP for sub-1ms I/O |
| Ignoring deployment complexity | Focusing only on performance numbers | Operations team cannot manage the runtime | Factor operational costs into the decision |
| Not factoring team expertise | Assuming any runtime can be learned quickly | Extended incident resolution times | Choose the runtime your team can support |

## Anti-Patterns

- **Flipping runtimes without performance regression testing**: Each runtime has different performance characteristics. Always benchmark before/after.
- **Applying the same runtime to all applications**: Different workload profiles benefit from different runtimes. Evaluate per-application.
- **Assuming the latest runtime is always best**: PHP-FPM is still optimal for many workloads, especially memory-constrained or stable-traffic applications.
- **Choosing a runtime before identifying the bottleneck**: If the bottleneck is database queries, no runtime will solve it. Profile first, then select.

## Examples

```
Decision Flow:
1. Is your application Laravel or Symfony?
   Yes → Use Laravel Octane/Symfony Runtime
   No  → Use raw runtime
2. What is your average database query latency?
   >50ms → Swoole (coroutine advantage)
   <1ms  → RoadRunner or FrankenPHP
3. What is your operational priority?
   Simplicity → FrankenPHP
   Stability → RoadRunner
   Maximum throughput → Swoole
```

## Related Topics

- Runtime Comparison Overview
- Architecture Model Differences
- Laravel Octane Driver Selection
- Benchmarking Methodology

## AI Agent Notes

- The decision tree has three primary branches: I/O latency, operational complexity, and Octane driver preference.
- RoadRunner is the safest default choice for most Laravel Octane applications — no extension needed, excellent stability track record.
- Swoole is ONLY beneficial when I/O latency is high (>50ms). Benchmark before committing.
- FrankenPHP is ideal for teams that prioritize operational simplicity over maximum performance tuning.
- ReactPHP/AMPHP are not recommended for web serving at scale — they're for CLI/streaming workloads.

## Verification

- [ ] Workload I/O profile analyzed (DB query latency distribution)
- [ ] Team operational expertise assessed
- [ ] Octane compatibility checked (if applicable)
- [ ] Candidate runtimes shortlisted
- [ ] Benchmark results collected with production-representative workload
- [ ] 24-hour soak test completed
- [ ] Operational runbook created for selected runtime
- [ ] Rollback path documented
