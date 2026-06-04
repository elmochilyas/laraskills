# Standardized Knowledge: PM Min Spare Servers

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | PM Min Spare Servers |
| Difficulty | Foundation |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

`pm.min_spare_servers` controls the minimum number of idle PHP-FPM workers that the dynamic process manager maintains. It ensures a ready pool of workers to handle incoming traffic spikes without spawn latency. Setting it too low causes request queuing during traffic bursts. Setting it too high wastes memory on idle processes.

## Core Concepts

- **Dynamic mode relevance**: `pm.min_spare_servers` only applies when `pm = dynamic`. Static and ondemand modes ignore this setting entirely.
- **Idle worker pool**: Workers spawned beyond current demand stay alive as idle processes. The FPM master monitors idle count and spawns new workers when it drops below `pm.min_spare_servers`.
- **Spawn trigger**: When idle workers < `pm.min_spare_servers`, the master forks new workers (up to `pm.max_children`). Spawn latency is ~10-50ms per worker.
- **Relationship with pm.max_spare_servers**: `pm.min_spare_servers` defines the floor, `pm.max_spare_servers` defines the ceiling. Together they create a target idle range.

## When To Use

- Configuring dynamic process manager mode for variable-traffic workloads
- Ensuring low-latency response to traffic spikes
- Balancing memory efficiency with request responsiveness
- Multi-tenant environments with per-pool isolation

## When NOT To Use

- When `pm = static` (ignored — all workers always active)
- When `pm = ondemand` (ignored — zero idle workers by design)
- When memory is too constrained to maintain idle workers
- On single-request environments (CLI scripts, queue workers)

## Best Practices

- **Set based on baseline traffic**: Calculate from average idle request rate during low-traffic periods. Formula: `min_spare = baseline_RPS × avg_request_duration_seconds`.
- **Keep it low but safe**: 2-5 for most applications. Higher values (10-20) for high-traffic APIs with bursty patterns.
- **Never exceed pm.max_spare_servers**: `pm.min_spare_servers` must be less than `pm.max_spare_servers`. The gap between them defines the idle buffer range.
- **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, `pm.min_spare_servers` may be too low for the traffic pattern.

## Architecture Guidelines

- **Dynamic mode mechanics**: FPM master's event loop (`fpm_event_loop()`) evaluates idle count every second. When below `pm.min_spare_servers`, it spawns workers in batches (`pm.spawn_rate`, default 1 per second) to avoid thundering herd.
- **Spawn rate limiting**: The master spawns at most `pm.spawn_rate` workers per second (default 1). A large deficit between idle count and `pm.min_spare_servers` takes seconds to close — plan accordingly.
- **Ondemand vs Dynamic distinction**: Ondemand spawns on new connection (no idle pool). Dynamic maintains the idle pool. The choice depends on whether spawn latency is acceptable per-request or only during bursts.

## Performance Considerations

- Idle workers consume ~30-60 MB RSS each — each idle worker is committed RAM doing no work
- Spawn latency: 10-50ms per worker fork (memory allocation, extension initialization, OpCache warm)
- Overflow spawns during traffic spikes add latency to the requests that trigger them
- `pm.min_spare_servers` too low + traffic spike = listen queue buildup while workers spawn
- `pm.min_spare_servers` too high = wasted RAM that could serve other processes (database, Redis)

## Security

- Idle workers retain residual memory from previous requests — sensitive data may persist until overwritten
- Set `pm.max_requests` to recycle workers periodically, clearing residual memory
- In multi-tenant pools, ensure idle workers from one tenant don't leak data to the next

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Setting min_spare equal to max_children | Misunderstanding dynamic mode | No idle buffer — master constantly spawns/kills | Set min_spare ~10-20% of max_children |
| Setting min_spare higher than max_spare | Configuration error | FPM fails to start or logs warnings | Always keep min < max with a meaningful gap |
| Setting min_spare to 0 | Copying ondemand behavior | Every dip below threshold triggers spawn cascade | Set minimum of 1-2 to avoid constant spawn churn |
| Ignoring spawn_rate interaction | Not reading documentation | Slow recovery from idle deficit (1 worker/second) | Account for spawn rate in capacity planning |

## Anti-Patterns

- **Setting min_spare equal to max_spare**: Creates a narrow target range — the master oscillates between spawning and killing workers as traffic fluctuates. Always maintain a buffer between min and max.
- **Blindly copying values from tutorials**: Optimal `pm.min_spare_servers` depends on your traffic pattern, memory budget, and response times. Measure first, then set.
- **Using dynamic mode with static-like min_spare**: If min_spare approaches max_children, you're simulating static mode with extra spawn overhead. Either switch to static or reduce min_spare.

## Examples

```ini
; php-fpm pool configuration — Dynamic mode with conservative min_spare
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10
pm.max_requests = 500

; php-fpm pool configuration — Dynamic mode for bursty traffic
pm = dynamic
pm.max_children = 100
pm.start_servers = 20
pm.min_spare_servers = 10
pm.max_spare_servers = 30
pm.max_requests = 1000
```

## Related Topics

- PM Static Dynamic Ondemand
- PM Max Children
- PM Start Servers
- PM Max Spare Servers
- Pool Sizing Formula and Rationale

## AI Agent Notes

- `pm.min_spare_servers` is only relevant in dynamic mode — static and ondemand ignore it
- The setting defines the floor of the idle worker pool, not the ceiling
- Each idle worker consumes real RSS memory — don't set unnecessarily high
- Spawn rate is limited to 1/second by default — large deficits take time to recover
- Monitor FPM status page: "idle processes" count should consistently stay above min_spare
- For steady high-traffic workloads, prefer static mode over dynamic

## Verification

- [ ] FPM configured to dynamic mode (pm = dynamic)
- [ ] pm.min_spare_servers set to appropriate value for traffic baseline
- [ ] pm.min_spare_servers < pm.max_spare_servers
- [ ] FPM status page showing idle processes consistently above min_spare
- [ ] No excessive spawn events in FPM error log during normal traffic
- [ ] Memory usage monitored — idle workers not consuming excessive RAM
- [ ] pm.max_requests configured to recycle workers and clear residual memory
