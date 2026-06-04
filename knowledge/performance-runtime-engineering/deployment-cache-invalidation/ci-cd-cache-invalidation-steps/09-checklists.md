# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** CI/CD Pipeline Cache Invalidation Steps ? Integration with Deployment Pipeline
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Each step has a timeout and retry**: If any step fails (e.g., OpCache reset not confirmed), retry N times before triggering rollback. Timeouts prevent hung deployments.
- [ ] **Use symlink swap for atomic deployment**: `ln -snf /app/releases/v2 /app/current`. This prevents partial-read of mixed code versions. Web server root points to symlink.
- [ ] **Validate cache state after invalidation**: Don't assume opcache_reset() succeeded. Call opcache_get_status() and verify hit_rate dropped to 0%, then climbs back after warm-up.
- [ ] **Rollback on health check failure**: If health check fails after deployment, automatically revert to previous version, reload workers, and verify.
- [ ] **Monitor for 10 minutes after traffic enable**: Late-onset errors (memory leaks, slow degradation) may not appear immediately. Keep monitoring window post-deployment.
- [ ] Pipeline includes build, deploy, invalidate, warm, health, enable stages
- [ ] Each stage has timeout and retry configuration
- [ ] OpCache state verified after invalidation (hit_rate check)
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check validates OpCache, workers, and dependencies
- [ ] Pipeline deploys code with zero stale-code serving
- [ ] OpCache reset verified, not just assumed
- [ ] Warm-up eliminates first-user cold-start latency
- [ ] Automated rollback executes within 60 seconds on health check failure
- [ ] Post-deployment monitoring catches late-onset issues
- [ ] Pipeline fully automated with no manual steps
- [ ] Symlink swap used for atomic deployment
- [ ] OpCache state verified after reset (hit_rate == 0 confirmed)
- [ ] Warm-up covers all critical endpoints
- [ ] Health check validates OpCache hit rate >99%

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Pipeline as Code**: The deployment pipeline should be defined in the repository (GitHub Actions, GitLab CI, Jenkinsfile). Version-controlled pipelines are auditable and repeatable.
- [ ] **Stage Gates**: Each stage gates the next. Build failure stops deployment. OpCache reset failure triggers rollback. Health check failure prevents traffic enable.
- [ ] **Rollback Script**: The rollback script is tested on every deployment (by not being used) but must be verified monthly. It follows the same steps in reverse: revert code, reload workers, warm, health check.
- [ ] **Containerized Pipelines**: For containerized PHP, the pipeline includes image build â†’ push â†’ deploy â†’ warm â†’ health check. Cache invalidation is handled by the new image having fresh OpCache.
- [ ] Document and follow through on architectural decision: Cache invalidation in CI/CD pipeline
- [ ] Ensure architecture aligns with core concept: **Step 1 - Build**: Composer install, asset compilation, build artifacts. Ensure atomicity for deployment.
- [ ] Ensure architecture aligns with core concept: **Step 2 - Deploy**: Copy code via rsync, git pull, or container image push. Use symlink swap for atomic code replacement.
- [ ] Ensure architecture aligns with core concept: **Step 3 - OpCache Reset**: Run cachetool opcache:reset --all or trigger PHP-FPM reload. Verify reset via opcache_get_status() API.
- [ ] Ensure architecture aligns with core concept: **Step 4 - Preloading Refresh**: Full PHP-FPM restart if preloading script changed. Coordinate with load balancer to drain connections first.
- [ ] Ensure architecture aligns with core concept: **Step 5 - Cache Warm**: HTTP GET requests to critical endpoints. Each request populates OpCache for that endpoint's code path.
- [ ] Ensure architecture aligns with core concept: **Step 6 - Health Check**: Verify HTTP 200 from health endpoint, OpCache hit rate > 99%, listen queue = 0. Fail deployment if any check fails.
- [ ] Ensure architecture aligns with core concept: **Step 7 - Traffic Enable**: Remove from load balancer maintenance mode. Monitor for increased error rate or latency.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Each step has a timeout and retry**: If any step fails (e.g., OpCache reset not confirmed), retry N times before triggering rollback. Timeouts prevent hung deployments.
- [ ] **Use symlink swap for atomic deployment**: `ln -snf /app/releases/v2 /app/current`. This prevents partial-read of mixed code versions. Web server root points to symlink.
- [ ] **Validate cache state after invalidation**: Don't assume opcache_reset() succeeded. Call opcache_get_status() and verify hit_rate dropped to 0%, then climbs back after warm-up.
- [ ] **Rollback on health check failure**: If health check fails after deployment, automatically revert to previous version, reload workers, and verify.
- [ ] **Monitor for 10 minutes after traffic enable**: Late-onset errors (memory leaks, slow degradation) may not appear immediately. Keep monitoring window post-deployment.

