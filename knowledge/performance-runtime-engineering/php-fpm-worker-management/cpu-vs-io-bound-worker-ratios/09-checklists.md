# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** CPU-Bound vs I/O-Bound Worker Ratios â€” 2-4/core vs 8-12/core
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Classify your workload first**: Run a request profile. If CPU utilization is 20% during peak load, the workload is I/O-bound. If CPU utilization is 90%+, it's CPU-bound.
- [ ] **Start conservative, then tune**: Begin with the mixed ratio (5-8/core). Measure throughput and latency. Increase or decrease based on CPU utilization.
- [ ] **Consider separate pools for different workloads**: If your application has both CPU-heavy (report generation) and I/O-heavy (API) endpoints, create separate pools with different ratios.
- [ ] **Don't exceed RAM budget**: The per-core ratio is a CPU consideration, but RAM is typically the binding constraint. The ratio must fit within the RAM budget.
- [ ] Workload classified (CPU-bound, I/O-bound, or mixed)
- [ ] CPU utilization measured during peak load for classification
- [ ] Worker ratio selected based on classification (2-4, 5-8, or 8-12 per core)
- [ ] Ratio validated against RAM budget (P95 RSS calculation)
- [ ] Throughput measured at different worker counts to find optimal
- [ ] Workload classified as CPU-bound, I/O-bound, or mixed
- [ ] Worker count matched to classification
- [ ] CPU utilization <80% at peak
- [ ] I/O subsystems not saturated
- [ ] Throughput optimized for the workload type
- [ ] CPU vs I/O wait time measured per request
- [ ] CPU utilization monitored (<80% target)
- [ ] I/O utilization monitored (database query time, external API)
- [ ] Worker count adjusted based on monitoring
- [ ] Classification documented
- [ ] **Status page**: Enable pm.status_path = /status in pool config. Monitor: ctive processes, idle processes, listen queue, max children reached, slow requests.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Workload classification**: Measure CPU utilization during peak load. <50% = I/O-bound, >70% = CPU-bound, 50-70% = mixed.
- [ ] **More workers for I/O-bound**: When workers block on I/O, additional workers can use the CPU during wait time. The optimal ratio is bounded by RAM.
- [ ] **Fewer workers for CPU-bound**: Beyond core count, additional workers add context switching overhead without throughput gain.
- [ ] Document and follow through on architectural decision: Worker count based on CPU vs IO profile
- [ ] Ensure architecture aligns with core concept: **CPU-bound ratio (2-4/core)**: Each worker keeps the CPU busy. More workers than cores causes context switching overhead without throughput gain. Example: image processing, PDF generation, encryption.
- [ ] Ensure architecture aligns with core concept: **I/O-bound ratio (8-12/core)**: Workers block on I/O (database queries, HTTP calls). While one worker waits, other workers can use the CPU. Higher worker counts maximize CPU utilization during I/O wait.
- [ ] Ensure architecture aligns with core concept: **Mixed workloads**: Start at 5-8 per core. Profile to determine whether CPU or I/O wait dominates. Adjust based on actual utilization patterns.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Classify your workload first**: Run a request profile. If CPU utilization is 20% during peak load, the workload is I/O-bound. If CPU utilization is 90%+, it's CPU-bound.
- [ ] **Start conservative, then tune**: Begin with the mixed ratio (5-8/core). Measure throughput and latency. Increase or decrease based on CPU utilization.
- [ ] **Consider separate pools for different workloads**: If your application has both CPU-heavy (report generation) and I/O-heavy (API) endpoints, create separate pools with different ratios.
- [ ] **Don't exceed RAM budget**: The per-core ratio is a CPU consideration, but RAM is typically the binding constraint. The ratio must fit within the RAM budget.
- [ ] Profile a representative sample of requests: measure total wall time and CPU time
- [ ] Calculate I/O wait: wall time - CPU time
- [ ] If I/O wait > 50% of wall time: the workload is I/O-bound â€” increasing workers improves throughput up to the I/O subsystem capacity
- [ ] If CPU time > 50% of wall time: the workload is CPU-bound â€” increasing workers may degrade performance (CPU contention)
- [ ] For I/O-bound workloads: worker count can approach the calculated max from capacity planning (workers spend most time waiting)
- [ ] For CPU-bound workloads: worker count should be limited to CPU core count + small buffer (1-2 extra)
- [ ] For mixed workloads: find the balance â€” start with 2x CPU core count and adjust based on utilization
- [ ] Monitor CPU utilization: if >80% with workers waiting for CPU, reduce worker count
- [ ] Monitor I/O utilization: if I/O is saturated, reduce workers or optimize queries
- [ ] Document the workload classification and worker ratio

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Over-provisioning workers (too many) caused OOM kills from memory exhaustion
- [ ] Under-provisioning workers (too few) causes request queuing and timeouts
- [ ] Workload classification helps prevent both scenarios
- [ ] CPU-bound workloads with too many workers may experience degraded performance but not security failures

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
- [ ] Workload classified (CPU-bound, I/O-bound, or mixed)
- [ ] CPU utilization measured during peak load for classification
- [ ] Worker ratio selected based on classification (2-4, 5-8, or 8-12 per core)
- [ ] Ratio validated against RAM budget (P95 RSS calculation)
- [ ] Throughput measured at different worker counts to find optimal
- [ ] Re-classification scheduled quarterly
- [ ] Workload classified as CPU-bound, I/O-bound, or mixed
- [ ] Worker count matched to classification
- [ ] CPU utilization <80% at peak
- [ ] I/O subsystems not saturated
- [ ] Throughput optimized for the workload type
- [ ] CPU vs I/O wait time measured per request
- [ ] CPU utilization monitored (<80% target)
- [ ] I/O utilization monitored (database query time, external API)
- [ ] Worker count adjusted based on monitoring
- [ ] Classification documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Classify your workload first**: Run a request profile. If CPU utilization is 20% during peak load, the workload is I/O-bound. If CPU utilization is 90%+, it's CPU-bound.
- [ ] **Start conservative, then tune**: Begin with the mixed ratio (5-8/core). Measure throughput and latency. Increase or decrease based on CPU utilization.
- [ ] **Consider separate pools for different workloads**: If your application has both CPU-heavy (report generation) and I/O-heavy (API) endpoints, create separate pools with different ratios.
- [ ] **Don't exceed RAM budget**: The per-core ratio is a CPU consideration, but RAM is typically the binding constraint. The ratio must fit within the RAM budget.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming "more workers = more throughput"
- [ ] Avoid: Using CPU ratios without RAM check
- [ ] Avoid: One ratio for all workloads
- [ ] Avoid: Setting ratio once, never updating
- [ ] Avoid anti-pattern: **Using CPU-core-based max_children without RAM check**: RAM is typically the binding constraint. Always calculate the RAM ceiling first, then apply the ratio within that ceiling.
- [ ] Avoid anti-pattern: **Assuming static workload**: Adding caching, upgrading database, or changing API patterns changes the I/O profile. Re-classify after significant changes.
- [ ] Avoid anti-pattern: **Same ratio for all pools**: Different applications have different workload profiles. Size per-pool independently.
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
**Core Concepts:** **CPU-bound ratio (2-4/core)**: Each worker keeps the CPU busy. More workers than cores causes context switching overhead without throughput gain. Example: image processing, PDF generation, encryption., **I/O-bound ratio (8-12/core)**: Workers block on I/O (database queries, HTTP calls). While one worker waits, other workers can use the CPU. Higher worker counts maximize CPU utilization during I/O wait., **Mixed workloads**: Start at 5-8 per core. Profile to determine whether CPU or I/O wait dominates. Adjust based on actual utilization patterns.
**Skills:** Capacity Planning and Safety Margins, Pool Sizing Formula Rationale, PM Max Children P95 Calculation
**Decision Trees:** Worker count based on CPU vs IO profile
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Pool Sizing Formula, Worker RSS Capacity Ceiling, Capacity Planning Safety Margins, Bottleneck Optimization Strategy, FPM Status Page Monitoring

