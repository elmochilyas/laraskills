# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Interned Strings â€” interned_strings_buffer, String Deduplication, Memory Savings
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Run `opcache_get_status(false)['interned_strings_usage']` and check `used_memory`.
- [ ] Calculate utilization: `used_memory / (interned_strings_buffer Ã— 1MB)`. If >80%, increase.
- [ ] Verify interned strings are shared: `$a = 'hello'; $b = 'hello';` â€” compare `spl_object_id()`.
- [ ] Check that framework class names are interned (they appear as string literals).
- [ ] Document the interned_strings_buffer value and monitoring approach.
- [ ] interned_strings_buffer sized appropriately for the application
- [ ] No conflict between opcode cache and interned strings memory
- [ ] Hit rate >99% maintained
- [ ] Value documented with rationale
- [ ] interned_strings_buffer set to 16-64MB based on application size
- [ ] PHP-FPM restarted after configuration change
- [ ] Memory consumption monitored to ensure no conflict between opcode cache and interned strings
- [ ] Hit rate maintained >99% after configuration
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **String lifecycle**: At PHP startup (compilation phase), all string literals are added to the interned strings table. The string is stored once; all references point to it via pointer equality.
- [ ] **Interning across workers**: Interned strings are stored in shared memory accessible by all PHP-FPM workers. Worker A and Worker B referencing `"App\Models\User"` use the same memory.
- [ ] **Wasted interned strings**: When the buffer fills, new strings cannot be interned. They are stored in per-request memory instead. This wastes the buffer space occupied by less-frequently-used strings, but no strings are evicted.
- [ ] **Interning during preloading**: Strings from preloaded files are interned at startup. The preload script can trigger interning of additional strings that wouldn't normally be literals.
- [ ] **Hash caching on interned strings**: The `zend_string::hash` field stores the pre-computed hash. This speeds up HashTable lookups when the string is used as an array key (common for class names in autoloading and service container resolution).
- [ ] Document and follow through on architectural decision: interned_strings_buffer value
- [ ] Ensure architecture aligns with core concept: **Interned strings**: String literals (class names, function names, method names, string constants, string literals in code) stored once in shared memory. All PHP files share the same interned string table.
- [ ] Ensure architecture aligns with core concept: **Deduplication**: When two PHP files reference the string `"App\Models\User"`, they share the same `zend_string` pointer. Without interning, each file would store its own copy.
- [ ] Ensure architecture aligns with core concept: **interned_strings_buffer**: Size in MB of the interned strings buffer. Default: 8MB. Recommended: 16â€“64MB for framework applications.
- [ ] Ensure architecture aligns with core concept: **Separate from memory_consumption**: Interned strings use their own memory pool. Not freed until PHP-FPM restart. Independent of the opcode cache eviction cycle.
- [ ] Ensure architecture aligns with core concept: **Scope of interning**: String literals declared at compile time. Dynamically generated strings (`"User_{$id}"`) are NOT interned.
- [ ] Ensure architecture aligns with core concept: **Pre-computed hashes**: Each interned string has its hash cached in the `zend_string::hash` field. When used as array keys, hash computation is skipped â€” saving ~50â€“100ns per lookup.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Set `opcache.interned_strings_buffer=16` as a starting value for most applications
- [ ] For framework applications (Laravel, Symfony, Magento): set to 32MB to accommodate class/method name deduplication
- [ ] For large applications with many packages (Magento, Drupal with many modules): set to 64MB
- [ ] For small applications (WordPress, custom sites): 8-16MB is sufficient
- [ ] Restart PHP-FPM and let the cache warm up under production traffic
- [ ] Monitor interned strings usage: not directly available via opcache_get_status() â€” monitor overall memory usage pattern
- [ ] If opcache memory usage is high and hit rate is <99%, check if interned strings buffer is competing with opcode cache
- [ ] If the sum of memory_consumption + interned_strings_buffer exceeds available memory, increase memory_consumption
- [ ] Document the interned strings buffer value and rationale

