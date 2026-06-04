# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** pm.max_requests Counteracts Memory Drift at Cost of Process Spawn Overhead
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **The real risk is memory drift, not spawn overhead**: Spawn overhead at 500 max_requests is <0.1% of CPU. The risk of memory exhaustion from drift is far greater.
- [ ] **Preloading reduces spawn cost significantly**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling nearly free.
- [ ] **Measure drift before tuning**: Compare worker RSS at spawn vs after max_requests. If growth > 20%, lower max_requests. If growth < 5%, you could raise max_requests.
- [ ] **Don't raise max_requests to "reduce overhead"**: The overhead is already negligible. Raising max_requests increases memory drift risk without meaningful benefit.
- [ ] pm.max_requests set to a value between 500-1000
- [ ] Memory drift measured (RSS at spawn vs after max_requests)
- [ ] Spawn overhead quantified and confirmed negligible
- [ ] Preloading evaluated for spawn cost reduction
- [ ] No use of pm.max_requests=0 in production
- [ ] Memory drift measured and documented
- [ ] pm.max_requests set to balance drift against recycling overhead
- [ ] Worker RSS stable with recycling (observed over 24 hours)
- [ ] Bootstrap amortization verified (recycling cost justified)
- [ ] Configuration documented with drift data
- [ ] Worker RSS baseline measured
- [ ] Memory drift per request calculated
- [ ] pm.max_requests set based on drift rate
- [ ] Bootstrap amortization verified (recycling not too frequent)
- [ ] Observed RSS stable after configuration
- [ ] No excessive recycling (max_requests too low)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Memory drift mechanics**: PHP's per-request allocator (Zend Memory Manager) uses a chunked allocator. Fragmented pages cannot be returned to the OS between requests.
- [ ] **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population (~5-50ms depending on preloading).
- [ ] **Overhead minimization strategies**: Preloading (50-80% spawn cost reduction), OpCache (reduces per-worker compilation), COW-friendly design (shares memory between forked workers).
- [ ] Document and follow through on architectural decision: pm.max_requests recycling threshold
- [ ] Ensure architecture aligns with core concept: **Memory drift mechanics**: PHP's per-request allocator leaves fragmented memory pages that the OS cannot reclaim. Over ~10,000 requests, RSS grows 1.5-2x.
- [ ] Ensure architecture aligns with core concept: **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading).
- [ ] Ensure architecture aligns with core concept: **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead = 100 workers Ã— (1 recycle / 500 requests) Ã— 30ms spawn cost = 6ms per 500 requests = 0.012ms per request. Negligible.
- [ ] Ensure architecture aligns with core concept: **Overhead minimization**: Preloading (reduces spawn cost by 50-80%), COW-friendly PHP compilation (OpCache reduces per-worker memory needs), and process-mode static (avoids spawn/waste contention).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **The real risk is memory drift, not spawn overhead**: Spawn overhead at 500 max_requests is <0.1% of CPU. The risk of memory exhaustion from drift is far greater.
- [ ] **Preloading reduces spawn cost significantly**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling nearly free.
- [ ] **Measure drift before tuning**: Compare worker RSS at spawn vs after max_requests. If growth > 20%, lower max_requests. If growth < 5%, you could raise max_requests.
- [ ] **Don't raise max_requests to "reduce overhead"**: The overhead is already negligible. Raising max_requests increases memory drift risk without meaningful benefit.
- [ ] Measure worker RSS immediately after start (post-first-request baseline)
- [ ] Measure worker RSS after 100, 500, 1000, and 2000 requests
- [ ] Calculate memory drift per request: (RSS_at_N - RSS_baseline) / N
- [ ] If drift < 1KB per request: memory is stable â€” set max_requests to 10000+
- [ ] If drift 1-10KB per request: moderate drift â€” set max_requests to 2000-5000
- [ ] If drift > 10KB per request: significant drift â€” set max_requests to 500-1000
- [ ] Calculate bootstrap amortization: max_requests Ã— bootstrap_savings_per_request â€” ensure this exceeds recycling cost
- [ ] Set pm.max_requests to the lower bound that balances drift against recycling overhead
- [ ] Monitor after change: verify RSS is stable with worker recycling
- [ ] Document the max_requests configuration and drift data

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Workers with high memory drift are more likely to be OOM-killed
- [ ] OOM events can cause data corruption in applications without proper error handling
- [ ] Residual memory from previous requests may contain sensitive data â€” recycling clears this
- [ ] Regular recycling is a security control against cross-request data leakage

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
- [ ] pm.max_requests set to a value between 500-1000
- [ ] Memory drift measured (RSS at spawn vs after max_requests)
- [ ] Spawn overhead quantified and confirmed negligible
- [ ] Preloading evaluated for spawn cost reduction
- [ ] No use of pm.max_requests=0 in production
- [ ] Drift measurement repeated after code changes
- [ ] Memory drift measured and documented
- [ ] pm.max_requests set to balance drift against recycling overhead
- [ ] Worker RSS stable with recycling (observed over 24 hours)
- [ ] Bootstrap amortization verified (recycling cost justified)
- [ ] Configuration documented with drift data
- [ ] Worker RSS baseline measured
- [ ] Memory drift per request calculated
- [ ] pm.max_requests set based on drift rate
- [ ] Bootstrap amortization verified (recycling not too frequent)
- [ ] Observed RSS stable after configuration
- [ ] No excessive recycling (max_requests too low)
- [ ] Configuration documented with rationale

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **The real risk is memory drift, not spawn overhead**: Spawn overhead at 500 max_requests is <0.1% of CPU. The risk of memory exhaustion from drift is far greater.
- [ ] **Preloading reduces spawn cost significantly**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling nearly free.
- [ ] **Measure drift before tuning**: Compare worker RSS at spawn vs after max_requests. If growth > 20%, lower max_requests. If growth < 5%, you could raise max_requests.
- [ ] **Don't raise max_requests to "reduce overhead"**: The overhead is already negligible. Raising max_requests increases memory drift risk without meaningful benefit.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Raising max_requests to "reduce overhead"
- [ ] Avoid: pm.max_requests=0 (unlimited)
- [ ] Avoid: Setting too low (100-200)
- [ ] Avoid: Not using preloading
- [ ] Avoid anti-pattern: **Optimizing spawn overhead at the expense of memory stability**: The overhead is negligible (<0.1% CPU). Memory drift is the real risk. Err on the side of lower max_requests.
- [ ] Avoid anti-pattern: **Not quantifying the tradeoff**: The quantified tradeoff (0.012ms/request at 500 max_requests) shows that spawn overhead is almost always worth accepting for memory stability.
- [ ] Avoid anti-pattern: **Ignoring preloading's impact on spawn cost**: Preloading dramatically reduces the cost of recycling. If spawn cost is a concern, implement preloading instead of raising max_requests.
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
**Core Concepts:** **Memory drift mechanics**: PHP's per-request allocator leaves fragmented memory pages that the OS cannot reclaim. Over ~10,000 requests, RSS grows 1.5-2x., **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading)., **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead = 100 workers Ã— (1 recycle / 500 requests) Ã— 30ms spawn cost = 6ms per 500 requests = 0.012ms per request. Negligible., **Overhead minimization**: Preloading (reduces spawn cost by 50-80%), COW-friendly PHP compilation (OpCache reduces per-worker memory needs), and process-mode static (avoids spawn/waste contention).
**Skills:** Memory Leak Detection Patterns, PM Max Requests Tuning, Worker RSS Capacity Ceiling
**Decision Trees:** pm.max_requests recycling threshold
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** PM Max Requests Tuning, Memory Drift Detection, Preloading Configuration, Worker RSS Capacity Ceiling, OpCache Configuration

