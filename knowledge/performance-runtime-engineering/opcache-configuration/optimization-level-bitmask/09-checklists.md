# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Optimization Level Bitmask â€” Safe vs Unsafe Optimization Passes
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Leave opcache.optimization_level at default in production.
- [ ] If debugging, document which passes were disabled and why.
- [ ] File PHP bug report if optimization pass causes incorrect behavior.
- [ ] Optimization level bitmask rationale documented
- [ ] Before/after benchmark validates the selected level
- [ ] No optimization-induced bugs observed
- [ ] Compilation time vs runtime throughput trade-off understood
- [ ] Current optimization level documented
- [ ] Bitmask modification rationale defined (bug debug, compilation time, throughput)
- [ ] Modified bitmask applied in php.ini
- [ ] PHP-FPM restarted
- [ ] Before/after benchmark completed (throughput and compilation time)
- [ ] No optimization-related bugs observed
- [ ] Bitmask configuration documented
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code Ã¢â€ â€™ opcache_reset() Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Bitmask enables individual passes. 0x7FFEBFFF = all passes enabled (default).
- [ ] Debugging: start with 0x7FFEBFFF, disable half, test. Continue bisecting.
- [ ] File PHP bug report if specific pass causes incorrect behavior.
- [ ] Document and follow through on architectural decision: Whether to change optimization_level from default
- [ ] Document and follow through on architectural decision: How to debug optimization-related bugs
- [ ] Ensure architecture aligns with core concept: Optimization passes: ~30+ distinct passes from basic (constant folding, dead code elimination) to advanced (function inlining, loop optimization, SCCP).
- [ ] Ensure architecture aligns with core concept: Bitmask structure: Each bit enables one optimization pass. 0x7FFEBFFF enables all standard passes.
- [ ] Ensure architecture aligns with core concept: Level groupings: Basic (1-10), intermediate (11-20), advanced (21-30). Safe to enable all for typical web applications.
- [ ] Ensure architecture aligns with core concept: Known problematic passes: Pass #8 (function call optimization) has caused edge-case bugs. Pass #24 (SSA-based) may conflict with some extensions.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Check current optimization level: `opcache_get_configuration()['directives']['opcache.optimization_level']`
- [ ] Document the default value (0x7FFFBFFF for most PHP 8.x versions = all optimization passes enabled)
- [ ] If debugging optimization-related bugs, disable individual passes by removing them from the bitmask
- [ ] To reduce compilation time (containers, frequent restarts), disable pass 10 (SSA optimization) if compilation time is a bottleneck
- [ ] Apply the modified bitmask: `opcache.optimization_level=0x7FFFBFFE` (disable pass 10 as example)
- [ ] Benchmark throughput: compare default vs modified bitmask â€” if throughput drops, the pass was important
- [ ] Benchmark compilation time: measure first-request latency with default vs modified bitmask
- [ ] If compilation time improves but throughput does not degrade, the modified bitmask is acceptable
- [ ] Document the selected bitmask and the rationale based on benchmarks

# Performance Checklist (from 04/06)
- [ ] Default optimization level provides most of OpCache's compile-time optimization benefit.
- [ ] Setting optimization_level=0 reduces but does not eliminate OpCache value (caching benefit remains).
- [ ] Individual pass contributions are small; cumulative effect is significant.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications.
- [ ] Incorrect optimization level cannot bypass security controls.

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
- [ ] Leave opcache.optimization_level at default in production.
- [ ] If debugging, document which passes were disabled and why.
- [ ] File PHP bug report if optimization pass causes incorrect behavior.
- [ ] Optimization level bitmask rationale documented
- [ ] Before/after benchmark validates the selected level
- [ ] No optimization-induced bugs observed
- [ ] Compilation time vs runtime throughput trade-off understood
- [ ] Current optimization level documented
- [ ] Bitmask modification rationale defined (bug debug, compilation time, throughput)
- [ ] Modified bitmask applied in php.ini
- [ ] PHP-FPM restarted
- [ ] Before/after benchmark completed (throughput and compilation time)
- [ ] No optimization-related bugs observed
- [ ] Bitmask configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting optimization_level=0
- [ ] Avoid anti-pattern: Changing optimization level without understanding the passes.
- [ ] Avoid anti-pattern: Using optimization_level=0 as a permanent configuration.
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
**Core Concepts:** Optimization passes: ~30+ distinct passes from basic (constant folding, dead code elimination) to advanced (function inlining, loop optimization, SCCP)., Bitmask structure: Each bit enables one optimization pass. 0x7FFEBFFF enables all standard passes., Level groupings: Basic (1-10), intermediate (11-20), advanced (21-30). Safe to enable all for typical web applications., Known problematic passes: Pass #8 (function call optimization) has caused edge-case bugs. Pass #24 (SSA-based) may conflict with some extensions.
**Skills:** OpCache Overview and Configuration, OpCache Memory Sizing, OpCache Monitoring and Hit Rate Analysis
**Decision Trees:** Whether to change optimization_level from default, How to debug optimization-related bugs
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Purpose and Mechanics, PHP Execution Lifecycle, Zend Engine Opcode Pipeline


