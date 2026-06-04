# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Hit Rate Inversely Correlates with CPU Load
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Establish baseline hit rate for your application (>99% target).
- [ ] Monitor CPU utilization vs OpCache hit rate correlation.
- [ ] Verify OpCache is properly sized before tuning application code.
- [ ] Implement alerting when hit rate drops below 99%.
- [ ] Hit rate vs CPU relationship understood and documented
- [ ] Memory increase justified by predicted CPU savings
- [ ] After-change metrics confirm the relationship
- [ ] Monitoring in place to detect future hit rate degradation
- [ ] Current hit rate and CPU recorded
- [ ] CPU overhead from misses calculated
- [ ] Memory increase predicted to restore hit rate
- [ ] CPU savings estimated
- [ ] Change implemented
- [ ] After: hit rate improved, CPU decreased
- [ ] Relationship validated with before/after data
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Under-provisioned OpCache creates a compounding effect: higher traffic -> more evictions -> lower hit rate -> higher CPU -> slower requests -> more concurrent requests -> more evictions.
- [ ] Preloading reduces per-request compilation, helping maintain higher effective hit rate.
- [ ] Document and follow through on architectural decision: Whether high CPU is caused by low OpCache hit rate
- [ ] Document and follow through on architectural decision: Action threshold based on hit rate
- [ ] Ensure architecture aligns with core concept: Each miss costs: 5-15ms of CPU time for lexing, parsing, and compiling a PHP file. With 200 files per request, one miss = 1-3 seconds of compilation.
- [ ] Ensure architecture aligns with core concept: Hit rate to CPU correlation: 95% hit rate with 500 req/s and 200 files/request = 5,000 compilations per second leading to server saturation.
- [ ] Ensure architecture aligns with core concept: Cache sizing prevents this: Proper memory_consumption and max_accelerated_files ensure >99% hit rate, eliminating compilation as a CPU consumer.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Record current OpCache hit rate and CPU utilization at peak traffic
- [ ] If hit rate <95%, calculate the CPU overhead: (100 - hit_rate) * 0.0075 (midpoint of 0.5-1% per 1% miss rate)
- [ ] Multiply by current CPU utilization to estimate how much CPU is wasted on recompilation
- [ ] If cache_full=true, estimate the memory increase needed to restore >99% hit rate
- [ ] For each 128MB memory increase, predict hit rate improvement: ~2-5% depending on current utilization
- [ ] Calculate CPU savings from the predicted hit rate improvement
- [ ] Present the analysis: "Increasing OpCache memory by 256MB will improve hit rate from 92% to 99%, saving ~5% CPU"
- [ ] After the change, verify: hit rate should improve, CPU should decrease proportionally
- [ ] Document the before/after metrics to validate the relationship

# Performance Checklist (from 04/06)
- [ ] Each file compilation: 5-15ms CPU time.
- [ ] 1% hit rate decrease = 0.5-1% CPU increase.
- [ ] file_cache reduces cold-start latency by 50-70%.
- [ ] Preloading eliminates first-hit compilation for preloaded files.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications.

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
- [ ] Establish baseline hit rate for your application (>99% target).
- [ ] Monitor CPU utilization vs OpCache hit rate correlation.
- [ ] Verify OpCache is properly sized before tuning application code.
- [ ] Implement alerting when hit rate drops below 99%.
- [ ] Hit rate vs CPU relationship understood and documented
- [ ] Memory increase justified by predicted CPU savings
- [ ] After-change metrics confirm the relationship
- [ ] Monitoring in place to detect future hit rate degradation
- [ ] Current hit rate and CPU recorded
- [ ] CPU overhead from misses calculated
- [ ] Memory increase predicted to restore hit rate
- [ ] CPU savings estimated
- [ ] Change implemented
- [ ] After: hit rate improved, CPU decreased
- [ ] Relationship validated with before/after data

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Investigating application code for CPU spikes without checking OpCache
- [ ] Avoid anti-pattern: Throwing more hardware at CPU issues caused by OpCache under-provisioning.
- [ ] Avoid anti-pattern: Tuning application performance while OpCache is thrashing.
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
**Core Concepts:** Each miss costs: 5-15ms of CPU time for lexing, parsing, and compiling a PHP file. With 200 files per request, one miss = 1-3 seconds of compilation., Hit rate to CPU correlation: 95% hit rate with 500 req/s and 200 files/request = 5,000 compilations per second leading to server saturation., Cache sizing prevents this: Proper memory_consumption and max_accelerated_files ensure >99% hit rate, eliminating compilation as a CPU consumer.
**Skills:** OpCache Monitoring and Hit Rate Analysis, OpCache Memory Sizing, Capacity Planning and Safety Margins
**Decision Trees:** Whether high CPU is caused by low OpCache hit rate, Action threshold based on hit rate
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Monitoring and Hit Rate, OpCache Memory Sizing, Max Accelerated Files Calculation


