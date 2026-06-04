# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Memory Consumption â€” memory_consumption Directive, Memory Sizing by Framework, Monitoring
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `opcache_get_status(false)` and note `used_memory`, `free_memory`, `wasted_memory`.
- [ ] Calculate recommended memory_consumption: total PHP file count Ã— 10KB / 0.8.
- [ ] Verify free_memory > 20% of total. If not, increase by 50%.
- [ ] Check `cache_full` is false.
- [ ] Check `current_wasted_percentage` â€” should be <5%.
- [ ] memory_consumption sized to application: free memory >20% after warm-up
- [ ] cache_full = false
- [ ] Hit rate >99%
- [ ] Monthly monitoring in place to detect growth
- [ ] PHP file count documented
- [ ] Initial memory_consumption calculated using formula
- [ ] Value set in php.ini and PHP-FPM restarted
- [ ] Free memory verified >20% of total after warm-up
- [ ] cache_full = false confirmed
- [ ] Hit rate >99% confirmed
- [ ] Monthly monitoring configured
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Memory structure**: The allocated memory holds: hash table (mapping file paths â†’ cached entries), op_array structures (compiled opcodes per function/class), interned strings table, and cache header (locking, statistics).
- [ ] **Eviction mechanics**: When new files need caching but memory is full, OpCache marks old entries as "wasted." These entries are removed from the hash table but their memory isn't reused until PHP-FPM restart (compaction). This is why `wasted_memory` grows over time.
- [ ] **Memory fragmentation**: The shared memory segment can fragment over time as files of different sizes are added and evicted. Fragmentation increases wasted memory but doesn't affect cache correctness.
- [ ] **OOM restart**: When OpCache's memory allocator (`zend_accel_shared_alloc`) cannot satisfy an allocation, it increments `oom_restarts`. This is a restart of the OpCache internal allocator, not a PHP-FPM restart. It causes all cached files to be lost and recompiled.
- [ ] Document and follow through on architectural decision: opcache.memory_consumption value
- [ ] Ensure architecture aligns with core concept: **memory_consumption**: Total shared memory (in MB) for opcode storage. This memory is pre-allocated at PHP-FPM startup and shared across all workers.
- [ ] Ensure architecture aligns with core concept: **Per-file compiled size**: A typical PHP file compiles to ~8â€“15KB of opcodes. Framework files tend to be larger (more classes, functions) than simple scripts.
- [ ] Ensure architecture aligns with core concept: **Total memory formula**: `num_files Ã— avg_compiled_size / 0.8` (adding 20% headroom). For Laravel (20K files Ã— 10KB / 0.8 = 256MB).
- [ ] Ensure architecture aligns with core concept: **Memory monitoring**: `opcache_get_status(false)['memory_usage']` returns `used_memory`, `free_memory`, `wasted_memory`, `current_wasted_percentage`.
- [ ] Ensure architecture aligns with core concept: **cache_full indicator**: When `opcache_get_status()['cache_full']` is true, the cache has been full at some point and eviction has occurred.
- [ ] Ensure architecture aligns with core concept: **wasted_memory**: Memory that was used by files that have been evicted (not yet compacted). High wasted memory means the cache is too small.
- [ ] Ensure architecture aligns with core concept: **Shared memory persistence**: OpCache memory is never released to the OS until PHP-FPM restart. Over-allocation permanently wastes RAM.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Count PHP files in the application: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
- [ ] Estimate average compiled opcode size: 8-15KB per file for framework applications, 4-8KB for simpler applications
- [ ] Calculate initial sizing: file_count Ã— avg_compiled_size / 0.8 (20% headroom)
- [ ] For Laravel/Symfony (15K-30K files): start at 256MB
- [ ] For WordPress/Magento (5K-15K files): start at 128MB
- [ ] For small applications (<5K files): 64-128MB is sufficient
- [ ] Set `opcache.memory_consumption=<value>` in php.ini and restart PHP-FPM
- [ ] After cache warms, check `opcache_get_status()['memory_usage']['free_memory']` â€” should be >20% of total
- [ ] If free <20%, increase memory_consumption by 50% and repeat
- [ ] Set up monthly monitoring of memory usage to catch growth over time

