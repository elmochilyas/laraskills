# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache File Cache and Container Cold-Start Mitigation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Configure opcache.file_cache path in php.ini.
- [ ] Verify file cache directory exists and is writable.
- [ ] Set file_cache_consistency_check=0 in production.
- [ ] Benchmark cold-start time with and without file cache.
- [ ] Mount file cache on persistent volume.
- [ ] Cold-start latency reduced by 50-70%
- [ ] File cache configured with appropriate storage (persistent or ephemeral)
- [ ] Container startup includes warm-up and health check
- [ ] File cache directory secured
- [ ] Configuration documented
- [ ] Cold-start latency measured before optimization
- [ ] opcache.file_cache configured in container image
- [ ] Persistent volume mounted for file cache (if desired)
- [ ] Container startup includes warm-up script
- [ ] Health check verifies OpCache population
- [ ] Cold-start latency measured after optimization
- [ ] Deployment pipeline includes warm-up for blue-green/rolling
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Hybrid mode: OpCache reads from shared memory (fast) and writes to file cache (for restart recovery).
- [ ] File cache only mode (PHP 8.5+): No shared memory. All reads from disk.
- [ ] File cache format may differ between PHP versions - rebuild after PHP upgrades.
- [ ] File cache is not shared across workers.
- [ ] Document and follow through on architectural decision: Enable opcache.file_cache
- [ ] Document and follow through on architectural decision: File cache strategy for containers
- [ ] Ensure architecture aligns with core concept: file_cache path: Directory where compiled opcodes are stored as individual files. Shared between deployments if persistent volume mounted.
- [ ] Ensure architecture aligns with core concept: file_cache_only (PHP 8.5+): Run OpCache without shared memory. Eliminates cold-start entirely. 10-20% slower than memory but avoids cold-start.
- [ ] Ensure architecture aligns with core concept: Container cold-start problem: In Kubernetes/Docker, shared memory is lost on container restart. OpCache recompiles all files.
- [ ] Ensure architecture aligns with core concept: file_cache_consistency_check: Validates file cache integrity. Set to 0 in production for speed.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Measure current cold-start latency: time the first 10 requests after container start vs steady-state
- [ ] Enable OpCache file cache: `opcache.file_cache=/tmp/opcache-file-cache` in php.ini
- [ ] For persistent optimization: mount a volume at the file cache path to survive container restarts
- [ ] For ephemeral storage: file cache speeds warm-up within the same container's lifetime but not across restarts
- [ ] Create a warm-up script that executes critical endpoint requests (see OpCache Warm-Up skill)
- [ ] Add the warm-up script to the container startup lifecycle (postStart hook, init container, or startup probe)
- [ ] Configure container health check to verify OpCache is populated before accepting traffic
- [ ] For blue-green or rolling deployments: warm new containers before adding them to the load balancer
- [ ] Measure cold-start latency after file cache implementation â€” target 50-70% reduction
- [ ] Document the configuration and expected improvement

# Performance Checklist (from 04/06)
- [ ] Shared memory: ~50ns per opcode read. File cache: ~500ns-2us per opcode read.
- [ ] Tradeoff: 10-20% reduced throughput for zero cold-start latency.
- [ ] CI/CD pre-warm: Compile all PHP files during build step.
- [ ] Container cold-start without file cache: 2-5s first request delay.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] File cache writes compiled opcodes to disk. Directory must not be publicly accessible.
- [ ] Use appropriate filesystem permissions on the file cache directory.

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
- [ ] Configure opcache.file_cache path in php.ini.
- [ ] Verify file cache directory exists and is writable.
- [ ] Set file_cache_consistency_check=0 in production.
- [ ] Benchmark cold-start time with and without file cache.
- [ ] Mount file cache on persistent volume.
- [ ] Cold-start latency reduced by 50-70%
- [ ] File cache configured with appropriate storage (persistent or ephemeral)
- [ ] Container startup includes warm-up and health check
- [ ] File cache directory secured
- [ ] Configuration documented
- [ ] Cold-start latency measured before optimization
- [ ] opcache.file_cache configured in container image
- [ ] Persistent volume mounted for file cache (if desired)
- [ ] Container startup includes warm-up script
- [ ] Health check verifies OpCache population
- [ ] Cold-start latency measured after optimization
- [ ] Deployment pipeline includes warm-up for blue-green/rolling

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not using file cache in containers
- [ ] Avoid: Setting file_cache_only=1 without measurement
- [ ] Avoid anti-pattern: Using file cache on ephemeral storage: Cache is lost on restart, defeating purpose.
- [ ] Avoid anti-pattern: Mixing file cache across different PHP versions: Format incompatibility causes corruption.
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
**Core Concepts:** file_cache path: Directory where compiled opcodes are stored as individual files. Shared between deployments if persistent volume mounted., file_cache_only (PHP 8.5+): Run OpCache without shared memory. Eliminates cold-start entirely. 10-20% slower than memory but avoids cold-start., Container cold-start problem: In Kubernetes/Docker, shared memory is lost on container restart. OpCache recompiles all files., file_cache_consistency_check: Validates file cache integrity. Set to 0 in production for speed.
**Skills:** OpCache Warmup Implementation, Containerized Deployment Cache Strategies, Blue-Green Deployment with OpCache
**Decision Trees:** Enable opcache.file_cache, File cache strategy for containers
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** Containerized Deployment Cache Strategies, Preloading Script Design Patterns, OpCache Memory Sizing

