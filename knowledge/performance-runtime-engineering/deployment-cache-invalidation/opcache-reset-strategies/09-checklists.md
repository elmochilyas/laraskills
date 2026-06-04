# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** OpCache Reset Strategies ? PHP-FPM Restart, opcache_reset(), cachetool CLI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use cachetool for production deployments**: No SSH required, works across all workers, integrates with CI/CD pipelines. Install as a Composer dependency.
- [ ] **Combine reset with warm**: Always follow opcache_reset() with a warm-up script that hits critical endpoints. Prevents cold-start latency for first users.
- [ ] **Restart PHP-FPM when preloading changes**: Neither opcache_reset() nor reload (USR2) refreshes preloading. Only a full restart re-executes the preload script.
- [ ] **Secure the opcache_reset() endpoint**: The web endpoint must be authentication-protected and network-restricted. Exposing opcache_reset() publicly is a denial-of-service risk.
- [ ] **Monitor cache hit rate after reset**: Verify hit rate returns to >99% after warm-up. If not, increase memory_consumption or max_accelerated_files.
- [ ] Reset strategy selected based on deployment type (preloading changes? yes/no)
- [ ] cachetool installed and configured for CI/CD pipeline
- [ ] opcache_reset() web endpoint secured (auth + IP restriction)
- [ ] Warm-up script configured to run after reset
- [ ] PHP-FPM restart procedure coordinated with load balancer
- [ ] Correct reset strategy selected per deployment type
- [ ] cachetool automates all production resets
- [ ] Reset endpoint secured against unauthorized access
- [ ] Warm-up prevents cold-start latency for users
- [ ] Full restart used when preloading changes (never reset alone)
- [ ] OpCache state verified after every reset and warm-up
- [ ] Reset strategy selected based on deployment type
- [ ] cachetool used for automated reset (not manual SSH)
- [ ] Reset endpoint secured (auth + IP restriction + rate limit)
- [ ] OpCache state verified after reset (hit_rate == 0)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Reset vs Restart**: opcache_reset() clears shared memory opcodes but preserves the OpCache memory segment. PHP-FPM restart destroys and recreates the entire segment including preloaded classes.
- [ ] **Multi-Worker Coordination**: In PHP-FPM with multiple workers, opcache_reset() affects all workers simultaneously because they share the same OpCache memory. In RoadRunner/Octane, each worker process has its own OpCache.
- [ ] **cachetool Mechanism**: The web endpoint must be deployed on each server. cachetool sends an HTTP request to the endpoint, which calls opcache_reset() and returns the status. The endpoint should be protected.
- [ ] **Deployment Integration**: cachetool as Composer dependency simplifies integration. The deployment script runs `cachetool opcache:reset --all` after code deployment.
- [ ] Document and follow through on architectural decision: opcache_reset() timing and method
- [ ] Ensure architecture aligns with core concept: **PHP-FPM Restart**: systemctl reload php8.x-fpm. Kills all workers, spawns new ones. OpCache shared memory destroyed and recreated. Preloading script re-executes. Cold-start: 1-5 seconds (all files recompile).
- [ ] Ensure architecture aligns with core concept: **opcache_reset()**: PHP function. Atomically clears OpCache shared memory. All files recompiled on next access. Preloading NOT reloaded. Must be called on every worker pool. Cost: ~1Âµs execution, then cold-start on next requests.
- [ ] Ensure architecture aligns with core concept: **cachetool CLI**: `cachetool opcache:reset --web --web-path=http://app/opcache.php`. Sends HTTP request to a PHP endpoint that calls opcache_reset(). Each worker's endpoint executes independently. No server access required.
- [ ] Ensure architecture aligns with core concept: **opcache_invalidate()**: Per-file invalidation. Recompiles only the specified file on next access. Used for partial deployments, individual hotfixes, or development.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use cachetool for production deployments**: No SSH required, works across all workers, integrates with CI/CD pipelines. Install as a Composer dependency.
- [ ] **Combine reset with warm**: Always follow opcache_reset() with a warm-up script that hits critical endpoints. Prevents cold-start latency for first users.
- [ ] **Restart PHP-FPM when preloading changes**: Neither opcache_reset() nor reload (USR2) refreshes preloading. Only a full restart re-executes the preload script.
- [ ] **Secure the opcache_reset() endpoint**: The web endpoint must be authentication-protected and network-restricted. Exposing opcache_reset() publicly is a denial-of-service risk.
- [ ] **Monitor cache hit rate after reset**: Verify hit rate returns to >99% after warm-up. If not, increase memory_consumption or max_accelerated_files.

