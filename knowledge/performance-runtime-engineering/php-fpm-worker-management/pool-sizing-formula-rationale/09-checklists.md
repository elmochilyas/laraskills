# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** Pool Sizing Formula â€” pm.max_children = (total_RAM - reserved) / avg_worker_RSS
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Reserve RAM for non-FPM services first**: OS, database, Redis, and other services need guaranteed memory. Calculate available RAM after subtracting these reservations.
- [ ] **Use P95 RSS, not average**: P95 RSS is typically 1.3-1.6x average. Using average creates 30-50% oversubscription risk.
- [ ] **Apply a safety factor**: Multiply available RAM by 0.7-0.8. This leaves headroom for page cache growth and unexpected spikes.
- [ ] **Verify with monitoring**: After setting max_children, monitor listen queue and free RAM under peak load. Adjust if needed.
- [ ] Total RAM known and documented
- [ ] Reserved RAM calculated (OS + database + Redis + other services)
- [ ] Worker RSS measured under realistic production load
- [ ] P95 RSS calculated (not average)
- [ ] Safety factor applied (1.2-1.5)
- [ ] Full pool sizing formula applied and documented
- [ ] All terms explained with measured or estimated values
- [ ] Cross-validated against traffic-based calculation
- [ ] No swap usage at peak traffic
- [ ] Formula assumptions documented for future review
- [ ] Total server RAM documented
- [ ] OS reservation calculated
- [ ] Other service RAM subtracted
- [ ] Per-worker RSS measured (idle and peak)
- [ ] Raw max_children calculated
- [ ] Safety margin applied

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Monitor-then-size workflow**: 1) Enable FPM status page, 2) Measure average and P95 worker RSS under peak load, 3) Calculate max_children, 4) Set pm.max_children, 5) Verify listen queue stays at 0 under peak.
- [ ] **The formula is a starting point**: Production traffic may exceed estimates. Always monitor and adjust.
- [ ] Document and follow through on architectural decision: Pool sizing formula
- [ ] Ensure architecture aligns with core concept: **Total RAM**: Physical memory (e.g., 16GB). Not burstable/swap â€” using swap degrades performance catastrophically.
- [ ] Ensure architecture aligns with core concept: **Reserved RAM**: OS (~1-2GB), database (InnoDB buffer pool size), Redis (maxmemory), other services. Typically 30-50% of total RAM.
- [ ] Ensure architecture aligns with core concept: **Worker RSS**: Measure via `ps --no-headers -o rss -C php-fpm | awk '{sum+=$1} END {print sum/NR/1024}'` (average RSS in MB).
- [ ] Ensure architecture aligns with core concept: **P95 RSS**: 95th percentile worker RSS â€” accounts for memory spikes. For FPM, P95 is typically 1.3-1.6x the average RSS.
- [ ] Ensure architecture aligns with core concept: **Safety factor**: Multiply available RAM by 0.7-0.8 to leave headroom for OS page cache and unexpected spikes.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Reserve RAM for non-FPM services first**: OS, database, Redis, and other services need guaranteed memory. Calculate available RAM after subtracting these reservations.
- [ ] **Use P95 RSS, not average**: P95 RSS is typically 1.3-1.6x average. Using average creates 30-50% oversubscription risk.
- [ ] **Apply a safety factor**: Multiply available RAM by 0.7-0.8. This leaves headroom for page cache growth and unexpected spikes.
- [ ] **Verify with monitoring**: After setting max_children, monitor listen queue and free RAM under peak load. Adjust if needed.
- [ ] Calculate total available RAM: total_RAM - OS_reserve - other_service_RAM
- [ ] Reserve for OS: 1-2GB depending on OS and monitoring agents
- [ ] Subtract other co-located services: database, Redis, web server, monitoring
- [ ] Measure per-worker RSS at idle (post-request) and at peak (during request)
- [ ] Use peak RSS for conservative sizing, or weighted average if peak is rare
- [ ] Calculate raw max_children: available_RAM / per_worker_RAM
- [ ] Apply safety margin: raw_value Ã— (1 - safety_margin) â€” typically 0.7-0.8
- [ ] Round down to the nearest reasonable number
- [ ] Validate against traffic-based calculation (P95 concurrency) â€” use the lower of the two
- [ ] Document the full formula with all terms explained

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Over-provisioning workers (too high max_children) causes OOM kills
- [ ] OOM events may lead to data corruption in applications without proper error handling
- [ ] Reserve adequate memory for system processes and security services (firewall, monitoring, logging)

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
- [ ] Total RAM known and documented
- [ ] Reserved RAM calculated (OS + database + Redis + other services)
- [ ] Worker RSS measured under realistic production load
- [ ] P95 RSS calculated (not average)
- [ ] Safety factor applied (1.2-1.5)
- [ ] pm.max_children set to calculated value
- [ ] Listen queue stays at 0 under peak load
- [ ] Free RAM stays above 15% under peak
- [ ] Full pool sizing formula applied and documented
- [ ] All terms explained with measured or estimated values
- [ ] Cross-validated against traffic-based calculation
- [ ] No swap usage at peak traffic
- [ ] Formula assumptions documented for future review
- [ ] Total server RAM documented
- [ ] OS reservation calculated
- [ ] Other service RAM subtracted
- [ ] Per-worker RSS measured (idle and peak)
- [ ] Raw max_children calculated
- [ ] Safety margin applied
- [ ] Cross-validated with traffic-based calculation
- [ ] Full formula documented with assumptions

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Reserve RAM for non-FPM services first**: OS, database, Redis, and other services need guaranteed memory. Calculate available RAM after subtracting these reservations.
- [ ] **Use P95 RSS, not average**: P95 RSS is typically 1.3-1.6x average. Using average creates 30-50% oversubscription risk.
- [ ] **Apply a safety factor**: Multiply available RAM by 0.7-0.8. This leaves headroom for page cache growth and unexpected spikes.
- [ ] **Verify with monitoring**: After setting max_children, monitor listen queue and free RAM under peak load. Adjust if needed.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Sizing by average RSS
- [ ] Avoid: Not reserving OS memory
- [ ] Avoid: Using total_RAM / memory_limit
- [ ] Avoid: Setting once, never updating
- [ ] Avoid anti-pattern: **Formula-only without monitoring**: The formula provides a safe starting point. Always verify with status page and free memory monitoring.
- [ ] Avoid anti-pattern: **Maximizing max_children**: The goal is adequate capacity, not maximum workers. More workers = more memory pressure.
- [ ] Avoid anti-pattern: **Ignoring database connections**: max_children Ã— connections_per_request must not exceed database max_connections.
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
**Core Concepts:** **Total RAM**: Physical memory (e.g., 16GB). Not burstable/swap â€” using swap degrades performance catastrophically., **Reserved RAM**: OS (~1-2GB), database (InnoDB buffer pool size), Redis (maxmemory), other services. Typically 30-50% of total RAM., **Worker RSS**: Measure via `ps --no-headers -o rss -C php-fpm | awk '{sum+=$1} END {print sum/NR/1024}'` (average RSS in MB)., **P95 RSS**: 95th percentile worker RSS â€” accounts for memory spikes. For FPM, P95 is typically 1.3-1.6x the average RSS., **Safety factor**: Multiply available RAM by 0.7-0.8 to leave headroom for OS page cache and unexpected spikes.
**Skills:** Capacity Planning and Safety Margins, PM Max Children P95 Calculation, Worker RSS Capacity Ceiling, CPU vs IO Bound Worker Ratios
**Decision Trees:** Pool sizing formula
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** PM Max Children P95 Calculation, Worker RSS Capacity Ceiling, Capacity Planning Safety Margins, FPM Status Page Monitoring, CPU vs I/O Bound Worker Ratios

