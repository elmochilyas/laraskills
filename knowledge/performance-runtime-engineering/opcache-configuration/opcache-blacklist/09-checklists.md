# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache Blacklist â€” opcache.blacklist_filename, Excluding Files from Caching
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Create the blacklist file with necessary entries.
- [ ] Verify blacklisted files are not cached: `opcache_get_status()` should not list them.
- [ ] Verify non-blacklisted files are cached normally.
- [ ] Benchmark: compare response time for blacklisted vs non-blacklisted files.
- [ ] Document each blacklist entry with the reason.
- [ ] Blacklisted files excluded from OpCache as confirmed by opcache_get_status()
- [ ] Application functions correctly without caching those files
- [ ] Hit rate regression (if any) documented and acceptable
- [ ] Each blacklisted entry has documented rationale
- [ ] Problematic files identified
- [ ] Blacklist file created with correct paths
- [ ] opcache.blacklist_filename configured in php.ini
- [ ] PHP-FPM restarted
- [ ] Blacklisted files confirmed not cached
- [ ] Application functions correctly
- [ ] Hit rate monitored for regression
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **Blacklist matching**: OpCache checks the blacklist during compilation (lazy loading or preloading). If the file path matches any pattern in the blacklist, it is not cached and is recompiled on every request.
- [ ] **Blacklist and preloading**: Blacklisted files are SKIPPED during preloading. The preload script will not compile blacklisted files.
- [ ] **Blacklist scope**: Applies to all PHP-FPM workers and all requests. Once configured, the blacklist is global.
- [ ] **Blacklist evaluation cost**: Each file access checks the path against the blacklist. The check is a simple pattern match â€” negligible overhead.
- [ ] **Blacklist reload**: Changes to the blacklist file require PHP-FPM restart. OpCache reads the blacklist once at startup.
- [ ] Document and follow through on architectural decision: Files to blacklist from OpCache
- [ ] Ensure architecture aligns with core concept: **opcache.blacklist_filename**: Path to a text file containing one file or directory pattern per line. Files matching these patterns are never cached.
- [ ] Ensure architecture aligns with core concept: **Pattern matching**: Supports exact paths and prefix matching. A trailing slash (e.g., `/path/to/dir/`) matches all files in that directory.
- [ ] Ensure architecture aligns with core concept: **Per-request recompilation**: Blacklisted files are compiled on every request. This is slow â€” only blacklist files that absolutely cannot be cached.
- [ ] Ensure architecture aligns with core concept: **Blacklist vs not caching**: Without OpCache entirely, ALL files are recompiled per request. With a blacklist, only listed files are recompiled â€” the rest benefit from caching.
- [ ] Ensure architecture aligns with core concept: **Common use cases**: Development-only scripts, files with `include`/`require` of dynamically-generated files, files that check `__FILE__` or `__DIR__` and behave differently when cached.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Identify the problematic files: check error logs for OpCache-related errors, or identify files that should not be cached
- [ ] Create a blacklist file (plain text, one file path per line): `echo "/path/to/file.php >> /etc/php/opcache-blacklist.txt"`
- [ ] Set `opcache.blacklist_filename=/etc/php/opcache-blacklist.txt` in php.ini
- [ ] Restart PHP-FPM to apply the blacklist
- [ ] Verify the files are not cached: `opcache_get_status(false)['scripts']` should not include blacklisted files
- [ ] Verify the application still functions correctly without those files being cached
- [ ] Monitor hit rate: blacklisting files reduces the total cacheable file count but may slightly decrease hit rate
- [ ] Document the blacklisted files and the reason for each exclusion

# Performance Checklist (from 04/06)
- [ ] Blacklisted file performance: 50â€“75% slower than cached (recompilation on every request). Only blacklist when necessary.
- [ ] Blacklist check overhead: ~1â€“5Âµs per file access â€” negligible.
- [ ] Blacklist size impact: A blacklist with 1000 entries still has negligible check overhead (prefix matching is O(n) but n is small).
- [ ] If multiple files in a directory are blacklisted, use a directory pattern (trailing slash) for slightly faster matching.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] Blacklisting security-critical files: Do not blacklist authentication, authorization, or validation files â€” they need the performance benefit of caching.
- [ ] Blacklist file permissions: The blacklist file should be readable only by the web server user. It contains filesystem path patterns (low sensitivity).
- [ ] Temporary file exposure: If uploaded files in a temp directory are accidentally PHP files, the blacklist prevents them from being cached (but does not prevent execution â€” secure the directory separately).

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Create the blacklist file with necessary entries.
- [ ] Verify blacklisted files are not cached: `opcache_get_status()` should not list them.
- [ ] Verify non-blacklisted files are cached normally.
- [ ] Benchmark: compare response time for blacklisted vs non-blacklisted files.
- [ ] Document each blacklist entry with the reason.
- [ ] Schedule quarterly blacklist review.
- [ ] Blacklisted files excluded from OpCache as confirmed by opcache_get_status()
- [ ] Application functions correctly without caching those files
- [ ] Hit rate regression (if any) documented and acceptable
- [ ] Each blacklisted entry has documented rationale
- [ ] Problematic files identified
- [ ] Blacklist file created with correct paths
- [ ] opcache.blacklist_filename configured in php.ini
- [ ] PHP-FPM restarted
- [ ] Blacklisted files confirmed not cached
- [ ] Application functions correctly
- [ ] Hit rate monitored for regression

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Blacklisting instead of fixing broken code
- [ ] Avoid: Blacklisting too many files
- [ ] Avoid: Using relative paths in blacklist
- [ ] Avoid: Adding files to blacklist without documentation
- [ ] Avoid: Forgetting to remove blacklisted files after a code fix
- [ ] Avoid anti-pattern: **Using blacklist as a development tool**: The blacklist is not for development. Use `validate_timestamps=1` for development environments.
- [ ] Avoid anti-pattern: **Blacklisting for "better debugging"**: If you need to debug a file, disable OpCache temporarily or set `opcache.enable=0`. The blacklist is for specific edge cases, not general debugging.
- [ ] Avoid anti-pattern: **Blacklisting files that use `include` with relative paths**: Fix the include path. Use `__DIR__ . '/relative/file.php'` to make includes work regardless of caching.
- [ ] Avoid anti-pattern: **Blacklisting files that check `filemtime()`**: If a file reads its own modification time, it should use the source file path, not the cached path. Fix the code.
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
**Core Concepts:** **opcache.blacklist_filename**: Path to a text file containing one file or directory pattern per line. Files matching these patterns are never cached., **Pattern matching**: Supports exact paths and prefix matching. A trailing slash (e.g., `/path/to/dir/`) matches all files in that directory., **Per-request recompilation**: Blacklisted files are compiled on every request. This is slow â€” only blacklist files that absolutely cannot be cached., **Blacklist vs not caching**: Without OpCache entirely, ALL files are recompiled per request. With a blacklist, only listed files are recompiled â€” the rest benefit from caching., **Common use cases**: Development-only scripts, files with `include`/`require` of dynamically-generated files, files that check `__FILE__` or `__DIR__` and behave differently when cached.
**Rules:**
- General: Do Not Use Blacklist as a Development or Debugging Tool
**Skills:** OpCache Monitoring and Hit Rate Analysis, OpCache Overview and Configuration, Production Hardening Settings
**Decision Trees:** Files to blacklist from OpCache
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Overview â€” Purpose and Mechanics, OpCache Revalidation Frequency â€” validate_timestamps, OpCache Preloading and Warmup, OpCache Error Handling

