# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache File Cache Secondary Storage â€” opcache.file_cache, Cold-Start Mitigation, PHP 8.5+ Enhancements
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Enable `opcache.file_cache` and configure the cache directory.
- [ ] Restart PHP-FPM and verify cache files are written to the directory.
- [ ] Benchmark cold-start time: measure first request latency with and without file cache.
- [ ] Verify file cache hit rate: should be >95% after initial warmup.
- [ ] Test `opcache.file_cache_read_only=1` (PHP 8.5+): verify OpCache does not write to the directory.
- [ ] File cache configured and populated
- [ ] Cold-start latency reduced by 50-70%
- [ ] File cache directory secured (not publicly accessible)
- [ ] Shared memory remains the primary cache
- [ ] Configuration documented with rationale
- [ ] File cache directory created and writeable by PHP-FPM
- [ ] opcache.file_cache configured in php.ini
- [ ] File cache directory not publicly accessible
- [ ] File cache files (.php.bin) confirmed present after warm-up
- [ ] Container: directory survives restarts if using persistent volume
- [ ] Cold-start latency measured (should be 50-70% lower with file cache)
- [ ] Shared memory still configured as primary cache
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **File cache write**: When a file is compiled (either lazily or via preloading), OpCache writes the opcodes to the file cache directory. The file path mirrors the source path.
- [ ] **File cache read**: On cache miss in shared memory (cold start), OpCache loads the compiled opcodes from the file cache instead of recompiling. This is ~5â€“10Ã— faster than recompilation.
- [ ] **File cache in read-only mode**: `file_cache_read_only=1` means OpCache never writes to the cache directory. If a file is not in the cache, it is compiled normally (and not cached to disk). This is ideal for prebuilt caches in containers.
- [ ] **File cache validation**: When `validate_timestamps=1`, OpCache checks the source file's mtime against the cached file's mtime. If the source is newer, the cache is invalidated. When `validate_timestamps=0`, mtime checks are skipped.
- [ ] **Cache directory structure**: `/tmp/opcache/{sha1_of_path}/{file}.php.bin`. The directory structure flattens deeply nested paths using SHA-1 hashing to avoid filesystem path length limits.
- [ ] **File cache and shared memory together**: Default mode (`file_cache_only=0`): files are compiled once, stored in shared memory (primary) and file cache (secondary). After restart, shared memory is empty, but file cache is populated. First access reads from file cache, re-populating shared memory.
- [ ] Document and follow through on architectural decision: File cache usage as secondary cache
- [ ] Ensure architecture aligns with core concept: **opcache.file_cache**: Path to a directory where OpCache stores compiled opcodes as files. Each PHP file gets a corresponding file in the file cache directory.
- [ ] Ensure architecture aligns with core concept: **opcache.file_cache_only=0 (default)**: Uses shared memory as primary cache, file cache as fallback. Files load from shared memory (fast), and the file cache provides persistence across restarts.
- [ ] Ensure architecture aligns with core concept: **opcache.file_cache_only=1** (PHP 8.5+): Uses file cache ONLY â€” no shared memory. Files are compiled to disk and read from disk on every request. Eliminates shared memory overhead.
- [ ] Ensure architecture aligns with core concept: **opcache.file_cache_read_only=1** (PHP 8.5+): File cache is read-only. Files are never written to the cache â€” only read. Requires the cache to be pre-populated. Ideal for immutable containers.
- [ ] Ensure architecture aligns with core concept: **Cold-start scenario**: PHP-FPM restart â†’ OpCache memory is empty â†’ first request compiles all files â†’ slow first response. File cache speeds this up by loading from disk instead of recompiling.
- [ ] Ensure architecture aligns with core concept: **Cache file naming**: Each cached file is stored as `{cache_dir}/{file_path}.php.bin` with a directory structure mirroring the source. Cache validity is checked via file mtime.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Choose a directory for the file cache outside the web root: `/var/opcache-file-cache`
- [ ] Create the directory: `mkdir -p /var/opcache-file-cache && chown www-data:www-data /var/opcache-file-cache`
- [ ] Set `opcache.file_cache=/var/opcache-file-cache` in php.ini
- [ ] For containers: use a writable directory within the container (e.g., `/tmp/opcache-file-cache`)
- [ ] For persistent optimization: mount a volume for the file cache to survive container restarts
- [ ] Enable `opcache.file_cache_only=0` (default) â€” file cache is secondary to shared memory
- [ ] Restart PHP-FPM to apply the configuration
- [ ] Verify the file cache is populated: check the directory for `.php.bin` files
- [ ] Benchmark cold-start latency with and without file cache
- [ ] Document the file cache configuration

