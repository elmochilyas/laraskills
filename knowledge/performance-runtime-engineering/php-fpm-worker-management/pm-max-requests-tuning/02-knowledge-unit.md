# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP-FPM Process & Worker Management
Knowledge Unit: PM Max Requests Tuning — Worker Recycling to Counteract Memory Drift
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`pm.max_requests` controls how many requests a worker handles before being killed and replaced. This **recycling** prevents memory drift — the gradual increase in worker RSS caused by per-request memory fragmentation. A worker starting at 65MB RSS will grow to ~120MB over 12 hours without recycling. Setting `pm.max_requests` to 500-1000 stabilizes RSS by recycling before memory becomes critical.

---

# Core Concepts

- **Memory drift**: PHP's allocator does not return all memory to the OS between requests. Small fragmentation accumulates. After ~10,000 requests, RSS can double.
- **Recycling cost**: Killing and spawning a worker consumes ~10-50ms (process fork + PHP bootstrap). Too-frequent recycling wastes CPU on process management.
- **Zero is never appropriate**: `pm.max_requests=0` (unlimited) guarantees memory drift will eventually exhaust RAM. Always set a limit.
- **Tuning range**: 300-500 for memory-leak-prone apps (WordPress with plugins), 1000-2000 for well-behaved apps (Laravel), 5000+ only with monitoring proving no drift.

---

# Patterns

**Memory drift detection**: Compare worker RSS at start (just spawned) vs after 500 requests. If growth >20%, lower max_requests. If growth <5%, raise max_requests to reduce recycling overhead.

---

# Performance Considerations

- Low max_requests (100-200): High spawn overhead (~5-10% of total CPU)
- High max_requests (5000+): Risk of memory exhaustion if a leak exists
- Optimal: 500-1000 for most applications — balances drift prevention with spawn overhead (<1% of total CPU)

---

# Common Mistakes

**pm.max_requests=0 (unlimited)**: Workers never recycle. Memory drift accumulates indefinitely. On a server with 128 workers at 65MB baseline, drift to 120MB adds 7GB of additional memory pressure.

---

# Related Knowledge Units

Memory Drift Detection and Mitigation | Worker RSS Capacity Ceiling | FPM Process Manager Modes

---

## Mental Models

**Restaurant kitchen model**: PHP-FPM workers are chefs in a kitchen. Static mode keeps all chefs on shift at all times â€” fast service but high payroll. Dynamic mode adjusts chefs based on orders â€” efficient but has hiring lag. Ondemand mode hires a chef only when an order comes in â€” maximum payroll savings but slow first service.

---

## Internal Mechanics

PHP-FPM's master process uses a event-driven loop (pm_event_loop()) that handles signals, timer events, and child process management. Children are forked via pm_children_make(). The master tracks child states using an array of pm_child_s structs containing PID, scoreboard pointer, and last request time. The scoreboard (pm_scoreboard_s) maintains per-child and per-pool statistics accessible via the FPM status page. The listen socket can be TCP or Unix domain socket. Process management decisions (spawn/kill) are made in pm_pm_main() which evaluates current vs target process counts based on the configured pm mode.

---

## Patterns

**Monitor-then-size**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children = (RAM - reserved) / (P95_RSS * safety_factor), 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.

---

## Architectural Decisions

- **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| Static PM | Zero spawn latency, predictable | Always-on memory, no downsizing |
| Dynamic PM | Memory adapts to traffic | Spawn latency on spikes, management overhead |
| Ondemand PM | Minimum memory footprint | Spawn latency on every cold request |
| Unix socket vs TCP | Lower latency, no port conflicts | Same-machine only, permission complexity |

---

## Production Considerations

- **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- **Capacity alerts**: Alert when max_children_reached counter increments â€” indicates pool exhaustion. Alert when listen queue consistently above 0.

---

## Failure Modes

- **max_children exhaustion**: All workers busy, request queue grows. Symptom: FPM log "server reached pm.max_children setting". Nginx returns 502/504. Mitigation: Increase max_children, optimize response time, add more servers.
- **OOM killer**: Linux OOM killer terminates PHP-FPM workers. Symptom: dmesg "oom-killer" events, FPM logs SIGKILL. Mitigation: Reduce max_children, add RAM, enable swap.
- **Slow request cascade**: One slow request holds a worker, reducing capacity, causing queuing, which creates more slow requests (snowball effect). Symptom: Latency degrades non-linearly with traffic increase. Mitigation: Set request_terminate_timeout, enable slow log, identify bottleneck.
- **PHP-FPM master crash**: Master process dies due to bug or resource exhaustion. Symptom: All workers die, site down. Mitigation: systemd auto-restart, monitoring alert.

---

## Ecosystem Usage

- **Laravel Forge / Vapor**: Laravel Forge manages PHP-FPM configuration via UI. Vapor (serverless) uses a different execution model but similar OpCache principles apply to container cold starts.
- **Plesk / cPanel**: Shared hosting panels configure PHP-FPM pool isolation per subscription. Each vhost gets a separate pool with configurable max_children. Multi-pool isolation is common.
- **Docker PHP images**: Official php:*-fpm Alpine images default to dynamic PM with 5 max_children. Production Dockerfiles override PM settings via COPY of custom www.conf.
- **Kubernetes**: PHP-FPM in Kubernetes pods requires careful liveness/readiness probe configuration. FPM status page on a separate port for k8s probes.

---

## Research Notes

- PHP-FPM's event loop architecture has remained stable since PHP 5.3. Upstream improvements focus on configuration ergonomics and monitoring rather than fundamental architecture changes.
- PHP 8.5 adds warning when OpCache settings are configured in pool files instead of php.ini â€” a common misconfiguration caught at startup.
- Community research: PHP-FPM socket activation via systemd for zero-downtime socket management during restarts. Not yet adopted in core.
