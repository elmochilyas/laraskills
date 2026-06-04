# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Zero-Downtime Deployment ? PHP-FPM Graceful Reload, OpCache Pre-Warming, Health Check Sequencing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always drain before deploying**: Signal the load balancer to stop sending traffic before touching PHP-FPM. This prevents serving partial states or dropped connections.
- [ ] **Warm OpCache before re-enabling traffic**: After reload, run warm-up requests on all critical endpoints. First real user requests must not trigger cold-compilation.
- [ ] **Health check includes OpCache hit rate**: The health endpoint should report OpCache statistics. Load balancer only re-enables traffic when hit rate > 95%.
- [ ] **Stagger warm-ups across fleet**: If all servers warm simultaneously, backend services (database, Redis) see a thundering herd. Stagger warm-ups by 5-10 seconds.
- [ ] **Monitor during transition**: Track error rate, latency, and listen queue during deployment. Any anomaly should trigger immediate investigation or rollback.
- [ ] Load balancer drain configured with appropriate timeout
- [ ] OpCache warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate > 95%
- [ ] Rolling deployment sequence tested in staging
- [ ] Warm-ups staggered across fleet (5-10s apart)
- [ ] Deployment completes with zero user-facing errors
- [ ] OpCache pre-warming prevents cold-start latency
- [ ] Health check verifies quality of service (OpCache hit rate >95%)
- [ ] Warm-ups staggered to prevent backend overload
- [ ] Schema changes backward-compatible for rolling deployment
- [ ] Error rates and latency monitored in real-time during deployment
- [ ] Automated rollback on health check failure
- [ ] Load balancer drain executed before any server modification
- [ ] Symlink swap used for atomic code deployment
- [ ] Graceful reload used (SIGUSR2, not SIGTERM)

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **Load Balancer Integration**: AWS ALB/NLB, HAProxy, Nginx, or Kubernetes Service. The load balancer must support connection draining with configurable timeout.
- [ ] **Health Check Design**: Health endpoint returns 200 only when: PHP-FPM accepting connections, OpCache hit rate > 95%, database responsive, no listen queue buildup. Multiple checks provide deployment confidence.
- [ ] **Rolling vs Blue-Green**: Rolling is more resource-efficient (no duplicate infrastructure). Blue-green provides stronger consistency guarantees. Choose based on acceptable complexity.
- [ ] **Pre-Warm Script Design**: Cachetool or curl-based warm-up hitting endpoint groups. Each endpoint populates OpCache for a different code path. Cover all critical user flows.
- [ ] Document and follow through on architectural decision: Zero-downtime deployment strategy
- [ ] Ensure architecture aligns with core concept: **Load Balancer Orchestration**: Mark server as draining (stop sending new connections), wait for in-flight requests to complete (10-30s), deploy code, reload PHP-FPM gracefully, warm OpCache, health check passes, mark server as active (resume traffic).
- [ ] Ensure architecture aligns with core concept: **OpCache Pre-Warming**: After reload, critical endpoints may be slow. Run a warm-up script hitting key URLs (/, /api/health, /api/users). Ensures OpCache is populated before user traffic resumes.
- [ ] Ensure architecture aligns with core concept: **Health Check Sequencing**: Load balancer checks health endpoint. Health endpoint verifies: PHP-FPM responding, OpCache hit rate > 95%, database connection OK, listen queue = 0. Server stays in draining until all checks pass.
- [ ] Ensure architecture aligns with core concept: **Rolling Across Fleet**: Repeat for each server. At fleet level, one server drains while others serve. When it rejoins, the next server drains. No server sits idle.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always drain before deploying**: Signal the load balancer to stop sending traffic before touching PHP-FPM. This prevents serving partial states or dropped connections.
- [ ] **Warm OpCache before re-enabling traffic**: After reload, run warm-up requests on all critical endpoints. First real user requests must not trigger cold-compilation.
- [ ] **Health check includes OpCache hit rate**: The health endpoint should report OpCache statistics. Load balancer only re-enables traffic when hit rate > 95%.
- [ ] **Stagger warm-ups across fleet**: If all servers warm simultaneously, backend services (database, Redis) see a thundering herd. Stagger warm-ups by 5-10 seconds.
- [ ] **Monitor during transition**: Track error rate, latency, and listen queue during deployment. Any anomaly should trigger immediate investigation or rollback.

