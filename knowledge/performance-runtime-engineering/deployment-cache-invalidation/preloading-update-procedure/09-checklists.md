# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Preloading Update Procedure ? Full PHP-FPM Restart Requirement
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Coordinate with load balancer**: Full restart drops in-flight connections. Drain traffic from the server before restart, then warm and rejoin.
- [ ] **Verify preloaded classes after restart**: Check opcache_get_status()['preload_statistics'] to confirm preloading executed correctly.
- [ ] **Test preload changes in staging**: A bad preload script prevents PHP-FPM from starting. Always verify in staging before production restart.
- [ ] **Minimize preload changes**: Batch preloading updates to reduce the number of full restarts. Most deployments only need graceful reload.
- [ ] **Document preload dependencies**: Preloaded classes cannot be modified without full restart. Developers must know which files are preloaded.
- [ ] Preloading change triggers full restart (not reload)
- [ ] Load balancer drain coordinated before restart
- [ ] Preloading verified after restart (opcache_get_status preload_statistics)
- [ ] Preload script tested in staging before production restart
- [ ] Rollback plan includes preloading refresh
- [ ] Preloading changes applied with full restart (not reload or reset)
- [ ] Load balancer drain prevents connection drops during restart
- [ ] Preloading state verified with opcache_get_status() after restart
- [ ] Changes tested in staging before production
- [ ] Preloading updates batched to minimize restart frequency
- [ ] Rollback procedure includes full restart to restore previous preloaded classes
- [ ] Preloading changes tested in staging before production
- [ ] Load balancer drained before full restart
- [ ] Full PHP-FPM restart executed (not reload, not reset)
- [ ] Preloading state verified after restart

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Preloading vs OpCache**: OpCache caches files lazily (on first access). Preloading compiles files eagerly (at startup). Preloaded classes are immutable in OpCache â€” they persist until the process dies.
- [ ] **Master Process State**: The PHP-FPM master process holds the preloaded class table. Workers fork with a copy of this table. When the master restarts, the table is rebuilt.
- [ ] **Immutable Flag**: Preloaded classes have the GC_IMMUTABLE flag set. The garbage collector ignores them, and opcache_reset() skips them. Only process termination removes them.
- [ ] **Restart Window**: During full restart, the server cannot serve requests. Brief downtime (1-5 seconds) occurs unless the server is drained from the load balancer first.
- [ ] Document and follow through on architectural decision: Preload file update on deployment
- [ ] Ensure architecture aligns with core concept: **Preloading Lifecycle**: PHP-FPM starts â†’ Master reads opcache.preload setting â†’ Preload script executed â†’ Classes compiled and stored in OpCache shared memory â†’ Workers fork from preloaded master.
- [ ] Ensure architecture aligns with core concept: **Why Reset Doesn't Work**: opcache_reset() clears OpCache of lazily-cached files but does NOT remove preloaded classes. They are flagged as GC_IMMUTABLE/PERSISTENT and survive reset.
- [ ] Ensure architecture aligns with core concept: **Why Reload Doesn't Work**: kill -USR2 only replaces workers. The preloaded master state persists because the master process doesn't re-execute the preload script.
- [ ] Ensure architecture aligns with core concept: **Full Restart**: systemctl stop php8.x-fpm && systemctl start php8.x-fpm. Master terminates. New master starts fresh, re-executes preload script.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Coordinate with load balancer**: Full restart drops in-flight connections. Drain traffic from the server before restart, then warm and rejoin.
- [ ] **Verify preloaded classes after restart**: Check opcache_get_status()['preload_statistics'] to confirm preloading executed correctly.
- [ ] **Test preload changes in staging**: A bad preload script prevents PHP-FPM from starting. Always verify in staging before production restart.
- [ ] **Minimize preload changes**: Batch preloading updates to reduce the number of full restarts. Most deployments only need graceful reload.
- [ ] **Document preload dependencies**: Preloaded classes cannot be modified without full restart. Developers must know which files are preloaded.

