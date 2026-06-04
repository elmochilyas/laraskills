# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Multi-Instance Cache Coordination in Horizontal Scaling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Use cachetool with --all flag**: cachetool opcache:reset --all iterates across all configured hosts. No need for per-host loops in custom scripts.
- [ ] **Implement sticky sessions**: Load balancer session affinity (same client â†’ same server) prevents mixed-version execution during rolling deployments.
- [ ] **Warm before enabling traffic**: Each instance must be warmed and health-checked before it receives traffic. Never let a cold instance serve users.
- [ ] **Monitor the transition window**: During rolling deployment, track error rates per instance. Anomalies in an instance may indicate deployment issues.
- [ ] **Coordinate via configuration management**: Ansible/Chef/Puppet deploys code across the fleet. Post-deployment step: run cachetool on all hosts in parallel.
- [ ] All instances identified and inventory documented
- [ ] cachetool configured with --all or per-host iteration
- [ ] Sticky sessions enabled on load balancer
- [ ] Each instance warmed independently before traffic enable
- [ ] Health check verifies OpCache hit rate per instance
- [ ] All instances invalidated and warmed with no stale-code serving
- [ ] Sticky sessions prevent mixed-version user experience
- [ ] Staggered warm-up avoids fleet-wide CPU spikes and thundering herd
- [ ] Per-instance monitoring detects warm-up failures immediately
- [ ] SSH-based invalidation available when HTTP endpoints are restricted
- [ ] All instances invalidated explicitly (no instance missed)
- [ ] Invalidation staggered by 5-10s per instance
- [ ] Each instance warmed and health-checked independently
- [ ] OpCache hit rate >95% confirmed per instance
- [ ] Per-instance hit rate monitored post-deployment

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **OpCache Is Per-Machine**: This is a fundamental architectural constraint. OpCache uses SysV shared memory (or mmap), which is local to the machine. There is no network-distributed OpCache.
- [ ] **Rolling Deployment Consistency**: At any point during rolling deployment, some instances serve old code and some serve new. The application must handle this gracefully â€” backward-compatible API responses, no schema changes that break old code.
- [ ] **cachetool Architecture**: Each instance runs a PHP web endpoint (e.g., /opcache.php) that executes opcache_reset(). cachetool sends HTTP requests to each endpoint. The endpoint should be authentication-protected.
- [ ] **Autoscaling Implications**: When a new instance is added by the autoscaler, it has no OpCache. It must be pre-warmed before it can serve traffic effectively.
- [ ] Document and follow through on architectural decision: Coordinating cache invalidation across instances
- [ ] Ensure architecture aligns with core concept: **No Shared OpCache**: OpCache memory is per-machine (SysV shared memory). Horizontal scaling with N instances means N independent OpCaches. Each must be invalidated separately.
- [ ] Ensure architecture aligns with core concept: **cachetool Multi-Host**: `cachetool opcache:reset --all` or iterate over hosts. Each host's web endpoint executes opcache_reset() independently.
- [ ] Ensure architecture aligns with core concept: **Rolling Warm-Up**: In a rolling deployment, instances are updated one at a time. New instance is warmed and health-checked before the next instance begins. At any point, 1/N instances are new, others are old.
- [ ] Ensure architecture aligns with core concept: **Sticky Sessions**: Load balancer session affinity prevents a user from hitting old and new instances during the transition window. Session cookie ensures consistent versioning per user session.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Use cachetool with --all flag**: cachetool opcache:reset --all iterates across all configured hosts. No need for per-host loops in custom scripts.
- [ ] **Implement sticky sessions**: Load balancer session affinity (same client â†’ same server) prevents mixed-version execution during rolling deployments.
- [ ] **Warm before enabling traffic**: Each instance must be warmed and health-checked before it receives traffic. Never let a cold instance serve users.
- [ ] **Monitor the transition window**: During rolling deployment, track error rates per instance. Anomalies in an instance may indicate deployment issues.
- [ ] **Coordinate via configuration management**: Ansible/Chef/Puppet deploys code across the fleet. Post-deployment step: run cachetool on all hosts in parallel.

