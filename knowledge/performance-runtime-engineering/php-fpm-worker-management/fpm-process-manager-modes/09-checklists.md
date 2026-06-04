# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** FPM Process Manager Modes â€” Static, Dynamic, Ondemand
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Static for predictable high traffic**: Eliminates spawn latency entirely. Memory cost is constant â€” you pay for maximum capacity at all times.
- [ ] **Dynamic for variable traffic**: Memory adapts to load. Spawn latency only during traffic increases. Requires tuning of min/max spare servers.
- [ ] **Ondemand only for low traffic**: Maximum memory efficiency but each cold request pays ~10-50ms spawn penalty. Not suitable above ~50 req/s.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, consider switching to static or tuning spare server counts.
- [ ] Mode selected matches traffic pattern (static for steady, dynamic for variable, ondemand for low)
- [ ] If dynamic: min_spare_servers and max_spare_servers tuned appropriately
- [ ] If ondemand: process_idle_timeout configured and max_children set
- [ ] pm.max_children set for all modes (including ondemand)
- [ ] FPM status page enabled for monitoring spawn events
- [ ] pm mode matched to traffic pattern
- [ ] No excessive spawn events in logs
- [ ] Memory utilization appropriate for the mode
- [ ] Workers available when needed (no 502 errors from no available workers)
- [ ] Mode selection documented with rationale
- [ ] Traffic pattern analyzed (steady, variable, low)
- [ ] pm mode selected based on traffic pattern
- [ ] pm.max_children set for all modes
- [ ] Dynamic: start_servers, min_spare, max_spare configured
- [ ] Ondemand: process_idle_timeout configured
- [ ] No excessive spawn events in FPM error log

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] PHP-FPM's master process uses an event-driven loop (`fpm_event_loop()`) that handles signals, timer events, and child process management.
- [ ] Children are forked via `fpm_children_make()`. The master tracks child states using an array of `pm_child_s` structs containing PID, scoreboard pointer, and last request time.
- [ ] The scoreboard (`pm_scoreboard_s`) maintains per-child and per-pool statistics accessible via the FPM status page.
- [ ] Process management decisions (spawn/kill) are made in `fpm_pm_main()` which evaluates current vs target process counts based on the configured pm mode.
- [ ] Document and follow through on architectural decision: pm = static vs dynamic vs ondemand
- [ ] Ensure architecture aligns with core concept: **pm = static**: Fixed number of children (`pm.max_children`). All spawned at startup. No spawn overhead. Always pays full memory cost. Best for predictable high-traffic workloads.
- [ ] Ensure architecture aligns with core concept: **pm = dynamic**: Min/max spare servers maintained. Spawns children when idle servers fall below `pm.min_spare_servers`. Kills when idle exceeds `pm.max_spare_servers`. Good for variable traffic.
- [ ] Ensure architecture aligns with core concept: **pm = ondemand**: Zero children at idle. Spawns on connection. Idle children killed after `pm.process_idle_timeout`. Best for memory-constrained or low-traffic servers. Spawn latency on cold requests.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Static for predictable high traffic**: Eliminates spawn latency entirely. Memory cost is constant â€” you pay for maximum capacity at all times.
- [ ] **Dynamic for variable traffic**: Memory adapts to load. Spawn latency only during traffic increases. Requires tuning of min/max spare servers.
- [ ] **Ondemand only for low traffic**: Maximum memory efficiency but each cold request pays ~10-50ms spawn penalty. Not suitable above ~50 req/s.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, consider switching to static or tuning spare server counts.
- [ ] Analyze traffic pattern: is traffic steady throughout the day, or does it vary significantly?
- [ ] If traffic > 100 req/s and steady: use `pm = static` â€” zero spawn latency, full memory always committed
- [ ] If traffic varies (10-100 req/s range): use `pm = dynamic` â€” adaptive memory, occasional spawn latency
- [ ] If traffic < 10 req/s: use `pm = ondemand` â€” minimum memory, spawn latency on cold requests
- [ ] For static: set `pm.max_children` to the calculated value â€” all workers start at FPM startup
- [ ] For dynamic: set `pm.max_children`, `pm.start_servers` (25-50% of max), `pm.min_spare_servers`, `pm.max_spare_servers`
- [ ] For ondemand: set `pm.max_children`, `pm.process_idle_timeout` (10-30s) to kill idle workers
- [ ] Set `pm.max_children` for ALL modes â€” even ondemand needs an upper bound
- [ ] Monitor spawn events in FPM error log â€” frequent spawning indicates mode mismatch
- [ ] Document the mode selection and rationale

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Each mode has different implications for resource exhaustion attacks.
- [ ] Ondemand can be overwhelmed by a sudden traffic spike (spawn rate limit + latency).
- [ ] Static is the most predictable and easiest to capacity-plan for security.
- [ ] Dynamic can be exploited if min_spare_servers is too high (wasted resources).

