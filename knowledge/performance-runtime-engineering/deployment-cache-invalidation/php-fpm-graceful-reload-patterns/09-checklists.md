# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** PHP-FPM Graceful Reload Patterns ? USR2 Signal, Worker Sequencing, Zero-Downtime
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use reload, not restart**: systemctl reload vs systemctl restart. Reload sends SIGUSR2 (graceful). Restart sends SIGTERM (immediate kill, drops connections).
- [ ] **Set process_control_timeout**: Configures max wait for old workers to finish (e.g., 30s). Without it, workers with persistent connections never exit, preventing reload completion.
- [ ] **Verify reload completion**: Monitor worker count after reload. Old worker count should drop to 0, new workers should match pool configuration.
- [ ] **Coordinate with cache warming**: After reload, OpCache is cold. Run warm-up requests before signaling deployment complete.
- [ ] **Monitor listen queue during reload**: The transition window may cause brief queue buildup. Alert if listen queue exceeds threshold during reloads.
- [ ] Deployment uses reload (SIGUSR2), not restart (SIGTERM)
- [ ] process_control_timeout configured (30-60s)
- [ ] OpCache warm-up script configured after reload
- [ ] Worker count monitored after reload
- [ ] Listen queue monitored during reload window
- [ ] Graceful reload executed with zero dropped connections
- [ ] process_control_timeout prevents hanging reloads
- [ ] OpCache warmed before deployment is declared complete
- [ ] Listen queue monitored and below threshold during transition
- [ ] Preloading changes handled with full restart (not reload)
- [ ] Configuration changes batched to minimize warm-up cycles
- [ ] Reload used (SIGUSR2), not restart (SIGTERM)
- [ ] OpCache warmed after reload before declaring complete
- [ ] Listen queue monitored during transition
- [ ] Worker count verified matches configuration

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Reload vs Restart**: Reload (SIGUSR2) forks new workers and lets old ones drain. Restart (SIGTERM) kills all workers immediately. Reload is for zero-downtime. Restart is for emergencies or preloading changes.
- [ ] **Worker Memory Isolation**: Each new worker starts with fresh memory. Memory leaks from old workers don't carry over. Reload is an implicit memory management tool.
- [ ] **Configuration Reload**: Reload re-reads the pool configuration file. Changed settings (pm.*, request_terminate_timeout, etc.) take effect without full restart.
- [ ] **Socket Persistence**: The listen socket (TCP or Unix) is opened by the master and inherited by new children. Old children continue listening on the same socket until they exit.
- [ ] Document and follow through on architectural decision: Graceful reload method for PHP-FPM
- [ ] Ensure architecture aligns with core concept: **USR2 Signal**: Instructs FPM master to reload. Master forks new workers with new config/OpCache. Old workers finish in-flight requests up to process_control_timeout.
- [ ] Ensure architecture aligns with core concept: **Sequence**: Signal â†’ Master reads pool config â†’ Spawns new children â†’ New children start accepting from listen socket â†’ Old children finish requests â†’ Old children exit when idle.
- [ ] Ensure architecture aligns with core concept: **Zero-Downtime Guarantee**: The listen socket remains open during reload. New connections go to new workers. Old workers drain existing requests. No request is dropped unless it exceeds process_control_timeout.
- [ ] Ensure architecture aligns with core concept: **OpCache Reset Correlation**: Graceful reload does NOT reset OpCache per se. Each new worker starts with an empty OpCache and compiles files on demand. Preloading runs automatically if configured.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use reload, not restart**: systemctl reload vs systemctl restart. Reload sends SIGUSR2 (graceful). Restart sends SIGTERM (immediate kill, drops connections).
- [ ] **Set process_control_timeout**: Configures max wait for old workers to finish (e.g., 30s). Without it, workers with persistent connections never exit, preventing reload completion.
- [ ] **Verify reload completion**: Monitor worker count after reload. Old worker count should drop to 0, new workers should match pool configuration.
- [ ] **Coordinate with cache warming**: After reload, OpCache is cold. Run warm-up requests before signaling deployment complete.
- [ ] **Monitor listen queue during reload**: The transition window may cause brief queue buildup. Alert if listen queue exceeds threshold during reloads.

