# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Inheritance Cache Deep Dive â€” Class Hierarchy Pre-Resolution, Method Table Caching
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify PHP version is 8.1 or later.
- [ ] Confirm OpCache is enabled.
- [ ] Check that inheritance cache is active via phpinfo().
- [ ] Benchmark class-loading time before/after upgrade.
- [ ] Monitor OpCache hit rate to ensure no under-provisioning.
- [ ] PHP 8.1+ confirmed with inheritance cache active
- [ ] OpCache memory sized to accommodate inheritance cache overhead
- [ ] Class resolution benefit documented
- [ ] No regressions from increased memory usage
- [ ] PHP version >= 8.1 confirmed
- [ ] Inheritance cache active (automatic check)
- [ ] Class resolution overhead measured (if profiling available)
- [ ] Benefit documented for the team
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Automatic enablement: Inheritance cache is on by default in PHP 8.1+. No php.ini directive to tune.
- [ ] Memory impact: Each cached method table adds ~200-500 bytes per class to the cached opcode size.
- [ ] Composability: Works transparently with preloading, OpCache file cache, and JIT compilation.
- [ ] Document and follow through on architectural decision: Inheritance cache configuration
- [ ] Ensure architecture aligns with core concept: Inheritance resolution cost: Without inheritance cache, each class load requires walking the parent chain to build the method table. For deep hierarchies (Laravel's 5-7 level deep class trees), this costs 1-3ms per class.
- [ ] Ensure architecture aligns with core concept: Inheritance cache mechanism: OpCache pre-computes the method table during compilation and stores it alongside the opcodes.
- [ ] Ensure architecture aligns with core concept: Enabled by default: opcache.inheritance_cache=1 in PHP 8.1+. No configuration needed.
- [ ] Ensure architecture aligns with core concept: Benefit scaling: Most impactful for applications with deep inheritance hierarchies.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Verify PHP version >= 8.1: `php -v | grep "^PHP"`
- [ ] Confirm inheritance cache is active (automatic in PHP 8.1+, no configuration needed) â€” check via `opcache_get_status()`
- [ ] Profile a request and measure time spent in autoloading/class resolution before and after inheritance cache benefit
- [ ] Compare class resolution overhead between PHP 8.0 (no inheritance cache) and PHP 8.1+ (with inheritance cache)
- [ ] The inheritance cache reduces class hierarchy resolution by ~80% in framework applications
- [ ] Ensure OpCache memory_consumption is adequate â€” inheritance cache uses additional shared memory
- [ ] If memory usage increased after PHP 8.1+ upgrade, the inheritance cache is one cause â€” size memory accordingly
- [ ] Document that inheritance cache is enabled and its expected benefit

# Performance Checklist (from 04/06)
- [ ] Reduces class-loading time by 40-60% for framework classes.
- [ ] Most impactful for applications with deep inheritance hierarchies.
- [ ] Benefit scales with number of classes.
- [ ] Works transparently with preloading.
- [ ] Each cached method table adds marginal memory overhead to OpCache consumption.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications. Inheritance cache only affects class loading performance, not behavior.
- [ ] As with all OpCache features, ensure the OpCache shared memory is not accessible to untrusted processes.

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
- [ ] Verify PHP version is 8.1 or later.
- [ ] Confirm OpCache is enabled.
- [ ] Check that inheritance cache is active via phpinfo().
- [ ] Benchmark class-loading time before/after upgrade.
- [ ] Monitor OpCache hit rate to ensure no under-provisioning.
- [ ] PHP 8.1+ confirmed with inheritance cache active
- [ ] OpCache memory sized to accommodate inheritance cache overhead
- [ ] Class resolution benefit documented
- [ ] No regressions from increased memory usage
- [ ] PHP version >= 8.1 confirmed
- [ ] Inheritance cache active (automatic check)
- [ ] Class resolution overhead measured (if profiling available)
- [ ] Benefit documented for the team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Disabling OpCache thinking inheritance cache causes issues
- [ ] Avoid anti-pattern: Manually disabling inheritance cache: There is no setting to disable it separately, and no reason to do so.
- [ ] Avoid anti-pattern: Counting on inheritance cache without OpCache: Enable OpCache first; inheritance cache is a bonus on top.
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
**Core Concepts:** Inheritance resolution cost: Without inheritance cache, each class load requires walking the parent chain to build the method table. For deep hierarchies (Laravel's 5-7 level deep class trees), this costs 1-3ms per class., Inheritance cache mechanism: OpCache pre-computes the method table during compilation and stores it alongside the opcodes., Enabled by default: opcache.inheritance_cache=1 in PHP 8.1+. No configuration needed., Benefit scaling: Most impactful for applications with deep inheritance hierarchies.
**Skills:** OpCache Memory Sizing, PHP Version Upgrade Planning, OpCache Overview and Configuration
**Decision Trees:** Inheritance cache configuration
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Purpose and Mechanics, Preloading Script Design Patterns, OpCache Optimization Level Bitmask