# Reliability Checklist (from 04/05/06)
- [ ] **max_children exhaustion**: All workers busy, request queue grows. Symptom: FPM log "server reached pm.max_children setting". Nginx returns 502/504. Mitigation: Increase max_children, optimize response time, add more servers.
- [ ] **OOM killer**: Linux OOM killer terminates PHP-FPM workers. Symptom: dmesg "oom-killer" events, FPM logs SIGKILL. Mitigation: Reduce max_children, add RAM, enable swap.
- [ ] **Slow request cascade**: One slow request holds a worker, reducing capacity, causing queuing, which creates more slow requests (snowball effect). Symptom: Latency degrades non-linearly with traffic increase. Mitigation: Set request_terminate_timeout, enable slow log, identify bottleneck.
- [ ] **PHP-FPM master crash**: Master process dies due to bug or resource exhaustion. Symptom: All workers die, site down. Mitigation: systemd auto-restart, monitoring alert.
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- [ ] **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments Ã¢â‚¬â€ indicates pool exhaustion. Alert when listen queue consistently above 0.

# Testing Checklist (from 04/06)
- [ ] Mode selected matches traffic pattern (static for steady, dynamic for variable, ondemand for low)
- [ ] If dynamic: min_spare_servers and max_spare_servers tuned appropriately
- [ ] If ondemand: process_idle_timeout configured and max_children set
- [ ] pm.max_children set for all modes (including ondemand)
- [ ] FPM status page enabled for monitoring spawn events
- [ ] No excessive spawn events in FPM error log
- [ ] pm mode matched to traffic pattern
- [ ] No excessive spawn events in logs
- [ ] Memory utilization appropriate for the mode
- [ ] Workers available when needed (no 502 errors from no available workers)
- [ ] Mode selection documented with rationale
- [ ] Traffic pattern analyzed (steady, variable, low)
- [ ] pm mode selected based on traffic pattern
- [ ] pm.max_children set for all modes
- [ ] Dynamic: start_servers, min_spare, max_spare configured
- [ ] Ondemand: process_idle_timeout configured
- [ ] Mode selection documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Static for predictable high traffic**: Eliminates spawn latency entirely. Memory cost is constant â€” you pay for maximum capacity at all times.
- [ ] **Dynamic for variable traffic**: Memory adapts to load. Spawn latency only during traffic increases. Requires tuning of min/max spare servers.
- [ ] **Ondemand only for low traffic**: Maximum memory efficiency but each cold request pays ~10-50ms spawn penalty. Not suitable above ~50 req/s.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, consider switching to static or tuning spare server counts.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using ondemand for high-traffic APIs
- [ ] Avoid: Using dynamic with static-like settings
- [ ] Avoid: Not setting max_children in ondemand mode
- [ ] Avoid: onsistent spare server counts
- [ ] Avoid anti-pattern: **Ondemand for production APIs**: Each cold request pays spawn latency. At 500 req/s, the server spends 5-25 seconds per second spawning workers.
- [ ] Avoid anti-pattern: **Static for low-traffic servers**: All workers consume memory 24/7 even at zero traffic. Use ondemand or dynamic for low-traffic environments.
- [ ] Avoid anti-pattern: **Dynamic without monitoring**: Without status page monitoring, you can't tell if dynamic is working correctly. Always pair dynamic with monitoring.
- [ ] Guard against anti-pattern: pm.max_children Set Arbitrarily Without Calculation
- [ ] Guard against anti-pattern: Using Dynamic Process Manager for Consistent Workloads
- [ ] Guard against anti-pattern: pm.max_requests Too High - Memory Drift Unchecked
- [ ] Guard against anti-pattern: pm.min_spare_servers Too Low Causing Cold Requests
- [ ] Guard against anti-pattern: Ignoring pm.status_page in Production
- [ ] Calculated from RSS data
- [ ] No swap under load

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- [ ] **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments Ã¢â‚¬â€ indicates pool exhaustion. Alert when listen queue consistently above 0.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **pm = static**: Fixed number of children (`pm.max_children`). All spawned at startup. No spawn overhead. Always pays full memory cost. Best for predictable high-traffic workloads., **pm = dynamic**: Min/max spare servers maintained. Spawns children when idle servers fall below `pm.min_spare_servers`. Kills when idle exceeds `pm.max_spare_servers`. Good for variable traffic., **pm = ondemand**: Zero children at idle. Spawns on connection. Idle children killed after `pm.process_idle_timeout`. Best for memory-constrained or low-traffic servers. Spawn latency on cold requests.
**Skills:** Capacity Planning and Safety Margins, PM Max Children P95 Calculation, Pool Sizing Formula Rationale, FPM Status Page Monitoring
**Decision Trees:** pm = static vs dynamic vs ondemand
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** PM Max Children, PM Max Requests Tuning, Pool Sizing Formula, FPM Status Page Monitoring, Slow Log Configuration

