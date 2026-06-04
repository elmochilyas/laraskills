# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Revalidation Frequency â€” validate_timestamps, revalidate_freq, stat() Elimination
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify `opcache.validate_timestamps` is 0 in production.
- [ ] Test deployment procedure: deploy â†’ cache reset â†’ verify new code serves.
- [ ] Benchmark CPU usage with validate_timestamps=1 vs 0 (expect 1â€“3% difference).
- [ ] Confirm `opcache.status` shows the correct configuration values.
- [ ] Verify the deployment pipeline includes cache invalidation step.
- [ ] validate_timestamps=0 configured in production
- [ ] Deployment pipeline includes opcache_reset() on all servers
- [ ] No stale-code serving after deployments
- [ ] Hit rate monitoring alerts configured
- [ ] Procedure documented and tested in staging
- [ ] validate_timestamps=0 configured in php.ini
- [ ] PHP-FPM restarted after configuration
- [ ] opcache_reset() added to deployment pipeline
- [ ] Multi-server deployment handles all servers
- [ ] Container deployment includes cache warm-up
- [ ] Hit rate monitoring alert configured (<95% threshold)
- [ ] Deployment cache invalidation procedure documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **stat() elimination mechanism**: When `validate_timestamps=0`, OpCache never calls `stat()`. The lookup path is: hash table lookup â†’ return cached op_array. No filesystem interaction beyond the initial compilation.
- [ ] **stat() cost**: Each stat() is a syscall (~0.5â€“2Âµs depending on filesystem and caching). For 20,000 files accessed over a minute, that's 10â€“40ms of CPU time spent on stat(). At high traffic, the cumulative cost is significant.
- [ ] **Cache staleness risk**: If a file is changed on disk after OpCache cached it, the old opcodes serve until the cache is cleared. This is the tradeoff for the CPU savings.
- [ ] **Deployment sequences**: Code deploy â†’ `opcache_reset()` â†’ warm cache with preloading or first request â†’ health check â†’ enable traffic. This sequence ensures no stale code is served.
- [ ] **revalidate_freq granularity**: At `revalidate_freq=2`, the check window is 2 seconds. If a file changes at t=0 and is accessed at t=1, it may serve stale code until t=2. For production, this is too slow for immediate updates â€” hence `validate_timestamps=0` + explicit reset is preferred.
- [ ] Document and follow through on architectural decision: validate_timestamps setting by environment
- [ ] Document and follow through on architectural decision: revalidate_freq value selection
- [ ] Ensure architecture aligns with core concept: **validate_timestamps=1 (default)**: OpCache calls `stat()` on each file before serving from cache. If the file's mtime is newer than the cached version, the file is recompiled.
- [ ] Ensure architecture aligns with core concept: **validate_timestamps=0**: OpCache never checks file timestamps. Cached opcodes are served indefinitely, even if the source file changes. Requires explicit `opcache_reset()` or PHP-FPM restart after deployments.
- [ ] Ensure architecture aligns with core concept: **revalidate_freq (seconds)**: How often OpCache checks timestamps (only when `validate_timestamps=1`). Default: 2 seconds. Set to 0 to check every request (not recommended).
- [ ] Ensure architecture aligns with core concept: **revalidate_path**: If enabled (0 by default), OpCache checks the stat() timestamp even for files that haven't changed â€” adds unnecessary overhead. Leave disabled.
- [ ] Ensure architecture aligns with core concept: **stat() syscall**: System call that checks file metadata (modification time, size, permissions). Each file access triggers one stat() when `validate_timestamps=1`.
- [ ] Ensure architecture aligns with core concept: **revalidate_freq optimization**: Files that passed the timestamp check within `revalidate_freq` seconds are not rechecked. At `revalidate_freq=2`, a file accessed 100 times per second is checked 0.5 times per second.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Set `opcache.validate_timestamps=0` in php.ini for production â€” eliminates stat() syscall overhead
- [ ] Set `opcache.revalidate_freq=0` (ignored when validate_timestamps=0, but good practice)
- [ ] Restart PHP-FPM to apply the configuration
- [ ] Add `opcache_reset()` call to the deployment pipeline â€” must run after code is deployed
- [ ] For PHP-FPM: use `cachetool opcache:reset --all` or `php -r "opcache_reset();"` on each server
- [ ] For multiple servers, execute opcache_reset() on every server in sequence
- [ ] For containerized deployments: fresh containers start with empty OpCache (no reset needed, but warm-up is required)
- [ ] Verify after deployment: check `opcache_get_status()['opcache_statistics']['hit_rate']` â€” should start low and climb
- [ ] Document the deployment cache invalidation procedure
- [ ] Set up monitoring alert if hit rate drops below 95%

