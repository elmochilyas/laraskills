# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Deployment Cache Invalidation Landscape
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always invalidate OpCache after deployment**: With validate_timestamps=0 (production best practice), OpCache never checks for changes. Explicit invalidation is mandatory.
- [ ] **Restart PHP-FPM after preloading changes**: opcache_reset() does NOT refresh preloaded classes. Only a full restart re-executes the preloading script.
- [ ] **Use graceful reload for PHP-FPM**: kill -USR2 (or systemctl reload) restarts workers without dropping connections. Never use SIGTERM for production deployments.
- [ ] **Coordinate with load balancer**: Drain connections before restarting when preloading changes. This prevents connection drops during the brief window of full restart.
- [ ] **Warm caches after invalidation**: Run warm-up requests on critical endpoints after reset to prevent slow first-user experience.
- [ ] All cache types identified (OpCache, preloading, worker, runtime)
- [ ] Invalidation procedure defined for each cache type
- [ ] Deployment script follows correct invalidation sequence
- [ ] Cache warm step included after invalidation
- [ ] Health check verifies successful invalidation
- [ ] All caching layers identified and invalidated in correct order
- [ ] Each invalidation verified (not assumed)
- [ ] Preloading changes handled with full restart and load balancer drain
- [ ] Cache warm-up prevents first-user cold-start
- [ ] Rollback procedure follows the same sequence in reverse
- [ ] Deployment runbook documents the complete invalidation procedure
- [ ] All caching layers identified (OpCache, preloading, config, route, view, events)
- [ ] Invalidation sequence documented and correct
- [ ] Each step verified (not just assumed)
- [ ] Preloading changes handled with full restart

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Cache Invalidation Taxonomy**: OpCache (shared memory opcodes), Preloading (class definitions), Worker state (process memory), Alternative runtime (Octane worker state). Each requires different handling.
- [ ] **Deployment Step Sequence**: Code deploy â†’ OpCache reset â†’ Preload refresh (if changed) â†’ Worker restart â†’ Cache warm â†’ Health check â†’ Traffic enable. Each step must succeed before the next begins.
- [ ] **Atomicity**: Code deployment should use symlink swaps for atomic file replacement. Partial reads of mixed code versions cause fatal errors.
- [ ] Document and follow through on architectural decision: Understanding which caches need invalidation on deployment
- [ ] Ensure architecture aligns with core concept: **OpCache Invalidation**: opcache_reset() (full) or opcache_invalidate() (per-file). Required when validate_timestamps=0. Must be called on every PHP-FPM worker via cachetool CLI.
- [ ] Ensure architecture aligns with core concept: **Preloading Invalidation**: Full PHP-FPM restart required. Preloaded classes are loaded at startup. No partial invalidation possible.
- [ ] Ensure architecture aligns with core concept: **PHP-FPM Worker State**: Graceful reload (USR2 signal) restarts workers one-by-one. Each new worker has fresh state.
- [ ] Ensure architecture aligns with core concept: **Octane Worker State**: `php artisan octane:reload` gracefully restarts workers. OpCache also needs reset if code changed.
- [ ] Ensure architecture aligns with core concept: **Deployment Ordering**: Deploy code â†’ OpCache reset â†’ Preloading reload â†’ Worker reload â†’ Health check â†’ Enable traffic.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always invalidate OpCache after deployment**: With validate_timestamps=0 (production best practice), OpCache never checks for changes. Explicit invalidation is mandatory.
- [ ] **Restart PHP-FPM after preloading changes**: opcache_reset() does NOT refresh preloaded classes. Only a full restart re-executes the preloading script.
- [ ] **Use graceful reload for PHP-FPM**: kill -USR2 (or systemctl reload) restarts workers without dropping connections. Never use SIGTERM for production deployments.
- [ ] **Coordinate with load balancer**: Drain connections before restarting when preloading changes. This prevents connection drops during the brief window of full restart.
- [ ] **Warm caches after invalidation**: Run warm-up requests on critical endpoints after reset to prevent slow first-user experience.

