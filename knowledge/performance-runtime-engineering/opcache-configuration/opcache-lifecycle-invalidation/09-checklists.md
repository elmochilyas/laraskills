# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Lifecycle and Invalidation â€” opcache_reset(), opcache_invalidate(), PHP-FPM Graceful Reload
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Implement deployment script with opcache_reset().
- [ ] Verify cache warmup after reset.
- [ ] Test PHP-FPM graceful reload.
- [ ] Document invalidation procedure for your deployment.
- [ ] Monitor first-request latency after invalidation.
- [ ] OpCache lifecycle stages understood and managed
- [ ] Deployment pipeline includes appropriate invalidation steps
- [ ] Population stage managed with warm-up
- [ ] Monitoring detects lifecycle transitions (eviction, low hit rate)
- [ ] Preloading changes handled with full restart
- [ ] Current lifecycle stage identified
- [ ] Population stage management (warm-up) configured
- [ ] Steady state monitoring in place
- [ ] Eviction detection with alert configured
- [ ] Deployment pipeline includes appropriate invalidation
- [ ] Preloading change procedure documented (full restart required)
- [ ] Container deployment lifecycle managed
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] opcache_reset() marks all cached entries as stale, not deallocates memory immediately.
- [ ] preloading scripts re-execute on PHP-FPM restart, not on opcache_reset().
- [ ] file cache requires separate invalidation (delete directory contents).
- [ ] Document and follow through on architectural decision: Cache invalidation method after deployment
- [ ] Document and follow through on architectural decision: opcache_reset() vs PHP-FPM reload for specific scenarios
- [ ] Ensure architecture aligns with core concept: opcache_reset(): Atomically clears entire OpCache. All files recompiled on next access. Must be called on every PHP-FPM worker (or via web endpoint). Executes in <1ms.
- [ ] Ensure architecture aligns with core concept: opcache_invalidate($filepath): Removes specific file from cache. Used during development or partial deployments.
- [ ] Ensure architecture aligns with core concept: PHP-FPM graceful reload: kill -USR2 <master_pid> or systemctl reload php8.x-fpm. Master restarts workers one-by-one. Each new worker has empty OpCache.
- [ ] Ensure architecture aligns with core concept: opcache.file_cache invalidation: Both memory and file cache must be invalidated. File cache requires deleting cache files.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify the current lifecycle stage: population (hit rate climbing), steady state (hit rate >99%), or eviction (hit rate dropping)
- [ ] For population stage (post-deployment or reset): warm the cache using warm-up requests before accepting traffic
- [ ] For steady state: ensure monitoring detects when hit rate drops below 99%
- [ ] For eviction (cache_full): increase memory_consumption by 50% and restart PHP-FPM to reset
- [ ] For planned deployments: use validate_timestamps=0 with explicit opcache_reset() in deployment pipeline
- [ ] For unplanned invalidation (opcache_reset() during traffic): expect 30-120 seconds of increased latency as cache repopulates
- [ ] For preloading changes: note that opcache_reset() does not invalidate preloaded classes â€” full PHP-FPM restart required
- [ ] In containerized environments: each new container starts in population stage â€” use file cache and warm-up to accelerate
- [ ] Document the lifecycle management procedure for the team

# Performance Checklist (from 04/06)
- [ ] opcache_reset() is nearly instantaneous (<1ms). The cost is recompilation of files on subsequent requests.
- [ ] First request after reset: 2-5s for large applications if preloading is not used.
- [ ] Preloaded classes are NOT affected by opcache_reset(). Must restart PHP-FPM to refresh preloaded classes.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] opcache_reset() should be restricted to admin-level access only.
- [ ] Never expose opcache_reset() via public web endpoint without authentication.

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
- [ ] Implement deployment script with opcache_reset().
- [ ] Verify cache warmup after reset.
- [ ] Test PHP-FPM graceful reload.
- [ ] Document invalidation procedure for your deployment.
- [ ] Monitor first-request latency after invalidation.
- [ ] OpCache lifecycle stages understood and managed
- [ ] Deployment pipeline includes appropriate invalidation steps
- [ ] Population stage managed with warm-up
- [ ] Monitoring detects lifecycle transitions (eviction, low hit rate)
- [ ] Preloading changes handled with full restart
- [ ] Current lifecycle stage identified
- [ ] Population stage management (warm-up) configured
- [ ] Steady state monitoring in place
- [ ] Eviction detection with alert configured
- [ ] Deployment pipeline includes appropriate invalidation
- [ ] Preloading change procedure documented (full restart required)
- [ ] Container deployment lifecycle managed

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: opcache_reset() without warming
- [ ] Avoid: Not restarting PHP-FPM when preloading changes
- [ ] Avoid anti-pattern: Calling opcache_reset() on every deployment without warming: Creates latency spikes.
- [ ] Avoid anti-pattern: Relying on opcache_reset() to clear preloaded classes: Use PHP-FPM restart instead.
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
**Core Concepts:** opcache_reset(): Atomically clears entire OpCache. All files recompiled on next access. Must be called on every PHP-FPM worker (or via web endpoint). Executes in <1ms., opcache_invalidate($filepath): Removes specific file from cache. Used during development or partial deployments., PHP-FPM graceful reload: kill -USR2 <master_pid> or systemctl reload php8.x-fpm. Master restarts workers one-by-one. Each new worker has empty OpCache., opcache.file_cache invalidation: Both memory and file cache must be invalidated. File cache requires deleting cache files.
**Skills:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, Preloading Update Procedure, CI/CD Cache Invalidation Steps
**Decision Trees:** Cache invalidation method after deployment, opcache_reset() vs PHP-FPM reload for specific scenarios
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** PHP-FPM Graceful Reload Patterns, OpCache Reset Strategies, Deployment Cache Invalidation

