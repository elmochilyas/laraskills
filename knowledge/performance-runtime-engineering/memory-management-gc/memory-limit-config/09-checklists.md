# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Memory Management & Garbage Collection
**Knowledge Unit:** # Memory Limit Configuration â€” memory_limit Directive, Per-Request vs Process Limits, pm.max_children Relationship
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify `memory_limit` is set in php.ini and FPM pool config.
- [ ] Calculate `pm.max_children` using P95 RSS from production monitoring data.
- [ ] Verify P95 RSS does not exceed 80% of memory_limit under peak load.
- [ ] Monitor swap usage â€” should be 0 at all times.
- [ ] Verify memory budget: total RAM > OS + services + (workers Ã— RSS Ã— safety_factor).
- [ ] memory_limit configured per workload type
- [ ] No OOM errors in production
- [ ] Octane worker memory calculated correctly
- [ ] Headroom maintained for peak usage
- [ ] Configuration documented per SAPI
- [ ] Peak memory usage measured for all critical endpoints
- [ ] memory_limit calculated with 50% headroom
- [ ] memory_limit configured per SAPI (web, CLI) if they differ
- [ ] Octane worker memory calculated from total RAM / worker count
- [ ] OOM errors eliminated after configuration
- [ ] Configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Total memory budget**: Total RAM = OS + services + (workers Ã— per-worker RSS Ã— safety factor). If the equation doesn't balance, reduce worker count or increase RAM.
- [ ] **Worker RSS baseline**: PHP-FPM: ~30â€“50MB per worker (includes framework). Octane: ~50â€“80MB per worker (higher due to persistent bootstrap). Grow up to 2Ã— baseline over worker lifetime.
- [ ] **Swap threshold**: When total memory exceeds physical RAM, swap is used. PHP performance degrades 10â€“100Ã— on swap. Never allocate more than 80% of physical RAM to PHP workers.
- [ ] **Container limits**: In Docker/K8s, set container memory limit to the per-worker budget Ã— max workers in the container. `memory_limit` should be â‰¤ container memory limit.
- [ ] **memory_limit vs PM limit**: `memory_limit` is a PHP internal limit. PM limits control process count. Both must be configured consistently â€” a worker within `pm.max_children` may still exceed `memory_limit` if limits are mismatched.
- [ ] Document and follow through on architectural decision: memory_limit value selection
- [ ] Ensure architecture aligns with core concept: **memory_limit**: PHP configuration directive. Hard limit on per-process memory allocation (including the Zend MM heap, extension allocations, and PHP internals). When exceeded, PHP throws a fatal error.
- [ ] Ensure architecture aligns with core concept: **Per-request (PHP-FPM)**: The limit applies to a single request. After the request, the heap is destroyed and memory is freed. A single request exceeding the limit throws Fatal Error.
- [ ] Ensure architecture aligns with core concept: **Per-worker (Octane)**: The limit applies to the worker process over its lifetime. Memory accumulates across requests. A worker that grows to exceed the limit is terminated.
- [ ] Ensure architecture aligns with core concept: **pm.max_children (PHP-FPM)**: Maximum number of PHP-FPM worker processes. Total memory = max_children Ã— per-worker memory (P95 RSS). Must be sized to fit within available RAM.
- [ ] Ensure architecture aligns with core concept: **Worker count (Octane)**: Number of persistent workers. Total memory = workers Ã— per-worker memory. Also limited by available RAM.
- [ ] Ensure architecture aligns with core concept: **Reserved memory**: System memory reserved for OS, database, Redis, Nginx, and other services. Not available for PHP workers.
- [ ] Ensure architecture aligns with core concept: **Safety factor**: Typically 1.2â€“1.5Ã— to account for RSS variance. Formula: `max_children = (total_RAM - reserved_RAM) / (P95_RSS Ã— safety_factor)`.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile all critical endpoints/scripts: capture `memory_get_usage(true)` at peak usage
- [ ] Identify the highest-memory endpoint and note its peak usage
- [ ] For web requests: set `memory_limit = peak_usage * 1.5` (50% headroom)
- [ ] For API endpoints (typically lower memory): use the same calculation but expect lower values
- [ ] For CLI scripts: set individually per script or use a higher global value
- [ ] For queue workers: set to handle the largest job + 50% headroom
- [ ] For Octane/Swoole workers: calculate per-worker limit = total_RAM / worker_count â€” they are persistent across requests
- [ ] Set the limit in php.ini or via `ini_set('memory_limit', '256M')` in specific scripts
- [ ] Monitor OOM errors after configuration change â€” adjust if errors persist
- [ ] Document the memory limit configuration per SAPI (web, CLI, phpdbg)

