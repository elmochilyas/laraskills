# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Warmup â€” Preloading Strategies, Cache Warming, Cold-Start Latency Mitigation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Create and configure the preload script.
- [ ] Run `php preload.php` manually to verify no errors.
- [ ] Restart PHP-FPM and verify preloaded files appear in `opcache_get_status()`.
- [ ] Verify `opcache.preload_user` matches the web server user.
- [ ] Benchmark response time before and after preloading.
- [ ] OpCache warm-up procedure implemented in deployment pipeline
- [ ] Users never experience cold-start latency after deployment
- [ ] Warm-up completed before traffic switch (blue-green)
- [ ] Cached script count verified and monitored
- [ ] Procedure documented and tested
- [ ] OpCache verified empty before warm-up
- [ ] Warm-up endpoint list covers critical application paths
- [ ] Warm-up requests executed before user traffic
- [ ] Cached script count monitored and stabilized
- [ ] Hit rate confirmed climbing post-warmup
- [ ] Blue-green: warm-up completed before traffic switch
- [ ] Procedure documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Preload execution flow**: PHP-FPM starts â†’ reads `opcache.preload` directive â†’ executes the preload script â†’ script calls `opcache_compile_file()` for each file â†’ files are compiled and stored in shared memory â†’ PHP-FPM workers can now use these files without autoloading.
- [ ] **Preload and shared memory**: Preloaded files live in OpCache's shared memory. They are accessible by all workers. No per-worker duplication.
- [ ] **Preload and validate_timestamps**: Preloaded files are NOT affected by `validate_timestamps`. Once preloaded, they remain in cache until PHP-FPM restart. Changing a preloaded file requires restarting PHP-FPM, not just `opcache_reset()`.
- [ ] **Cache warming with curl**: After deployment, iterate over site URLs via curl or a specialized warm-up script. Each request compiles the files needed for that endpoint. This warms the cache without preloading.
- [ ] **Incremental caching**: If you split warming across requests (e.g., one request per endpoint), each request pays the compilation cost for new files. The total warm-up time is the sum of per-request compilation costs.
- [ ] **Warm-up health check**: After warm-up, verify the OpCache hit rate is >99%. If not, some files may still need compilation â€” increase the warm-up scope.
- [ ] Document and follow through on architectural decision: OpCache warmup strategy
- [ ] Ensure architecture aligns with core concept: **Preloading**: `opcache.preload` directive specifies a PHP script that is executed at PHP-FPM startup. The script uses `opcache_compile_file()` or `require` to load files into OpCache's shared memory. Preloaded files never trigger autoloading â€” they are always available.
- [ ] Ensure architecture aligns with core concept: **Preloading script**: A PHP file (typically `preload.php` in the project root) that lists which files to preload. Uses `opcache_compile_file()` for compilation without execution, or `require` for compilation + execution.
- [ ] Ensure architecture aligns with core concept: **opcache_compile_file()**: Compiles a PHP file into opcodes without executing it. Used in preloading scripts to add files to the cache without running them.
- [ ] Ensure architecture aligns with core concept: **Cache warming**: After deployment or cache reset, send requests to all critical endpoints (or use a script that iterates PHP files) to populate the OpCache gradually.
- [ ] Ensure architecture aligns with core concept: **Cold-start latency**: The time between PHP-FPM start (or cache reset) and stable operation at full throughput. During this period, each request triggers lazy compilation of its required files.
- [ ] Ensure architecture aligns with core concept: **Preload user**: `opcache.preload_user` specifies the system user that can execute the preload script. Prevents privilege escalation.
- [ ] Ensure architecture aligns with core concept: **Lazy compilation**: The default behavior â€” files are compiled on first access. This spreads compilation cost across the first N requests.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] After opcache_reset() or container start, check OpCache is empty: `opcache_get_status(false)['opcache_statistics']['num_cached_scripts']` should be near zero
- [ ] Execute HTTP GET requests against the critical endpoints list: homepage, key API routes, admin pages
- [ ] Each request compiles and caches the PHP files executed during that request
- [ ] Use a CLI script or curl loop to hit 10-20 representative endpoints covering different modules
- [ ] Monitor cache population: check `num_cached_scripts` increasing after each request
- [ ] Continue until the number of cached scripts stabilizes (most files are compiled)
- [ ] Verify warm-up completion: hit rate from `opcache_get_status()['opcache_statistics']['hit_rate']` should be climbing
- [ ] For blue-green deployments: warm the OpCache on the new environment BEFORE switching traffic
- [ ] Document the warm-up endpoint list and procedure

