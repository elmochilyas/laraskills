# Standardized Knowledge: Runtime Comparison Overview

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | Runtime Comparison Overview |
| Difficulty | Foundation |
| Lifecycle | Evaluate, Design |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Alternative PHP runtimes replace PHP-FPM's process-per-request model with memory-resident architectures delivering 3-15x throughput improvements. Four primary categories exist: Swoole/OpenSwoole (PHP extension, coroutine-based), RoadRunner (Go-based, goroutine scheduler + PHP workers), FrankenPHP (Caddy module, embedded PHP via CGO + threads), and ReactPHP/AMPHP (PHP userspace event loops). Each targets different workload profiles and operational complexity levels.

## Core Concepts

- **Swoole**: C extension providing coroutine-based event-driven architecture. Auto-hooks PDO, MySQLi, Redis, cURL into coroutines. io_uring support (6.2+). Best for high-latency I/O workloads.
- **RoadRunner**: Go application server communicating with PHP workers via Goridge binary protocol. No PHP extension required. Best all-around performance for Laravel Octane.
- **FrankenPHP**: Single binary (Caddy + PHP), embedded PHP via CGO. Thread-based worker pool. HTTP/3, automatic HTTPS, 103 Early Hints. Best for operational simplicity.
- **ReactPHP / AMPHP**: Pure PHP event loops and fiber-based concurrency. No extension required but limited to single-process concurrency. Best for streaming and CLI tools.

## When To Use

- Evaluating whether to migrate from PHP-FPM to a memory-resident runtime
- Selecting a runtime for Laravel Octane or Symfony Runtime
- Choosing the right architecture for a new high-performance PHP application
- Understanding the runtime landscape before committing to a specific stack

## When NOT To Use

- When PHP-FPM still meets performance requirements with simpler operations
- For legacy applications where migration cost exceeds performance benefits
- When the team lacks the operational expertise for the chosen runtime
- For applications with heavy reliance on non-thread-safe PHP extensions

## Best Practices

- **Benchmark your specific workload**: Published benchmarks are directional. Runtime performance varies dramatically by I/O profile, framework, and dependencies.
- **Start with RoadRunner for Octane**: It's the most stable, best-documented alternative runtime with strong Laravel integration. No PHP extension requirement reduces risk.
- **Consider FrankenPHP for container simplicity**: Single binary deployment dramatically reduces Docker image complexity and ops overhead.
- **Match runtime to workload I/O profile**: High-latency I/O (50ms+ queries) → Swoole. Mixed/low-latency I/O → RoadRunner. Maximum simplicity → FrankenPHP.
- **Plan for 24-hour soak tests**: All memory-resident runtimes can develop memory leaks over hours. Never ship without extended soak testing.

## Architecture Guidelines

- **Memory-Resident Model**: All alternative runtimes boot PHP once and handle many requests. This eliminates the 10-40ms per-request bootstrap cost that dominates PHP-FPM's overhead.
- **Concurrency Model Differences**: Swoole uses coroutines (cooperative multitasking within threads), RoadRunner uses goroutines (M:N threading) + PHP workers, FrankenPHP uses threads (1:1 with OS threads).
- **PHP Extension Requirement**: Swoole requires a C extension. RoadRunner and FrankenPHP do not. This affects deployment pipeline complexity and third-party library compatibility.
- **Operational Complexity Spectrum**: FrankenPHP (lowest) → RoadRunner (medium) → Swoole (highest). Match complexity to team capabilities.

## Performance Considerations

- RoadRunner: 41-111% throughput improvement over FPM; efficient scheduler even with minimal I/O
- Swoole: best for high-latency I/O (50ms+ DB queries); coroutine overhead ~1us per yield point
- FrankenPHP: thread-based worker model; CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes
- ReactPHP/AMPHP: best for CLI/streaming workloads; event-loop based, no multi-process coordination

## Security Considerations

- Swoole's C extension must be compiled from trusted sources to avoid supply chain risks
- RoadRunner's process isolation provides stronger security boundaries than Swoole's or FrankenPHP's shared-memory models
- FrankenPHP's CGO bridge and ZTS requirements introduce unique memory safety considerations
- All runtimes require regular updates — monitor each project's security advisory channels

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Choosing Swoole for low-I/O workloads | Assuming coroutines always improve throughput | 10%+ performance regression vs FPM | Match runtime to I/O profile |
| Ignoring deployment complexity | Focusing only on performance numbers | Team struggles with operations | Factor ops expertise into decision |
| Skipping memory leak testing | Assuming short benchmarks are sufficient | Memory leaks surface after hours in production | Run 24-hour soak tests before production |
| Not planning rollback | Assuming migration is correct | Can't revert if runtime doesn't work | Maintain parallel FPM deployment |

## Anti-Patterns

- **Choosing a runtime based on a single blog post benchmark**: Published benchmarks have different hardware, frameworks, and methodologies. Always test your workload.
- **Migrating all applications to the same runtime**: Different workloads benefit from different runtimes. Evaluate per-application.
- **Assuming newer runtimes are always better**: PHP-FPM remains the right choice for many workloads. Migration should be justified by measurable gains.
- **Implementing alternative runtimes without Laravel Octane or Symfony Runtime**: These frameworks abstract driver differences. Raw runtimes require significant boilerplate for framework integration.

## Examples

```bash
# Runtime selection decision summary
# High-latency I/O (>50ms DB): Swoole → 3-5x improvement
# Mixed I/O API: RoadRunner → 1.4-2.1x improvement
# Simple deployment: FrankenPHP → 3-5x improvement
# CLI/streaming: ReactPHP/AMPHP → 1.2-1.5x improvement
```

## Related Topics

- Architecture Model Differences
- Runtime Selection Decision Tree
- Laravel Octane Driver Selection
- PHP-FPM Worker Management

## AI Agent Notes

- The runtime landscape has four categories, but Swoole, RoadRunner, and FrankenPHP cover 95%+ of production use cases
- RoadRunner requires no PHP extension — this is often the deciding factor for teams avoiding extension complexity
- FrankenPHP's 3-5x throughput is the highest published benchmark, but actual results vary by workload
- ReactPHP/AMPHP are PHP userspace libraries, not application servers — they're best for CLI/streaming, not web serving
- All runtimes support Laravel Octane, making Octane the recommended migration path for Laravel applications

## Verification

- [ ] Workload I/O profile analyzed (average query latency, response times)
- [ ] Candidate shortlisted based on I/O profile and team expertise
- [ ] Benchmark results collected for candidate runtime with production-representative workload
- [ ] 24-hour soak test completed for selected runtime
- [ ] Rollback plan documented (FPM or alternate runtime)
- [ ] Runtime-specific monitoring configured
- [ ] Team trained on runtime operations and troubleshooting