# Performance Checklist (from 04/06)
- [ ] Per-instance warm-up: 5-30s each. For a 10-server fleet: 50-300s total deployment time.
- [ ] OpCache hit rate during warm-up on new instances: 0% â†’ 99% over 30-120s
- [ ] Mixed version window: during rolling deployment, different instances serve different code versions
- [ ] CPU spike on each instance during warm-up: all files compile simultaneously
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] cachetool web endpoints must be authentication-protected to prevent unauthorized cache manipulation.
- [ ] Multi-instance deployment automation must use secure communication (HTTPS, API tokens).
- [ ] Sticky sessions using cookies may have privacy implications â€” use secure, short-lived session cookies.
- [ ] SSH-based cache invalidation (cachetool --ssh) is more secure than HTTP but requires SSH key management.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] All instances identified and inventory documented
- [ ] cachetool configured with --all or per-host iteration
- [ ] Sticky sessions enabled on load balancer
- [ ] Each instance warmed independently before traffic enable
- [ ] Health check verifies OpCache hit rate per instance
- [ ] Mixed-version window duration documented
- [ ] Backward-compatible code changes for rolling deployments
- [ ] Autoscaling warm-up configured for new instances
- [ ] All instances invalidated and warmed with no stale-code serving
- [ ] Sticky sessions prevent mixed-version user experience
- [ ] Staggered warm-up avoids fleet-wide CPU spikes and thundering herd
- [ ] Per-instance monitoring detects warm-up failures immediately
- [ ] SSH-based invalidation available when HTTP endpoints are restricted
- [ ] All instances invalidated explicitly (no instance missed)
- [ ] Invalidation staggered by 5-10s per instance
- [ ] Each instance warmed and health-checked independently
- [ ] OpCache hit rate >95% confirmed per instance
- [ ] Per-instance hit rate monitored post-deployment
- [ ] SSH-based cachetool configured for restricted environments

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Use cachetool with --all flag**: cachetool opcache:reset --all iterates across all configured hosts. No need for per-host loops in custom scripts.
- [ ] **Implement sticky sessions**: Load balancer session affinity (same client â†’ same server) prevents mixed-version execution during rolling deployments.
- [ ] **Warm before enabling traffic**: Each instance must be warmed and health-checked before it receives traffic. Never let a cold instance serve users.
- [ ] **Monitor the transition window**: During rolling deployment, track error rates per instance. Anomalies in an instance may indicate deployment issues.
- [ ] **Coordinate via configuration management**: Ansible/Chef/Puppet deploys code across the fleet. Post-deployment step: run cachetool on all hosts in parallel.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Assuming OpCache is shared across instances
- [ ] Avoid: Not using sticky sessions
- [ ] Avoid: Warming only one endpoint
- [ ] Avoid: No health check after warm-up
- [ ] Avoid anti-pattern: **Invalidating all instances simultaneously**: Causes a fleet-wide performance spike as all instances recompile simultaneously. Stagger invalidations.
- [ ] Avoid anti-pattern: **Manual per-instance invalidation**: Human error will miss an instance. Automate with cachetool or configuration management.
- [ ] Avoid anti-pattern: **Ignoring the mixed-version window**: Code that can't handle backward compatibility breaks during rolling deployments.
- [ ] Avoid anti-pattern: **Not testing multi-instance deployment**: The first time you test is during a production incident. Test multi-instance deployments in staging.
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
**Core Concepts:** **No Shared OpCache**: OpCache memory is per-machine (SysV shared memory). Horizontal scaling with N instances means N independent OpCaches. Each must be invalidated separately., **cachetool Multi-Host**: `cachetool opcache:reset --all` or iterate over hosts. Each host's web endpoint executes opcache_reset() independently., **Rolling Warm-Up**: In a rolling deployment, instances are updated one at a time. New instance is warmed and health-checked before the next instance begins. At any point, 1/N instances are new, others are old., **Sticky Sessions**: Load balancer session affinity prevents a user from hitting old and new instances during the transition window. Session cookie ensures consistent versioning per user session.
**Skills:** CI/CD Cache Invalidation Steps, Zero-Downtime Deployment OpCache, Blue-Green Deployment OpCache, OpCache Reset Strategies
**Decision Trees:** Coordinating cache invalidation across instances
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** Deployment Cache Invalidation, CI/CD Cache Invalidation Steps, Zero-Downtime Deployment OpCache, OpCache Reset Strategies

