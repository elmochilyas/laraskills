# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Overview â€” Purpose, Architecture, Lifecycle, Throughput Impact
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Enable OpCache in php.ini: `opcache.enable=1`.
- [ ] Verify OpCache is active: `php -i | grep 'opcache.enable'` or `opcache_get_status()`.
- [ ] Check hit rate: target >99%.
- [ ] Monitor `cache_full` indicator â€” should always be false.
- [ ] Configure deployment automation: `opcache_reset()` after every deploy.
- [ ] OpCache enabled and verified active
- [ ] Hit rate >99% after cache population
- [ ] cache_full = false
- [ ] validate_timestamps=0 configured with deployment automation
- [ ] Benchmark documents throughput improvement
- [ ] opcache.enable=1 set in php.ini
- [ ] OpCache verified active: `php -i | grep opcache.enable`
- [ ] Hit rate >99% recorded
- [ ] cache_full = false confirmed
- [ ] validate_timestamps=0 configured for production
- [ ] opcache_reset() added to deployment pipeline
- [ ] Before/after benchmark documents OpCache impact
- [ ] Initial configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Shared memory architecture**: OpCache allocates a shared memory segment at PHP-FPM startup. All workers access the same cache. Memory is never released until PHP-FPM restarts.
- [ ] **Cache population**: Files are compiled lazily â€” the first request to a file triggers compilation and caching. Preloading compiles files at startup, avoiding the lazy compilation penalty.
- [ ] **Memory layout**: The shared memory segment contains: opcache header (locking, statistics), hash table (fileâ†’opcode mapping), op_array structures (compiled opcodes), and interned strings table.
- [ ] **Eviction policy**: When memory is full, OpCache marks least-recently-used entries as "wasted" (removed from the hash table but memory is not reused until compacted). Compaction happens on restart.
- [ ] **Inheritance cache (PHP 8.1+)**: Caches resolved class hierarchies (parent class, interfaces, traits). Reduces class resolution overhead by ~80% in framework applications.
- [ ] Document and follow through on architectural decision: OpCache production configuration baseline
- [ ] Document and follow through on architectural decision: Whether OpCache is causing performance issues
- [ ] Ensure architecture aligns with core concept: **Without OpCache**: Every request â†’ read file from disk â†’ lex to tokens â†’ parse to AST â†’ compile to opcodes â†’ execute. Disk I/O + CPU for compilation on every request.
- [ ] Ensure architecture aligns with core concept: **With OpCache**: First request â†’ compile and store in shared memory. Subsequent requests â†’ fetch opcodes from shared memory â†’ execute. Only file stat() overhead remains (eliminated by `validate_timestamps=0`).
- [ ] Ensure architecture aligns with core concept: **Shared memory**: OpCache stores compiled files in SysV IPC shared memory (shm) accessible by all PHP-FPM workers. No inter-process duplication.
- [ ] Ensure architecture aligns with core concept: **OpCache phases**: Cache population (lazy, on first access) â†’ cache hit â†’ cache eviction (when full) â†’ cache full detection â†’ reset.
- [ ] Ensure architecture aligns with core concept: **Key directives**: `opcache.enable=1`, `opcache.memory_consumption`, `opcache.interned_strings_buffer`, `opcache.max_accelerated_files`, `opcache.validate_timestamps`, `opcache.revalidate_freq`, `opcache.preload`.
- [ ] Ensure architecture aligns with core concept: **Hit rate**: Percentage of requests that find the file already compiled in cache. Target: >99%. Below 95% indicates configuration problems.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Enable OpCache in php.ini: `opcache.enable=1` and restart PHP-FPM
- [ ] Verify OpCache is active: `php -i | grep 'opcache.enable'` should show "opcache.enable => On"
- [ ] Execute a few requests to populate the cache
- [ ] Check OpCache status: call `opcache_get_status(false)` from a PHP script
- [ ] Verify the hit rate: target >99% â€” record the initial value
- [ ] Check cache_full indicator: should be false â€” if true, memory is undersized
- [ ] Set `opcache.validate_timestamps=0` for production to eliminate stat() syscalls
- [ ] Add `opcache_reset()` to the deployment pipeline (required when validate_timestamps=0)
- [ ] Benchmark throughput with OpCache enabled vs disabled to measure the impact
- [ ] Document the initial OpCache configuration and baseline metrics

