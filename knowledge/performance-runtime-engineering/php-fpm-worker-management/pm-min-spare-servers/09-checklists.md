# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP-FPM Worker Management
**Knowledge Unit:** PM Min Spare Servers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Set based on baseline traffic**: Calculate from average idle request rate during low-traffic periods. Formula: `min_spare = baseline_RPS Ã— avg_request_duration_seconds`.
- [ ] **Keep it low but safe**: 2-5 for most applications. Higher values (10-20) for high-traffic APIs with bursty patterns.
- [ ] **Never exceed pm.max_spare_servers**: `pm.min_spare_servers` must be less than `pm.max_spare_servers`. The gap between them defines the idle buffer range.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, `pm.min_spare_servers` may be too low for the traffic pattern.
- [ ] FPM configured to dynamic mode (pm = dynamic)
- [ ] pm.min_spare_servers set to appropriate value for traffic baseline
- [ ] pm.min_spare_servers < pm.max_spare_servers
- [ ] FPM status page showing idle processes consistently above min_spare
- [ ] No excessive spawn events in FPM error log during normal traffic
- [ ] No excessive spawn events in FPM log
- [ ] Idle worker count stays within min/max spare range
- [ ] No latency spikes from worker spawning
- [ ] Memory usage optimized for traffic pattern
- [ ] Configuration documented with rationale
- [ ] Low-traffic concurrency measured
- [ ] min_spare_servers set above low-traffic baseline
- [ ] max_spare_servers set for reasonable surplus
- [ ] start_servers set to midpoint
- [ ] Idle worker count stays within configured range
- [ ] Memory usage acceptable during low traffic

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Dynamic mode mechanics**: FPM master's event loop (`fpm_event_loop()`) evaluates idle count every second. When below `pm.min_spare_servers`, it spawns workers in batches (`pm.spawn_rate`, default 1 per second) to avoid thundering herd.
- [ ] **Spawn rate limiting**: The master spawns at most `pm.spawn_rate` workers per second (default 1). A large deficit between idle count and `pm.min_spare_servers` takes seconds to close â€” plan accordingly.
- [ ] **Ondemand vs Dynamic distinction**: Ondemand spawns on new connection (no idle pool). Dynamic maintains the idle pool. The choice depends on whether spawn latency is acceptable per-request or only during bursts.
- [ ] Document and follow through on architectural decision: pm.min_spare_servers value
- [ ] Ensure architecture aligns with core concept: **Dynamic mode relevance**: `pm.min_spare_servers` only applies when `pm = dynamic`. Static and ondemand modes ignore this setting entirely.
- [ ] Ensure architecture aligns with core concept: **Idle worker pool**: Workers spawned beyond current demand stay alive as idle processes. The FPM master monitors idle count and spawns new workers when it drops below `pm.min_spare_servers`.
- [ ] Ensure architecture aligns with core concept: **Spawn trigger**: When idle workers < `pm.min_spare_servers`, the master forks new workers (up to `pm.max_children`). Spawn latency is ~10-50ms per worker.
- [ ] Ensure architecture aligns with core concept: **Relationship with pm.max_spare_servers**: `pm.min_spare_servers` defines the floor, `pm.max_spare_servers` defines the ceiling. Together they create a target idle range.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Set based on baseline traffic**: Calculate from average idle request rate during low-traffic periods. Formula: `min_spare = baseline_RPS Ã— avg_request_duration_seconds`.
- [ ] **Keep it low but safe**: 2-5 for most applications. Higher values (10-20) for high-traffic APIs with bursty patterns.
- [ ] **Never exceed pm.max_spare_servers**: `pm.min_spare_servers` must be less than `pm.max_spare_servers`. The gap between them defines the idle buffer range.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, `pm.min_spare_servers` may be too low for the traffic pattern.
- [ ] Determine typical idle request concurrency during low traffic (e.g., 5 concurrent requests)
- [ ] Set `pm.min_spare_servers` to this number + small buffer (e.g., 8-10)
- [ ] Determine the maximum comfortable surplus during normal traffic (e.g., 20-30% of max_children)
- [ ] Set `pm.max_spare_servers` to this number (e.g., 15-20)
- [ ] Set `pm.start_servers` to the midpoint between min and max spare (e.g., 12-15)
- [ ] Monitor FPM logs for spawn events: if "spawning child" appears frequently, min_spare is too low
- [ ] Monitor idle worker count: if it consistently exceeds max_spare, max_spare is too high
- [ ] Adjust: increase min_spare if traffic frequently exceeds it (causing spawn delays)
- [ ] Adjust: decrease max_spare if memory is constrained and idle workers waste RAM
- [ ] Document the spare server configuration and rationale

