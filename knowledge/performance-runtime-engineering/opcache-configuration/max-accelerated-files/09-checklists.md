# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Max Accelerated Files â€” max_accelerated_files, Hash Table Prime Numbers, File Counting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Count all PHP files: `find . -name '*.php' | wc -l`.
- [ ] Verify `max_accelerated_files` â‰¥ 1.5Ã— total file count.
- [ ] Check `opcache_get_status()['opcache_statistics']['hash_restarts']` â€” should be 0.
- [ ] Check `opcache_get_status()['opcache_statistics']['max_accelerated_files']` â€” shows the rounded value.
- [ ] Document the file count and chosen max_accelerated_files value.
- [ ] max_accelerated_files set to appropriate value for application size
- [ ] Hit rate >99% confirmed
- [ ] Headroom for growth maintained (1.5x multiplier)
- [ ] Calculation documented for future reference
- [ ] PHP file count documented
- [ ] max_accelerated_files set to valid prime number >= 1.5x file count
- [ ] PHP-FPM restarted
- [ ] Value documented with calculation rationale
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Hash table mechanics**: OpCache maps each cached file to a hash table bucket. The bucket index is: `hash(file_path) % max_accelerated_files` (using the nearest prime). When two files map to the same bucket, a collision chain forms.
- [ ] **Collision chain impact**: Long collision chains slow down cache lookups. At the default 10,000 entries with 20,000 files, collisions are common. At 40,000 entries for 20,000 files (double size), collisions are rare.
- [ ] **Cache eviction with hash full**: When the hash table is full (file count exceeds `max_accelerated_files`), OpCache must evict existing entries to make room. This causes recompilation when those files are accessed again.
- [ ] **Prime number rounding**: If you set `max_accelerated_files=20000`, OpCache rounds to the nearest prime (likely 20021 or similar). The hash table is sized at the prime number, not 20000.
- [ ] **Speed vs size tradeoff**: Larger hash tables have fewer collisions but use more memory and have slightly slower hash computation. The difference is negligible â€” prioritize avoiding eviction over hash table speed.
- [ ] Document and follow through on architectural decision: max_accelerated_files value
- [ ] Ensure architecture aligns with core concept: **max_accelerated_files**: Maximum number of unique file entries in the OpCache hash table. Default: 10,000. Range: 200â€“1,000,000.
- [ ] Ensure architecture aligns with core concept: **Hash table sizing**: OpCache rounds `max_accelerated_files` to the nearest prime number for optimal hash distribution. Prime sizes reduce hash collisions.
- [ ] Ensure architecture aligns with core concept: **Known prime sizes**: 200, 400, 600, 800, 1000, 2000, ..., 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000.
- [ ] Ensure architecture aligns with core concept: **Hash collision**: When two file paths hash to the same bucket. More collisions = slower lookups. A prime-numbered hash table size minimizes collisions.
- [ ] Ensure architecture aligns with core concept: **hash_restarts**: Counter in `opcache_get_status()` that increments when hash table-related memory allocation fails. Indicates `max_accelerated_files` is set too low.
- [ ] Ensure architecture aligns with core concept: **File count calculation**: Count all PHP files your application loads, including vendor/, packages/, config/, and generated files (cached routes, compiled views, Doctrine proxies).
- [ ] Ensure architecture aligns with core concept: **Headroom**: Set `max_accelerated_files` to 1.5â€“2Ã— your total file count to accommodate growth and temporary files.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Count the total number of PHP files in the application including vendor directory: `Get-ChildItem -Recurse -Filter *.php | Measure-Object | Select-Object Count`
- [ ] Multiply the file count by 1.5 to provide 50% headroom for growth
- [ ] Round up to the nearest prime number from PHP's valid values: 10000, 20000, 30000, 40000, 50000, 100000
- [ ] Set `opcache.max_accelerated_files=<selected_value>` in php.ini
- [ ] For Laravel/Symfony with vendor (20K-40K files): use 40000 or 50000
- [ ] For WordPress (5K-10K files): use 10000 or 20000
- [ ] For Magento (30K-60K files): use 100000
- [ ] Restart PHP-FPM and verify hit rate >99%
- [ ] Document the selected value and the calculation

