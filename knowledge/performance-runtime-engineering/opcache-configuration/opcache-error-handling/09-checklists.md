# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Error Handling â€” Logging, Diagnostic Tools, Common Error Scenarios, Recovery
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `opcache_get_status(false)` and verify all error counters are zero.
- [ ] Check `cache_full` is false, `oom_restarts` and `hash_restarts` are 0.
- [ ] Verify `current_wasted_percentage` is <5%.
- [ ] Test `opcache_reset()` and verify counters reset.
- [ ] Simulate a compile error: verify OpCache caches the error state.
- [ ] Error resolved with no recurrence for 24 hours
- [ ] Root cause documented
- [ ] Configuration fix applied and verified
- [ ] Monitoring in place to detect future errors
- [ ] Error identified from logs
- [ ] Root cause determined
- [ ] Configuration fix applied
- [ ] PHP-FPM restarted
- [ ] Error no longer present in logs
- [ ] Hit rate and cache_full monitored for 24 hours
- [ ] Resolution documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Error propagation**: OpCache errors do not cause PHP userland exceptions. They manifest as log messages, counter increments, or degraded performance. Monitoring is essential for detection.
- [ ] **oom_restarts**: OpCache's internal memory allocator is out of memory. This is NOT a PHP-FPM restart. It resets the OpCache internal allocator, clearing all cached files. Files are recompiled. Immediate cause: `memory_consumption` too small.
- [ ] **hash_restarts**: Hash table allocation failure. The hash table cannot accommodate more file entries. Immediate cause: `max_accelerated_files` too small.
- [ ] **Compile error caching behavior**: When a PHP file has a compile error, OpCache caches the error state. On every subsequent request, the file returns the same error without attempting recompilation. The file must be fixed and the cache cleared.
- [ ] **Preload error recovery**: A preload failure during startup prevents PHP-FPM from entering the ready state. Fix the preload script and restart PHP-FPM. A partial preload (some files failed) is logged but the worker may start.
- [ ] **Shared memory cleanup**: On PHP-FPM shutdown, OpCache's shared memory segment is marked for deletion (via `shmctl(IPC_RMID)`). If PHP-FPM crashes, the shared memory segment may persist, consuming system resources. Manual cleanup may be needed.
- [ ] Document and follow through on architectural decision: Error handling for OpCache failures
- [ ] Ensure architecture aligns with core concept: **Error indicators**: `opcache_get_status()` provides: `cache_full` (true/false), `oom_restarts` (integer), `hash_restarts` (integer), `current_wasted_percentage` (float). Non-zero restarts or high waste = configuration problems.
- [ ] Ensure architecture aligns with core concept: **opcache.error_log**: If set, OpCache errors are logged to a separate file. If not set, errors go to PHP's main error log.
- [ ] Ensure architecture aligns with core concept: **opcache.log_verbosity_level**: Controls OpCache's internal logging verbosity (0â€“4). Default: 1 (only critical errors). Increase to 2â€“3 for debugging, but never in production â€” high verbosity generates significant log volume.
- [ ] Ensure architecture aligns with core concept: **Compile-time errors**: If a PHP file has a parse error, OpCache caches the error and reports a compile failure on every subsequent access. The file must be fixed and the cache cleared.
- [ ] Ensure architecture aligns with core concept: **Preload failure**: If the preload script fails, PHP-FPM may not start, or workers may start with an incomplete preload. Errors are logged to the PHP error log.
- [ ] Ensure architecture aligns with core concept: **Shared memory corruption**: Rare but catastrophic. Memory corruption in the shared memory segment causes unpredictable behavior. Requires PHP-FPM restart.
- [ ] Ensure architecture aligns with core concept: **Stale code serving**: With `validate_timestamps=0`, if a file is changed but OpCache is not reset, old opcodes serve indefinitely. Detect by comparing file mtimes with cache timestamps.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Check PHP-FPM error log for OpCache errors: grep for "opcache" or "Opcache" keywords
- [ ] If error is "Unable to allocate shared memory segment": increase `opcache.memory_consumption` or reduce other shared memory usage
- [ ] If error is "cache_full" or "Cache is full": increase `opcache.memory_consumption` by 50%
- [ ] If error mentions "file_cache": check that the file cache directory exists and is writeable by PHP-FPM
- [ ] If error is "blacklist file not found": verify `opcache.blacklist_filename` path exists and is readable
- [ ] If error is "Interned strings buffer overflow": increase `opcache.interned_strings_buffer`
- [ ] If error occurs only on CLI: ensure `opcache.enable_cli=1` if CLI caching is intended, or disable it if not needed
- [ ] After fixing the configuration, restart PHP-FPM and verify the error is resolved
- [ ] Monitor for 24 hours to ensure the fix is stable
- [ ] Document the error, root cause, and resolution

