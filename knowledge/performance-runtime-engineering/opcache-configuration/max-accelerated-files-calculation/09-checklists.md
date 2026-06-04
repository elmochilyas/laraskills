# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Max Accelerated Files Calculation â€” Hash Table Prime Number Rounding
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Count total PHP files in your project (including vendor).
- [ ] Set max_accelerated_files to 1.5x that count.
- [ ] Deploy and monitor opcache_get_status()['cache_full'].
- [ ] Verify hit rate >99% after cache warms up.
- [ ] max_accelerated_files calculated and configured correctly
- [ ] num_cached_keys < max_cached_keys verified
- [ ] Hit rate >99% maintained
- [ ] Headroom for growth ensured
- [ ] PHP file count accurately measured
- [ ] 1.5x headroom multiplier applied
- [ ] Value rounded to nearest valid prime
- [ ] php.ini updated with selected value
- [ ] PHP-FPM restarted
- [ ] num_cached_keys < max_cached_keys confirmed
- [ ] Calculation documented
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Prime number rounding: Values are rounded up to nearest prime: 10000->10007, 20000->20021, 40000->40009.
- [ ] Hash table sizing: Too-large values waste memory. Too-small values cause cache_full and eviction.
- [ ] Relationship to memory_consumption: Both must be sized together.
- [ ] Document and follow through on architectural decision: max_accelerated_files value
- [ ] Document and follow through on architectural decision: When to increase max_accelerated_files
- [ ] Ensure architecture aligns with core concept: File counting: find /path -name '*.php' | wc -l - count all PHP files including vendor.
- [ ] Ensure architecture aligns with core concept: Prime number rounding: Values like 10000, 20000, 40000 are rounded to the nearest prime internally.
- [ ] Ensure architecture aligns with core concept: Default value: 10000 (rounded to 10007) - sufficient for small apps but too low for Laravel/Symfony.
- [ ] Ensure architecture aligns with core concept: Common values: 20000 for medium apps, 40000 for large apps, 100000+ for monorepos.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Count total PHP files: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
- [ ] Multiply file count by 1.5 for headroom: `target = fileCount * 1.5`
- [ ] Round up to the nearest valid prime: if target <= 10000, use 10000; <= 20000 use 20000; <= 30000 use 30000; <= 40000 use 40000; <= 50000 use 50000; else use 100000
- [ ] For Laravel/Symfony (15K-30K app files + 5K-15K vendor = 20K-45K): use 30000 or 40000 or 50000
- [ ] For WordPress (5K-10K total): use 10000 or 20000
- [ ] For Magento (40K-60K total): use 100000
- [ ] Set the selected value in php.ini: `opcache.max_accelerated_files=40000`
- [ ] Restart PHP-FPM
- [ ] Verify after warm-up: check `opcache_get_status(false)['opcache_statistics']['num_cached_keys']` < `max_cached_keys`
- [ ] Document the calculation and selected value

# Performance Checklist (from 04/06)
- [ ] Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation.
- [ ] Too small memory_consumption causes eviction of frequently-used files.
- [ ] opcache.file_cache reduces cold-start latency by 50-70% in containerized environments.
- [ ] Preloading reduces per-request class loading time by 1-3ms.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications. Setting this too high only wastes shared memory.
- [ ] Ensure OpCache shared memory is not accessible to untrusted processes on multi-tenant systems.

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
- [ ] Count total PHP files in your project (including vendor).
- [ ] Set max_accelerated_files to 1.5x that count.
- [ ] Deploy and monitor opcache_get_status()['cache_full'].
- [ ] Verify hit rate >99% after cache warms up.
- [ ] max_accelerated_files calculated and configured correctly
- [ ] num_cached_keys < max_cached_keys verified
- [ ] Hit rate >99% maintained
- [ ] Headroom for growth ensured
- [ ] PHP file count accurately measured
- [ ] 1.5x headroom multiplier applied
- [ ] Value rounded to nearest valid prime
- [ ] php.ini updated with selected value
- [ ] PHP-FPM restarted
- [ ] num_cached_keys < max_cached_keys confirmed
- [ ] Calculation documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not counting vendor files
- [ ] Avoid: Setting max_accelerated_files too low
- [ ] Avoid anti-pattern: Setting max_accelerated_files to an arbitrarily high value: Wastes shared memory without benefit.
- [ ] Avoid anti-pattern: Ignoring cache_full after deployment: Monitor and alert on this metric.
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
**Core Concepts:** File counting: find /path -name '*.php' | wc -l - count all PHP files including vendor., Prime number rounding: Values like 10000, 20000, 40000 are rounded to the nearest prime internally., Default value: 10000 (rounded to 10007) - sufficient for small apps but too low for Laravel/Symfony., Common values: 20000 for medium apps, 40000 for large apps, 100000+ for monorepos.
**Skills:** OpCache Memory Sizing, OpCache Monitoring and Hit Rate Analysis, OpCache Overview and Configuration
**Decision Trees:** max_accelerated_files value, When to increase max_accelerated_files
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Sizing, OpCache Monitoring and Hit Rate, Production Hardening Settings

