# Skill: Navigate the Runtime Selection Decision Tree

## Purpose

Use a systematic decision tree to select between PHP-FPM, Swoole, RoadRunner, FrankenPHP, and ReactPHP based on workload, team, and operational constraints.

## When To Use

- Evaluating whether to migrate from PHP-FPM
- Selecting a runtime for a new project
- Re-evaluating runtime choice after significant application changes

## When NOT To Use

- When the runtime decision is already final
- Without profiling data for the application
- Without team input on operational capabilities

## Prerequisites

- Application I/O profile (PHP execution vs I/O wait)
- Throughput requirements (RPS target)
- Team operational expertise assessment
- Understanding of each runtime's requirements

## Inputs

- I/O wait percentage (profiling data)
- Peak throughput requirement (RPS)
- Database query latency (average, P95)
- Team experience with: Go, C extensions, Docker, PHP extensions
- Deployment environment (containers, bare metal, cloud)

## Workflow (numbered steps)

1. Start: Does the application need >1000 RPS or is bootstrap >20% of request time?
2. If NO to both: stay with PHP-FPM — migration not justified
3. If YES: choose the runtime path based on I/O profile
4. Is I/O wait >50% of wall time?
5. If YES: Swoole (coroutine auto-hooking for DB/Redis/cURL)
6. If NO: use RoadRunner (goroutine scheduler, best all-around)
7. Is operational simplicity the primary concern?
8. If YES: FrankenPHP (single binary, automatic HTTPS, HTTP/3)
9. Is the workload CLI/streaming only?
10. If YES: ReactPHP/AMPHP
11. For Laravel Octane: prefer RoadRunner (best integration), then FrankenPHP (simplicity), then Swoole (performance)
12. Validate the selected runtime with a benchmark and 24-hour soak test
13. Document the decision path including the answers to each question

## Validation Checklist

- [ ] Decision tree navigated step by step
- [ ] I/O profile and throughput requirements documented
- [ ] Team expertise assessed
- [ ] Runtime selected based on decision tree
- [ ] Selected runtime validated with benchmark
- [ ] 24-hour soak test completed
- [ ] Decision path documented

## Common Failures

- **Skipping the "stay with FPM" question**: Most applications do not need alternative runtimes
- **Choosing based on a single factor**: I/O profile, team expertise, and operational complexity must all be considered
- **Not validating with the actual workload**: The decision tree provides direction — benchmarks provide confirmation
- **Ignoring the rollback question**: Every decision tree should include "can we roll back to FPM?"

## Decision Points

- Step 1: Bootstrap >20% AND throughput requirement >1000 RPS? -> continue; else -> FPM
- Step 2: I/O wait >50%? -> Swoole; else -> RoadRunner
- Step 3: Simplicity priority? -> FrankenPHP
- Step 4: CLI/streaming? -> ReactPHP
- Step 5: Laravel Octane? -> RoadRunner > FrankenPHP > Swoole
- Step 6: Validate -> benchmark + 24-hour soak

## Performance Considerations

- FPM: 2-4x with OpCache, no migration risk
- RoadRunner: 41-111% improvement, lowest migration risk
- Swoole: 3-5x for high-I/O, highest migration complexity
- FrankenPHP: 3-5x, lowest ops complexity, moderate migration effort
- ReactPHP: 1.2-1.5x for CLI, not suitable for web serving

## Security Considerations

- Process isolation: FPM = RoadRunner > FrankenPHP > Swoole
- Extension risk: Swoole (C ext) > FrankenPHP (ZTS) > RoadRunner (none) > FPM (none)
- Attack surface: larger for runtimes with more components
- Rollback capability: essential for all runtime migrations

## Related Rules (from 05-rules.md)

- Match Runtime Selection to Workload I/O Profile
- Run 24-Hour Soak Tests Before Production
- Start with RoadRunner for Laravel Octane
- Never Migrate Without a Documented Rollback Plan

## Related Skills

- Runtime Comparison Overview
- Architecture Model Differences
- Concurrency Model Selection
- Sync vs Async I/O Assessment

## Success Criteria

- Decision tree navigated with documented answers
- Runtime selected based on systematic evaluation
- Selected runtime validated with benchmark and soak test
- Rollback plan in place
- Decision path documented for future reference