# Performance Checklist (from 04/06)
- [ ] Full restart cold-start: 1-5 seconds for workers to start and OpCache to warm
- [ ] Preloading execution time: 100ms-2s depending on the number of classes
- [ ] After restart, all workers share the same preloaded class table â€” no per-worker duplication
- [ ] Preloaded class memory is not freed until process termination
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] A bad preload script can prevent PHP-FPM from starting entirely (denial of service). Test thoroughly.
- [ ] Preloading runs as the configured preload_user. Ensure this user has appropriate file permissions.
- [ ] Full restart drops all connections. Coordinate with load balancer to prevent user-facing downtime.
- [ ] Preload script errors may not be visible in standard error logs. Check PHP-FPM startup logs.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Preloading change triggers full restart (not reload)
- [ ] Load balancer drain coordinated before restart
- [ ] Preloading verified after restart (opcache_get_status preload_statistics)
- [ ] Preload script tested in staging before production restart
- [ ] Rollback plan includes preloading refresh
- [ ] Deployment pipeline distinguishes preloading vs non-preloading deployments
- [ ] Preloading changes applied with full restart (not reload or reset)
- [ ] Load balancer drain prevents connection drops during restart
- [ ] Preloading state verified with opcache_get_status() after restart
- [ ] Changes tested in staging before production
- [ ] Preloading updates batched to minimize restart frequency
- [ ] Rollback procedure includes full restart to restore previous preloaded classes
- [ ] Preloading changes tested in staging before production
- [ ] Load balancer drained before full restart
- [ ] Full PHP-FPM restart executed (not reload, not reset)
- [ ] Preloading state verified after restart
- [ ] OpCache warmed after restart before rejoining
- [ ] Rollback plan includes full PHP-FPM restart

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Coordinate with load balancer**: Full restart drops in-flight connections. Drain traffic from the server before restart, then warm and rejoin.
- [ ] **Verify preloaded classes after restart**: Check opcache_get_status()['preload_statistics'] to confirm preloading executed correctly.
- [ ] **Test preload changes in staging**: A bad preload script prevents PHP-FPM from starting. Always verify in staging before production restart.
- [ ] **Minimize preload changes**: Batch preloading updates to reduce the number of full restarts. Most deployments only need graceful reload.
- [ ] **Document preload dependencies**: Preloaded classes cannot be modified without full restart. Developers must know which files are preloaded.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not accounting for preloading reload cost
- [ ] Avoid: Using reload instead of restart
- [ ] Avoid: No preload verification after restart
- [ ] Avoid: Not draining before restart in production
- [ ] Avoid anti-pattern: **Frequent preloading updates**: Each update requires full restart. Batch changes to minimize restart frequency.
- [ ] Avoid anti-pattern: **Preloading without testing**: A bad preload script crashes PHP-FPM on restart. Test in staging first.
- [ ] Avoid anti-pattern: **Assuming opcache_reset() refreshes preloading**: Preloaded classes survive opcache_reset(). Only full restart works.
- [ ] Avoid anti-pattern: **Ignoring preload in rollback plan**: Rollback that doesn't include full restart may leave stale preloaded classes.
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
**Core Concepts:** **Preloading Lifecycle**: PHP-FPM starts â†’ Master reads opcache.preload setting â†’ Preload script executed â†’ Classes compiled and stored in OpCache shared memory â†’ Workers fork from preloaded master., **Why Reset Doesn't Work**: opcache_reset() clears OpCache of lazily-cached files but does NOT remove preloaded classes. They are flagged as GC_IMMUTABLE/PERSISTENT and survive reset., **Why Reload Doesn't Work**: kill -USR2 only replaces workers. The preloaded master state persists because the master process doesn't re-execute the preload script., **Full Restart**: systemctl stop php8.x-fpm && systemctl start php8.x-fpm. Master terminates. New master starts fresh, re-executes preload script.
**Skills:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, Deployment Cache Invalidation, Rollback Planning and Version Mismatch
**Decision Trees:** Preload file update on deployment
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache Reset Strategies, PHP-FPM Graceful Reload Patterns, Deployment Cache Invalidation, Preloading Script Design Patterns

