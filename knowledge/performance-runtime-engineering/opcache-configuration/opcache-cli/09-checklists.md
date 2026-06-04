# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** OpCache Configuration
**Knowledge Unit:** # OpCache CLI â€” opcache.enable_cli, CLI Script Performance, Best Practices
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Verify `opcache.enable_cli` is enabled for long-running daemons.
- [ ] Benchmark queue worker CPU usage with and without OpCache.
- [ ] Test `php -r 'opcache_reset();'` works in the deployment environment.
- [ ] Verify CLI `opcache_reset()` affects web workers (same server).
- [ ] Test `php -r 'print_r(opcache_get_status(false));'` for monitoring scripts.
- [ ] CLI OpCache enabled for workers and long-running scripts
- [ ] Worker processing throughput improved (measurable)
- [ ] File-modifying scripts handled appropriately
- [ ] Configuration documented for the team
- [ ] CLI php.ini located and modified
- [ ] opcache.enable=1 and opcache.enable_cli=1 set
- [ ] JIT configured for CLI (if applicable)
- [ ] OpCache verified active for CLI
- [ ] Worker/script restart completed
- [ ] Job processing time compared before/after
- [ ] File-modifying scripts handled (reset or excluded)
- [ ] Configuration documented
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Performance vs operational complexity**: The highest-performance settings (validate_timestamps=0, aggressive memory sizing) require more operational discipline. Choose based on team maturity and deployment automation.
- [ ] **One-size-fits-all vs per-application tuning**: Default settings are designed for compatibility, not performance. Each application requires measurement-based tuning.
- [ ] **CLI shared memory access**: When `opcache.enable_cli=1`, CLI scripts access the same shared memory segment as PHP-FPM workers. `opcache_reset()` from CLI clears the cache for ALL processes.
- [ ] **CLI preloading**: Preloading works the same as for PHP-FPM â€” a preload script is executed at PHP startup, caching files in shared memory. The preloaded files benefit all subsequent CLI and FPM executions.
- [ ] **Memory persistence**: OpCache shared memory persists across separate CLI invocations. When the first CLI script enables OpCache, the shared memory segment is created. Subsequent CLI scripts reuse it. The segment persists after CLI scripts exit (until PHP-FPM restart).
- [ ] **Process isolation**: Each CLI process has its own execution context. OpCache caches compiled opcodes in shared memory, but each process has its own variable scope, heap, and state. OpCache only caches the compiled code, not execution state.
- [ ] **CLI file cache**: When `opcache.file_cache` is enabled, CLI scripts can also benefit from file-backed caching. This is especially useful for frequently-executed CLI commands in containerized environments.
- [ ] Document and follow through on architectural decision: OpCache configuration for CLI scripts
- [ ] Ensure architecture aligns with core concept: **opcache.enable_cli=0 (default)**: OpCache is disabled for CLI SAPI. Each CLI execution compiles files from scratch. Appropriate for short-lived scripts (cron jobs, one-off commands).
- [ ] Ensure architecture aligns with core concept: **opcache.enable_cli=1**: OpCache is enabled for CLI scripts. Files are cached in shared memory, benefiting long-running processes. The OpCache persists across requests within the same process lifetime.
- [ ] Ensure architecture aligns with core concept: **CLI script lifetime**: Most CLI scripts are short-lived (seconds to minutes). OpCache overhead (shared memory allocation) exceeds the benefit for scripts that run once and exit.
- [ ] Ensure architecture aligns with core concept: **Long-running CLI processes**: Queue workers, Octane workers, Swoole servers, FrankenPHP workers â€” these processes run for hours or days. OpCache dramatically improves their performance by eliminating recompilation.
- [ ] Ensure architecture aligns with core concept: **OpCache management via CLI**: `php -r 'opcache_reset();'` is the standard way to clear the cache from deployment scripts. `opcache_get_status()` and `opcache_get_configuration()` are also accessed via CLI.
- [ ] Ensure architecture aligns with core concept: **CLI preloading**: `opcache.preload` works with CLI when `opcache.enable_cli=1`. Preloading at PHP startup (for long-running daemons) gives them the same cold-start benefit as PHP-FPM workers.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] Locate the CLI php.ini: `php -i | grep "Loaded Configuration File"` for the CLI SAPI
- [ ] Enable OpCache for CLI: `opcache.enable=1` and `opcache.enable_cli=1` in the CLI php.ini
- [ ] For long-running workers: also configure JIT with `opcache.jit=1254` and `opcache.jit_buffer_size=128M`
- [ ] Verify OpCache is enabled for CLI: `php -i | grep "opcache.enable"` should show "On"
- [ ] Test a worker or CLI script: execute it and check that OpCache is caching files
- [ ] For queue workers: restart the worker process so it picks up the new configuration
- [ ] Monitor performance: compare job processing time before and after enabling CLI OpCache
- [ ] If CLI scripts modify files (code generation): use `opcache_reset()` or disable OpCache for those specific scripts
- [ ] Document the CLI OpCache configuration

# Performance Checklist (from 04/06)
- [ ] CLI OpCache benefit: For a queue worker processing 10,000 jobs, OpCache saves ~50â€“75% CPU time that would otherwise be spent recompiling PHP files for each job.
- [ ] CLI OpCache overhead: ~1â€“5ms for initial shared memory attachment (one-time cost per CLI invocation).
- [ ] Preloading benefit for CLI: Preloaded CLI daemons start faster (no cold-start compilation). Reduces startup time by 500msâ€“5s.
- [ ] Memory cost: OpCache shared memory is allocated regardless of whether CLI or FPM uses it. If only CLI uses OpCache, the memory is dedicated to CLI.
- [ ] `opcache_reset()` in deployment: The reset call takes <1ms. The cost is the subsequent recompilation of files on next access (paid by the first process that accesses each file).
- [ ] Higher memory allocation
- [ ] validate_timestamps=0
- [ ] Larger hash table

