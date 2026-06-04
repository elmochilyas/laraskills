# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Monitoring and Hit Rate Analysis â€” cache_full Detection, Waste Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Implement opcache_get_status() monitoring via FPM status endpoint.
- [ ] Set alert for hit_rate <99%.
- [ ] Set alert for cache_full=true.
- [ ] Set alert for wasted_percentage >5%.
- [ ] Verify monitoring after deployment and cache warmup.
- [ ] Hit rate monitoring implemented with dashboard and alerts
- [ ] Deployment-related dips distinguished from configuration issues
- [ ] Corrective actions defined for each hit rate threshold
- [ ] Monthly trend analysis identifies gradual degradation
- [ ] Hit rate data collected at regular intervals
- [ ] Baseline established (7-day rolling average)
- [ ] Alert thresholds configured
- [ ] Alert response procedure defined
- [ ] cache_full and memory metrics correlated with hit rate
- [ ] Monthly trend analysis reviewed
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Monitoring data available via opcache_get_status(false) - lightweight, no reset.
- [ ] FPM status endpoint can expose OpCache metrics.
- [ ] Integrate with Prometheus/node_exporter via custom exporter.
- [ ] Document and follow through on architectural decision: Whether OpCache is under-provisioned
- [ ] Document and follow through on architectural decision: What action to take based on monitoring data
- [ ] Ensure architecture aligns with core concept: opcache_get_status(): Returns array with opcache_enabled, cache_full, memory_usage, statistics (hits, misses, blacklist misses), interned_strings_usage.
- [ ] Ensure architecture aligns with core concept: Hit rate: hits / (hits + misses). Target >99%. Below 95% indicates severe under-provisioning.
- [ ] Ensure architecture aligns with core concept: cache_full flag: Set to true when max_accelerated_files exceeded. Requires OpCache reset to clear.
- [ ] Ensure architecture aligns with core concept: Wasted memory: Internal fragmentation from file updates (when validate_timestamps=1). Reset OpCache periodically to reclaim.
- [ ] Ensure architecture aligns with core concept: Blacklist misses: Files excluded from caching via opcache.blacklist. Minimize this list.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Collect hit rate data: `$status = opcache_get_status(false)['opcache_statistics']; $hitRate = $status['hit_rate'];` â€” run every 60 seconds from monitoring script
- [ ] Establish baseline hit rate: average over 7 days of steady-state operation (no deployments or changes)
- [ ] Set alert thresholds: warning at <95%, critical at <90%, based on baseline minus 3% for normal deployment dips
- [ ] When alert triggers, check: cache_full indicator, memory usage trend, recent deployments, file count changes
- [ ] If cache_full=true: increase memory_consumption by 50%
- [ ] If memory usage trend is rising but not full: plan memory increase at next maintenance window
- [ ] If recent deployment: hit rate dip is normal â€” wait 30-60 minutes for cache to repopulate
- [ ] If file count increased (new packages): recalculate max_accelerated_files and memory_consumption
- [ ] If hit rate does not recover after 60 minutes post-deployment: investigate configuration issues
- [ ] Document the hit rate investigation and resolution

# Performance Checklist (from 04/06)
- [ ] Every 1% decrease in hit rate increases CPU usage ~0.5-1%.
- [ ] file_cache reduces cold-start latency by 50-70% in containers.
- [ ] Preloading reduces per-request class loading time by 1-3ms.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] opcache_get_status() exposes internal memory layout. Restrict access in production.
- [ ] The FPM status page should be protected by authentication or IP restriction.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache full Ã¢â‚¬â€ no restart**: cache_full=true but wasted memory below max_wasted_percentage. Symptom: hit rate drops below 90%. Files recompile on every request. Mitigation: Increase memory_consumption or max_wasted_percentage.
- [ ] **OOM restart**: Memory allocation fails. Symptom: oom_restarts counter increments. Mitigation: Increase memory_consumption. Root cause: memory_consumption set too low for application size.
- [ ] **Hash collision thrashing**: max_accelerated_files too low. Symptom: hash_restarts counter increments. Files evicted and recompiled frequently. Mitigation: Increase max_accelerated_files to 1.5x total PHP file count.
- [ ] **Stale preloading**: Preloaded classes from old deployment survive opcache_reset(). Symptom: Mixed old/new class definitions. Mitigation: Always restart PHP-FPM when preloading script changes.
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Testing Checklist (from 04/06)
- [ ] Implement opcache_get_status() monitoring via FPM status endpoint.
- [ ] Set alert for hit_rate <99%.
- [ ] Set alert for cache_full=true.
- [ ] Set alert for wasted_percentage >5%.
- [ ] Verify monitoring after deployment and cache warmup.
- [ ] Document baseline hit rate for your application.
- [ ] Hit rate monitoring implemented with dashboard and alerts
- [ ] Deployment-related dips distinguished from configuration issues
- [ ] Corrective actions defined for each hit rate threshold
- [ ] Monthly trend analysis identifies gradual degradation
- [ ] Hit rate data collected at regular intervals
- [ ] Baseline established (7-day rolling average)
- [ ] Alert thresholds configured
- [ ] Alert response procedure defined
- [ ] cache_full and memory metrics correlated with hit rate
- [ ] Monthly trend analysis reviewed

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring cache_full
- [ ] Avoid anti-pattern: Only checking OpCache status during incidents: Should be continuous monitoring.
- [ ] Avoid anti-pattern: Looking at hits/misses without context: 90% hit rate on a busy server means thousands of compilations per second.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment
- [ ] OpCache memory sized for application
- [ ] Hit rate > 99% at steady state
- [ ] No cache full events
- [ ] Memory utilization monitored

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** opcache_get_status(): Returns array with opcache_enabled, cache_full, memory_usage, statistics (hits, misses, blacklist misses), interned_strings_usage., Hit rate: hits / (hits + misses). Target >99%. Below 95% indicates severe under-provisioning., cache_full flag: Set to true when max_accelerated_files exceeded. Requires OpCache reset to clear., Wasted memory: Internal fragmentation from file updates (when validate_timestamps=1). Reset OpCache periodically to reclaim., Blacklist misses: Files excluded from caching via opcache.blacklist. Minimize this list.
**Skills:** OpCache Lifecycle and Invalidation, OpCache Memory Sizing, OpCache Configuration Overview
**Decision Trees:** Whether OpCache is under-provisioned, What action to take based on monitoring data
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Sizing, Max Accelerated Files Calculation, OpCache File Cache and Container Cold Start

