# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Deployment & Cache Invalidation
**Knowledge Unit:** Containerized Deployment ? Immutable Infrastructure, OpCache File Cache for Cold-Start
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Pre-warm file cache in CI build**: Run a PHP script during image build that compiles all files and writes OpCache file cache. Include the cache directory in the image. Container starts fully warm.
- [ ] **Use persistent volumes for file cache**: If containers restart on the same node, a hostPath or PVC preserves the file cache across restarts, eliminating re-warm time.
- [ ] **Preloading for critical classes**: Even with file cache, preloading reduces first-request latency. Configure preloading in the container php.ini.
- [ ] **Readiness probe with warm-up**: If pre-warming is not possible, configure Kubernetes readiness probes to delay traffic until OpCache is populated.
- [ ] **Monitor OpCache hit rate post-start**: Verify that OpCache is effectively warm after container start. Low hit rate indicates warm-up failure.
- [ ] OpCache file cache configured for container environment
- [ ] CI/CD pipeline includes OpCache pre-warm step
- [ ] Kubernetes readiness probe verifies OpCache hit rate
- [ ] File cache path configured for persistence (hostPath or PVC)
- [ ] Image size increase from file cache evaluated and accepted
- [ ] Container starts with pre-warmed OpCache (<1s ready-to-serve)
- [ ] Persistent volume preserves file cache across restarts
- [ ] Kubernetes readiness probe prevents cold pods from receiving traffic
- [ ] File cache rebuilt on every deployment to prevent bytecode/source mismatch
- [ ] Image size impact of file cache evaluated and accepted
- [ ] OpCache file cache configured in container php.ini
- [ ] CI/CD pipeline includes pre-warm step in Dockerfile
- [ ] Persistent volume mounted for file cache (hostPath or PVC)
- [ ] Readiness probe verifies OpCache hit rate >95%
- [ ] File cache cleaned/versioned on each deployment

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- [ ] **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.
- [ ] **File Cache vs Shared Memory**: In containers, shared memory OpCache (default mode) is lost on restart because the shared memory segment is process-scoped. File cache persists across restarts within the same node.
- [ ] **Image Layer Caching**: OpCache file cache can be a separate Docker layer. If code doesn't change, the file cache layer is cached, speeding up subsequent builds.
- [ ] **Readiness Probe Design**: The health endpoint should return 503 (not ready) until OpCache hit rate reaches 95%+. Kubernetes won't route traffic until the probe succeeds.
- [ ] **Ephemeral vs Persistent**: Ephemeral volumes (emptyDir) are lost on pod reschedule. Persistent volumes (hostPath, PVC) survive reschedule within the same node. Persistent is better for multi-container lifecycles.
- [ ] Document and follow through on architectural decision: OpCache strategy for containers
- [ ] Ensure architecture aligns with core concept: **Immutable Image**: Container image built with all PHP code. No code changes at runtime. OpCache file cache path points to an ephemeral volume (lost on restart) or persistent volume (survives restart).
- [ ] Ensure architecture aligns with core concept: **OpCache File Cache for Containers**: `opcache.file_cache=/tmp/opcache` with `opcache.file_cache_only=1` (PHP 8.5+). Ephemeral volume = rebuilt per start (slow). Persistent volume = survives restarts (fast).
- [ ] Ensure architecture aligns with core concept: **CI/CD Pre-Warming**: In CI build step, run a script that compiles all PHP files and writes OpCache file cache. Include file cache directory in the container image. Container starts with fully warm disk-based OpCache.
- [ ] Ensure architecture aligns with core concept: **Readiness Probe**: Kubernetes liveness/readiness probes hit a health endpoint. Multiple failed probes delay traffic until OpCache populates. Simple approach but extends deployment time.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Pre-warm file cache in CI build**: Run a PHP script during image build that compiles all files and writes OpCache file cache. Include the cache directory in the image. Container starts fully warm.
- [ ] **Use persistent volumes for file cache**: If containers restart on the same node, a hostPath or PVC preserves the file cache across restarts, eliminating re-warm time.
- [ ] **Preloading for critical classes**: Even with file cache, preloading reduces first-request latency. Configure preloading in the container php.ini.
- [ ] **Readiness probe with warm-up**: If pre-warming is not possible, configure Kubernetes readiness probes to delay traffic until OpCache is populated.
- [ ] **Monitor OpCache hit rate post-start**: Verify that OpCache is effectively warm after container start. Low hit rate indicates warm-up failure.

# Performance Checklist (from 04/06)
- [ ] CI pre-warm adds 5-30s to image build time (depending on file count)
- [ ] Ready-to-serve time: <1s (pre-warmed) vs 5-30s (cold start)
- [ ] File cache on persistent volume: near-zero warm-up on restart
- [ ] Readiness probe delay: 30-60s of health check intervals before traffic flows
- [ ] PHP-FPM restart
- [ ] opcache_reset()
- [ ] cachetool CLI
- [ ] Graceful reload

