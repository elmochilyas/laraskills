# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** OpCache Purpose and Mechanics — How Opcode Caching Eliminates Re-Compilation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Enable opcache.enable=1 in php.ini.
- [ ] Verify OpCache is active via phpinfo() or opcache_get_status().
- [ ] Set memory_consumption to 256MB+ for framework applications.
- [ ] Set max_accelerated_files to 1.5x your total PHP file count.
- [ ] Set validate_timestamps=0 in production.
- [ ] OpCache architecture understood by the team
- [ ] Throughput impact demonstrated with benchmark data
- [ ] Foundation role for further optimizations (JIT, preloading) understood
- [ ] Documentation created for ongoing reference
- [ ] Lifecycle with and without OpCache understood
- [ ] Shared memory architecture (hash table, op_array, interned strings) explained
- [ ] Throughput impact demonstrated with before/after benchmark
- [ ] Foundation role for JIT and preloading explained
- [ ] Documentation created for team reference
- [ ] **Monitoring**: Run opcache_get_status(false) via FPM status endpoint. Alert on: cache_full=true, opcache_hit_rate < 99%, oom_restarts > 0, hash_restarts > 0, current_wasted_percentage > 5%.
- [ ] **Memory sizing**: Start with 256MB for Laravel/Symfony, 128MB for WordPress. Monitor memory_usage.free_memory. If approaching zero, increase by 50%.
- [ ] **Deployment procedure**: After code deploy, always verify OpCache status. Script: deploy code â†’ opcache_reset() â†’ cache warm â†’ health check (hit rate > 99%).
- [ ] **Container considerations**: In containerized environments, use opcache.file_cache with opcache.file_cache_only=0 for faster cold starts.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **validate_timestamps=0** vs **validate_timestamps=1**: Disabling timestamps eliminates stat() calls (~1-3% CPU savings) but requires explicit cache management during deployments. Enabling timestamps simplifies deployments at a small CPU cost. Choose based on deployment frequency and automation maturity.
- [ ] **Preloading vs lazy compilation**: Preloading loads framework classes into shared memory at startup, eliminating cold-start latency for preloaded files at the cost of longer startup. Lazy compilation spreads cold-start cost across first requests. Preloading is ideal for containerized environments where startup happens once per container.
- [ ] Shared memory layout: opcache_memory header (locking, statistics), hash table mapping file paths to cached entries, op_array structures (compiled opcodes per function/class), interned strings table.
- [ ] Cache entries are lazily populated on first file access.
- [ ] Eviction uses two-phase approach: mark entries as wasted, then compact on restart.
- [ ] opcache_huge_pages maps shared memory via 2MB huge pages for reduced TLB pressure.
- [ ] Document and follow through on architectural decision: Whether to enable OpCache in production
- [ ] Document and follow through on architectural decision: OpCache vs alternative caching strategies
- [ ] Ensure architecture aligns with core concept: Without OpCache: Every request -> read file from disk -> lex to tokens -> parse to AST -> compile to opcodes -> execute. Disk I/O + CPU for compilation on every request.
- [ ] Ensure architecture aligns with core concept: With OpCache: First request -> compile and store in shared memory. Subsequent requests -> fetch opcodes from shared memory -> execute. Only file stat() overhead remains (eliminated by validate_timestamps=0).
- [ ] Ensure architecture aligns with core concept: Shared memory: OpCache stores compiled files in SysV IPC shared memory accessible by all PHP-FPM workers. No inter-process duplication.
- [ ] Ensure architecture aligns with core concept: OpCache phases: Cache population (lazy, on first access) -> cache hit -> cache eviction (when full) -> cache full detection -> reset.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Explain the PHP request lifecycle without OpCache: read file â†’ lex â†’ parse â†’ AST â†’ compile â†’ execute (60-80% of CPU on compilation)
- [ ] Explain with OpCache: first request compiles â†’ stores in shared memory â†’ subsequent requests fetch from memory â†’ execute (0% compilation on hits)
- [ ] Demonstrate the architecture: shared memory segment contains hash table (file â†’ opcode mapping), op_array structures (compiled opcodes), interned strings table (deduplicated strings)
- [ ] Show throughput impact: benchmark the application with OpCache disabled vs enabled â€” expect 2-4x improvement
- [ ] Explain the 2-4x range: default settings provide 1.5-2x; tuned settings (proper memory sizing, validate_timestamps=0) provide 2-4x
- [ ] Describe OpCache as the foundation for further optimizations: JIT reads from OpCache, preloading relies on OpCache
- [ ] Document the OpCache architecture and expected impact for the team's reference

# Performance Checklist (from 04/06)
- [ ] Default OpCache: ~1.5-2x throughput. With optimized settings: ~2-4x throughput.
- [ ] 60-80% of uncached request CPU time is compilation.
- [ ] validate_timestamps=0 saves ~1-3% additional throughput.
- [ ] Preloading compounds with OpCache for further cold-start reduction.
- [ ] validate_timestamps=0
- [ ] Preloading
- [ ] Large memory_consumption
- [ ] High max_accelerated_files

# Security Checklist (from 04/06 - only if relevant)
- [ ] No direct security implications from OpCache itself.
- [ ] Shared memory must not be accessible to untrusted processes on multi-tenant systems.
- [ ] The opcache.blacklist can prevent specific files from being cached (e.g., configuration files with secrets).

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
- [ ] Enable opcache.enable=1 in php.ini.
- [ ] Verify OpCache is active via phpinfo() or opcache_get_status().
- [ ] Set memory_consumption to 256MB+ for framework applications.
- [ ] Set max_accelerated_files to 1.5x your total PHP file count.
- [ ] Set validate_timestamps=0 in production.
- [ ] Monitor hit rate >99% after cache warms up.
- [ ] OpCache architecture understood by the team
- [ ] Throughput impact demonstrated with benchmark data
- [ ] Foundation role for further optimizations (JIT, preloading) understood
- [ ] Documentation created for ongoing reference
- [ ] Lifecycle with and without OpCache understood
- [ ] Shared memory architecture (hash table, op_array, interned strings) explained
- [ ] Throughput impact demonstrated with before/after benchmark
- [ ] Foundation role for JIT and preloading explained
- [ ] Documentation created for team reference

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not enabling OpCache
- [ ] Avoid anti-pattern: Enabling OpCache in development with validate_timestamps=1: Causes confusion when changes don't appear.
- [ ] Avoid anti-pattern: Zero optimization of OpCache settings: Defaults are conservative; always tune for your application.
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
**Core Concepts:** Without OpCache: Every request -> read file from disk -> lex to tokens -> parse to AST -> compile to opcodes -> execute. Disk I/O + CPU for compilation on every request., With OpCache: First request -> compile and store in shared memory. Subsequent requests -> fetch opcodes from shared memory -> execute. Only file stat() overhead remains (eliminated by validate_timestamps=0)., Shared memory: OpCache stores compiled files in SysV IPC shared memory accessible by all PHP-FPM workers. No inter-process duplication., OpCache phases: Cache population (lazy, on first access) -> cache hit -> cache eviction (when full) -> cache full detection -> reset.
**Skills:** OpCache Configuration Overview, OpCache Memory Sizing, Preloading Script Design Patterns, JIT Concepts and Terminology
**Decision Trees:** Whether to enable OpCache in production, OpCache vs alternative caching strategies
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Memory Sizing, Max Accelerated Files Calculation, Production Hardening Settings