# Performance Checklist (from 04/06)
- [ ] Deployment duration: 2-10 minutes depending on server count and warm-up time
- [ ] OpCache warm-up: 5-30s for typical applications
- [ ] Health check interval: every 5-10 seconds during deployment verification
- [ ] Pipeline timeout: should be 2x expected duration (10-20 minutes)
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] CI/CD pipeline secrets must be stored securely (GitHub Secrets, GitLab CI variables, vault)
- [ ] Deployment scripts should not contain hardcoded credentials
- [ ] Rollback scripts require the same security as deployment scripts
- [ ] Pipeline access should be restricted to authorized personnel

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Pipeline includes build, deploy, invalidate, warm, health, enable stages
- [ ] Each stage has timeout and retry configuration
- [ ] OpCache state verified after invalidation (hit_rate check)
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check validates OpCache, workers, and dependencies
- [ ] Automated rollback configured on health check failure
- [ ] Symlink swap used for atomic code deployment
- [ ] Pipeline tested in staging before production use
- [ ] Rollback script tested monthly
- [ ] Pipeline deploys code with zero stale-code serving
- [ ] OpCache reset verified, not just assumed
- [ ] Warm-up eliminates first-user cold-start latency
- [ ] Automated rollback executes within 60 seconds on health check failure
- [ ] Post-deployment monitoring catches late-onset issues
- [ ] Pipeline fully automated with no manual steps
- [ ] Symlink swap used for atomic deployment
- [ ] OpCache state verified after reset (hit_rate == 0 confirmed)
- [ ] Warm-up covers all critical endpoints
- [ ] Health check validates OpCache hit rate >99%
- [ ] 10-minute post-deployment monitoring window configured

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Each step has a timeout and retry**: If any step fails (e.g., OpCache reset not confirmed), retry N times before triggering rollback. Timeouts prevent hung deployments.
- [ ] **Use symlink swap for atomic deployment**: `ln -snf /app/releases/v2 /app/current`. This prevents partial-read of mixed code versions. Web server root points to symlink.
- [ ] **Validate cache state after invalidation**: Don't assume opcache_reset() succeeded. Call opcache_get_status() and verify hit_rate dropped to 0%, then climbs back after warm-up.
- [ ] **Rollback on health check failure**: If health check fails after deployment, automatically revert to previous version, reload workers, and verify.
- [ ] **Monitor for 10 minutes after traffic enable**: Late-onset errors (memory leaks, slow degradation) may not appear immediately. Keep monitoring window post-deployment.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Skipping cache warm-up
- [ ] Avoid: No rollback trigger
- [ ] Avoid: OpCache reset without verification
- [ ] Avoid: No symlink swap
- [ ] Avoid anti-pattern: **Manual deployment steps in a "CI/CD" pipeline**: Every step should be automated. Manual steps are error-prone and not auditable.
- [ ] Avoid anti-pattern: **Deploying during peak traffic**: Schedule deployments during low-traffic windows. Even zero-downtime deployments add overhead.
- [ ] Avoid anti-pattern: **Skipping staging tests**: The pipeline should deploy to staging first. Production-only deployment misses environment-specific issues.
- [ ] Avoid anti-pattern: **Not testing rollback**: The rollback script should be tested monthly. An untested rollback is not a rollback.
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
**Core Concepts:** **Step 1 - Build**: Composer install, asset compilation, build artifacts. Ensure atomicity for deployment., **Step 2 - Deploy**: Copy code via rsync, git pull, or container image push. Use symlink swap for atomic code replacement., **Step 3 - OpCache Reset**: Run cachetool opcache:reset --all or trigger PHP-FPM reload. Verify reset via opcache_get_status() API., **Step 4 - Preloading Refresh**: Full PHP-FPM restart if preloading script changed. Coordinate with load balancer to drain connections first., **Step 5 - Cache Warm**: HTTP GET requests to critical endpoints. Each request populates OpCache for that endpoint's code path.
**Skills:** OpCache Reset Strategies, Zero-Downtime Deployment OpCache, Multi-Instance Cache Coordination, Rollback Planning and Version Mismatch
**Decision Trees:** Cache invalidation in CI/CD pipeline
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache Reset Strategies, Deployment Cache Invalidation, Zero-Downtime Deployment OpCache, Multi-Instance Cache Coordination

