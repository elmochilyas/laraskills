# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Consistency Models for Cache Invalidation ? Eventual vs Strong Consistency in Multi-Worker Deployments
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Prefer strong consistency for write-heavy endpoints**: Mixed versions can cause data inconsistencies if the write format changes between versions.
- [ ] **Eventual consistency is acceptable for read-heavy endpoints**: As long as the response format is backward-compatible, mixed versions have minimal impact.
- [ ] **Always apply schema changes before code changes**: Database must be compatible with old code first. Old workers continue during rolling deployment.
- [ ] **Use sticky sessions with eventual consistency**: Ensures a user session stays on the same version throughout their interaction.
- [ ] **Document the consistency model**: The deployment strategy should explicitly state whether it provides strong or eventual consistency. Operations teams must understand the implications.
- [ ] Consistency model chosen and documented for each service
- [ ] Schema changes applied before code changes
- [ ] Backward-compatible code for rolling deployments
- [ ] Sticky sessions configured for eventual consistency
- [ ] Mixed-version operation tested in staging
- [ ] Consistency model documented for every production service
- [ ] Write-heavy services use strong consistency (blue-green)
- [ ] Read-heavy services use eventual consistency with sticky sessions
- [ ] Schema changes applied before code changes in all pipelines
- [ ] Deployment automation enforces the chosen model
- [ ] Consistency model chosen and documented per service
- [ ] Rollback plan aligned with consistency model
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Strong Consistency Stack**: Blue-green environments + load balancer atomic cutover + fully warmed caches. No mixed versions at any point. Maximum infrastructure cost.
- [ ] **Eventual Consistency Stack**: Rolling deployment + backward-compatible code + per-worker cache invalidation. Mixed versions during transition. Lower infrastructure cost.
- [ ] **Consistency Spectrum**: Blue-green (strongest) â†’ canary (mostly strong) â†’ rolling (eventual) â†’ per-worker restart (most eventual). Choose based on tolerance.
- [ ] **Cache Invalidation Impact**: With eventual consistency, OpCache is invalidated per-worker as they restart. Workers that haven't restarted still have old OpCache. The invalidation is eventually consistent.
- [ ] Document and follow through on architectural decision: Cache consistency model selection
- [ ] Ensure architecture aligns with core concept: **Strong Consistency (Blue-Green)**: Two full environments. Cut traffic atomically from blue to green. Old environment receives zero traffic. New environment has fully warmed caches. Cost: 2x infrastructure.
- [ ] Ensure architecture aligns with core concept: **Eventual Consistency (Rolling)**: Workers restart one by one. During rollout, some workers serve old code, some serve new. Code must be backward-compatible. Cost: no extra infrastructure.
- [ ] Ensure architecture aligns with core concept: **OpCache Consistency**: With validate_timestamps=0, OpCache is per-worker-memory. Each worker must independently invalidate. No shared OpCache knowledge across workers.
- [ ] Ensure architecture aligns with core concept: **Database Schema Consistency**: Code and schema changes must be backward-compatible during rolling deployments. Old workers must work with new schema. Apply schema changes before code deployments.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Prefer strong consistency for write-heavy endpoints**: Mixed versions can cause data inconsistencies if the write format changes between versions.
- [ ] **Eventual consistency is acceptable for read-heavy endpoints**: As long as the response format is backward-compatible, mixed versions have minimal impact.
- [ ] **Always apply schema changes before code changes**: Database must be compatible with old code first. Old workers continue during rolling deployment.
- [ ] **Use sticky sessions with eventual consistency**: Ensures a user session stays on the same version throughout their interaction.
- [ ] **Document the consistency model**: The deployment strategy should explicitly state whether it provides strong or eventual consistency. Operations teams must understand the implications.

# Performance Checklist (from 04/06)
- [ ] Strong consistency: no performance degradation during deployment (fully warmed new environment)
- [ ] Eventual consistency: brief performance impact per worker during warm-up
- [ ] Strong consistency: 2x resource usage during deployment (both environments running)
- [ ] Eventual consistency: no additional resources needed
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] Mixed-version execution can expose inconsistent data. For security-sensitive operations, prefer strong consistency.
- [ ] Strong consistency with blue-green provides a clean rollback path â€” blue's caches are still warm.
- [ ] Eventual consistency must be evaluated for security boundary changes. Authentication changes between versions can cause access issues.
- [ ] Database schema changes must be reviewed for security implications with old code accessing new schema.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Consistency model chosen and documented for each service
- [ ] Schema changes applied before code changes
- [ ] Backward-compatible code for rolling deployments
- [ ] Sticky sessions configured for eventual consistency
- [ ] Mixed-version operation tested in staging
- [ ] Rollback plan aligned with consistency model
- [ ] Deployment automation enforces the chosen model
- [ ] Consistency model documented for every production service
- [ ] Write-heavy services use strong consistency (blue-green)
- [ ] Read-heavy services use eventual consistency with sticky sessions
- [ ] Schema changes applied before code changes in all pipelines
- [ ] Consistency model chosen and documented per service

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Prefer strong consistency for write-heavy endpoints**: Mixed versions can cause data inconsistencies if the write format changes between versions.
- [ ] **Eventual consistency is acceptable for read-heavy endpoints**: As long as the response format is backward-compatible, mixed versions have minimal impact.
- [ ] **Always apply schema changes before code changes**: Database must be compatible with old code first. Old workers continue during rolling deployment.
- [ ] **Use sticky sessions with eventual consistency**: Ensures a user session stays on the same version throughout their interaction.
- [ ] **Document the consistency model**: The deployment strategy should explicitly state whether it provides strong or eventual consistency. Operations teams must understand the implications.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not understanding the consistency model
- [ ] Avoid: Applying schema changes after code deploy
- [ ] Avoid: No sticky sessions with eventual consistency
- [ ] Avoid: Assuming all deployments need strong consistency
- [ ] Avoid anti-pattern: **Deploying schema changes atomically with code changes**: Schema must be applied first, tested, then code deployed. Atomic schema+code changes are dangerous.
- [ ] Avoid anti-pattern: **Not testing mixed-version operation**: If you use eventual consistency, test that old and new code work together. Don't assume backward compatibility.
- [ ] Avoid anti-pattern: **Ignoring consistency in deployment automation**: If the automation doesn't enforce the consistency model, it will drift toward eventual consistency by default.
- [ ] Avoid anti-pattern: **Strong consistency without rollback plan**: The old environment is your rollback. If you decommission it immediately, you lose the rollback capability.
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
**Core Concepts:** **Strong Consistency (Blue-Green)**: Two full environments. Cut traffic atomically from blue to green. Old environment receives zero traffic. New environment has fully warmed caches. Cost: 2x infrastructure., **Eventual Consistency (Rolling)**: Workers restart one by one. During rollout, some workers serve old code, some serve new. Code must be backward-compatible. Cost: no extra infrastructure., **OpCache Consistency**: With validate_timestamps=0, OpCache is per-worker-memory. Each worker must independently invalidate. No shared OpCache knowledge across workers., **Database Schema Consistency**: Code and schema changes must be backward-compatible during rolling deployments. Old workers must work with new schema. Apply schema changes before code deployments.
**Skills:** Blue-Green Deployment OpCache, Zero-Downtime Deployment OpCache, Multi-Instance Cache Coordination, Rollback Planning and Version Mismatch
**Decision Trees:** Cache consistency model selection
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** Blue-Green Deployment OpCache, Zero-Downtime Deployment OpCache, Multi-Instance Cache Coordination, Deployment Cache Invalidation

