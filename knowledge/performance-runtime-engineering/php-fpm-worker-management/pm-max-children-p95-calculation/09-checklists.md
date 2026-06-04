# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** PM Max Children Calculation with P95 — Avoiding OOM Under Peak Variance
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use P95 RSS, not average**: Average-based sizing creates 30-50% oversubscription risk. P95-based sizing is the difference between a stable server and one that OOM-kills under peak load.
- [ ] **Apply a safety factor of 1.2-1.5**: Even P95 has variance. The safety factor provides headroom for page cache pressure, measurement error, and future growth.
- [ ] **Measure over 24 hours**: One hour may not capture peak memory usage. Sample over a full business cycle.
- [ ] **Re-calibrate quarterly**: Worker RSS changes with code, data size, and traffic patterns. Regular recalibration prevents drift.
- [ ] Worker RSS sampled over 24+ hours of production traffic
- [ ] P95 RSS calculated from samples (not average)
- [ ] Safety factor (1.2-1.5) applied in formula
- [ ] pm.max_children set to calculated value
- [ ] FPM status page confirms listen queue stays at 0 under peak
- [ ] max_children calculated from P95 (or selected percentile) concurrency
- [ ] Cross-checked against memory budget
- [ ] max_children_reached = 0 or acceptably rare
- [ ] Worker utilization optimized (not over-provisioned)
- [ ] Calculation documented with percentile data
- [ ] Request concurrency data collected over 7+ days
- [ ] P95, P99, max values calculated
- [ ] max_children calculated using selected percentile + headroom
- [ ] max_children_reached = 0 after deployment (or tracked and acceptable)
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Production measurement**: `ps -eo rss,pid,command --sort -rss | grep php-fpm` â€” capture at peak hours. Log to a file, calculate P95 after 24h.
- [ ] **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.
- [ ] Document and follow through on architectural decision: pm.max_children value based on p95 concurrency
- [ ] Ensure architecture aligns with core concept: **Average RSS trap**: Worker RSS varies significantly across requests. Memory-intensive pages (reports, admin dashboards) can consume 2-3x more RSS than average pages. Average-based sizing fails under concurrent memory-intensive requests.
- [ ] Ensure architecture aligns with core concept: **P95 RSS collection**: Sample RSS across all workers over 1 hour of production traffic. Sort, discard top 5%. The 95th percentile value = P95 RSS. Formula: `max_children = (available_RAM / (P95_RSS Ã— safety_factor))`.
- [ ] Ensure architecture aligns with core concept: **Safety factor rationale**: 1.2 for well-characterized workloads, 1.5 for variable workloads. Accounts for: 1) OS memory pressure from page cache growth, 2) burst memory allocation before OOM killer, 3) measurement sampling error.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use P95 RSS, not average**: Average-based sizing creates 30-50% oversubscription risk. P95-based sizing is the difference between a stable server and one that OOM-kills under peak load.
- [ ] **Apply a safety factor of 1.2-1.5**: Even P95 has variance. The safety factor provides headroom for page cache pressure, measurement error, and future growth.
- [ ] **Measure over 24 hours**: One hour may not capture peak memory usage. Sample over a full business cycle.
- [ ] **Re-calibrate quarterly**: Worker RSS changes with code, data size, and traffic patterns. Regular recalibration prevents drift.
- [ ] Collect request concurrency data over 7+ days (include weekends and weekdays)
- [ ] Calculate P95, P99, and max concurrent request values
- [ ] For most production APIs: max_children = P95_concurrency Ã— 1.2 (20% headroom)
- [ ] For latency-sensitive applications: max_children = P99_concurrency Ã— 1.2
- [ ] For cost-optimized environments: max_children = P95_concurrency (no headroom, accept rare queueing)
- [ ] Cross-check with memory budget: max_children Ã— per_worker_RSS must be <= available RAM
- [ ] If memory budget cannot accommodate P95-based calculation, reduce workers or increase RAM
- [ ] If P95 and P99 are very different (ratio > 2), the traffic is highly variable â€” use higher percentile
- [ ] Monitor after deployment: if max_children_reached > 0, increase max_children
- [ ] Document the percentile-based calculation

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] OOM events can cause data corruption in applications without proper error handling
- [ ] A server under memory pressure (OOM or swapping) is vulnerable to denial of service
- [ ] Setting max_children correctly is a security control against resource exhaustion

