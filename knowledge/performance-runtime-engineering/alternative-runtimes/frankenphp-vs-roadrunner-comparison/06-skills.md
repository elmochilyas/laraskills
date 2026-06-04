# Skill: Compare FrankenPHP and RoadRunner for Runtime Selection

## Purpose

Systematically compare FrankenPHP (thread-based, Caddy embedded) and RoadRunner (Go + PHP workers, Goridge) across architecture, performance, and operational dimensions.

## When To Use

- Choosing between FrankenPHP and RoadRunner for a project
- Evaluating which runtime better fits the team's operational expertise
- Understanding the trade-offs between thread and worker process models

## When NOT To Use

- When the decision is already made
- Without considering the application's I/O profile and team expertise
- When PHP-FPM or Swoole is a better fit

## Prerequisites

- Understanding of both FrankenPHP and RoadRunner architectures
- I/O profile of the application
- Team operational capabilities

## Inputs

- Application I/O profile (query latency, external API overhead)
- Team experience (Go, Caddy, Docker, PHP extensions)
- Deployment environment (containers, bare metal, cloud)
- Requirements (HTTP/3, automatic HTTPS, stability, documentation)

## Workflow (numbered steps)

1. Compare architectures: FrankenPHP (threads, CGO, Caddy) vs RoadRunner (Go goroutines, PHP workers, Goridge)
2. For operational simplicity: FrankenPHP wins (single binary, automatic HTTPS, HTTP/3)
3. For stability and documentation quality: RoadRunner wins (more mature, extensive Laravel integration, larger community)
4. For memory efficiency: RoadRunner wins (separate PHP workers can be recycled independently)
5. For maximum throughput: depends on workload — test both with production-representative traffic
6. For Laravel Octane: RoadRunner is the default and best-documented option
7. For non-Laravel applications: FrankenPHP's Caddy integration provides easier setup
8. For teams avoiding PHP extensions: RoadRunner needs no extensions; FrankenPHP needs ZTS build
9. Benchmark both with the specific application workload over 24 hours
10. Document the comparison results and selection rationale

## Validation Checklist

- [ ] Architectures compared (threads vs goroutines + workers)
- [ ] Operational complexity assessed
- [ ] Documentation and community support compared
- [ ] Both runtimes benchmarked with application workload
- [ ] 24-hour soak test passed for selected runtime
- [ ] Selection rationale documented

## Common Failures

- **Choosing based on a single benchmark**: Published benchmarks use different workloads — always test your own
- **Ignoring operational expertise**: FrankenPHP's single binary appeal is strong, but RoadRunner's community support is larger
- **Not testing for memory leaks**: Both runtimes can exhibit leaks over hours — 24-hour soak is essential
- **Underestimating ZTS requirements**: FrankenPHP requires ZTS build — may not be available in some environments

## Decision Points

- Laravel Octane: RoadRunner (default, best documented)
- Operational simplicity priority: FrankenPHP (single binary, auto HTTPS)
- HTTP/3 required: FrankenPHP (built-in) vs RoadRunner (needs separate proxy)
- Team has Go expertise: RoadRunner (Go-based configuration)
- Team prefers PHP config: FrankenPHP (Caddyfile is simpler)
- PHP extension constraints: FrankenPHP (ZTS needed) vs RoadRunner (no PHP extension needed)

## Performance Considerations

- RoadRunner: 41-111% throughput over FPM; efficient goroutine scheduler
- FrankenPHP: 3-5x throughput over FPM; CGO overhead 5-10%
- Both outperform FPM significantly — the difference between them is workload-dependent
- RoadRunner's PHP workers are isolated processes — crash in one worker does not affect others
- FrankenPHP's threads share memory — better cache utilization but no process isolation

## Security Considerations

- RoadRunner process isolation: stronger — each PHP worker is a separate process
- FrankenPHP thread sharing: memory corruption in one thread can affect others
- Both support HTTPS (FrankenPHP: automatic via Caddy; RoadRunner: via separate proxy)
- Both require regular security updates
- RoadRunner's PHP workers run as separate processes — can use different OS users

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Start with RoadRunner for Laravel Octane
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Runtime Comparison Overview
- Runtime Selection Decision Tree
- FrankenPHP Installation and Caddyfile Configuration
- RoadRunner Installation and Configuration

## Success Criteria

- FrankenPHP vs RoadRunner compared across all relevant dimensions
- Both runtimes benchmarked with the application workload
- Selection justified by data (not opinion)
- 24-hour soak test passed for selected runtime
- Comparison documented for team reference
