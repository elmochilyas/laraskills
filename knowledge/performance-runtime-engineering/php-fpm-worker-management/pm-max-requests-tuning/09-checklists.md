# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** PM Max Requests Tuning — Worker Recycling to Counteract Memory Drift
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Set a limit for all production deployments**: pm.max_requests=0 guarantees memory drift will eventually exhaust RAM. 500-1000 is the recommended starting range.
- [ ] **Detect drift before tuning**: Compare worker RSS at start (just spawned) vs after 500 requests. If growth > 20%, lower max_requests. If growth < 5%, raise max_requests.
- [ ] **Consider the spawn cost**: At pm.max_requests=500 with 100 workers, total spawn overhead = ~0.012ms per request â€” negligible. Don't fear recycling.
- [ ] **Preloading reduces spawn cost**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling less costly.
- [ ] pm.max_requests set to a value > 0 (never 0 in production)
- [ ] Initial setting in 500-1000 range
- [ ] Worker RSS drift measured (compare at spawn vs after max_requests)
- [ ] max_requests adjusted based on drift data
- [ ] Spawn overhead monitored and within acceptable range
- [ ] max_requests set within calculated bounds
- [ ] No worker OOM from memory drift
- [ ] Bootstrap overhead acceptable (<0.05ms per request)
- [ ] Worker RSS stable at recycling interval
- [ ] Configuration documented with drift data
- [ ] Memory drift per request measured
- [ ] Bootstrap overhead time measured
- [ ] Lower bound calculated (amortization requirement)
- [ ] Upper bound calculated (memory limit)
- [ ] max_requests set within bounds
- [ ] No worker OOM observed

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Static vs Dynamic vs Ondemand**: Static provides predictable latency and memory at the cost of always-on resource consumption. Dynamic adapts to traffic but introduces spawn latency during spikes. Ondemand maximizes memory efficiency but sacrifices consistency. For production APIs serving >100 req/s, static is preferred. For variable traffic with spare RAM, dynamic. For low-traffic or memory-constrained, ondemand.
- [ ] **Spawn cost components**: Fork (~5ms) + PHP bootstrap (~10-30ms) + OpCache population for first unique files (~5-50ms depending on preloading).
- [ ] **Quantified tradeoff**: At pm.max_requests=500 with 100 workers, each worker recycles every 500 requests. Total spawn overhead per request is negligible (<0.1% of CPU).
- [ ] **Low max_requests (100-200)**: High spawn overhead (~5-10% of total CPU). Only for leak-prone apps.
- [ ] **High max_requests (5000+)**: Risk of memory exhaustion if a leak exists. Only with monitoring proving no drift.
- [ ] Document and follow through on architectural decision: pm.max_requests value
- [ ] Ensure architecture aligns with core concept: **Memory drift**: PHP's allocator does not return all memory to the OS between requests. Small fragmentation accumulates. After ~10,000 requests, RSS can double.
- [ ] Ensure architecture aligns with core concept: **Recycling cost**: Killing and spawning a worker consumes ~10-50ms (process fork + PHP bootstrap). Too-frequent recycling wastes CPU on process management.
- [ ] Ensure architecture aligns with core concept: **Zero is never appropriate**: `pm.max_requests=0` (unlimited) guarantees memory drift will eventually exhaust RAM. Always set a limit.
- [ ] Ensure architecture aligns with core concept: **Tuning range**: 300-500 for memory-leak-prone apps (WordPress with plugins), 1000-2000 for well-behaved apps (Laravel), 5000+ only with monitoring proving no drift.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Set a limit for all production deployments**: pm.max_requests=0 guarantees memory drift will eventually exhaust RAM. 500-1000 is the recommended starting range.
- [ ] **Detect drift before tuning**: Compare worker RSS at start (just spawned) vs after 500 requests. If growth > 20%, lower max_requests. If growth < 5%, raise max_requests.
- [ ] **Consider the spawn cost**: At pm.max_requests=500 with 100 workers, total spawn overhead = ~0.012ms per request â€” negligible. Don't fear recycling.
- [ ] **Preloading reduces spawn cost**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling less costly.
- [ ] Measure worker RSS at start and after N requests to determine drift rate
- [ ] Calculate how many requests until worker RSS exceeds 80% of memory_limit â€” this is the upper bound for max_requests
- [ ] Calculate how many requests are needed to amortize bootstrap cost: cost / (bootstrap_time / request_time) â€” typically 50-100 requests
- [ ] Set max_requests to a value between lower bound (amortization) and upper bound (memory limit)
- [ ] Start with 1000 for most production workloads â€” balances drift and amortization
- [ ] If drift is high (>10KB/req), reduce to 500
- [ ] If drift is low (<1KB/req) and OpCache is stable, increase to 5000
- [ ] Never set below 500 for production â€” bootstrap cost becomes significant
- [ ] Monitor after setting: check for worker OOM or performance degradation before recycling
- [ ] Document the max_requests value and rationale

