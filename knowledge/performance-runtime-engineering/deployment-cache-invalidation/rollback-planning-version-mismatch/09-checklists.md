# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Rollback Planning ? Stateful Service Rollback, OpCache Version Mismatch Handling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Have a one-click rollback in CI/CD**: The pipeline should have a rollback button that reverts code, reloads workers, warms cache, and verifies health. Practice rollback monthly.
- [ ] **Test rollback in staging**: Don't discover rollback issues during a production incident. Test the rollback procedure after every deployment.
- [ ] **Handle OpCache version mismatches**: When rolling back PHP version, delete OpCache file cache directory. Shared memory is automatically cleared by PHP-FPM restart.
- [ ] **Drain Octane workers before rollback**: Signal workers to stop accepting traffic. Wait for in-flight requests (up to max request timeout). Then restart with old code.
- [ ] **Document the rollback time**: How long does rollback take? 30s? 5 minutes? This determines incident response strategy.
- [ ] Rollback procedure documented for each service
- [ ] One-click rollback implemented in CI/CD pipeline
- [ ] OpCache version mismatch handling documented (file cache deletion)
- [ ] Octane worker restart included in rollback procedure (if applicable)
- [ ] Database schema changes backward-compatible for one release
- [ ] Automated rollback completes in under 60 seconds for code-only rollbacks
- [ ] OpCache file cache deleted before PHP version rollback (no segfaults)
- [ ] Octane workers restarted during rollback (no state corruption)
- [ ] Schema changes additive â€” rollback doesn't require database revert
- [ ] Rollback tested monthly â€” verified working in staging
- [ ] Load balancer drain prevents connection drops during rollback
- [ ] One-click automated rollback in CI/CD pipeline
- [ ] OpCache version mismatch handling documented (delete file cache on PHP version rollback)
- [ ] Octane worker restart included in rollback procedure
- [ ] Schema changes additive for current release cycle

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Rollback Sequencing**: 1) Signal load balancer to drain, 2) Wait for requests to complete, 3) Revert code, 4) Restart workers (or reload for Octane), 5) Clear/warm OpCache, 6) Health check, 7) Rejoin load balancer.
- [ ] **OpCache File Cache Invalidation**: OpCache file cache format is PHP-version-specific. Rolling back PHP requires deleting the file cache directory. Rolling forward typically works without deletion.
- [ ] **Octane Stateful Rollback**: Octane workers hold database connections, in-memory cache, and application state. Old code may not correctly handle state initialized by new code. Always kill and restart workers.
- [ ] **Database Schema Compatibility**: Schema changes should be backward-compatible for at least one release cycle. This allows rollback without schema revert. Schema revert should be a separate, slower process.
- [ ] Document and follow through on architectural decision: Rollback strategy for PHP deployments
- [ ] Ensure architecture aligns with core concept: **OpCache Version Mismatch**: OpCache file cache format is not guaranteed compatible across PHP minor versions. Rolling back from PHP 8.5 to 8.4 requires deleting OpCache file cache directory. Shared memory mode only needs PHP-FPM restart.
- [ ] Ensure architecture aligns with core concept: **Stateful Service Rollback (Octane)**: Octane workers maintain persistent connections and in-memory state. Rollback requires: signal workers to stop accepting requests, wait for in-flight requests to complete, kill workers, deploy previous code, restart workers, warm OpCache.
- [ ] Ensure architecture aligns with core concept: **Database Migration Rollback**: Deploy code that is backward-compatible with the previous database schema. Schema rollback should be a separate, tested operation. Never deploy code requiring the new schema to function.
- [ ] Ensure architecture aligns with core concept: **Canary Rollback**: If rollback is needed during canary deployment, simply redirect the canary's traffic back to the main pool. The canary's OpCache is discarded.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Have a one-click rollback in CI/CD**: The pipeline should have a rollback button that reverts code, reloads workers, warms cache, and verifies health. Practice rollback monthly.
- [ ] **Test rollback in staging**: Don't discover rollback issues during a production incident. Test the rollback procedure after every deployment.
- [ ] **Handle OpCache version mismatches**: When rolling back PHP version, delete OpCache file cache directory. Shared memory is automatically cleared by PHP-FPM restart.
- [ ] **Drain Octane workers before rollback**: Signal workers to stop accepting traffic. Wait for in-flight requests (up to max request timeout). Then restart with old code.
- [ ] **Document the rollback time**: How long does rollback take? 30s? 5 minutes? This determines incident response strategy.

