# Skill: Provide an Overview of Alternative PHP Runtimes

## Purpose

Distinguish the four categories of alternative PHP runtimes (Swoole, RoadRunner, FrankenPHP, ReactPHP) and their primary use cases, I/O profiles, and operational requirements.

## When To Use

- Introducing alternative runtimes to a team
- Evaluating whether to move beyond PHP-FPM
- Selecting a runtime category for further evaluation
- Educational overview before deep dives into specific runtimes

## When NOT To Use

- For deep configuration (use the specific runtime skills)
- When the runtime decision is already made
- Without understanding the application's current FPM performance

## Prerequisites

- Understanding of PHP-FPM's shared-nothing model
- Knowledge of the application's I/O profile
- Awareness of team operational capabilities

## Inputs

- Application I/O profile (query latency, API call volume)
- Current PHP-FPM performance (throughput, latency)
- Team expertise (PHP, Go, C extensions, Docker)
- Deployment environment (containers, bare metal, cloud)

## Workflow (numbered steps)

1. Understand the four categories: Swoole (C extension, coroutines), RoadRunner (Go + PHP workers, Goridge), FrankenPHP (Caddy module, threads), ReactPHP/AMPHP (PHP userspace, event loops)
2. Swoole: best for high-latency I/O (>50ms DB queries), requires C extension
3. RoadRunner: best for mixed I/O, no extension required, strongest Laravel integration
4. FrankenPHP: best for operational simplicity, single binary, automatic HTTPS
5. ReactPHP/AMPHP: best for CLI/streaming workloads, no extension, limited to single-process
6. For most Laravel applications: RoadRunner is the recommended starting point
7. For maximum simplicity: FrankenPHP's single binary reduces deployment complexity
8. For high-I/O workloads: Swoole's coroutine model provides the highest throughput
9. Benchmark the shortlisted runtime(s) with the application workload
10. Document the comparison and selection

## Validation Checklist

- [ ] Four runtime categories understood
- [ ] I/O profile matched to appropriate category
- [ ] Operational requirements assessed
- [ ] Shortlisted runtime(s) identified
- [ ] Selection rationale documented
- [ ] Team trained on selected runtime basics

## Common Failures

- **Choosing based on a single benchmark**: Published benchmarks are directional — test your workload
- **Ignoring deployment complexity**: Swoole needs a C extension; FrankenPHP needs ZTS; RoadRunner needs no extension
- **Assuming newer = better**: PHP-FPM remains the right choice for many workloads
- **Not planning for rollback**: Always maintain a parallel FPM deployment for at least 2 weeks after migration

## Decision Points

- Laravel Octane: RoadRunner (default) or FrankenPHP (simplicity)
- High-latency I/O (>50ms DB): Swoole
- Operational simplicity priority: FrankenPHP
- No PHP extension compilation: RoadRunner
- CLI/streaming: ReactPHP/AMPHP
- PHP-FPM sufficient: stay with FPM

## Performance Considerations

- RoadRunner: 41-111% improvement over FPM
- Swoole: best for high-latency I/O, 3-5x improvement
- FrankenPHP: 3-5x improvement, CGO adds 5-10% overhead
- ReactPHP/AMPHP: 1.2-1.5x for CLI/streaming
- All: require 24-hour soak tests to validate memory stability

## Security Considerations

- Swoole C extension: supply chain risk — compile from trusted sources
- RoadRunner process isolation: strongest security boundaries
- FrankenPHP CGO: memory safety considerations
- ReactPHP/AMPHP: PHP userspace — no extension security concerns
- All require regular security updates

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Start with RoadRunner for Laravel Octane
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Architecture Model Differences
- Runtime Selection Decision Tree
- Octane Driver Selection Comparison
- Benchmark Design and Execution

## Success Criteria

- Four runtime categories understood by team
- I/O profile matched to appropriate category
- Shortlisted runtime(s) identified for further evaluation
- Selection criteria documented
- Team education completed