# Performance Checklist (from 04/06)
- [ ] 1% hit rate decrease â†’ ~0.5â€“1% CPU increase from recompilation. At 80% hit rate, CPU usage is ~20â€“30% higher than at 99%.
- [ ] OpCache memory is allocated once and never released. 256MB reserved is 256MB not available for PHP workers or other processes.
- [ ] Preloading adds to memory consumption. Preloaded files consume memory from the same pool. Account for preloaded files when sizing.
- [ ] JIT uses a separate buffer (`jit_buffer_size`) but requires OpCache memory for compiled opcodes. JIT'd files consume both OpCache and JIT buffer memory.
- [ ] `opcache.file_cache` (PHP 8.5+) stores opcodes to disk, supplementing shared memory. Can reduce shared memory requirements at the cost of disk I/O on cold start.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Shared memory segments are readable by other processes on the same host (SysV IPC permissions). On shared hosting, ensure `kernel.shm_*` kernel parameters isolate tenants.
- [ ] OpCache memory contains compiled PHP code. In theory, a process with shm access could read opcodes. In practice, opcodes are PHP's internal format â€” not a meaningful security exposure.
- [ ] `memory_consumption` set too high can cause swap if total shared memory plus other processes exceeds RAM. Monitor total shared memory allocation.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `opcache_get_status(false)` and note `used_memory`, `free_memory`, `wasted_memory`.
- [ ] Calculate recommended memory_consumption: total PHP file count Ã— 10KB / 0.8.
- [ ] Verify free_memory > 20% of total. If not, increase by 50%.
- [ ] Check `cache_full` is false.
- [ ] Check `current_wasted_percentage` â€” should be <5%.
- [ ] Count PHP files: `find . -name '*.php' | wc -l` in your project.
- [ ] Document the memory_consumption value and the calculation used.
- [ ] memory_consumption sized to application: free memory >20% after warm-up
- [ ] cache_full = false
- [ ] Hit rate >99%
- [ ] Monthly monitoring in place to detect growth
- [ ] PHP file count documented
- [ ] Initial memory_consumption calculated using formula
- [ ] Value set in php.ini and PHP-FPM restarted
- [ ] Free memory verified >20% of total after warm-up
- [ ] cache_full = false confirmed
- [ ] Hit rate >99% confirmed
- [ ] Monthly monitoring configured

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting too low for framework apps
- [ ] Avoid: Setting too high for small apps
- [ ] Avoid: Not monitoring after initial config
- [ ] Avoid: Ignoring wasted memory
- [ ] Avoid anti-pattern: **Setting memory_consumption to max RAM**: OpCache memory is permanently reserved. Setting it to 4GB on a 8GB server starves other processes. Size based on actual need.
- [ ] Avoid anti-pattern: **Frequent PHP-FPM restarts to compact memory**: Restarting PHP-FPM clears OpCache entirely. The performance cost (all files recompiled) outweighs the fragmentation benefit.
- [ ] Avoid anti-pattern: **Copying settings between different applications**: A WordPress memory config is wrong for Magento. Size per-application based on its file count and compiled size.
- [ ] Guard against anti-pattern: Undersized OpCache Memory Allocation
- [ ] Guard against anti-pattern: Not Configuring max_accelerated_files
- [ ] Guard against anti-pattern: Disabling validate_timestamps in Development
- [ ] Guard against anti-pattern: Not Monitoring OpCache Hit Rate
- [ ] Guard against anti-pattern: Forgetting opcache_reset() After Deployment
- [ ] OpCache memory sized for application
- [ ] Hit rate > 99% at steady state

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
**Core Concepts:** **memory_consumption**: Total shared memory (in MB) for opcode storage. This memory is pre-allocated at PHP-FPM startup and shared across all workers., **Per-file compiled size**: A typical PHP file compiles to ~8â€“15KB of opcodes. Framework files tend to be larger (more classes, functions) than simple scripts., **Total memory formula**: `num_files Ã— avg_compiled_size / 0.8` (adding 20% headroom). For Laravel (20K files Ã— 10KB / 0.8 = 256MB)., **Memory monitoring**: `opcache_get_status(false)['memory_usage']` returns `used_memory`, `free_memory`, `wasted_memory`, `current_wasted_percentage`., **cache_full indicator**: When `opcache_get_status()['cache_full']` is true, the cache has been full at some point and eviction has occurred.
**Skills:** OpCache Max Accelerated Files Calculation, OpCache Interned Strings Configuration, OpCache Monitoring and Hit Rate Analysis
**Decision Trees:** opcache.memory_consumption value
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Overview â€” Purpose and Mechanics, Interned Strings Buffer â€” interned_strings_buffer, Max Accelerated Files Calculation, OpCache Monitoring and Hit Rate Analysis, OpCache File Cache Secondary Storage