# Performance Checklist (from 04/06)
- [ ] OpCache reset causes 100% miss rate until caches warm (30-120 seconds)
- [ ] PHP-FPM graceful reload finishes current requests before spawning new workers
- [ ] Preloading requires full restart â€” drops in-flight connections unless coordinated with load balancer
- [ ] Container cold start: 5-30s due to OpCache warm-up
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] opcache_reset() web endpoints must be protected (internal network only, authentication required)
- [ ] Preloading script changes can introduce class-not-found errors if not properly tested
- [ ] Rolling deployments with mixed versions require backward-compatible database schemas

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] All cache types identified (OpCache, preloading, worker, runtime)
- [ ] Invalidation procedure defined for each cache type
- [ ] Deployment script follows correct invalidation sequence
- [ ] Cache warm step included after invalidation
- [ ] Health check verifies successful invalidation
- [ ] Load balancer drain configured for preloading updates
- [ ] Rollback procedure tested and documented
- [ ] All caching layers identified and invalidated in correct order
- [ ] Each invalidation verified (not assumed)
- [ ] Preloading changes handled with full restart and load balancer drain
- [ ] Cache warm-up prevents first-user cold-start
- [ ] Rollback procedure follows the same sequence in reverse
- [ ] Deployment runbook documents the complete invalidation procedure
- [ ] All caching layers identified (OpCache, preloading, config, route, view, events)
- [ ] Invalidation sequence documented and correct
- [ ] Each step verified (not just assumed)
- [ ] Preloading changes handled with full restart
- [ ] Load balancer drain configured for full restarts

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always invalidate OpCache after deployment**: With validate_timestamps=0 (production best practice), OpCache never checks for changes. Explicit invalidation is mandatory.
- [ ] **Restart PHP-FPM after preloading changes**: opcache_reset() does NOT refresh preloaded classes. Only a full restart re-executes the preloading script.
- [ ] **Use graceful reload for PHP-FPM**: kill -USR2 (or systemctl reload) restarts workers without dropping connections. Never use SIGTERM for production deployments.
- [ ] **Coordinate with load balancer**: Drain connections before restarting when preloading changes. This prevents connection drops during the brief window of full restart.
- [ ] **Warm caches after invalidation**: Run warm-up requests on critical endpoints after reset to prevent slow first-user experience.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: OpCache reset but no preloading reload
- [ ] Avoid: SIGTERM instead of SIGUSR2
- [ ] Avoid: No cache warm after invalidation
- [ ] Avoid: Assuming shared OpCache across instances
- [ ] Avoid anti-pattern: **One invalidation strategy for all caches**: Each cache type (OpCache, preloading, worker) needs a different strategy. One-size-fits-all fails.
- [ ] Avoid anti-pattern: **No rollback plan for cache invalidation**: If deployment fails after cache invalidation, the system is in a mixed state. Always have a tested rollback procedure.
- [ ] Avoid anti-pattern: **Skipping deployment verification**: After invalidation, verify OpCache hit rate, preloaded classes, and worker status. Don't assume invalidation succeeded.
- [ ] Avoid anti-pattern: **Manual cache invalidation**: Automated pipelines prevent human error. Manual opcache_reset() calls are error-prone.
- [ ] Guard against anti-pattern: No Post-Deployment Cache Reset
- [ ] Guard against anti-pattern: OpCache validate_timestamps = 1 in Production
- [ ] Guard against anti-pattern: Cold-Start Cache Building on First Request
- [ ] Guard against anti-pattern: Invalidating Too Much Cache on Every Deploy
- [ ] Guard against anti-pattern: Deploying During Peak Traffic Without Blue-Green
- [ ] Cache reset automated

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **OpCache Invalidation**: opcache_reset() (full) or opcache_invalidate() (per-file). Required when validate_timestamps=0. Must be called on every PHP-FPM worker via cachetool CLI., **Preloading Invalidation**: Full PHP-FPM restart required. Preloaded classes are loaded at startup. No partial invalidation possible., **PHP-FPM Worker State**: Graceful reload (USR2 signal) restarts workers one-by-one. Each new worker has fresh state., **Octane Worker State**: `php artisan octane:reload` gracefully restarts workers. OpCache also needs reset if code changed., **Deployment Ordering**: Deploy code â†’ OpCache reset â†’ Preloading reload â†’ Worker reload â†’ Health check â†’ Enable traffic.
**Skills:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, Preloading Update Procedure, CI/CD Cache Invalidation Steps
**Decision Trees:** Understanding which caches need invalidation on deployment
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, Preloading Update Procedure, CI/CD Cache Invalidation Steps