# Performance Checklist (from 04/06)
- [ ] Error monitoring overhead: `opcache_get_status()` call is lightweight (<10Âµs). Call it periodically from monitoring scripts, not per-request.
- [ ] Log verbosity overhead: At level 1 (default), OpCache logs only critical errors â€” negligible overhead. At level 4, OpCache logs every cache operation â€” significant overhead. Never use >1 in production.
- [ ] Recovery cost: `opcache_reset()` takes <1ms. Full recompilation of all cached files takes 5â€“60 seconds depending on file count â€” this is the cost of recovering from cache-full or stale-cache scenarios.
- [ ] PHP-FPM restart cost: ~200ms process spawn + recompilation of all files. A necessary but expensive recovery step.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] error_log exposure: Ensure OpCache error logs are not publicly accessible. Log files may reveal filesystem paths and configuration details.
- [ ] compile error information: OpCache error messages include file paths and line numbers. These can reveal application structure. Control access to error logs.
- [ ] Preload script errors: A preload script error prevents PHP-FPM from starting. Ensure the preload script is tested in staging before production deployment.
- [ ] Shared memory leftover: After PHP-FPM crash, the shared memory segment may remain. An attacker could potentially read stale data. The data is compiled opcodes and interned strings â€” low sensitivity, but should be cleaned up.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `opcache_get_status(false)` and verify all error counters are zero.
- [ ] Check `cache_full` is false, `oom_restarts` and `hash_restarts` are 0.
- [ ] Verify `current_wasted_percentage` is <5%.
- [ ] Test `opcache_reset()` and verify counters reset.
- [ ] Simulate a compile error: verify OpCache caches the error state.
- [ ] Set up monitoring alerts for non-zero error counters.
- [ ] Document the error handling and recovery procedures.
- [ ] Error resolved with no recurrence for 24 hours
- [ ] Root cause documented
- [ ] Configuration fix applied and verified
- [ ] Monitoring in place to detect future errors
- [ ] Error identified from logs
- [ ] Root cause determined
- [ ] Configuration fix applied
- [ ] PHP-FPM restarted
- [ ] Error no longer present in logs
- [ ] Hit rate and cache_full monitored for 24 hours
- [ ] Resolution documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Ignoring non-zero error counters
- [ ] Avoid: Not checking OpCache status after deploy
- [ ] Avoid: Using `opcache_reset()` to fix all problems
- [ ] Avoid: Relying on `opcache_reset()` for preload changes
- [ ] Avoid: Setting `log_verbosity_level=4` in production
- [ ] Avoid anti-pattern: **Ignoring waste percentage**: `current_wasted_percentage > 5%` indicates cache thrashing. Don't dismiss it â€” increase `memory_consumption`.
- [ ] Avoid anti-pattern: **Frequent PHP-FPM restarts to "clean" OpCache**: Restarting fixes symptoms but not causes. Fix the underlying configuration or memory leak.
- [ ] Avoid anti-pattern: **Manual error log parsing**: Use structured monitoring (Prometheus, Datadog) to track OpCache metrics. Manual log parsing misses trends.
- [ ] Avoid anti-pattern: **Treating all OpCache errors as application bugs**: Some errors are configuration issues. Distinguish between "code compile error" (userland bug) and "cache full" (configuration issue).
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
**Core Concepts:** **Error indicators**: `opcache_get_status()` provides: `cache_full` (true/false), `oom_restarts` (integer), `hash_restarts` (integer), `current_wasted_percentage` (float). Non-zero restarts or high waste = configuration problems., **opcache.error_log**: If set, OpCache errors are logged to a separate file. If not set, errors go to PHP's main error log., **opcache.log_verbosity_level**: Controls OpCache's internal logging verbosity (0â€“4). Default: 1 (only critical errors). Increase to 2â€“3 for debugging, but never in production â€” high verbosity generates significant log volume., **Compile-time errors**: If a PHP file has a parse error, OpCache caches the error and reports a compile failure on every subsequent access. The file must be fixed and the cache cleared., **Preload failure**: If the preload script fails, PHP-FPM may not start, or workers may start with an incomplete preload. Errors are logged to the PHP error log.
**Rules:**
- General: Use opcache_get_status for Structured Monitoring, Not Log Parsing
**Skills:** OpCache Monitoring and Hit Rate Analysis, OpCache Memory Sizing, OpCache Overview and Configuration
**Decision Trees:** Error handling for OpCache failures
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Monitoring and Hit Rate Analysis, OpCache Memory Consumption, OpCache Max Accelerated Files, OpCache Preloading and Warmup, Deployment Cache Invalidation

