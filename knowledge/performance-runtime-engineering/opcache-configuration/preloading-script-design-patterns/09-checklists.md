# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** Preloading Script Design Patterns — opcache_compile_file() vs include, Conditional Declarations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Create preloading script with framework core classes.
- [ ] Configure opcache.preload in php.ini.
- [ ] Set opcache.preload_user to PHP-FPM user.
- [ ] Test with php -f preload.php to verify no errors.
- [ ] Benchmark cold-start latency with and without preloading.
- [ ] Preload script created with categorized, maintainable class list
- [ ] No side effects in preload execution
- [ ] Autoloading overhead reduced by 1-3ms per request
- [ ] Preload script integrated into CI/CD for updates
- [ ] Documentation created with maintenance instructions
- [ ] Autoloading profiled and top classes identified
- [ ] Preload script created with categorized class list
- [ ] No side effects confirmed (no DB, file, API calls during preload)
- [ ] Preload script tested in isolation
- [ ] opcache.preload configured
- [ ] Preloaded classes verified
- [ ] CI/CD automation for preload script updates considered
- [ ] Script documented with maintenance instructions
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Preloading reduces cold-start latency by 10-16ms (autoloading time).
- [ ] Higher baseline memory: Preloaded classes consume OpCache memory permanently.
- [ ] Preloading is ideal for containerized environments.
- [ ] Document and follow through on architectural decision: Preloading strategy: selective vs comprehensive
- [ ] Document and follow through on architectural decision: Which classes to include in preload script
- [ ] Ensure architecture aligns with core concept: Preloading vs caching: Preloading loads files at PHP-FPM startup. Regular OpCache caches files lazily on first access. Preloading also pre-executes class declarations so they skip autoloading.
- [ ] Ensure architecture aligns with core concept: opcache_compile_file(): Only compiles to opcodes. Classes/functions defined are NOT available to subsequent requests. Used for utility-only files.
- [ ] Ensure architecture aligns with core concept: require_once/include: Compiles AND executes. Class/function definitions become globally available without autoloading.
- [ ] Ensure architecture aligns with core concept: opcache.preload_user: Required when running as non-root. Must match the PHP-FPM user.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Profile autoloading: capture which classes are loaded on every request (top 100-200 by load frequency)
- [ ] Create preload script structure: return early if not in production, define class list, require files or use Composer's autoloader
- [ ] For Laravel: use `php artisan optimize` to generate an optimized preload configuration
- [ ] For Symfony: use `composer dump-autoload --classmap-authoritative` and reference the generated classmap
- [ ] Group preloaded classes by category: framework core, first-party modules, third-party packages
- [ ] Add comments explaining why each class group is preloaded (load frequency, class complexity)
- [ ] Test the preload script: execute it in isolation to verify no side effects (database connections, file writes, API calls)
- [ ] Configure preload in php.ini and restart PHP-FPM
- [ ] Verify preloaded classes via `opcache_get_status(false)['preload_statistics']`
- [ ] Update the preload script when significant packages are added or removed â€” automate this in CI/CD

# Performance Checklist (from 04/06)
- [ ] Preloading reduces cold-start by 10-16ms.
- [ ] For APIs with 20ms response: 10ms savings = 50% improvement.
- [ ] For apps with 1s response: 10ms = 1% improvement.
- [ ] Preloaded classes use memory even if never used.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] Preload script runs with high privileges during PHP-FPM startup.
- [ ] Ensure preload script does not contain sensitive logic.
- [ ] Validate preload script inputs if dynamic.

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
- [ ] Create preloading script with framework core classes.
- [ ] Configure opcache.preload in php.ini.
- [ ] Set opcache.preload_user to PHP-FPM user.
- [ ] Test with php -f preload.php to verify no errors.
- [ ] Benchmark cold-start latency with and without preloading.
- [ ] Preload script created with categorized, maintainable class list
- [ ] No side effects in preload execution
- [ ] Autoloading overhead reduced by 1-3ms per request
- [ ] Preload script integrated into CI/CD for updates
- [ ] Documentation created with maintenance instructions
- [ ] Autoloading profiled and top classes identified
- [ ] Preload script created with categorized class list
- [ ] No side effects confirmed (no DB, file, API calls during preload)
- [ ] Preload script tested in isolation
- [ ] opcache.preload configured
- [ ] Preloaded classes verified
- [ ] CI/CD automation for preload script updates considered
- [ ] Script documented with maintenance instructions

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Preloading everything
- [ ] Avoid anti-pattern: Preloading classes that are only used in admin/cron paths: Wastes memory per worker.
- [ ] Avoid anti-pattern: Using opcache_compile_file() for class files: Classes are compiled but not available to autoloader.
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
**Core Concepts:** Preloading vs caching: Preloading loads files at PHP-FPM startup. Regular OpCache caches files lazily on first access. Preloading also pre-executes class declarations so they skip autoloading., opcache_compile_file(): Only compiles to opcodes. Classes/functions defined are NOT available to subsequent requests. Used for utility-only files., require_once/include: Compiles AND executes. Class/function definitions become globally available without autoloading., opcache.preload_user: Required when running as non-root. Must match the PHP-FPM user.
**Skills:** Preloading Cold-Start Latency Reduction, OpCache Lifecycle and Invalidation, Composer Autoloader Optimization
**Decision Trees:** Preloading strategy: selective vs comprehensive, Which classes to include in preload script
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Sizing, Preloading Reduces Cold Start Latency, Inheritance Cache Deep Dive