# Performance Checklist (from 04/06)
- [ ] Reload duration: typically 1-5 seconds for all old workers to drain
- [ ] CPU spike during reload: all new workers compile OpCache simultaneously. Stagger warm-ups if possible.
- [ ] Memory usage peaks: old workers + new workers coexist briefly, doubling memory during transition
- [ ] process_control_timeout default is 0 (wait forever). Set to 30-60s for predictable reloads.
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] SIGUSR2 signal requires appropriate permissions. PHP-FPM master should run under a dedicated user.
- [ ] process_control_timeout prevents worker hangs from blocking reload indefinitely.
- [ ] Listen socket permissions must allow new workers to bind after restart.
- [ ] Reload logs should be monitored for worker termination failures or timeout warnings.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Deployment uses reload (SIGUSR2), not restart (SIGTERM)
- [ ] process_control_timeout configured (30-60s)
- [ ] OpCache warm-up script configured after reload
- [ ] Worker count monitored after reload
- [ ] Listen queue monitored during reload window
- [ ] Preloading changes handled with full restart (not reload)
- [ ] Reload logs verified after each deployment
- [ ] Graceful reload executed with zero dropped connections
- [ ] process_control_timeout prevents hanging reloads
- [ ] OpCache warmed before deployment is declared complete
- [ ] Listen queue monitored and below threshold during transition
- [ ] Configuration changes batched to minimize warm-up cycles
- [ ] Reload used (SIGUSR2), not restart (SIGTERM)
- [ ] OpCache warmed after reload before declaring complete
- [ ] Listen queue monitored during transition
- [ ] Worker count verified matches configuration
- [ ] Configuration changes batched to minimize reload frequency

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use reload, not restart**: systemctl reload vs systemctl restart. Reload sends SIGUSR2 (graceful). Restart sends SIGTERM (immediate kill, drops connections).
- [ ] **Set process_control_timeout**: Configures max wait for old workers to finish (e.g., 30s). Without it, workers with persistent connections never exit, preventing reload completion.
- [ ] **Verify reload completion**: Monitor worker count after reload. Old worker count should drop to 0, new workers should match pool configuration.
- [ ] **Coordinate with cache warming**: After reload, OpCache is cold. Run warm-up requests before signaling deployment complete.
- [ ] **Monitor listen queue during reload**: The transition window may cause brief queue buildup. Alert if listen queue exceeds threshold during reloads.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: SIGTERM instead of SIGUSR2
- [ ] Avoid: No process_control_timeout
- [ ] Avoid: Skipping verification after reload
- [ ] Avoid: No OpCache warm after reload
- [ ] Avoid anti-pattern: **Reloading for every config change**: Frequent reloads cause repeated OpCache cold starts. Batch config changes when possible.
- [ ] Avoid anti-pattern: **Relying on reload for preloading changes**: Reload does not refresh preloading. Always use full restart when preloading changes.
- [ ] Avoid anti-pattern: **Ignoring failed workers**: If a new worker fails to start (e.g., OpCache memory full), reload may succeed with fewer workers. Monitor worker count.
- [ ] Avoid anti-pattern: **Reload during peak traffic**: Even graceful reload adds overhead. Schedule reloads during low-traffic windows when possible.
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
**Core Concepts:** **USR2 Signal**: Instructs FPM master to reload. Master forks new workers with new config/OpCache. Old workers finish in-flight requests up to process_control_timeout., **Sequence**: Signal â†’ Master reads pool config â†’ Spawns new children â†’ New children start accepting from listen socket â†’ Old children finish requests â†’ Old children exit when idle., **Zero-Downtime Guarantee**: The listen socket remains open during reload. New connections go to new workers. Old workers drain existing requests. No request is dropped unless it exceeds process_control_timeout., **OpCache Reset Correlation**: Graceful reload does NOT reset OpCache per se. Each new worker starts with an empty OpCache and compiles files on demand. Preloading runs automatically if configured.
**Skills:** OpCache Reset Strategies, Preloading Update Procedure, Zero-Downtime Deployment OpCache, Multi-Instance Cache Coordination
**Decision Trees:** Graceful reload method for PHP-FPM
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache Reset Strategies, Deployment Cache Invalidation Landscape, Preloading Update Procedure, Zero-Downtime Deployment OpCache