# Performance Checklist (from 04/06)
- [ ] Hash table lookup: O(1) average, O(n) worst-case for collision chains. At 2Ã— file count, collisions are rare.
- [ ] Cache eviction cost: An evicted file must be recompiled on next access. Recompilation takes 5â€“50ms per file depending on size.
- [ ] Hash table memory: Each entry adds ~100 bytes (hash, file path pointer, op_array pointer). 40,000 entries = ~4MB. Negligible compared to the opcode storage itself.
- [ ] `hash_restarts` impact: Each restart clears some file entries. The affected files are recompiled, adding CPU load and latency for those requests.
- [ ] Prime rounding precision: Setting values that are already close to a prime (e.g., 20000 â†’ 20021) is fine. Setting values that round to a much larger prime wastes a few entries but doesn't harm performance.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Hash collision attacks: In theory, an attacker could craft file paths that produce hash collisions, slowing down OpCache lookups. PHP uses randomized hash seeding (added in PHP 5.4) to prevent this.
- [ ] No direct security exposure: `max_accelerated_files` configuration does not affect security boundaries.
- [ ] Deployment safety: After adding many files in a deployment, ensure `max_accelerated_files` is sufficient. Files exceeding the limit won't be cached, increasing CPU usage.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Count all PHP files: `find . -name '*.php' | wc -l`.
- [ ] Verify `max_accelerated_files` â‰¥ 1.5Ã— total file count.
- [ ] Check `opcache_get_status()['opcache_statistics']['hash_restarts']` â€” should be 0.
- [ ] Check `opcache_get_status()['opcache_statistics']['max_accelerated_files']` â€” shows the rounded value.
- [ ] Document the file count and chosen max_accelerated_files value.
- [ ] Schedule quarterly file count reviews.
- [ ] max_accelerated_files set to appropriate value for application size
- [ ] Hit rate >99% confirmed
- [ ] Headroom for growth maintained (1.5x multiplier)
- [ ] Calculation documented for future reference
- [ ] PHP file count documented
- [ ] max_accelerated_files set to valid prime number >= 1.5x file count
- [ ] PHP-FPM restarted
- [ ] Value documented with calculation rationale

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Setting `max_accelerated_files` based on guesswork
- [ ] Avoid: Setting it very high (100000) "to be safe"
- [ ] Avoid: Not counting generated files
- [ ] Avoid: Forgetting to update after package additions
- [ ] Avoid: Setting a non-prime value that rounds down
- [ ] Avoid anti-pattern: **Setting max_accelerated_files below total file count**: At best, some files are never cached. At worst, frequently-used files are evicted and recompiled. Always set â‰¥ total file count.
- [ ] Avoid anti-pattern: **Zero or very low values**: Values below 200 cause extreme cache churn. Minimum recommended: 10000.
- [ ] Avoid anti-pattern: **Copying values from other applications**: A WordPress max_accelerated_files (5000) is wrong for Magento (100000+). Size per-application.
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
**Core Concepts:** **max_accelerated_files**: Maximum number of unique file entries in the OpCache hash table. Default: 10,000. Range: 200â€“1,000,000., **Hash table sizing**: OpCache rounds `max_accelerated_files` to the nearest prime number for optimal hash distribution. Prime sizes reduce hash collisions., **Known prime sizes**: 200, 400, 600, 800, 1000, 2000, ..., 10000, 20000, 40000, 60000, 80000, 100000, 200000, 400000, 600000, 800000, 1000000., **Hash collision**: When two file paths hash to the same bucket. More collisions = slower lookups. A prime-numbered hash table size minimizes collisions., **hash_restarts**: Counter in `opcache_get_status()` that increments when hash table-related memory allocation fails. Indicates `max_accelerated_files` is set too low.
**Skills:** OpCache Memory Sizing, OpCache Monitoring and Hit Rate Analysis, PHP File Count Estimation
**Decision Trees:** max_accelerated_files value
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Consumption, OpCache Monitoring and Hit Rate Analysis, OpCache Revalidation Frequency, OpCache File Cache Secondary Storage

