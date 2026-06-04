# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Production Hardening — validate_timestamps=0, revalidate_freq, Time Validation Interaction
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Set opcache.validate_timestamps=0 in production php.ini.
- [ ] Implement opcache_reset() in deployment script.
- [ ] Verify code changes take effect only after deployment (not on file edit).
- [ ] Monitor no increase in 500 errors after deployments.
- [ ] Benchmark CPU syscall overhead before/after.
- [ ] Complete production OpCache configuration applied and documented
- [ ] All values calculated for the specific application
- [ ] Deployment automation includes cache invalidation
- [ ] Hit rate >99% after warm-up
- [ ] No errors in OpCache error log
- [ ] Configuration template created for future deployments
- [ ] All recommended directives set (enable, memory, interned strings, max files, validate_timestamps, fast_shutdown)
- [ ] Values calculated for application size and type
- [ ] Deployment pipeline includes opcache_reset()
- [ ] Preloading configured (if applicable)
- [ ] File cache configured for containers (if applicable)
- [ ] PHP-FPM restarted and configuration verified
- [ ] Complete configuration documented
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] validate_timestamps=0 saves ~200-2000 stat() syscalls per request depending on file count.
- [ ] Syscall overhead varies by OS/filesystem: Linux ext4 ~2-5us per stat().
- [ ] For busy servers (500 req/s, 500 files each): 250,000 stat() calls per second eliminated.
- [ ] Document and follow through on architectural decision: validate_timestamps=0 vs 1 for production
- [ ] Document and follow through on architectural decision: Deployment cache invalidation strategy
- [ ] Ensure architecture aligns with core concept: validate_timestamps=0: Never check file modification times. Code changes only take effect after PHP-FPM restart or opcache_reset(). Required for maximum production performance.
- [ ] Ensure architecture aligns with core concept: validate_timestamps=1 (default): Check file mtime on every request (or every revalidate_freq seconds). Adds stat() syscall per file.
- [ ] Ensure architecture aligns with core concept: revalidate_freq: Ignored when validate_timestamps=0. When enabled, controls how often (seconds) timestamps are checked.
- [ ] Ensure architecture aligns with core concept: revalidate_path: Check file path changes. Usually disabled (0) in production.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Set `opcache.enable=1` (foundational â€” must be On)
- [ ] Set `opcache.memory_consumption=256` (or calculated value for application)
- [ ] Set `opcache.interned_strings_buffer=32` (or calculated value for application)
- [ ] Set `opcache.max_accelerated_files=40000` (or calculated value)
- [ ] Set `opcache.validate_timestamps=0` (eliminate stat() syscalls)
- [ ] Set `opcache.revalidate_freq=0` (no periodic revalidation)
- [ ] Set `opcache.fast_shutdown=1` (cleanup optimization)
- [ ] Set `opcache.enable_cli=0` (disable CLI caching unless specifically needed)
- [ ] If preloading is used: configure `opcache.preload` and `opcache.preload_user`
- [ ] Set `opcache.error_log=<path>` for OpCache-specific error logging
- [ ] Configure `opcache.file_cache=<path>` for containers (optional, see file cache skill)
- [ ] Restart PHP-FPM and verify all settings are applied via `opcache_get_configuration()`
- [ ] Document the complete configuration with rationale for each setting

# Performance Checklist (from 04/06)
- [ ] On a busy server: 250,000 stat() calls per second eliminated.
- [ ] Per-request savings: 0.5-2.5ms per request.
- [ ] 1-3% total throughput improvement typical.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications.
- [ ] With validate_timestamps=0, ensure deployment pipeline includes OpCache reset.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache full â€” no restart**: cache_full=true but wasted memory below max_wasted_percentage. Symptom: hit rate drops below 90%. Files recompile on every request. Mitigation: Increase memory_consumption or max_wasted_percentage.
- [ ] **OOM restart**: Memory allocation fails. Symptom: oom_restarts counter increments. Mitigation: Increase memory_consumption. Root cause: memory_consumption set too low for application size.
- [ ] **Hash collision thrashing**: max_accelerated_files too low. Symptom: hash_restarts counter increments. Files evicted and recompiled frequently. Mitigation: Increase max_accelerated_files to 1.5x total PHP file count.
- [ ] **Stale preloading**: Preloaded classes from old deployment survive opcache_reset(). Symptom: Mixed old/new class definitions. Mitigation: Always restart PHP-FPM when preloading script changes.
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code â†’ opcache_reset() â†’ cache warm â†’ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Testing Checklist (from 04/06)
- [ ] Set opcache.validate_timestamps=0 in production php.ini.
- [ ] Implement opcache_reset() in deployment script.
- [ ] Verify code changes take effect only after deployment (not on file edit).
- [ ] Monitor no increase in 500 errors after deployments.
- [ ] Benchmark CPU syscall overhead before/after.
- [ ] Complete production OpCache configuration applied and documented
- [ ] All values calculated for the specific application
- [ ] Deployment automation includes cache invalidation
- [ ] Hit rate >99% after warm-up
- [ ] No errors in OpCache error log
- [ ] Configuration template created for future deployments
- [ ] All recommended directives set (enable, memory, interned strings, max files, validate_timestamps, fast_shutdown)
- [ ] Values calculated for application size and type
- [ ] Deployment pipeline includes opcache_reset()
- [ ] Preloading configured (if applicable)
- [ ] File cache configured for containers (if applicable)
- [ ] PHP-FPM restarted and configuration verified
- [ ] Complete configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: validate_timestamps=1 in production
- [ ] Avoid anti-pattern: Using validate_timestamps=1 with revalidate_freq=0: Checks every time, maximum overhead.
- [ ] Avoid anti-pattern: Setting validate_timestamps=0 without deployment automation: Code changes don't take effect.
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
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code â†’ opcache_reset() â†’ cache warm â†’ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** validate_timestamps=0: Never check file modification times. Code changes only take effect after PHP-FPM restart or opcache_reset(). Required for maximum production performance., validate_timestamps=1 (default): Check file mtime on every request (or every revalidate_freq seconds). Adds stat() syscall per file., revalidate_freq: Ignored when validate_timestamps=0. When enabled, controls how often (seconds) timestamps are checked., revalidate_path: Check file path changes. Usually disabled (0) in production.
**Skills:** OpCache Memory Sizing, OpCache Max Accelerated Files Calculation, Preloading Script Design Patterns, OpCache Monitoring and Hit Rate Analysis
**Decision Trees:** validate_timestamps=0 vs 1 for production, Deployment cache invalidation strategy
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Purpose and Mechanics, OpCache Lifecycle and Invalidation, Deployment Cache Invalidation Strategies