# Performance Checklist (from 04/06)
- [ ] opcache_reset() execution: ~1Âµs. The cost is in subsequent requests (all files recompile)
- [ ] PHP-FPM restart: 1-5 seconds cold-start while all files recompile
- [ ] Every 1% decrease in hit rate increases CPU usage ~0.5-1% due to recompilation
- [ ] opcache_invalidate() per-file cost: ~50Âµs per file (stat + recompile)
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] opcache_reset() web endpoint must be protected: authentication token, IP whitelist, or internal network only
- [ ] Exposed opcache_reset() allows attackers to degrade performance by forcing constant recompilation
- [ ] cachetool CLI commands should use HTTPS for web endpoint communication
- [ ] PHP-FPM restart requires sudo or appropriate systemd permissions

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Reset strategy selected based on deployment type (preloading changes? yes/no)
- [ ] cachetool installed and configured for CI/CD pipeline
- [ ] opcache_reset() web endpoint secured (auth + IP restriction)
- [ ] Warm-up script configured to run after reset
- [ ] PHP-FPM restart procedure coordinated with load balancer
- [ ] Cache hit rate verified >99% after warm-up
- [ ] opcache_invalidate() path available for emergency hotfixes
- [ ] Correct reset strategy selected per deployment type
- [ ] cachetool automates all production resets
- [ ] Reset endpoint secured against unauthorized access
- [ ] Warm-up prevents cold-start latency for users
- [ ] Full restart used when preloading changes (never reset alone)
- [ ] OpCache state verified after every reset and warm-up
- [ ] Reset strategy selected based on deployment type
- [ ] cachetool used for automated reset (not manual SSH)
- [ ] Reset endpoint secured (auth + IP restriction + rate limit)
- [ ] OpCache state verified after reset (hit_rate == 0)
- [ ] Warm-up executed after reset before accepting user traffic
- [ ] Preloading changes handled with full restart (not just reset)
- [ ] Hit rate >99% confirmed after warm-up

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use cachetool for production deployments**: No SSH required, works across all workers, integrates with CI/CD pipelines. Install as a Composer dependency.
- [ ] **Combine reset with warm**: Always follow opcache_reset() with a warm-up script that hits critical endpoints. Prevents cold-start latency for first users.
- [ ] **Restart PHP-FPM when preloading changes**: Neither opcache_reset() nor reload (USR2) refreshes preloading. Only a full restart re-executes the preload script.
- [ ] **Secure the opcache_reset() endpoint**: The web endpoint must be authentication-protected and network-restricted. Exposing opcache_reset() publicly is a denial-of-service risk.
- [ ] **Monitor cache hit rate after reset**: Verify hit rate returns to >99% after warm-up. If not, increase memory_consumption or max_accelerated_files.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: opcache_reset() without restarting when preloading is used
- [ ] Avoid: No warm-up after reset
- [ ] Avoid: Exposed opcache_reset() endpoint
- [ ] Avoid: Using restart instead of reload
- [ ] Avoid anti-pattern: **Calling opcache_reset() in every request**: Debug pattern that destroys production performance. Reset only during deployments.
- [ ] Avoid anti-pattern: **Skipping verification after reset**: Assume reset worked without checking. Always verify with opcache_get_status().
- [ ] Avoid anti-pattern: **Manual reset across many servers**: Human error risk. Use cachetool with CI/CD automation for multi-server resets.
- [ ] Avoid anti-pattern: **Resetting OpCache without deploying code**: Unnecessary performance hit. Only reset after actual code changes.
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
**Core Concepts:** **PHP-FPM Restart**: systemctl reload php8.x-fpm. Kills all workers, spawns new ones. OpCache shared memory destroyed and recreated. Preloading script re-executes. Cold-start: 1-5 seconds (all files recompile)., **opcache_reset()**: PHP function. Atomically clears OpCache shared memory. All files recompiled on next access. Preloading NOT reloaded. Must be called on every worker pool. Cost: ~1Âµs execution, then cold-start on next requests., **cachetool CLI**: `cachetool opcache:reset --web --web-path=http://app/opcache.php`. Sends HTTP request to a PHP endpoint that calls opcache_reset(). Each worker's endpoint executes independently. No server access required., **opcache_invalidate()**: Per-file invalidation. Recompiles only the specified file on next access. Used for partial deployments, individual hotfixes, or development.
**Skills:** PHP-FPM Graceful Reload Patterns, Preloading Update Procedure, Deployment Cache Invalidation, CI/CD Cache Invalidation Steps
**Decision Trees:** opcache_reset() timing and method
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** Deployment Cache Invalidation Landscape, PHP-FPM Graceful Reload Patterns, Preloading Update Procedure, CI/CD Cache Invalidation Steps