# Performance Checklist (from 04/06)
- [ ] Interned string lookup: O(1) hash table lookup in the interned strings table.
- [ ] Hash caching benefit: ~50â€“100ns saved per array key access using an interned string. Significant for framework autoloading and service container lookups.
- [ ] Buffer undersizing: When full, new strings are not interned. They use per-request allocation (more memory, no deduplication). The already-interned strings are unaffected.
- [ ] Buffer oversizing: No performance penalty beyond reserved RAM. 32MB buffer that's only 30% used still reserves 32MB.
- [ ] Memory comparison: Without interning, `"App\Models\User"` appearing in 1000 files uses ~1000 Ã— 35 bytes = 35KB. With interning, it uses 35 bytes total â€” a 1000Ã— reduction for that string.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Interned strings contain all string literals from all PHP files. In theory, a process with access to shared memory could read them. In practice, this is not a security concern.
- [ ] No dynamic data (user input, database results, session data) is interned. Interned strings only contain compile-time literals.
- [ ] Preloading scripts execute with full PHP privileges. If the preload script generates strings dynamically, those are not interned (runtime strings are per-request).

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Run `opcache_get_status(false)['interned_strings_usage']` and check `used_memory`.
- [ ] Calculate utilization: `used_memory / (interned_strings_buffer Ã— 1MB)`. If >80%, increase.
- [ ] Verify interned strings are shared: `$a = 'hello'; $b = 'hello';` â€” compare `spl_object_id()`.
- [ ] Check that framework class names are interned (they appear as string literals).
- [ ] Document the interned_strings_buffer value and monitoring approach.
- [ ] interned_strings_buffer sized appropriately for the application
- [ ] No conflict between opcode cache and interned strings memory
- [ ] Hit rate >99% maintained
- [ ] Value documented with rationale
- [ ] interned_strings_buffer set to 16-64MB based on application size
- [ ] PHP-FPM restarted after configuration change
- [ ] Memory consumption monitored to ensure no conflict between opcode cache and interned strings
- [ ] Hit rate maintained >99% after configuration

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting `interned_strings_buffer` too low for framework apps
- [ ] Avoid: Confusing interned_strings_buffer with memory_consumption
- [ ] Avoid: Setting interned_strings_buffer very large (256MB)
- [ ] Avoid: Not considering preloaded strings
- [ ] Avoid anti-pattern: **Interned_strings_buffer as a tuning lever for performance**: Increasing the buffer does not directly improve throughput. The benefit is memory deduplication and hash caching. Only increase if monitoring shows the buffer is full.
- [ ] Avoid anti-pattern: **Over-reserving in memory-constrained environments**: In containers with 256MB RAM total, a 64MB interned strings buffer is 25% of memory. Reserve conservatively.
- [ ] Avoid anti-pattern: **Ignoring interned strings monitoring**: The `interned_strings_usage` section of `opcache_get_status()` provides detailed data. Use it.
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
**Core Concepts:** **Interned strings**: String literals (class names, function names, method names, string constants, string literals in code) stored once in shared memory. All PHP files share the same interned string table., **Deduplication**: When two PHP files reference the string `"App\Models\User"`, they share the same `zend_string` pointer. Without interning, each file would store its own copy., **interned_strings_buffer**: Size in MB of the interned strings buffer. Default: 8MB. Recommended: 16â€“64MB for framework applications., **Separate from memory_consumption**: Interned strings use their own memory pool. Not freed until PHP-FPM restart. Independent of the opcode cache eviction cycle., **Scope of interning**: String literals declared at compile time. Dynamically generated strings (`"User_{$id}"`) are NOT interned.
**Skills:** OpCache Memory Sizing, OpCache Monitoring and Hit Rate Analysis, OpCache Configuration Overview
**Decision Trees:** interned_strings_buffer value
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Consumption â€” memory_consumption, OpCache Max Accelerated Files, String Memory Usage â€” zend_string structure, OpCache Preloading and Warmup, OpCache Monitoring