# Performance Checklist (from 04/06)
- [ ] Pre-warming takes 5-30 seconds depending on the number of unique endpoints
- [ ] OpCache hit rate after full warm: >99%. Hit rate during warm: 0% â†’ rapidly increasing
- [ ] Load balancer drain timeout: set to 2x max request duration (typically 60-120s)
- [ ] Thundering herd during warm: multiple servers hitting the same endpoints simultaneously can overwhelm backend services
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] Health check endpoint should not expose internal details publicly. Restrict to load balancer IP range.
- [ ] Warm-up scripts may trigger security monitoring. Exclude warm-up traffic from security alerts.
- [ ] Drain/rejoin cycle should be logged and monitored for anomalies.
- [ ] Pre-warming requests should be authenticated the same way as regular requests.

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] Load balancer drain configured with appropriate timeout
- [ ] OpCache warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate > 95%
- [ ] Rolling deployment sequence tested in staging
- [ ] Warm-ups staggered across fleet (5-10s apart)
- [ ] Database schema changes backward-compatible
- [ ] Deployment pipeline automated with rollback capability
- [ ] Monitoring configured to detect anomalies during deployment
- [ ] Deployment completes with zero user-facing errors
- [ ] OpCache pre-warming prevents cold-start latency
- [ ] Health check verifies quality of service (OpCache hit rate >95%)
- [ ] Warm-ups staggered to prevent backend overload
- [ ] Schema changes backward-compatible for rolling deployment
- [ ] Error rates and latency monitored in real-time during deployment
- [ ] Automated rollback on health check failure
- [ ] Load balancer drain executed before any server modification
- [ ] Symlink swap used for atomic code deployment
- [ ] Graceful reload used (SIGUSR2, not SIGTERM)
- [ ] OpCache warmed before re-enabling traffic
- [ ] Health check verifies OpCache hit rate >95%
- [ ] Schema changes backward-compatible and deployed before code
- [ ] Error rates and latency monitored during deployment
- [ ] Automated rollback configured on failure

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always drain before deploying**: Signal the load balancer to stop sending traffic before touching PHP-FPM. This prevents serving partial states or dropped connections.
- [ ] **Warm OpCache before re-enabling traffic**: After reload, run warm-up requests on all critical endpoints. First real user requests must not trigger cold-compilation.
- [ ] **Health check includes OpCache hit rate**: The health endpoint should report OpCache statistics. Load balancer only re-enables traffic when hit rate > 95%.
- [ ] **Stagger warm-ups across fleet**: If all servers warm simultaneously, backend services (database, Redis) see a thundering herd. Stagger warm-ups by 5-10 seconds.
- [ ] **Monitor during transition**: Track error rate, latency, and listen queue during deployment. Any anomaly should trigger immediate investigation or rollback.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Skipping warm-up
- [ ] Avoid: No health check validation
- [ ] Avoid: Draining too quickly
- [ ] Avoid: All servers warm simultaneously
- [ ] Avoid anti-pattern: **Deploying to all servers at once**: Zero-downtime requires rolling. Deploying everywhere simultaneously causes fleet-wide latency spikes during warm-up.
- [ ] Avoid anti-pattern: **Not testing the deployment pipeline**: The zero-downtime process should be tested in staging. Failed deployments in production cause longer incidents.
- [ ] Avoid anti-pattern: **Ignoring database migration compatibility**: Code changes that require new schema break old workers during rolling deployments.
- [ ] Avoid anti-pattern: **Manual deployment process**: Human error in drain/warm/rejoin sequence causes downtime. Automate the entire pipeline.
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
**Core Concepts:** **Load Balancer Orchestration**: Mark server as draining (stop sending new connections), wait for in-flight requests to complete (10-30s), deploy code, reload PHP-FPM gracefully, warm OpCache, health check passes, mark server as active (resume traffic)., **OpCache Pre-Warming**: After reload, critical endpoints may be slow. Run a warm-up script hitting key URLs (/, /api/health, /api/users). Ensures OpCache is populated before user traffic resumes., **Health Check Sequencing**: Load balancer checks health endpoint. Health endpoint verifies: PHP-FPM responding, OpCache hit rate > 95%, database connection OK, listen queue = 0. Server stays in draining until all checks pass., **Rolling Across Fleet**: Repeat for each server. At fleet level, one server drains while others serve. When it rejoins, the next server drains. No server sits idle.
**Skills:** PHP-FPM Graceful Reload Patterns, OpCache Reset Strategies, Blue-Green Deployment OpCache, Containerized Deployment Cache Strategies
**Decision Trees:** Zero-downtime deployment strategy
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** PHP-FPM Graceful Reload Patterns, OpCache Reset Strategies, Blue-Green Deployment OpCache, Containerized Deployment Cache Strategies