# Performance Checklist (from 04/06)
- [ ] OpCache with default settings: ~1.5â€“2Ã— throughput. With optimized settings: ~2â€“4Ã— throughput over OpCache-disabled.
- [ ] Every 1% decrease in hit rate increases CPU usage ~0.5â€“1% due to recompilation.
- [ ] `validate_timestamps=0` saves 1â€“3% CPU by eliminating stat() syscalls.
- [ ] Preloading reduces cold-start latency by 1â€“3ms per request for preloaded classes.
- [ ] OpCache memory overhead: 128â€“512MB shared memory. This is pre-allocated and not available for other uses.
- [ ] JIT requires adequate OpCache memory. OpCache eviction forces JIT to recompile affected files.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] `opcache.validate_timestamps=0` means PHP will never detect changed files. After a deployment, stale code serves until cache is reset. Always automate `opcache_reset()` in the deployment pipeline.
- [ ] `opcache.file_cache` writes cached opcodes to disk. Ensure the file cache directory is not publicly accessible.
- [ ] Preloading executes the preload script with full privileges. Only trusted code should be preloaded.
- [ ] OpCache shared memory is readable by other processes on the same system (SysV shm permissions). Isolate applications on multi-tenant servers.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Enable OpCache in php.ini: `opcache.enable=1`.
- [ ] Verify OpCache is active: `php -i | grep 'opcache.enable'` or `opcache_get_status()`.
- [ ] Check hit rate: target >99%.
- [ ] Monitor `cache_full` indicator â€” should always be false.
- [ ] Configure deployment automation: `opcache_reset()` after every deploy.
- [ ] Measure throughput: benchmark with and without OpCache to verify the gain.
- [ ] Document the OpCache configuration and deployment invalidation procedure.
- [ ] OpCache enabled and verified active
- [ ] Hit rate >99% after cache population
- [ ] cache_full = false
- [ ] validate_timestamps=0 configured with deployment automation
- [ ] Benchmark documents throughput improvement
- [ ] opcache.enable=1 set in php.ini
- [ ] OpCache verified active: `php -i | grep opcache.enable`
- [ ] Hit rate >99% recorded
- [ ] cache_full = false confirmed
- [ ] validate_timestamps=0 configured for production
- [ ] opcache_reset() added to deployment pipeline
- [ ] Before/after benchmark documents OpCache impact
- [ ] Initial configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not enabling OpCache in production
- [ ] Avoid: Using default settings for large apps
- [ ] Avoid: Setting `validate_timestamps=0` without deployment automation
- [ ] Avoid: Not resetting OpCache after deployment
- [ ] Avoid anti-pattern: **Disabling OpCache for debugging**: OpCache does not affect PHP behavior (unlike Xdebug). If you're debugging, keep OpCache enabled. Debug the code, not the cache.
- [ ] Avoid anti-pattern: **Over-allocating OpCache memory**: Setting `memory_consumption=4GB` for a small WordPress site wastes RAM. Size based on actual usage.
- [ ] Avoid anti-pattern: **Running `opcache_reset()` on every request**: Reset is destructive â€” it clears all cached files. Running it frequently defeats the purpose of OpCache.
- [ ] Avoid anti-pattern: **Ignoring cache_full and hit rate metrics**: These are free diagnostics. OpCache provides detailed status â€” use it.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment
- [ ] OpCache memory sized for application

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
**Core Concepts:** **Without OpCache**: Every request â†’ read file from disk â†’ lex to tokens â†’ parse to AST â†’ compile to opcodes â†’ execute. Disk I/O + CPU for compilation on every request., **With OpCache**: First request â†’ compile and store in shared memory. Subsequent requests â†’ fetch opcodes from shared memory â†’ execute. Only file stat() overhead remains (eliminated by `validate_timestamps=0`)., **Shared memory**: OpCache stores compiled files in SysV IPC shared memory (shm) accessible by all PHP-FPM workers. No inter-process duplication., **OpCache phases**: Cache population (lazy, on first access) â†’ cache hit â†’ cache eviction (when full) â†’ cache full detection â†’ reset., **Key directives**: `opcache.enable=1`, `opcache.memory_consumption`, `opcache.interned_strings_buffer`, `opcache.max_accelerated_files`, `opcache.validate_timestamps`, `opcache.revalidate_freq`, `opcache.preload`.
**Skills:** OpCache Memory Sizing, OpCache Max Accelerated Files Calculation, OpCache Monitoring and Hit Rate Analysis, Production Hardening Settings
**Decision Trees:** OpCache production configuration baseline, Whether OpCache is causing performance issues
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Consumption â€” memory_consumption, interned_strings_buffer, OpCache Max Accelerated Files â€” max_accelerated_files calculation, OpCache Revalidation Frequency â€” validate_timestamps, revalidate_freq, OpCache Preloading and Warmup, OpCache Monitoring and Hit Rate Analysis

