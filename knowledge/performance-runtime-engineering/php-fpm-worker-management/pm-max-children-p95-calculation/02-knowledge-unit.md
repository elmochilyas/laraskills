# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP-FPM Process & Worker Management
Knowledge Unit: PM Max Children Calculation with P95 — Avoiding OOM Under Peak Variance
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`pm.max_children` is the single most important FPM safety setting. The correct formula uses **P95 RSS** (not average) multiplied by a **safety factor** (1.2-1.5). Average-based sizing creates 30-50% oversubscription risk — when workers hit peak memory simultaneously during traffic spikes, the server OOM-kills FPM processes, causing mass 502 errors.

---

# Core Concepts

- **Average RSS trap**: Worker RSS varies significantly across requests. Memory-intensive pages (reports, admin dashboards) can consume 2-3x more RSS than average pages. Average-based sizing fails under concurrent memory-intensive requests.
- **P95 RSS collection**: Sample RSS across all workers over 1 hour of production traffic. Sort, discard top 5%. The 95th percentile value = P95 RSS. Formula: `max_children = (available_RAM / (P95_RSS × safety_factor))`.
- **Safety factor rationale**: 1.2 for well-characterized workloads, 1.5 for variable workloads. Accounts for: 1) OS memory pressure from page cache growth, 2) burst memory allocation before OOM killer, 3) measurement sampling error.

---

# Patterns

**Production measurement**: `ps -eo rss,pid,command --sort -rss | grep php-fpm` — capture at peak hours. Log to a file, calculate P95 after 24h. Re-calibrate after significant code changes.

---

# Performance Considerations

- Over-provisioning (too many workers): causes OOM → swap thrashing → complete performance collapse
- Under-provisioning (too few workers): causes listen queue buildup → 502/504 errors → degraded user experience
- The optimal point: max_children where listen queue stays at 0 during peak traffic while keeping 10-20% RAM free

---

# Common Mistakes

**Setting max_children = (total_RAM / memory_limit)**: Worker RSS is typically 30-60% of memory_limit. This formula overestimates capacity by 40-70%. Always measure actual RSS.

---

# Related Knowledge Units

Pool Sizing Formula | Worker RSS Capacity Ceiling | Capacity Planning Safety Margins

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
