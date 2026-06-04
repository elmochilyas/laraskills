# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** Shared-Nothing Architecture — PHP-FPM Process-Per-Request Model
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Understand the tradeoff**: Shared-nothing maximizes safety (no request can corrupt another) at the cost of performance. Choose based on your workload's priority.
- [ ] **Optimize within the model**: OpCache tuning, preloading, and Composer optimization reduce bootstrap cost even within the shared-nothing model.
- [ ] **Consider Octane for fast endpoints**: If bootstrap is 60-80% of request time, memory-resident architecture provides 3-15x throughput gains.
- [ ] **Don't fight the model**: Trying to share state across FPM workers (APCu, shared memory) violates the architecture and introduces subtle bugs.
- [ ] Architecture choice matches workload priority (isolation vs performance)
- [ ] If using shared-nothing: OpCache, preloading, and Composer optimization applied
- [ ] If considering Octane: bootstrap cost measured and confirmed > 20% of request time
- [ ] No cross-request state sharing attempted via APCu or shared memory
- [ ] Understanding of the isolation vs performance tradeoff demonstrated
- [ ] Bootstrap time reduced by 40-60% through OpCache + preloading + Composer optimization
- [ ] Throughput improvement measured and documented (typically 1.5-3x)
- [ ] Deployment automation includes cache invalidation
- [ ] Decision documented: stay on FPM or migrate to memory-resident based on remaining bootstrap overhead
- [ ] OpCache enabled and hit rate >99%
- [ ] OpCache memory sized correctly (free >20% after warm-up)
- [ ] `validate_timestamps=0` configured in production
- [ ] Composer autoloader optimized (`--classmap-authoritative`)
- [ ] Preloading configured and verified
- [ ] Bootstrap time measured and compared before/after
- [ ] Deployment automation includes opcache_reset() step

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] Document and follow through on architectural decision: Shared-nothing (FPM) vs memory-resident (Octane)
- [ ] Document and follow through on architectural decision: Whether to share state across FPM workers
- [ ] Document and follow through on architectural decision: How to optimize bootstrap within shared-nothing
- [ ] Ensure architecture aligns with core concept: **Process-per-request**: Each PHP-FPM worker handles one request, then becomes available for the next.
- [ ] Ensure architecture aligns with core concept: **No state sharing**: Class definitions, variables, connections are destroyed when the request ends.
- [ ] Ensure architecture aligns with core concept: **Memory isolation**: A crash in one worker never affects other workers or requests.
- [ ] Ensure architecture aligns with core concept: **Bootstrap cost**: Every request re-executes autoloading, service container construction, config loading.
- [ ] Ensure architecture aligns with core concept: **Framework overhead dominance**: For sub-50ms API requests, bootstrap accounts for 60-80% of total time.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Understand the tradeoff**: Shared-nothing maximizes safety (no request can corrupt another) at the cost of performance. Choose based on your workload's priority.
- [ ] **Optimize within the model**: OpCache tuning, preloading, and Composer optimization reduce bootstrap cost even within the shared-nothing model.
- [ ] **Consider Octane for fast endpoints**: If bootstrap is 60-80% of request time, memory-resident architecture provides 3-15x throughput gains.
- [ ] **Don't fight the model**: Trying to share state across FPM workers (APCu, shared memory) violates the architecture and introduces subtle bugs.
- [ ] Profile the application to measure bootstrap time as percentage of wall time
- [ ] Enable OpCache with `opcache.enable=1` if not already enabled â€” this is the highest-ROI single change
- [ ] Size OpCache memory: count PHP files, multiply by 10KB average compiled size, add 20% headroom
- [ ] Set `opcache.max_accelerated_files` to 1.5x the PHP file count (rounded to nearest prime)
- [ ] Set `opcache.validate_timestamps=0` in production to eliminate stat() syscalls
- [ ] Configure Composer autoloader optimization: `composer install --optimize-autoloader --classmap-authoritative`
- [ ] Enable preloading: identify frequently-loaded classes from profiling and create a preload script
- [ ] Set `opcache.preload=/path/to/preload.php` in php.ini
- [ ] Benchmark before/after each optimization to measure individual impact
- [ ] Document the optimized configuration and expected bootstrap time reduction

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] Complete process isolation prevents data leakage between requests
- [ ] A crash in one worker never affects other requests or workers
- [ ] Residual memory in a worker process is cleared when the worker is recycled
- [ ] No shared state means no cross-request contamination of authentication or session data

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Architecture choice matches workload priority (isolation vs performance)
- [ ] If using shared-nothing: OpCache, preloading, and Composer optimization applied
- [ ] If considering Octane: bootstrap cost measured and confirmed > 20% of request time
- [ ] No cross-request state sharing attempted via APCu or shared memory
- [ ] Understanding of the isolation vs performance tradeoff demonstrated
- [ ] Bootstrap time reduced by 40-60% through OpCache + preloading + Composer optimization
- [ ] Throughput improvement measured and documented (typically 1.5-3x)
- [ ] Deployment automation includes cache invalidation
- [ ] Decision documented: stay on FPM or migrate to memory-resident based on remaining bootstrap overhead
- [ ] OpCache enabled and hit rate >99%
- [ ] OpCache memory sized correctly (free >20% after warm-up)
- [ ] `validate_timestamps=0` configured in production
- [ ] Composer autoloader optimized (`--classmap-authoritative`)
- [ ] Preloading configured and verified
- [ ] Bootstrap time measured and compared before/after
- [ ] Deployment automation includes opcache_reset() step

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Understand the tradeoff**: Shared-nothing maximizes safety (no request can corrupt another) at the cost of performance. Choose based on your workload's priority.
- [ ] **Optimize within the model**: OpCache tuning, preloading, and Composer optimization reduce bootstrap cost even within the shared-nothing model.
- [ ] **Consider Octane for fast endpoints**: If bootstrap is 60-80% of request time, memory-resident architecture provides 3-15x throughput gains.
- [ ] **Don't fight the model**: Trying to share state across FPM workers (APCu, shared memory) violates the architecture and introduces subtle bugs.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Treating shared-nothing as a performance feature
- [ ] Avoid: Trying to share state across workers
- [ ] Avoid: Not optimizing bootstrap
- [ ] Avoid: Migrating to Octane without audit
- [ ] Avoid anti-pattern: **Forcing state sharing across FPM workers**: APCu, shared memory, and file-based state sharing violate the shared-nothing model. Use external services (Redis, database) for cross-request state.
- [ ] Avoid anti-pattern: **Using shared-nothing for everything**: High-throughput APIs pay an unnecessary bootstrap tax. Match architecture to workload.
- [ ] Avoid anti-pattern: **Over-isolating**: Not every application needs process-level isolation. For dedicated API servers, memory-resident architecture is safer and faster.
- [ ] Guard against anti-pattern: Forcing State Sharing Across FPM Workers
- [ ] Guard against anti-pattern: Treating Shared-Nothing as a Performance Feature
- [ ] Guard against anti-pattern: Using Shared-Nothing for Everything
- [ ] Guard against anti-pattern: Not Optimizing Bootstrap Within the Model
- [ ] Guard against anti-pattern: Fighting the Model with State Workarounds
- [ ] APCu usage audited â€” no mutable cross-worker data
- [ ] Redis used for all shared mutable cache

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Process-per-request**: Each PHP-FPM worker handles one request, then becomes available for the next., **No state sharing**: Class definitions, variables, connections are destroyed when the request ends., **Memory isolation**: A crash in one worker never affects other workers or requests., **Bootstrap cost**: Every request re-executes autoloading, service container construction, config loading., **Framework overhead dominance**: For sub-50ms API requests, bootstrap accounts for 60-80% of total time.
**Skills:** OpCache Configuration and Sizing, Preloading Script Design Patterns, Composer Autoloader Optimization
**Decision Trees:** Shared-nothing (FPM) vs memory-resident (Octane), Whether to share state across FPM workers, How to optimize bootstrap within shared-nothing
**Anti-Patterns:** Forcing State Sharing Across FPM Workers, Treating Shared-Nothing as a Performance Feature, Using Shared-Nothing for Everything, Not Optimizing Bootstrap Within the Model, Fighting the Model with State Workarounds
**Related Topics:** Memory-Resident Architecture, Concurrency Models, PHP-FPM Process Manager Modes, Laravel Octane Architecture, Web Server Architectures

