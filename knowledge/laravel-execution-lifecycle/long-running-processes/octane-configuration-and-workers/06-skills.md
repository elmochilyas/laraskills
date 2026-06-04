# Skill: Tune Octane Worker Configuration Based on Memory Profile

## Purpose
Calculate and configure `worker_count`, `max_requests`, and runtime-specific timeouts in `config/octane.php` based on measured memory growth and workload characteristics.

## When To Use
- Initial Octane deployment
- After application changes that affect memory profile
- When workers OOM before reaching `max_requests`
- Capacity planning and performance tuning

## When NOT To Use
- Local development (defaults are sufficient)
- PHP-FPM deployments
- Serverless (Laravel Vapor)

## Prerequisites
- Memory profiling data (baseline, per-request delta from memory-profiling skill)
- `memory_limit` PHP configuration value
- Understanding of workload type (CPU-bound vs I/O-bound)
- Knowledge of target runtime (Swoole, RoadRunner, FrankenPHP)

## Inputs
- `config/octane.php` current settings
- Baseline memory per worker (idle, after boot)
- Per-request memory growth delta (average MB/request from profiling)
- PHP `memory_limit` value
- CPU core count of deployment server
- Runtime adapter (swoole/roadrunner/frankenphp)

## Workflow
1. Profile worker memory: log `memory_get_usage(true)` at request start for 1000+ requests to measure growth per request
2. Calculate `safe_max_requests = (memory_limit - baseline_memory) / growth_per_request * safety_margin(0.8)`
3. Set `worker_count` to CPU core count for CPU-bound workloads; CPU cores + Swoole coroutines for I/O-bound
4. Configure runtime-specific timeouts: `max_execution_time` (Swoole) or `request_timeout` (RoadRunner) at 2x the slowest legitimate request
5. Set `max_wait_time` (Swoole) or equivalent graceful shutdown timeout to match upstream timeout value, ensuring in-flight requests complete
6. Test with over-provisioned worker_count to observe context-switching overhead; verify `auto` mode detects cores correctly
7. Validate that `max_requests` is per-worker: total recycling capacity = `worker_count * max_requests`

## Validation Checklist
- [ ] `max_requests` calculated from profiled memory data with 20% safety margin, never 0 or null
- [ ] `worker_count` set to CPU core count (or `auto`), not concurrent user count
- [ ] Runtime-specific timeout matches slowest legitimate request + safety margin
- [ ] Graceful shutdown timeout (`max_wait_time`) configured appropriately
- [ ] Worker count validated against workload type (CPU-bound vs I/O-bound)
- [ ] Staged `max_requests` reduction strategy documented for zero-downtime deployments

## Common Failures
- Setting `worker_count` to expected concurrent users instead of CPU cores — context-switch thrashing
- Setting `max_requests` to 0 or null — no safety valve, workers OOM
- Confusing `max_requests` as global limit vs per-worker — with 8 workers, 500 = 4000 total
- Not matching runtime-specific timeout to actual request durations — long legitimate requests killed
- Over-provisioning workers for CPU-bound apps, reducing throughput

## Decision Points
- CPU-bound: `worker_count = CPU cores`, no coroutine benefit
- I/O-bound with Swoole: same worker count but enable coroutines for concurrency
- RoadRunner deployments: may prefer higher worker count since isolation prevents shared memory corruption
- Single `max_requests` for all routes vs separate instances for memory-intensive routes

## Performance Considerations
- Worker count > CPU cores causes context-switch thrashing, reducing throughput
- `max_requests` too low wastes throughput on worker churn and prevents cache warmth
- `max_requests` too high risks OOM — workers grow until killed
- Swoole coroutines: zero overhead context switching for I/O wait
- RoadRunner Go-side routing: sub-millisecond overhead per request
- Total memory budget = `worker_count * per-worker RSS`

## Security Considerations
- Oversubscription meltdown: too many workers on few cores causes queue backup and system collapse
- Stuck worker cascade: one worker in infinite loop overloads others, response times spike
- Worker starvation (RoadRunner): `max_jobs` too low prevents cache warmth, cold-start overhead on every request
- Swoole `max_execution_time` per-worker: stuck I/O blocks entire worker

## Related Rules
- Set worker count to CPU core count, not concurrent user count (05-rules.md)
- Always set `max_requests` based on profiled memory growth (05-rules.md)
- Understand that `max_requests` is per-worker, not global (05-rules.md)
- Use staged `max_requests` reduction for zero-downtime deployments (05-rules.md)
- Configure graceful shutdown timeouts per runtime (05-rules.md)
- Match runtime-specific timeout config to application needs (05-rules.md)

## Related Skills
- Establish Memory Baseline and Trend Tracking (memory-profiling-and-observability)
- Audit Service Providers for Octane Singleton Safety (octane-architecture-overview)
- Register Octane Lifecycle Hooks (octane-lifecycle-hooks)

## Success Criteria
- Workers run to `max_requests` without hitting `memory_limit`
- CPU utilization is balanced — no context-switch thrashing from over-provisioned workers
- Slowest legitimate request completes within runtime timeout without being killed
- Graceful shutdown completes all in-flight requests before worker termination
- Staged deployment reduces `max_requests` temporarily to cycle workers without capacity drop
- Total recycling capacity (`worker_count * max_requests`) is correctly understood and documented