# Security Checklist (from 04/06 - only if relevant)
- [ ] CLI reset access: Any user who can execute PHP CLI can call `opcache_reset()`. In shared hosting environments, ensure that only authorized users have CLI PHP access.
- [ ] Shared memory access across users: All PHP processes (CLI and FPM) share the same OpCache memory. A CLI script running as one user can affect the FPM cache used by another user. This is a security and isolation concern on multi-tenant systems.
- [ ] Preloading from CLI: Preloading scripts execute with the privileges of the user running the CLI command. Ensure the preload script and its files are properly permissioned.
- [ ] Just-in-time compilation exposure: OpCache debug information can reveal filesystem paths. Control access to CLI output.

# Reliability Checklist (from 04/05/06)
- [ ] **Cache thrashing**: Undersized memory causes constant eviction/recompilation. Symptom: hit rate below 95%. Mitigation: Increase memory.
- [ ] **Stale code serving**: validate_timestamps=0 without deployment automation. Symptom: Code changes don't take effect. Mitigation: Automate opcache_reset().
- [ ] **OOM from oversized cache**: Memory allocated to OpCache is permanently reserved. Oversizing can starve other processes.
- [ ] **Monitor metrics**: Track hit rate, cache_full, hash_restarts, wasted memory. Alert on deviations from baseline.
- [ ] **Automate deployment procedures**: Cache invalidation must be part of the deployment pipeline, not a manual step.
- [ ] **Test in staging**: Tuning changes should be validated in a staging environment before production.

# Testing Checklist (from 04/06)
- [ ] Verify `opcache.enable_cli` is enabled for long-running daemons.
- [ ] Benchmark queue worker CPU usage with and without OpCache.
- [ ] Test `php -r 'opcache_reset();'` works in the deployment environment.
- [ ] Verify CLI `opcache_reset()` affects web workers (same server).
- [ ] Test `php -r 'print_r(opcache_get_status(false));'` for monitoring scripts.
- [ ] Document the CLI OpCache configuration and usage patterns.
- [ ] CLI OpCache enabled for workers and long-running scripts
- [ ] Worker processing throughput improved (measurable)
- [ ] File-modifying scripts handled appropriately
- [ ] Configuration documented for the team
- [ ] CLI php.ini located and modified
- [ ] opcache.enable=1 and opcache.enable_cli=1 set
- [ ] JIT configured for CLI (if applicable)
- [ ] OpCache verified active for CLI
- [ ] Worker/script restart completed
- [ ] Job processing time compared before/after
- [ ] File-modifying scripts handled (reset or excluded)
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Enabling OpCache for all CLI scripts
- [ ] Avoid: Not enabling OpCache for long-running CLI daemons
- [ ] Avoid: Running `opcache_reset()` from CLI on a different server
- [ ] Avoid: Using CLI OpCache in development
- [ ] Avoid: Not considering CLI OpCache memory in capacity planning
- [ ] Avoid anti-pattern: **Calling `opcache_reset()` on every CLI invocation**: Reset is destructive â€” it clears the cache for all processes. Calling it frequently defeats the purpose of caching. Only reset during deployments.
- [ ] Avoid anti-pattern: **Running deployment scripts that call `opcache_reset()` without verifying**: If the reset call fails silently (e.g., PHP not found, script error), the cache is not cleared. Always verify.
- [ ] Avoid anti-pattern: **Enabling preloading for CLI on shared hosting**: Preloading can conflict with FPM preloading. Use separate configurations.
- [ ] Avoid anti-pattern: **Using OpCache to "speed up" `composer install`**: Composer operations are disk/network bound, not CPU bound. OpCache provides no meaningful benefit.
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
**Core Concepts:** **opcache.enable_cli=0 (default)**: OpCache is disabled for CLI SAPI. Each CLI execution compiles files from scratch. Appropriate for short-lived scripts (cron jobs, one-off commands)., **opcache.enable_cli=1**: OpCache is enabled for CLI scripts. Files are cached in shared memory, benefiting long-running processes. The OpCache persists across requests within the same process lifetime., **CLI script lifetime**: Most CLI scripts are short-lived (seconds to minutes). OpCache overhead (shared memory allocation) exceeds the benefit for scripts that run once and exit., **Long-running CLI processes**: Queue workers, Octane workers, Swoole servers, FrankenPHP workers â€” these processes run for hours or days. OpCache dramatically improves their performance by eliminating recompilation., **OpCache management via CLI**: `php -r 'opcache_reset();'` is the standard way to clear the cache from deployment scripts. `opcache_get_status()` and `opcache_get_configuration()` are also accessed via CLI.
**Rules:**
- General: Do Not Use OpCache to Speed Up composer install
**Skills:** JIT Configuration for Production, OpCache Overview and Configuration, OpCache Reset Strategies
**Decision Trees:** OpCache configuration for CLI scripts
**Anti-Patterns:** Undersized OpCache Memory Allocation, Not Configuring max_accelerated_files, Disabling validate_timestamps in Development, Not Monitoring OpCache Hit Rate, Forgetting opcache_reset() After Deployment
**Related Topics:** OpCache Overview â€” Purpose and Mechanics, OpCache Preloading and Warmup, OpCache File Cache Secondary Storage, Octane Architecture and Execution Model, Queue Worker Configuration