# Performance Checklist (from 04/06)
- [ ] Workers consuming 80% of `memory_limit`: performance is normal but there's no headroom for spikes. Increase limit or reduce worker count.
- [ ] Workers at `memory_limit`: PHP throws Fatal Error. The worker dies and restarts. Request fails with 500 error.
- [ ] Swap usage: even 1% swap usage degrades PHP performance significantly. Zend MM performs poorly on swap.
- [ ] Worker restart on memory limit: each restart costs ~200ms spawn overhead + bootstrap time. Frequent restarts degrade throughput.
- [ ] P95 RSS measurement: collect RSS samples over 24 hours under peak load. The P95 value is the 95th percentile â€” 5% of workers will exceed this.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Memory limit attacks: an attacker may craft requests that consume excessive memory, hitting `memory_limit` and causing denial of service. Protect with rate limiting and input validation.
- [ ] Pool isolation: in multi-tenant PHP-FPM, each pool should have its own `memory_limit` and `pm.max_children`. One tenant's memory leak should not affect others.
- [ ] Container security: set container memory limits that are slightly higher than PHP `memory_limit` to give PHP room for graceful error handling before OOM.
- [ ] Resource exhaustion: if a single request can allocate massive memory (e.g., large file upload, unvalidated array), limit the data size before PHP processes it.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Verify `memory_limit` is set in php.ini and FPM pool config.
- [ ] Calculate `pm.max_children` using P95 RSS from production monitoring data.
- [ ] Verify P95 RSS does not exceed 80% of memory_limit under peak load.
- [ ] Monitor swap usage â€” should be 0 at all times.
- [ ] Verify memory budget: total RAM > OS + services + (workers Ã— RSS Ã— safety_factor).
- [ ] Test a request that approaches memory_limit and verify Fatal Error is thrown.
- [ ] Document the memory budget calculation and periodic review process.
- [ ] memory_limit configured per workload type
- [ ] No OOM errors in production
- [ ] Octane worker memory calculated correctly
- [ ] Headroom maintained for peak usage
- [ ] Configuration documented per SAPI
- [ ] Peak memory usage measured for all critical endpoints
- [ ] memory_limit calculated with 50% headroom
- [ ] memory_limit configured per SAPI (web, CLI) if they differ
- [ ] Octane worker memory calculated from total RAM / worker count
- [ ] OOM errors eliminated after configuration
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting `memory_limit` to -1 (unlimited)
- [ ] Avoid: Calculating `max_children` from average RSS
- [ ] Avoid: Not reserving memory for system services
- [ ] Avoid: Setting pool memory_limit same as PHP-FPM global
- [ ] Avoid: Not monitoring RSS in Octane
- [ ] Avoid anti-pattern: **All-or-nothing memory config**: Setting `memory_limit` to -1 and hoping the OS handles it. The OS OOM killer is brutal â€” it kills processes without clean error handling.
- [ ] Avoid anti-pattern: **Copy-paste FPM settings to Octane**: Octane workers have persistent memory â€” set higher limits but also configure `max_requests`. FPM limits can be lower because memory resets per request.
- [ ] Avoid anti-pattern: **Ignoring RSS distribution**: If one worker grows faster than others, investigate that worker's request pattern. A specific endpoint may be the leak source.
- [ ] Avoid anti-pattern: **Setting memory_limit too tight**: A limit that's too low causes frequent worker deaths. Use monitoring data to set a limit that accommodates 99th percentile usage.
- [ ] Guard against anti-pattern: Ignoring zval Memory Overhead for Scalars vs Compounds
- [ ] Guard against anti-pattern: Copy-On-Write Violation - Unnecessary Array Duplication
- [ ] Guard against anti-pattern: Ignoring Cyclic Garbage Collection Overhead
- [ ] Guard against anti-pattern: Memory Leak in Long-Running Workers
- [ ] Guard against anti-pattern: Oversized Memory Limit Masking Waste

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
**Core Concepts:** **memory_limit**: PHP configuration directive. Hard limit on per-process memory allocation (including the Zend MM heap, extension allocations, and PHP internals). When exceeded, PHP throws a fatal error., **Per-request (PHP-FPM)**: The limit applies to a single request. After the request, the heap is destroyed and memory is freed. A single request exceeding the limit throws Fatal Error., **Per-worker (Octane)**: The limit applies to the worker process over its lifetime. Memory accumulates across requests. A worker that grows to exceed the limit is terminated., **pm.max_children (PHP-FPM)**: Maximum number of PHP-FPM worker processes. Total memory = max_children Ã— per-worker memory (P95 RSS). Must be sized to fit within available RAM., **Worker count (Octane)**: Number of persistent workers. Total memory = workers Ã— per-worker memory. Also limited by available RAM.
**Rules:**
- General: Use php_admin_value[memory_limit] Per Pool
**Skills:** PHP Memory Model, Memory Leak Detection Patterns, Octane Worker Configuration
**Decision Trees:** memory_limit value selection
**Anti-Patterns:** Ignoring zval Memory Overhead for Scalars vs Compounds, Copy-On-Write Violation - Unnecessary Array Duplication, Ignoring Cyclic Garbage Collection Overhead, Memory Leak in Long-Running Workers, Oversized Memory Limit Masking Waste
**Related Topics:** PHP Memory Model â€” Zend Engine Memory Manager, Memory Leak Detection, Efficient Data Structures, Octane Worker Configuration, PHP-FPM Pool Sizing

