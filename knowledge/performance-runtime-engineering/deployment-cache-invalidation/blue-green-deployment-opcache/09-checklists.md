# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Blue-Green Deployment with Separate OpCache Instances
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Warm green fully before switching**: Run a comprehensive warm-up script that hits all critical endpoints. Verify 100% OpCache hit rate before routing traffic.
- [ ] **Health check before switch**: Green must pass all health checks (OpCache hit rate, database connectivity, worker count, listen queue) before receiving traffic.
- [ ] **Keep blue for rollback**: After switching, keep blue running until the next deployment. Instant rollback is the primary advantage of blue-green.
- [ ] **Automate the switch**: Manual traffic switching is error-prone. Use load balancer API or infrastructure-as-code for automated cutover.
- [ ] **Test green independently**: Green should be fully functional without blue. Independent database connections, cache stores, and queue workers.
- [ ] Two independent environments provisioned (blue/green)
- [ ] Each environment has separate OpCache instances
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate before switch
- [ ] Load balancer switch automated (not manual)
- [ ] Blue-green deployment completes without user-facing latency impact
- [ ] Green environment fully warmed before receiving traffic
- [ ] Rollback to blue is instant (seconds, not minutes)
- [ ] OpCache file cache never shared between environments
- [ ] Schema changes are backward-compatible
- [ ] Deployment pipeline fully automated with one-click switch
- [ ] Two independent environments provisioned with separate OpCache
- [ ] File cache directories separate per environment
- [ ] Green warmed to 100% OpCache hit rate before switch
- [ ] Health checks pass on green before traffic switch

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Independent OpCache**: Each environment has separate OpCache shared memory. There is no cache sharing. This is inherent to PHP-FPM's architecture â€” OpCache is per-machine shared memory.
- [ ] **Independent Preloading**: Each environment runs its own preloading script at startup. Green's preloading doesn't affect blue.
- [ ] **Database Compatibility**: Both environments must work with the same database schema during transition. Apply backward-compatible schema changes before blue-green switch.
- [ ] **Load Balancer Requirements**: The load balancer must support weighted routing or instant switch between target groups. AWS ALB, HAProxy, and Nginx all support this.
- [ ] Document and follow through on architectural decision: Blue-green deployment with OpCache
- [ ] Ensure architecture aligns with core concept: **Infrastructure**: Two sets of PHP-FPM instances. Each has own OpCache shared memory, own preloading, own OpCache file cache. Load balancer routes traffic to active set.
- [ ] Ensure architecture aligns with core concept: **Deployment Flow**: Deploy to green (inactive) â†’ Start green PHP-FPM â†’ Preloading executes â†’ Warm green OpCache (hit all endpoints) â†’ Health check green â†’ Switch load balancer to green â†’ Verify â†’ Decommission blue or keep as rollback.
- [ ] Ensure architecture aligns with core concept: **Rollback**: Switch load balancer back to blue. Blue OpCache is still warm (unchanged during deployment). Instant rollback with zero warm-up time.
- [ ] Ensure architecture aligns with core concept: **Cold-Start Elimination**: Green is fully warmed before receiving traffic. First request to green is as fast as steady-state because OpCache and preloading are fully populated.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Warm green fully before switching**: Run a comprehensive warm-up script that hits all critical endpoints. Verify 100% OpCache hit rate before routing traffic.
- [ ] **Health check before switch**: Green must pass all health checks (OpCache hit rate, database connectivity, worker count, listen queue) before receiving traffic.
- [ ] **Keep blue for rollback**: After switching, keep blue running until the next deployment. Instant rollback is the primary advantage of blue-green.
- [ ] **Automate the switch**: Manual traffic switching is error-prone. Use load balancer API or infrastructure-as-code for automated cutover.
- [ ] **Test green independently**: Green should be fully functional without blue. Independent database connections, cache stores, and queue workers.