# Reliability Checklist (from 04/05/06)
- [ ] **max_children exhaustion**: All workers busy, request queue grows. Symptom: FPM log "server reached pm.max_children setting". Nginx returns 502/504. Mitigation: Increase max_children, optimize response time, add more servers.
- [ ] **OOM killer**: Linux OOM killer terminates PHP-FPM workers. Symptom: dmesg "oom-killer" events, FPM logs SIGKILL. Mitigation: Reduce max_children, add RAM, enable swap.
- [ ] **Slow request cascade**: One slow request holds a worker, reducing capacity, causing queuing, which creates more slow requests (snowball effect). Symptom: Latency degrades non-linearly with traffic increase. Mitigation: Set request_terminate_timeout, enable slow log, identify bottleneck.
- [ ] **PHP-FPM master crash**: Master process dies due to bug or resource exhaustion. Symptom: All workers die, site down. Mitigation: systemd auto-restart, monitoring alert.
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.
- [ ] **Logging**: Enable slow log (equest_slowlog_timeout = 2, slowlog = /path). Configure catch_workers_output = yes to capture PHP errors.
- [ ] **Emergency restart**: Set emergency_restart_threshold = 3 and emergency_restart_interval = 60s to auto-recover from OpCache memory corruption.
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments â€” indicates pool exhaustion. Alert when listen queue consistently above 0.

# Testing Checklist (from 04/06)
- [ ] Worker RSS sampled over 24+ hours of production traffic
- [ ] P95 RSS calculated from samples (not average)
- [ ] Safety factor (1.2-1.5) applied in formula
- [ ] pm.max_children set to calculated value
- [ ] FPM status page confirms listen queue stays at 0 under peak
- [ ] Server maintains 10-20% free RAM under peak load
- [ ] Re-calibration scheduled quarterly
- [ ] max_children calculated from P95 (or selected percentile) concurrency
- [ ] Cross-checked against memory budget
- [ ] max_children_reached = 0 or acceptably rare
- [ ] Worker utilization optimized (not over-provisioned)
- [ ] Calculation documented with percentile data
- [ ] Request concurrency data collected over 7+ days
- [ ] P95, P99, max values calculated
- [ ] max_children calculated using selected percentile + headroom
- [ ] max_children_reached = 0 after deployment (or tracked and acceptable)

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use P95 RSS, not average**: Average-based sizing creates 30-50% oversubscription risk. P95-based sizing is the difference between a stable server and one that OOM-kills under peak load.
- [ ] **Apply a safety factor of 1.2-1.5**: Even P95 has variance. The safety factor provides headroom for page cache pressure, measurement error, and future growth.
- [ ] **Measure over 24 hours**: One hour may not capture peak memory usage. Sample over a full business cycle.
- [ ] **Re-calibrate quarterly**: Worker RSS changes with code, data size, and traffic patterns. Regular recalibration prevents drift.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using total_RAM / memory_limit
- [ ] Avoid: Using average RSS instead of P95
- [ ] Avoid: No safety factor
- [ ] Avoid: Setting once, never updating
- [ ] Avoid anti-pattern: **Setting max_children to the number of CPU cores**: FPM workers are memory-constrained, not CPU-constrained. The formula must use RAM, not cores.
- [ ] Avoid anti-pattern: **Maximizing max_children without monitoring**: Pushing max_children to the limit without status page monitoring risks silent OOM crashes.
- [ ] Avoid anti-pattern: **Using the same max_children for all pools**: Each application and traffic pattern has different RSS. Size per-pool independently.
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
- [ ] **Capacity alerts**: Alert when max_children_reached counter increments â€” indicates pool exhaustion. Alert when listen queue consistently above 0.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Average RSS trap**: Worker RSS varies significantly across requests. Memory-intensive pages (reports, admin dashboards) can consume 2-3x more RSS than average pages. Average-based sizing fails under concurrent memory-intensive requests., **P95 RSS collection**: Sample RSS across all workers over 1 hour of production traffic. Sort, discard top 5%. The 95th percentile value = P95 RSS. Formula: `max_children = (available_RAM / (P95_RSS Ã— safety_factor))`., **Safety factor rationale**: 1.2 for well-characterized workloads, 1.5 for variable workloads. Accounts for: 1) OS memory pressure from page cache growth, 2) burst memory allocation before OOM killer, 3) measurement sampling error.
**Skills:** Capacity Planning and Safety Margins, Pool Sizing Formula Rationale, CPU vs IO Bound Worker Ratios, FPM Status Page Monitoring
**Decision Trees:** pm.max_children value based on p95 concurrency
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Pool Sizing Formula, Worker RSS Capacity Ceiling, Capacity Planning Safety Margins, FPM Status Page Monitoring, CPU vs I/O Bound Worker Ratios

