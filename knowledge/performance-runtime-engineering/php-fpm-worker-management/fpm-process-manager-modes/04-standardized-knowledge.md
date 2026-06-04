# Standardized Knowledge: FPM Process Manager Modes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP-FPM Process & Worker Management |
| Knowledge Unit | FPM Process Manager Modes |
| Difficulty | Foundation |
| Lifecycle | Configure, Tune |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP-FPM offers three process management modes: **static** (fixed pool size — constant memory usage, zero spawn latency), **dynamic** (variable pool — memory-efficient at low load, spawns on demand), and **ondemand** (zero idle workers — maximum memory saving, spawn latency on every request). Mode selection depends on traffic pattern: static for steady high traffic, dynamic for variable traffic, ondemand for low-traffic or memory-constrained environments.

## Core Concepts

- **pm = static**: Fixed number of children (`pm.max_children`). All spawned at startup. No spawn overhead. Always pays full memory cost. Best for predictable high-traffic workloads.
- **pm = dynamic**: Min/max spare servers maintained. Spawns children when idle servers fall below `pm.min_spare_servers`. Kills when idle exceeds `pm.max_spare_servers`. Good for variable traffic.
- **pm = ondemand**: Zero children at idle. Spawns on connection. Idle children killed after `pm.process_idle_timeout`. Best for memory-constrained or low-traffic servers. Spawn latency on cold requests.

## When To Use

- Static: Steady high-traffic (>100 req/s), predictable workloads, latency-sensitive applications.
- Dynamic: Variable traffic patterns, moderate traffic (10-100 req/s), shared servers with multiple workloads.
- Ondemand: Low-traffic servers (<10 req/s), memory-constrained environments, development/staging.

## When NOT To Use

- Static for low-traffic servers (wastes memory on idle workers).
- Dynamic for steady high-traffic (unnecessary spawn/kill overhead; use static).
- Ondemand for high-traffic APIs (each request pays spawn latency, degrading performance at scale).

## Best Practices (WHY)

- **Static for predictable high traffic**: Eliminates spawn latency entirely. Memory cost is constant — you pay for maximum capacity at all times.
- **Dynamic for variable traffic**: Memory adapts to load. Spawn latency only during traffic increases. Requires tuning of min/max spare servers.
- **Ondemand only for low traffic**: Maximum memory efficiency but each cold request pays ~10-50ms spawn penalty. Not suitable above ~50 req/s.
- **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, consider switching to static or tuning spare server counts.

## Architecture Guidelines

- PHP-FPM's master process uses an event-driven loop (`fpm_event_loop()`) that handles signals, timer events, and child process management.
- Children are forked via `fpm_children_make()`. The master tracks child states using an array of `pm_child_s` structs containing PID, scoreboard pointer, and last request time.
- The scoreboard (`pm_scoreboard_s`) maintains per-child and per-pool statistics accessible via the FPM status page.
- Process management decisions (spawn/kill) are made in `fpm_pm_main()` which evaluates current vs target process counts based on the configured pm mode.

## Performance

- Static: Zero spawn latency. Full memory cost always paid.
- Dynamic: Spawn latency (~10-50ms) during traffic increases. Spawn rate limited to 1/second by default.
- Ondemand: Spawn latency on every cold request (~10-50ms). Memory cost proportional to current traffic.
- Unix sockets are 15-25% faster than TCP for FPM communication.

## Security

- Each mode has different implications for resource exhaustion attacks.
- Ondemand can be overwhelmed by a sudden traffic spike (spawn rate limit + latency).
- Static is the most predictable and easiest to capacity-plan for security.
- Dynamic can be exploited if min_spare_servers is too high (wasted resources).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using ondemand for high-traffic APIs | Configuring by default | Each request pays spawn latency; server overwhelmed at >50 req/s | Use static or dynamic for production APIs |
| Using dynamic with static-like settings | Copying examples without understanding | Simulating static with extra spawn overhead | Use static if you need static-like behavior |
| Not setting max_children in ondemand mode | Assuming ondemand is self-limiting | Pool can still exhaust resources under load | Set max_children for all modes |
| onsistent spare server counts | Random values without measurement | Either wasted memory or frequent spawning | Measure baseline traffic; tune accordingly |

## Anti-Patterns

- **Ondemand for production APIs**: Each cold request pays spawn latency. At 500 req/s, the server spends 5-25 seconds per second spawning workers.
- **Static for low-traffic servers**: All workers consume memory 24/7 even at zero traffic. Use ondemand or dynamic for low-traffic environments.
- **Dynamic without monitoring**: Without status page monitoring, you can't tell if dynamic is working correctly. Always pair dynamic with monitoring.

## Examples

```ini
; Static mode — steady high traffic
pm = static
pm.max_children = 50

; Dynamic mode — variable traffic
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 10

; Ondemand mode — low traffic, memory-constrained
pm = ondemand
pm.max_children = 20
pm.process_idle_timeout = 10s
```

## Related Topics

- PM Max Children
- PM Max Requests Tuning
- Pool Sizing Formula
- FPM Status Page Monitoring
- Slow Log Configuration

## AI Agent Notes

- Static: Zero spawn latency, constant memory. Best for steady high traffic.
- Dynamic: Adaptive memory, occasional spawn latency. Best for variable traffic.
- Ondemand: Minimum memory, spawn latency on every cold request. Best for low traffic.
- The restaurant kitchen model helps explain the tradeoffs (static = all chefs on shift, dynamic = adjust based on orders, ondemand = hire per order).
- Never use ondemand for production APIs serving >50 req/s.

## Verification

- [ ] Mode selected matches traffic pattern (static for steady, dynamic for variable, ondemand for low)
- [ ] If dynamic: min_spare_servers and max_spare_servers tuned appropriately
- [ ] If ondemand: process_idle_timeout configured and max_children set
- [ ] pm.max_children set for all modes (including ondemand)
- [ ] FPM status page enabled for monitoring spawn events
- [ ] No excessive spawn events in FPM error log