# Performance Checklist (from 04/06)
- [ ] No cold-start latency for green â€” fully warmed before traffic
- [ ] Zero rollback latency â€” blue is already warm
- [ ] 2x infrastructure cost during transition (both environments running)
- [ ] Warm-up time: 30-120 seconds depending on endpoint count
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] Green environment introduces additional attack surface (running alongside production)
- [ ] Ensure green is not accidentally exposed to external traffic before switch
- [ ] Load balancer configuration changes should be logged and audited
- [ ] Blue-green environments must use separate secrets and credentials

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Two independent environments provisioned (blue/green)
- [ ] Each environment has separate OpCache instances
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate before switch
- [ ] Load balancer switch automated (not manual)
- [ ] Blue kept running after switch (instant rollback)
- [ ] Database schema changes backward-compatible
- [ ] Green tested independently before receiving traffic
- [ ] Rollback procedure tested and documented
- [ ] Blue-green deployment completes without user-facing latency impact
- [ ] Green environment fully warmed before receiving traffic
- [ ] Rollback to blue is instant (seconds, not minutes)
- [ ] OpCache file cache never shared between environments
- [ ] Schema changes are backward-compatible
- [ ] Deployment pipeline fully automated with one-click switch
- [ ] Two independent environments provisioned with separate OpCache
- [ ] File cache directories separate per environment
- [ ] Green warmed to 100% OpCache hit rate before switch
- [ ] Health checks pass on green before traffic switch
- [ ] Traffic switch automated via load balancer API
- [ ] Schema changes backward-compatible and applied before code
- [ ] Rollback procedure tested monthly

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Warm green fully before switching**: Run a comprehensive warm-up script that hits all critical endpoints. Verify 100% OpCache hit rate before routing traffic.
- [ ] **Health check before switch**: Green must pass all health checks (OpCache hit rate, database connectivity, worker count, listen queue) before receiving traffic.
- [ ] **Keep blue for rollback**: After switching, keep blue running until the next deployment. Instant rollback is the primary advantage of blue-green.
- [ ] **Automate the switch**: Manual traffic switching is error-prone. Use load balancer API or infrastructure-as-code for automated cutover.
- [ ] **Test green independently**: Green should be fully functional without blue. Independent database connections, cache stores, and queue workers.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Switching traffic without warming green
- [ ] Avoid: Not keeping blue after switch
- [ ] Avoid: Shared database configuration
- [ ] Avoid: Manual traffic switch
- [ ] Avoid anti-pattern: **Using the same OpCache file cache directory for both environments**: File cache collisions cause undefined behavior. Use separate directories per environment.
- [ ] Avoid anti-pattern: **Sharing database connections between environments**: Green's warm-up queries affect blue's production database. Isolate connection pools.
- [ ] Avoid anti-pattern: **Skipping green health checks**: Green may start with preloading errors. Verify before switching traffic.
- [ ] Avoid anti-pattern: **Blue-green without rollback testing**: The rollback path must be tested. A failed switch with untested rollback becomes a major incident.
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
**Core Concepts:** **Infrastructure**: Two sets of PHP-FPM instances. Each has own OpCache shared memory, own preloading, own OpCache file cache. Load balancer routes traffic to active set., **Deployment Flow**: Deploy to green (inactive) â†’ Start green PHP-FPM â†’ Preloading executes â†’ Warm green OpCache (hit all endpoints) â†’ Health check green â†’ Switch load balancer to green â†’ Verify â†’ Decommission blue or keep as rollback., **Rollback**: Switch load balancer back to blue. Blue OpCache is still warm (unchanged during deployment). Instant rollback with zero warm-up time., **Cold-Start Elimination**: Green is fully warmed before receiving traffic. First request to green is as fast as steady-state because OpCache and preloading are fully populated.
**Skills:** Zero-Downtime Deployment OpCache, OpCache Reset Strategies, Deployment Cache Invalidation, Multi-Instance Cache Coordination
**Decision Trees:** Blue-green deployment with OpCache
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** Zero-Downtime Deployment OpCache, OpCache Reset Strategies, Deployment Cache Invalidation, CI/CD Cache Invalidation Steps