# Performance Checklist (from 04/06)
- [ ] File cache read: ~50â€“200Âµs per file (disk seek + read + deserialize). Shared memory read: ~5â€“10Âµs (direct pointer access). File cache is slower but much faster than recompilation (5â€“50ms).
- [ ] Cold-start latency reduction: File cache reduces cold-start from ~500msâ€“5s (full recompilation) to ~100msâ€“1s (read from file cache). A 50â€“70% improvement.
- [ ] Disk space: File cache typically uses 200â€“500MB for a large framework application. Ensure adequate disk space in the cache directory.
- [ ] File cache in shared memory only mode: Adding file cache as a fallback adds no runtime overhead (only on cold start). Always enable it.
- [ ] Container image size: Prebuilding the file cache in a Docker image adds ~200â€“500MB to the image size. Balance this against cold-start time savings.
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] File cache directory permissions: The cache directory must be writable by the web server user. Ensure it is not publicly accessible via the web root.
- [ ] Cache poisoning: If an attacker can write to the file cache directory, they could inject malicious opcodes. The directory should be protected by filesystem permissions.
- [ ] Container isolation: In multi-tenant container environments, each container should have its own file cache directory. Shared file cache across tenants could leak information about file structure.
- [ ] Read-only cache security: `file_cache_read_only=1` is more secure because OpCache never writes to the cache directory â€” eliminating the write permission attack vector.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Enable `opcache.file_cache` and configure the cache directory.
- [ ] Restart PHP-FPM and verify cache files are written to the directory.
- [ ] Benchmark cold-start time: measure first request latency with and without file cache.
- [ ] Verify file cache hit rate: should be >95% after initial warmup.
- [ ] Test `opcache.file_cache_read_only=1` (PHP 8.5+): verify OpCache does not write to the directory.
- [ ] Prebuild file cache in Docker image: verify container starts with zero compilation.
- [ ] Verify cache directory permissions are secure (not web-accessible).
- [ ] Document the file cache configuration and deployment procedure.
- [ ] File cache configured and populated
- [ ] Cold-start latency reduced by 50-70%
- [ ] File cache directory secured (not publicly accessible)
- [ ] Shared memory remains the primary cache
- [ ] Configuration documented with rationale
- [ ] File cache directory created and writeable by PHP-FPM
- [ ] opcache.file_cache configured in php.ini
- [ ] File cache directory not publicly accessible
- [ ] File cache files (.php.bin) confirmed present after warm-up
- [ ] Container: directory survives restarts if using persistent volume
- [ ] Cold-start latency measured (should be 50-70% lower with file cache)
- [ ] Shared memory still configured as primary cache

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling file cache without enough disk space
- [ ] Avoid: Using file_cache_only=1 without prebuilt cache
- [ ] Avoid: Storing file cache in a web-accessible directory
- [ ] Avoid: Forgetting to clear file cache after code changes
- [ ] Avoid: Not prebuilding file cache in Docker images
- [ ] Avoid anti-pattern: **File cache on network storage (NFS)**: File cache reads benefit from local disk speed. Network file systems add latency and variability. Use local SSD or tmpfs.
- [ ] Avoid anti-pattern: **File cache on tmpfs without prebuilding**: If file cache is on tmpfs, it's empty on every container restart unless prebuilt. Use a persistent volume or prebuild.
- [ ] Avoid anti-pattern: **Allocating both large shared memory and file cache**: With `file_cache_only=1`, you don't need large `memory_consumption`. Don't double-allocate.
- [ ] Avoid anti-pattern: **Ignoring file cache in CI/CD**: Include OpCache warm-up and file cache prebuilding in CI/CD pipeline. Automated testing should verify the cache is valid.
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
**Core Concepts:** **opcache.file_cache**: Path to a directory where OpCache stores compiled opcodes as files. Each PHP file gets a corresponding file in the file cache directory., **opcache.file_cache_only=0 (default)**: Uses shared memory as primary cache, file cache as fallback. Files load from shared memory (fast), and the file cache provides persistence across restarts., **opcache.file_cache_only=1** (PHP 8.5+): Uses file cache ONLY â€” no shared memory. Files are compiled to disk and read from disk on every request. Eliminates shared memory overhead., **opcache.file_cache_read_only=1** (PHP 8.5+): File cache is read-only. Files are never written to the cache â€” only read. Requires the cache to be pre-populated. Ideal for immutable containers., **Cold-start scenario**: PHP-FPM restart â†’ OpCache memory is empty â†’ first request compiles all files â†’ slow first response. File cache speeds this up by loading from disk instead of recompiling.
**Rules:**
- General: Delete File Cache Directory During Code Deployments
**Skills:** OpCache Overview and Configuration, Containerized Deployment Cache Strategies, Preloading Reduces Cold-Start Latency
**Decision Trees:** File cache usage as secondary cache
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Preloading and Warmup, OpCache Memory Consumption, OpCache Lifecycle and Invalidation, Deployment Cache Invalidation, Containerized PHP Deployment