# Performance Checklist (from 04/06)
- [ ] Idle workers consume ~30-60 MB RSS each â€” each idle worker is committed RAM doing no work
- [ ] Spawn latency: 10-50ms per worker fork (memory allocation, extension initialization, OpCache warm)
- [ ] Overflow spawns during traffic spikes add latency to the requests that trigger them
- [ ] `pm.min_spare_servers` too low + traffic spike = listen queue buildup while workers spawn
- [ ] `pm.min_spare_servers` too high = wasted RAM that could serve other processes (database, Redis)
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Idle workers retain residual memory from previous requests â€” sensitive data may persist until overwritten
- [ ] Set `pm.max_requests` to recycle workers periodically, clearing residual memory
- [ ] In multi-tenant pools, ensure idle workers from one tenant don't leak data to the next

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] FPM configured to dynamic mode (pm = dynamic)
- [ ] pm.min_spare_servers set to appropriate value for traffic baseline
- [ ] pm.min_spare_servers < pm.max_spare_servers
- [ ] FPM status page showing idle processes consistently above min_spare
- [ ] No excessive spawn events in FPM error log during normal traffic
- [ ] Memory usage monitored â€” idle workers not consuming excessive RAM
- [ ] pm.max_requests configured to recycle workers and clear residual memory
- [ ] No excessive spawn events in FPM log
- [ ] Idle worker count stays within min/max spare range
- [ ] No latency spikes from worker spawning
- [ ] Memory usage optimized for traffic pattern
- [ ] Configuration documented with rationale
- [ ] Low-traffic concurrency measured
- [ ] min_spare_servers set above low-traffic baseline
- [ ] max_spare_servers set for reasonable surplus
- [ ] start_servers set to midpoint
- [ ] Idle worker count stays within configured range
- [ ] Memory usage acceptable during low traffic
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Set based on baseline traffic**: Calculate from average idle request rate during low-traffic periods. Formula: `min_spare = baseline_RPS Ã— avg_request_duration_seconds`.
- [ ] **Keep it low but safe**: 2-5 for most applications. Higher values (10-20) for high-traffic APIs with bursty patterns.
- [ ] **Never exceed pm.max_spare_servers**: `pm.min_spare_servers` must be less than `pm.max_spare_servers`. The gap between them defines the idle buffer range.
- [ ] **Monitor spawn events**: If the FPM log shows frequent "spawning child" messages, `pm.min_spare_servers` may be too low for the traffic pattern.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting min_spare equal to max_children
- [ ] Avoid: Setting min_spare higher than max_spare
- [ ] Avoid: Setting min_spare to 0
- [ ] Avoid: Ignoring spawn_rate interaction
- [ ] Avoid anti-pattern: **Setting min_spare equal to max_spare**: Creates a narrow target range â€” the master oscillates between spawning and killing workers as traffic fluctuates. Always maintain a buffer between min and max.
- [ ] Avoid anti-pattern: **Blindly copying values from tutorials**: Optimal `pm.min_spare_servers` depends on your traffic pattern, memory budget, and response times. Measure first, then set.
- [ ] Avoid anti-pattern: **Using dynamic mode with static-like min_spare**: If min_spare approaches max_children, you're simulating static mode with extra spawn overhead. Either switch to static or reduce min_spare.
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
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Dynamic mode relevance**: `pm.min_spare_servers` only applies when `pm = dynamic`. Static and ondemand modes ignore this setting entirely., **Idle worker pool**: Workers spawned beyond current demand stay alive as idle processes. The FPM master monitors idle count and spawns new workers when it drops below `pm.min_spare_servers`., **Spawn trigger**: When idle workers < `pm.min_spare_servers`, the master forks new workers (up to `pm.max_children`). Spawn latency is ~10-50ms per worker., **Relationship with pm.max_spare_servers**: `pm.min_spare_servers` defines the floor, `pm.max_spare_servers` defines the ceiling. Together they create a target idle range.
**Skills:** FPM Process Manager Mode Selection, Capacity Planning and Safety Margins, FPM Status Page Monitoring
**Decision Trees:** pm.min_spare_servers value
**Anti-Patterns:** pm.max_children Set Arbitrarily Without Calculation, Using Dynamic Process Manager for Consistent Workloads, pm.max_requests Too High - Memory Drift Unchecked, pm.min_spare_servers Too Low Causing Cold Requests, Ignoring pm.status_page in Production
**Related Topics:** PM Static Dynamic Ondemand, PM Max Children, PM Start Servers, PM Max Spare Servers, Pool Sizing Formula and Rationale