# Performance Checklist (from 04/06)
- [ ] Preloading benefit: 1â€“3ms saved per request for preloaded classes. For API endpoints <50ms, this is 2â€“6% of total time.
- [ ] Preloading cost: 500msâ€“5s increased PHP-FPM startup time. Baseline memory increases by ~10â€“30MB depending on the number of preloaded files.
- [ ] Cache warming cost: warm-up phase takes 5â€“60 seconds depending on the number of endpoints and compilation speed.
- [ ] Startup time impact: Preloading adds to PHP-FPM startup time. In auto-scaling environments with frequent container starts, startup time matters.
- [ ] Preloading for fast APIs (<100ms): The 1â€“3ms savings is ~1â€“3% of total response time â€” meaningful for high-throughput APIs.
- [ ] Preloading for slow apps (>1s): The 1â€“3ms savings is <1% â€” negligible. Focus optimization elsewhere.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] **Preload script execution**: The preload script executes with PHP-FPM's startup privileges. Any code in the preload script runs at startup. Only preload trusted code.
- [ ] **opcache.preload_user**: Restricts which system user can execute the preload script. Set this to the web server user (`www-data`, `nobody`) to prevent other users from loading malicious preload scripts.
- [ ] **Preload + dynamic class generation**: If your application generates dynamic classes (e.g., Doctrine proxies, compiled templates), ensure they are included in the preload script or regenerated after deployment.
- [ ] **Preload and stale code**: Preloaded files persist until PHP-FPM restart. If a security patch changes a preloaded file, the old code remains in memory until restart. Plan for this.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Create and configure the preload script.
- [ ] Run `php preload.php` manually to verify no errors.
- [ ] Restart PHP-FPM and verify preloaded files appear in `opcache_get_status()`.
- [ ] Verify `opcache.preload_user` matches the web server user.
- [ ] Benchmark response time before and after preloading.
- [ ] Verify preload does not consume excessive OpCache memory.
- [ ] Document the preloading strategy and warm-up procedure.
- [ ] OpCache warm-up procedure implemented in deployment pipeline
- [ ] Users never experience cold-start latency after deployment
- [ ] Warm-up completed before traffic switch (blue-green)
- [ ] Cached script count verified and monitored
- [ ] Procedure documented and tested
- [ ] OpCache verified empty before warm-up
- [ ] Warm-up endpoint list covers critical application paths
- [ ] Warm-up requests executed before user traffic
- [ ] Cached script count monitored and stabilized
- [ ] Hit rate confirmed climbing post-warmup
- [ ] Blue-green: warm-up completed before traffic switch
- [ ] Procedure documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using `require` instead of `opcache_compile_file()` in preload
- [ ] Avoid: Preloading all application files
- [ ] Avoid: Not testing preload script before deployment
- [ ] Avoid: Forgetting preload requires PHP-FPM restart
- [ ] Avoid: Preloading without enough memory_consumption
- [ ] Avoid anti-pattern: **Preloading in development**: Preloading adds startup time and makes it harder to test code changes. Use only in production/staging.
- [ ] Avoid anti-pattern: **Warming via GET requests to all possible URLs**: If your app has 1000+ routes, this is slow and may create unintended side effects. Use a script that `opcache_compile_file()` for all PHP files instead.
- [ ] Avoid anti-pattern: **Assuming preloading eliminates all compilation**: Preloading only caches the listed files. Files not in the preload script are still compiled lazily. Your warm-up strategy must handle both.
- [ ] Avoid anti-pattern: **Preloading user data or request-specific code**: Preload framework classes and stable infrastructure, not transient business logic.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment

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
**Core Concepts:** **Preloading**: `opcache.preload` directive specifies a PHP script that is executed at PHP-FPM startup. The script uses `opcache_compile_file()` or `require` to load files into OpCache's shared memory. Preloaded files never trigger autoloading â€” they are always available., **Preloading script**: A PHP file (typically `preload.php` in the project root) that lists which files to preload. Uses `opcache_compile_file()` for compilation without execution, or `require` for compilation + execution., **opcache_compile_file()**: Compiles a PHP file into opcodes without executing it. Used in preloading scripts to add files to the cache without running them., **Cache warming**: After deployment or cache reset, send requests to all critical endpoints (or use a script that iterates PHP files) to populate the OpCache gradually., **Cold-start latency**: The time between PHP-FPM start (or cache reset) and stable operation at full throughput. During this period, each request triggers lazy compilation of its required files.
**Rules:**
- General: Do Not Preload in Development Environments
**Skills:** OpCache Reset Strategies, OpCache Monitoring and Hit Rate Analysis, Preloading Script Design Patterns, Blue-Green Deployment with OpCache
**Decision Trees:** OpCache warmup strategy
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Lifecycle and Invalidation, OpCache File Cache Secondary Storage, Deployment Cache Invalidation Strategies, Preloading Script Design Patterns, OpCache Monitoring and Hit Rate Analysis

