# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Memory Sizing â€” memory_consumption, interned_strings_buffer
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Calculate memory_consumption = file_count * avg_compiled_size / 0.8.
- [ ] Set initial value (256MB for Laravel/Symfony, 128MB for WordPress).
- [ ] Deploy and monitor opcache_get_status()['memory_usage'].
- [ ] Verify free_memory is >20% of total after cache warmup.
- [ ] Alert if cache_full=true or hit rate <99%.
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Memory layout: opcache_memory header, hash table, op_array structures, interned strings table.
- [ ] Two-phase eviction: mark as wasted, compact on restart.
- [ ] opcache_huge_pages: maps shared memory via 2MB huge pages for reduced TLB pressure.
- [ ] Document and follow through on architectural decision: OpCache memory_consumption value
- [ ] Document and follow through on architectural decision: interned_strings_buffer value
- [ ] Ensure architecture aligns with core concept: memory_consumption: Total shared memory pool for opcodes. Formula: num_files * avg_opcode_size + 20% headroom. A typical Laravel file is ~8-15KB compiled.
- [ ] Ensure architecture aligns with core concept: interned_strings_buffer: Memory for deduplicated strings. Strings used across multiple files stored once. Larger for framework apps with many class/method names.
- [ ] Ensure architecture aligns with core concept: Memory monitoring: opcache_get_status()['memory_usage'] shows used/free/wasted memory. cache_full indicator shows eviction.
- [ ] Ensure architecture aligns with core concept: Shared memory consumption: Pre-allocated, never released until PHP-FPM restart.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Follow single responsibility principle
- [ ] Use constructor property promotion where applicable

# Performance Checklist (from 04/06)
- [ ] Every 1% decrease in hit rate increases CPU usage ~0.5-1%.
- [ ] file_cache reduces cold-start latency by 50-70% in containers.
- [ ] Preloading reduces class loading time by 1-3ms per request.
- [ ] JIT requires adequate OpCache memory.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] Shared memory must not be accessible to untrusted processes.
- [ ] No direct security impact from memory sizing.

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
- [ ] Calculate memory_consumption = file_count * avg_compiled_size / 0.8.
- [ ] Set initial value (256MB for Laravel/Symfony, 128MB for WordPress).
- [ ] Deploy and monitor opcache_get_status()['memory_usage'].
- [ ] Verify free_memory is >20% of total after cache warmup.
- [ ] Alert if cache_full=true or hit rate <99%.

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting memory_consumption too low (128MB for large apps)
- [ ] Avoid anti-pattern: Setting memory_consumption to the maximum available RAM: Wastes memory. Size appropriately.
- [ ] Avoid anti-pattern: Never monitoring OpCache memory usage: Silent performance degradation.
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
**Core Concepts:** memory_consumption: Total shared memory pool for opcodes. Formula: num_files * avg_opcode_size + 20% headroom. A typical Laravel file is ~8-15KB compiled., interned_strings_buffer: Memory for deduplicated strings. Strings used across multiple files stored once. Larger for framework apps with many class/method names., Memory monitoring: opcache_get_status()['memory_usage'] shows used/free/wasted memory. cache_full indicator shows eviction., Shared memory consumption: Pre-allocated, never released until PHP-FPM restart.
**Decision Trees:** OpCache memory_consumption value, interned_strings_buffer value
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** Max Accelerated Files Calculation, OpCache Monitoring and Hit Rate, Production Hardening Settings