# Security Checklist (from 04/06 - only if relevant)
- [ ] OpCache file cache in container image increases image size by 50-200MB. Consider security scanning of pre-compiled files.
- [ ] Persistent volumes across containers may expose old code if not properly invalidated.
- [ ] Container images with baked-in OpCache should be scanned for malicious opcodes during CI.
- [ ] Runtime modification of pre-warmed file cache should be prevented (read-only filesystem).

# Reliability Checklist (from 04/05/06)
- [ ] **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- [ ] **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- [ ] **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.
- [ ] **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- [ ] **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- [ ] **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code Ã¢â€ â€™ OpCache reset Ã¢â€ â€™ cache warm Ã¢â€ â€™ health check Ã¢â€ â€™ enable traffic.
- [ ] **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

# Testing Checklist (from 04/06)
- [ ] OpCache file cache configured for container environment
- [ ] CI/CD pipeline includes OpCache pre-warm step
- [ ] Kubernetes readiness probe verifies OpCache hit rate
- [ ] File cache path configured for persistence (hostPath or PVC)
- [ ] Image size increase from file cache evaluated and accepted
- [ ] OpCache hit rate monitored after container start
- [ ] File cache invalidation strategy implemented for new deployments
- [ ] Container starts with pre-warmed OpCache (<1s ready-to-serve)
- [ ] Persistent volume preserves file cache across restarts
- [ ] Kubernetes readiness probe prevents cold pods from receiving traffic
- [ ] File cache rebuilt on every deployment to prevent bytecode/source mismatch
- [ ] Image size impact of file cache evaluated and accepted
- [ ] OpCache file cache configured in container php.ini
- [ ] CI/CD pipeline includes pre-warm step in Dockerfile
- [ ] Persistent volume mounted for file cache (hostPath or PVC)
- [ ] Readiness probe verifies OpCache hit rate >95%
- [ ] File cache cleaned/versioned on each deployment
- [ ] Ready-to-serve time measured and confirmed <1s
- [ ] Image size increase from file cache evaluated

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Pre-warm file cache in CI build**: Run a PHP script during image build that compiles all files and writes OpCache file cache. Include the cache directory in the image. Container starts fully warm.
- [ ] **Use persistent volumes for file cache**: If containers restart on the same node, a hostPath or PVC preserves the file cache across restarts, eliminating re-warm time.
- [ ] **Preloading for critical classes**: Even with file cache, preloading reduces first-request latency. Configure preloading in the container php.ini.
- [ ] **Readiness probe with warm-up**: If pre-warming is not possible, configure Kubernetes readiness probes to delay traffic until OpCache is populated.
- [ ] **Monitor OpCache hit rate post-start**: Verify that OpCache is effectively warm after container start. Low hit rate indicates warm-up failure.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using shared memory OpCache in containers without warming
- [ ] Avoid: Not pre-warming in CI
- [ ] Avoid: Exposing health probe before OpCache warm
- [ ] Avoid: No file cache on persistent volume
- [ ] Avoid anti-pattern: **Building OpCache on first request in production**: The first user to hit a new container pays the compilation cost. Always pre-warm.
- [ ] Avoid anti-pattern: **Storing OpCache in container layers without invalidation**: If the file cache is in the image, old code persists even if you deploy a new image. Ensure cache directory is cleaned or versioned.
- [ ] Avoid anti-pattern: **Relying solely on readiness probes for warm-up**: Probes extend deployment time and may still serve slow responses. Combine with pre-warming.
- [ ] Avoid anti-pattern: **Using file_cache_only without shared memory**: PHP 8.5+ file_cache_only works without shared memory, but without shared memory, there's no OpCache in RAM. Evaluate the tradeoff.
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
**Core Concepts:** **Immutable Image**: Container image built with all PHP code. No code changes at runtime. OpCache file cache path points to an ephemeral volume (lost on restart) or persistent volume (survives restart)., **OpCache File Cache for Containers**: `opcache.file_cache=/tmp/opcache` with `opcache.file_cache_only=1` (PHP 8.5+). Ephemeral volume = rebuilt per start (slow). Persistent volume = survives restarts (fast)., **CI/CD Pre-Warming**: In CI build step, run a script that compiles all PHP files and writes OpCache file cache. Include file cache directory in the container image. Container starts with fully warm disk-based OpCache., **Readiness Probe**: Kubernetes liveness/readiness probes hit a health endpoint. Multiple failed probes delay traffic until OpCache populates. Simple approach but extends deployment time.
**Skills:** Zero-Downtime Deployment OpCache, OpCache Reset Strategies, Blue-Green Deployment OpCache, FrankenPHP Container Memory Management
**Decision Trees:** OpCache strategy for containers
**Anti-Patterns:** No Post-Deployment Cache Reset, OpCache validate_timestamps = 1 in Production, Cold-Start Cache Building on First Request, Invalidating Too Much Cache on Every Deploy, Deploying During Peak Traffic Without Blue-Green
**Related Topics:** OpCache File Cache, Zero-Downtime Deployment OpCache, FrankenPHP Container Memory Management, CI/CD Cache Invalidation Steps