# Performance Checklist (from 04/06)
- [ ] Static PM
- [ ] Dynamic PM
- [ ] Ondemand PM
- [ ] Unix socket vs TCP

# Security Checklist (from 04/06 - only if relevant)
- [ ] Residual memory from previous requests may contain sensitive data â€” recycling clears this
- [ ] Workers that never recycle gradually accumulate data from all previous requests processed
- [ ] In multi-tenant environments, recycling is a security control against cross-tenant data leakage

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
- [ ] pm.max_requests set to a value > 0 (never 0 in production)
- [ ] Initial setting in 500-1000 range
- [ ] Worker RSS drift measured (compare at spawn vs after max_requests)
- [ ] max_requests adjusted based on drift data
- [ ] Spawn overhead monitored and within acceptable range
- [ ] Preloading evaluated to reduce spawn cost
- [ ] Setting reviewed after significant code changes
- [ ] max_requests set within calculated bounds
- [ ] No worker OOM from memory drift
- [ ] Bootstrap overhead acceptable (<0.05ms per request)
- [ ] Worker RSS stable at recycling interval
- [ ] Configuration documented with drift data
- [ ] Memory drift per request measured
- [ ] Bootstrap overhead time measured
- [ ] Lower bound calculated (amortization requirement)
- [ ] Upper bound calculated (memory limit)
- [ ] max_requests set within bounds
- [ ] No worker OOM observed
- [ ] Bootstrap overhead acceptable (amortized across worker lifetime)
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Set a limit for all production deployments**: pm.max_requests=0 guarantees memory drift will eventually exhaust RAM. 500-1000 is the recommended starting range.
- [ ] **Detect drift before tuning**: Compare worker RSS at start (just spawned) vs after 500 requests. If growth > 20%, lower max_requests. If growth < 5%, raise max_requests.
- [ ] **Consider the spawn cost**: At pm.max_requests=500 with 100 workers, total spawn overhead = ~0.012ms per request â€” negligible. Don't fear recycling.
- [ ] **Preloading reduces spawn cost**: With preloading, PHP bootstrap time drops by 50-80%, making more frequent recycling less costly.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: pm.max_requests=0 (unlimited)
- [ ] Avoid: Setting too low (100-200)
- [ ] Avoid: Raising to "reduce overhead"
- [ ] Avoid: Not adjusting by app type
- [ ] Avoid anti-pattern: **Setting max_requests=0 because "it's fine"**: Memory drift is gradual and invisible until servers start OOM-killing. Always set a limit.
- [ ] Avoid anti-pattern: **Copying values from tutorials without measurement**: Each application has different memory characteristics. Measure drift, then tune.
- [ ] Avoid anti-pattern: **Thinking recycling is free**: Each spawn costs CPU. Balance drift prevention against spawn overhead. But err on the side of lower max_requests.
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
**Core Concepts:** **Memory drift**: PHP's allocator does not return all memory to the OS between requests. Small fragmentation accumulates. After ~10,000 requests, RSS can double., **Recycling cost**: Killing and spawning a worker consumes ~10-50ms (process fork + PHP bootstrap). Too-frequent recycling wastes CPU on process management., **Zero is never appropriate**: `pm.max_requests=0` (unlimited) guarantees memory drift will eventually exhaust RAM. Always set a limit., **Tuning range**: 300-500 for memory-leak-prone apps (WordPress with plugins), 1000-2000 for well-behaved apps (Laravel), 5000+ only with monitoring proving no drift.
**Skills:** Memory Drift and Recycling Overhead, Worker RSS Capacity Ceiling, Memory Leak Detection Patterns
**Decision Trees:** pm.max_requests value
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** Memory Drift Detection and Mitigation, Worker RSS Capacity Ceiling, FPM Process Manager Modes, Preloading Configuration, FPM Status Page Monitoring


