# Metadata

Domain: Performance & Runtime Engineering
Subdomain: PHP-FPM Process & Worker Management
Knowledge Unit: pm.max_requests Counteracts Memory Drift at Cost of Process Spawn Overhead
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Worker recycling via `pm.max_requests` is a deliberate tradeoff: **lower worker RSS** (good) vs **higher process spawn overhead** (bad). Each spawn costs ~10-50ms of CPU time for process fork, PHP bootstrap, and OpCache warming. The optimal `pm.max_requests` minimizes the sum of drift-related memory waste and spawn-related CPU waste.

---

# Core Concepts

- **Memory drift mechanics**: PHP's per-request allocator leaves fragmented memory pages that the OS cannot reclaim. Over ~10,000 requests, RSS grows 1.5-2x.
- **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading).
- **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead = 100 workers × (1 recycle / 500 requests) × 30ms spawn cost = 6ms per 500 requests = 0.012ms per request. Negligible.

---

# Patterns

**Overhead minimization**: Preloading (reduces spawn cost by 50-80%), COW-friendly PHP compilation (OpCache reduces per-worker memory needs), and process-mode static (avoids spawn/waste contention).

---

# Common Mistakes

**Raising max_requests to "reduce overhead"**: The overhead of spawning is already negligible (<0.1% of CPU). The real risk is memory drift from too-high max_requests. Optimize for memory stability, not spawn frequency.

---

# Performance Considerations

- max_children = (total_memory - OS_reserve) / per_worker_rss; oversubscription causes swapping
- dynamic (adaptive) vs static (fixed) vs ondemand (idle shutdown); static offers best throughput for steady traffic
- Higher pm.max_requests reduces recycling overhead but increases memory leak risk; 500-1000 is typical
- slow_log logging adds ~0.5ms per request; enable only when debugging specific issues
- /fpm-status provides real-time worker utilization, idle/max/active process counts

---

# Related Knowledge Units

PM Max Requests Tuning | Memory Drift Detection | Preloading Reduces Cold Start Latency

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