# Performance Checklist (from 04/06)
- [ ] stat() overhead: 1â€“3% CPU with `validate_timestamps=1`. At scale (100+ req/s), this adds measurable CPU cost.
- [ ] Setting `revalidate_freq=0`: ~5â€“15% CPU overhead from stat() on every request. Never use in production.
- [ ] The CPU savings from `validate_timestamps=0` are additive with other optimizations. Combined with preloading, OPcache file cache, and JIT, the total gain is substantial.
- [ ] Container environments: In Docker/K8s, overlay filesystems have different stat() performance characteristics. `validate_timestamps=0` is especially beneficial in containers where stat() on overlayfs is slower than on native filesystems.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] **Stale code serving with validate_timestamps=0**: If a security patch is deployed and `opcache_reset()` fails silently, the old (vulnerable) code continues to serve. Always verify cache reset in the deployment pipeline.
- [ ] **validate_timestamps=1 with low revalidate_freq**: Not a security issue, but can mask deployment problems (files appear unchanged because stat() hasn't checked them yet).
- [ ] **Preloading + validate_timestamps=0**: Preloaded classes are loaded at startup and never refreshed until PHP-FPM restart. A preloading script change requires a full restart, not just `opcache_reset()`.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Verify `opcache.validate_timestamps` is 0 in production.
- [ ] Test deployment procedure: deploy â†’ cache reset â†’ verify new code serves.
- [ ] Benchmark CPU usage with validate_timestamps=1 vs 0 (expect 1â€“3% difference).
- [ ] Confirm `opcache.status` shows the correct configuration values.
- [ ] Verify the deployment pipeline includes cache invalidation step.
- [ ] Document the revalidation configuration and deployment procedure.
- [ ] validate_timestamps=0 configured in production
- [ ] Deployment pipeline includes opcache_reset() on all servers
- [ ] No stale-code serving after deployments
- [ ] Hit rate monitoring alerts configured
- [ ] Procedure documented and tested in staging
- [ ] validate_timestamps=0 configured in php.ini
- [ ] PHP-FPM restarted after configuration
- [ ] opcache_reset() added to deployment pipeline
- [ ] Multi-server deployment handles all servers
- [ ] Container deployment includes cache warm-up
- [ ] Hit rate monitoring alert configured (<95% threshold)
- [ ] Deployment cache invalidation procedure documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Leaving `validate_timestamps=1` in production
- [ ] Avoid: Setting `validate_timestamps=0` without deployment automation
- [ ] Avoid: Using `revalidate_freq=0` in production
- [ ] Avoid: Not testing deployment procedure
- [ ] Avoid: Mixing validate_timestamps settings across environments
- [ ] Avoid anti-pattern: **validate_timestamps=1 in containers**: In immutable container images, files never change after build. stat() checks are always wasted. Always use `validate_timestamps=0` in containers.
- [ ] Avoid anti-pattern: **revalidate_freq=3600 (1 hour)**: Misleading â€” if a file changes, it takes up to 1 hour to see the effect. If you can tolerate delay, use `validate_timestamps=0` with explicit reset instead.
- [ ] Avoid anti-pattern: **Frequent opcache_reset() without need**: Calling `opcache_reset()` on every deploy adds unnecessary complexity for environments where `validate_timestamps=1` + deploy hook would suffice.
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
**Core Concepts:** **validate_timestamps=1 (default)**: OpCache calls `stat()` on each file before serving from cache. If the file's mtime is newer than the cached version, the file is recompiled., **validate_timestamps=0**: OpCache never checks file timestamps. Cached opcodes are served indefinitely, even if the source file changes. Requires explicit `opcache_reset()` or PHP-FPM restart after deployments., **revalidate_freq (seconds)**: How often OpCache checks timestamps (only when `validate_timestamps=1`). Default: 2 seconds. Set to 0 to check every request (not recommended)., **revalidate_path**: If enabled (0 by default), OpCache checks the stat() timestamp even for files that haven't changed â€” adds unnecessary overhead. Leave disabled., **stat() syscall**: System call that checks file metadata (modification time, size, permissions). Each file access triggers one stat() when `validate_timestamps=1`.
**Rules:**
- General: Test Deployment Procedure After Switching to validate_timestamps=0
**Skills:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, CI/CD Cache Invalidation Steps, Zero-Downtime Deployment
**Decision Trees:** validate_timestamps setting by environment, revalidate_freq value selection
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Lifecycle and Invalidation, OpCache File Cache Secondary Storage, Preloading and Cold-Start Latency, Deployment Cache Invalidation Strategies, PHP-FPM Graceful Reload Patterns

