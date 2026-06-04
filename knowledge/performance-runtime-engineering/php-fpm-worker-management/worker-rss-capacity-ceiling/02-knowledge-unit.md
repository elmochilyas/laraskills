# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP-FPM Process & Worker Management
Knowledge Unit: Worker RSS and pm.max_children Jointly Determine Server Capacity Ceiling
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

The server's maximum concurrent request capacity is `pm.max_children` — but this value is constrained by available RAM divided by worker RSS. More workers do not equal more throughput: beyond the optimal point, context switching overhead and memory pressure degrade performance. The capacity ceiling is a product of **worker count × worker RSS = available RAM**.

---

# Core Concepts

- **Capacity equation**: Concurrent request ceiling = min(CPU capacity, RAM capacity). RAM is typically the binding constraint.
- **CPU vs RAM bound**: CPU-bound workloads saturate CPU before memory (workers idle less). I/O-bound workloads accumulate many waiting workers, consuming memory without using CPU.
- **Worker RSS determination**: Average memory per worker under load. Varies by application complexity (50MB for simple sites, 120MB+ for large frameworks with heavy memory usage).
- **Optimal max_children**: The highest value where: 1) RAM stays 15%+ free, 2) CPU is utilized but not saturated, 3) Listen queue stays at 0.

---

# Patterns

**Scaling methodology**: Start with conservative max_children ? stress test ? monitor RSS and CPU ? increase until listen queue disappears or RAM hits 85% utilization ? back off 10% for safety margin.

---

# Performance Considerations

- max_children = (total_memory - OS_reserve) / per_worker_rss; oversubscription causes swapping
- dynamic (adaptive) vs static (fixed) vs ondemand (idle shutdown); static offers best throughput for steady traffic
- Higher pm.max_requests reduces recycling overhead but increases memory leak risk; 500-1000 is typical
- slow_log logging adds ~0.5ms per request; enable only when debugging specific issues
- /fpm-status provides real-time worker utilization, idle/max/active process counts

---

# Common Mistakes

- Setting max_children too high: over-subscribing memory causes swapping; calculate based on RAM / RSS
- Using pm=dynamic without understanding: spawning/killing workers has overhead; static is often better
- Not setting request_terminate_timeout: stuck workers accumulate; set to 30-60s
- Ignoring slow log: unoptimized queries degrade user experience; monitor actively
- Combining CPU-bound and I/O-bound workers in same pool: separate pools optimize resource allocation

---

# Related Knowledge Units

Pool Sizing Formula | PM Max Children P95 Calculation | CPU vs I/O Bound Worker Ratios

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
