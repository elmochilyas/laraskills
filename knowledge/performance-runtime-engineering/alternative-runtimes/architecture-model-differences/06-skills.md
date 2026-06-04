# Skill: Compare Alternative Runtime Architecture Models

## Purpose

Understand the architectural differences between Swoole (coroutines), RoadRunner (goroutines + PHP workers), and FrankenPHP (threads) to guide runtime selection.

## When To Use

- Evaluating alternative runtimes for a project
- Understanding the trade-offs between coroutine, goroutine, and thread models
- Architecture review for migration planning
- Team education on runtime internals

## When NOT To Use

- When the team has already selected a runtime
- Without profiling the application's I/O profile
- For applications where PHP-FPM remains the best choice

## Prerequisites

- Understanding of PHP-FPM's process-per-request model
- Familiarity with concurrency concepts (process, thread, coroutine, goroutine)
- Knowledge of the application's I/O profile

## Inputs

- Application I/O profile (query latency, external API calls)
- Team operational expertise (extension compilation, containers, etc.)
- Throughput and latency requirements
- Deployment environment constraints

## Workflow (numbered steps)

1. Learn the three models: Swoole (coroutines within PHP threads), RoadRunner (Go goroutines + separate PHP workers), FrankenPHP (OS threads with embedded PHP)
2. Swoole: coroutines auto-hook PDO/MySQLi/Redis/cURL — non-blocking I/O within PHP, requires C extension
3. RoadRunner: Go manages goroutines (M:N threading) and communicates with PHP workers via Goridge binary protocol — no PHP extension needed
4. FrankenPHP: Caddy module with embedded PHP via CGO — thread-based worker pool, single binary
5. For high-latency I/O (>50ms): Swoole's coroutine model yields during I/O wait — best for blocking operations
6. For mixed I/O with moderate overhead: RoadRunner's goroutine scheduler is most efficient across I/O profiles
7. For operational simplicity: FrankenPHP's single binary (Caddy + PHP) reduces deployment complexity
8. Document the architectural differences and how they map to the application's requirements

## Validation Checklist

- [ ] Three models understood (coroutine, goroutine+worker, thread)
- [ ] I/O profile matched to the optimal model
- [ ] Team expertise factored into selection
- [ ] Architectural differences documented
- [ ] Selection rationale stated

## Common Failures

- **Confusing Swoole coroutines with PHP threads**: Swoole coroutines are user-space, cooperative — not OS threads
- **Assuming "fastest" benchmark is always best**: RoadRunner benchmarks well across I/O profiles; Swoole wins on high-latency I/O
- **Not considering deployment complexity**: Swoole requires C extension; FrankenPHP requires ZTS build; RoadRunner needs no extension
- **Underestimating the learning curve**: Coroutine programming (Swoole) has a steeper learning curve than the worker model (RoadRunner)

## Decision Points

- High-latency I/O (DB queries >50ms): Swoole (coroutines yield on I/O)
- Mixed I/O, moderate latency: RoadRunner (efficient goroutine scheduler)
- Operational simplicity priority: FrankenPHP (single binary, automatic HTTPS)
- PHP extension constraints: RoadRunner (no extension required)
- Laravel Octane: RoadRunner (best integration) or FrankenPHP (simplicity)

## Performance Considerations

- Swoole coroutine yield: ~1µs overhead per yield point
- RoadRunner goroutine: M:N scheduling, minimal overhead, handles all I/O profiles efficiently
- FrankenPHP CGO boundary: 5-10% overhead vs pure Go/PHP runtimes
- All three: 3-15x throughput over PHP-FPM for typical workloads
- Memory: RoadRunner and FrankenPHP use separate PHP processes/threads; Swoole uses shared memory within a process

## Security Considerations

- Swoole C extension: must be compiled from trusted sources
- RoadRunner process isolation: strongest security boundaries (separate PHP processes)
- FrankenPHP CGO: memory safety considerations with C bridge
- All require regular updates for security patches

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Start with RoadRunner for Laravel Octane
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Runtime Comparison Overview
- Runtime Selection Decision Tree
- Swoole Architecture and Coroutine Model
- RoadRunner Architecture and Goridge

## Success Criteria

- Architecture models understood and compared
- I/O profile matched to appropriate model
- Selection documented with rationale
- Team trained on the chosen model's architecture
