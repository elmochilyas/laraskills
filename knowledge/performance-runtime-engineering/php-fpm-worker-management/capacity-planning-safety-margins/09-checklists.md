# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Capacity Planning â€” pm.max_children Ã— P95 RSS Ã— Safety Factor = Available RAM
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use a safety factor of 1.2-1.5**: The safety factor is not optional. It accounts for real-world variance that static formulas miss.
- [ ] **Include database connection budgeting**: max_children Ã— connections_per_request must fit within database max_connections. This is often the binding constraint.
- [ ] **Plan for growth**: Apply a future growth buffer (1.05-1.1) within the safety factor. A server at 95% capacity during normal operation has no room for traffic spikes.
- [ ] **Review quarterly**: Worker RSS, traffic patterns, and code all change. Recalculate capacity quarterly.
- [ ] Safety factor (1.2-1.5) applied in capacity calculation
- [ ] Database max_connections checked and budgeted
- [ ] P95 RSS used (not average)
- [ ] Available RAM calculated after reserving for all non-FPM services
- [ ] Capacity reviewed quarterly
- [ ] pm.max_children calculated with safety margin
- [ ] No worker spawning events during steady-state traffic
- [ ] Server does not swap at peak traffic
- [ ] 70-80% worker utilization at peak
- [ ] Calculation documented with all assumptions
- [ ] Worker RSS measured at idle and peak
- [ ] Total RAM budget calculated (minus non-FPM processes)
- [ ] Safety margin applied based on traffic predictability
- [ ] pm.max_children set to calculated value
- [ ] No worker spawning events in steady state
- [ ] Server does not swap during peak traffic

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Capacity planning spreadsheet**: Row 1: total_RAM, Row 2: OS_reserve, Row 3: DB_reserve, Row 4: cache_reserve, Row 5: available_RAM (R1-R2-R3-R4), Row 6: P95_RSS, Row 7: safety_factor, Row 8: max_children (R5/(R6Ã—R7)).
- [ ] **Database connection budgeting**: max_children Ã— peak_connections_per_request = DB_max_connections Ã— 0.8. The 0.8 factor reserves 20% for administrative connections and background jobs.
- [ ] Document and follow through on architectural decision: Worker count safety margin calculation
- [ ] Document and follow through on architectural decision: Over-provisioning vs under-provisioning
- [ ] Ensure architecture aligns with core concept: **Capacity formula**: `max_children = floor(available_RAM / (P95_RSS Ã— safety_factor))` â€” produces a conservative, production-safe value.
- [ ] Ensure architecture aligns with core concept: **P95 RSS measurement**: Sample worker RSS every 10s for 24h of production traffic, sort, take 95th percentile. Repeat quarterly or after major code changes.
- [ ] Ensure architecture aligns with core concept: **Safety factor components**: 1.1 for page cache pressure, 1.05 for measurement error, 1.05 for future growth buffer = ~1.2 minimum. 1.5 for workloads with high RSS variance.
- [ ] Ensure architecture aligns with core concept: **Database connection budgeting**: max_children Ã— connections_per_request must not exceed database max_connections. At 50 children Ã— 2 DB connections = 100 DB connections needed.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use a safety factor of 1.2-1.5**: The safety factor is not optional. It accounts for real-world variance that static formulas miss.
- [ ] **Include database connection budgeting**: max_children Ã— connections_per_request must fit within database max_connections. This is often the binding constraint.
- [ ] **Plan for growth**: Apply a future growth buffer (1.05-1.1) within the safety factor. A server at 95% capacity during normal operation has no room for traffic spikes.
- [ ] **Review quarterly**: Worker RSS, traffic patterns, and code all change. Recalculate capacity quarterly.
- [ ] Measure baseline: average worker RSS at idle (after processing a request) and at peak (during request)
- [ ] Calculate per-worker memory budget: worker RSS + headroom (typically 10MB per worker for temporary allocations)
- [ ] Calculate max workers with safety: (total_RAM_for_FPM / per_worker_memory) * (1 - safety_margin)
- [ ] Apply safety margin: 20% for predictable traffic, 30% for variable traffic, 50% for burst-prone traffic
- [ ] Round down to the nearest reasonable number
- [ ] Set `pm.max_children` to the calculated value
- [ ] For dynamic mode: set `pm.start_servers` to 25-50% of max_children
- [ ] For static mode: set `pm.max_children` = calculated value (all workers always exist)
- [ ] Monitor after deployment: if workers are always busy (spawning events in logs), recalculate
- [ ] Document the calculation with assumptions

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] OOM events can cause data corruption in applications without proper error handling
- [ ] Proper capacity planning is a security control against resource exhaustion
- [ ] Database connection exhaustion is a denial-of-service risk â€” budget connections carefully
- [ ] Safety margins protect against traffic spikes that could otherwise overwhelm the server

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
- [ ] Safety factor (1.2-1.5) applied in capacity calculation
- [ ] Database max_connections checked and budgeted
- [ ] P95 RSS used (not average)
- [ ] Available RAM calculated after reserving for all non-FPM services
- [ ] Capacity reviewed quarterly
- [ ] Growth buffer included in planning
- [ ] Monitoring confirms <85% RAM usage under peak load
- [ ] pm.max_children calculated with safety margin
- [ ] No worker spawning events during steady-state traffic
- [ ] Server does not swap at peak traffic
- [ ] 70-80% worker utilization at peak
- [ ] Calculation documented with all assumptions
- [ ] Worker RSS measured at idle and peak
- [ ] Total RAM budget calculated (minus non-FPM processes)
- [ ] Safety margin applied based on traffic predictability
- [ ] pm.max_children set to calculated value
- [ ] No worker spawning events in steady state
- [ ] Server does not swap during peak traffic
- [ ] Calculation documented with assumptions

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use a safety factor of 1.2-1.5**: The safety factor is not optional. It accounts for real-world variance that static formulas miss.
- [ ] **Include database connection budgeting**: max_children Ã— connections_per_request must fit within database max_connections. This is often the binding constraint.
- [ ] **Plan for growth**: Apply a future growth buffer (1.05-1.1) within the safety factor. A server at 95% capacity during normal operation has no room for traffic spikes.
- [ ] **Review quarterly**: Worker RSS, traffic patterns, and code all change. Recalculate capacity quarterly.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring database max_connections
- [ ] Avoid: No safety factor
- [ ] Avoid: Using average RSS
- [ ] Avoid: One-time planning
- [ ] Avoid anti-pattern: **Sizing for average load**: Capacity must handle peak load, not average. Use P95 RSS and peak traffic estimates.
- [ ] Avoid anti-pattern: **Ignoring the database ceiling**: The RAM formula may suggest 100 workers, but the database can only handle 50 connections. The lower value wins.
- [ ] Avoid anti-pattern: **Zero safety margin**: Every percentage point of RAM used above 85% increases OOM risk non-linearly. The safety factor is essential.
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
**Core Concepts:** **Capacity formula**: `max_children = floor(available_RAM / (P95_RSS Ã— safety_factor))` â€” produces a conservative, production-safe value., **P95 RSS measurement**: Sample worker RSS every 10s for 24h of production traffic, sort, take 95th percentile. Repeat quarterly or after major code changes., **Safety factor components**: 1.1 for page cache pressure, 1.05 for measurement error, 1.05 for future growth buffer = ~1.2 minimum. 1.5 for workloads with high RSS variance., **Database connection budgeting**: max_children Ã— connections_per_request must not exceed database max_connections. At 50 children Ã— 2 DB connections = 100 DB connections needed.
**Skills:** PM Max Children P95 Calculation, Worker RSS Capacity Ceiling, Pool Sizing Formula Rationale, CPU vs IO Bound Worker Ratios
**Decision Trees:** Worker count safety margin calculation, Over-provisioning vs under-provisioning
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** PM Max Children P95 Calculation, Pool Sizing Formula, Worker RSS Capacity Ceiling, CPU vs I/O Bound Worker Ratios, Database Connection Management