# Performance Checklist (from 04/06)
- [ ] Rollback time: 30s (simple code revert) to 5min (PHP version rollback with file cache clear)
- [ ] OpCache warm-up after rollback: 5-30s (same as after deployment)
- [ ] Octane worker restart: 5-15s for worker pool to restart and stabilize
- [ ] During rollback, server capacity may be reduced (draining connections, workers restarting)
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] Rollback is a high-risk operation. It should require approval (unless it's an automated health-check rollback).
- [ ] PHP version rollback may re-introduce known vulnerabilities. Document what you're rolling back to and its security status.
- [ ] Database schema rollback can cause data loss. Schema changes should be additive (new columns/tables) to avoid data loss on rollback.
- [ ] OpCache file cache from a newer PHP version should not be loaded by older PHP â€” it can cause segfaults.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Rollback procedure documented for each service
- [ ] One-click rollback implemented in CI/CD pipeline
- [ ] OpCache version mismatch handling documented (file cache deletion)
- [ ] Octane worker restart included in rollback procedure (if applicable)
- [ ] Database schema changes backward-compatible for one release
- [ ] Rollback tested in staging after each deployment
- [ ] Rollback time documented and within acceptable limits
- [ ] Load balancer drain included in rollback sequence
- [ ] Cache validation step in rollback procedure
- [ ] Automated rollback completes in under 60 seconds for code-only rollbacks
- [ ] OpCache file cache deleted before PHP version rollback (no segfaults)
- [ ] Octane workers restarted during rollback (no state corruption)
- [ ] Schema changes additive â€” rollback doesn't require database revert
- [ ] Rollback tested monthly â€” verified working in staging
- [ ] Load balancer drain prevents connection drops during rollback
- [ ] One-click automated rollback in CI/CD pipeline
- [ ] OpCache version mismatch handling documented (delete file cache on PHP version rollback)
- [ ] Octane worker restart included in rollback procedure
- [ ] Schema changes additive for current release cycle
- [ ] Rollback tested in staging after each production deployment
- [ ] Rollback time documented and <60s for code-only rollbacks

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Have a one-click rollback in CI/CD**: The pipeline should have a rollback button that reverts code, reloads workers, warms cache, and verifies health. Practice rollback monthly.
- [ ] **Test rollback in staging**: Don't discover rollback issues during a production incident. Test the rollback procedure after every deployment.
- [ ] **Handle OpCache version mismatches**: When rolling back PHP version, delete OpCache file cache directory. Shared memory is automatically cleared by PHP-FPM restart.
- [ ] **Drain Octane workers before rollback**: Signal workers to stop accepting traffic. Wait for in-flight requests (up to max request timeout). Then restart with old code.
- [ ] **Document the rollback time**: How long does rollback take? 30s? 5 minutes? This determines incident response strategy.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Octane rollback without worker restart
- [ ] Avoid: Not handling OpCache version mismatch
- [ ] Avoid: Assuming database rollback is instant
- [ ] Avoid: Not testing rollback
- [ ] Avoid anti-pattern: **Rolling back without draining traffic**: Dropping in-flight connections causes errors for active users.
- [ ] Avoid anti-pattern: **Skipping cache validation after rollback**: Verifying OpCache and preloading after rollback is essential. Don't trust the process â€” verify.
- [ ] Avoid anti-pattern: **Manually rolling back**: The rollback procedure should be as automated as the deployment. Manual rollback is error-prone.
- [ ] Avoid anti-pattern: **Rolling back PHP minor version without full testing**: The application may have features incompatible with the older PHP version. Test rollback scenarios.
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
**Core Concepts:** **OpCache Version Mismatch**: OpCache file cache format is not guaranteed compatible across PHP minor versions. Rolling back from PHP 8.5 to 8.4 requires deleting OpCache file cache directory. Shared memory mode only needs PHP-FPM restart., **Stateful Service Rollback (Octane)**: Octane workers maintain persistent connections and in-memory state. Rollback requires: signal workers to stop accepting requests, wait for in-flight requests to complete, kill workers, deploy previous code, restart workers, warm OpCache., **Database Migration Rollback**: Deploy code that is backward-compatible with the previous database schema. Schema rollback should be a separate, tested operation. Never deploy code requiring the new schema to function., **Canary Rollback**: If rollback is needed during canary deployment, simply redirect the canary's traffic back to the main pool. The canary's OpCache is discarded.
**Skills:** Zero-Downtime Deployment OpCache, Blue-Green Deployment OpCache, CI/CD Cache Invalidation Steps, Deployment Cache Invalidation
**Decision Trees:** Rollback strategy for PHP deployments
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** Zero-Downtime Deployment OpCache, Blue-Green Deployment OpCache, CI/CD Cache Invalidation Steps, Deployment Cache Invalidation


