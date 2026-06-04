# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Deployment & Cache Invalidation
Knowledge Unit: Containerized Deployment ? Immutable Infrastructure, OpCache File Cache for Cold-Start
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Containerized PHP deployments use **immutable infrastructure** ? each deployment builds a new container image with the application code baked in. OpCache must be warmed after container start. Strategies: **OpCache file cache** on persistent volumes (pre-warm in CI, reuse across container restarts), **preloading** (compiled at container start), or **readiness probe warm-up** (delay traffic until endpoints respond). The file cache approach eliminates cold-start latency entirely.

---

# Core Concepts

- **Immutable image**: Container image built with all PHP code. No code changes at runtime. OpCache file cache path points to an ephemeral volume (lost on container restart) or persistent volume (survives restart).
- **OpCache file cache for containers**: opcache.file_cache=/tmp/opcache with opcache.file_cache_only=1 (PHP 8.5+). If the volume is ephemeral, file cache is rebuilt per container start (slow). If persistent (hostPath / PVC), file cache survives restarts (fast).
- **CI/CD pre-warming**: In CI build step, run a script that compiles all PHP files and writes OpCache file cache. Include file cache directory in the container image. Container starts with fully warm disk-based OpCache.
- **Readiness probe**: Kubernetes liveness/readiness probes hit a health endpoint. Multiple failed probes delay traffic until OpCache is populated. Simple but extends deployment time.

---

# Patterns

**CI warm-up**: Dockerfile: RUN php -d opcache.file_cache=/tmp/opcache -d opcache.file_cache_only=1 /app/artisan cache:warm-opcache. The file cache directory is included in the image layer. Every new container starts warm.

---

# Common Mistakes

**Using shared memory OpCache in containers without warming**: In Kubernetes, a container restart loses all shared memory. The first request after restart compiles all files. Always use file cache or readiness probe warm-up.

---

# Performance Considerations

- OpCache reset during deployment causes 100% miss rate until caches warm (30-120 seconds)
- PHP-FPM graceful reload (SIGUSR2) finishes current requests before spawning new workers
- Blue-green: maintain two OpCache states via separate opcache.file_cache directories
- Preloading script must be updated atomically; stale preload references cause class-not-found errors
- Container cold start: 5-30s due to OpCache warm-up; use opcache.file_cache and preloading

---

# Related Knowledge Units

OpCache File Cache and Container Cold Start | Blue-Green Deployment | CI/CD Cache Invalidation Steps

---

## Mental Models

**Parking garage model**: Deploying code is changing the floor plan of a parking garage while cars are inside. OpCache reset is clearing all GPS units (compiled cache). Preloading refresh is reprogramming the automated parking system. Graceful PHP-FPM reload is rotating which sections are under construction â€” never closing the entire garage.

---

## Internal Mechanics

OpCache stores compiled opcodes in shared memory with a global mutex for concurrent access. opcache_reset() acquires the mutex, iterates the hash table, marks all entries as stale, and resets memory usage counters. opcache_invalidate() acquires the mutex, finds the specific file entry, and invalidates only that entry. PHP-FPM graceful reload sends SIGUSR2 to the master process, which then: stops accepting new connections on the old listen socket, spawns new workers with fresh opcache memory, waits for old workers to finish current requests, and reaps old workers. Preloading files are loaded during php_module_startup() before the first request, into a separate shared memory segment that survives opcache_reset().

---

## Patterns

**Zero-downtime deployment pipeline**: 1) Deploy to standby servers, 2) Run OpCache reset + cache warm, 3) Health check passes â†’ flip load balancer, 4) Monitor for 5 minutes, 5) If errors spike â†’ rollback load balancer + restore previous code version, 6) Record deployment as successful or failed in CI/CD.

---

## Architectural Decisions

- **Atomic deployment vs Rolling update**: Atomic deploys (symlink swap) ensure all files change at once, preventing mixed-version code execution but requiring disk space for two versions. Rolling updates minimize resource requirements but risk clients hitting partial deploys. For OpCache with validate_timestamps=0, atomic deploys prevent stale cache issues.
- **Pre-warming vs Cold start**: Pre-warming (accessing all code paths before enabling traffic) eliminates cold-start latency spikes but adds deployment time. Cold start accepts brief performance degradation for faster deployments. For user-facing APIs, pre-warming is preferred.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| PHP-FPM restart | Thorough reset (incl. preloading) | 1-5s downtime, dropped requests |
| opcache_reset() | Fast, no process restart | Preloading not refreshed, per-worker calls |
| cachetool CLI | No SSH needed, orchestrated | Requires HTTP endpoint, network latency |
| Graceful reload | Zero-downtime worker rotation | Slow (sequential), complex orchestration |

---

## Production Considerations

- **Pre-deployment checklist**: Verify OpCache settings in production config. Ensure opcache_reset() is callable. Test health endpoint returns 200. Verify load balancer draining works.
- **Post-deployment checklist**: Check OpCache hit rate > 99%. Verify listen queue = 0. Confirm error rate unchanged. Compare p50/p99 latency to pre-deploy baseline.
- **Rollback procedure**: Maintain two prior code versions. Rollback script: restore code â†’ OpCache reset â†’ cache warm â†’ health check â†’ enable traffic.
- **Blast radius**: Deploy to canary instances first (5-10% of traffic). Monitor for 5 minutes before rolling out to remaining servers.

---

## Failure Modes

- **Mixed version execution**: Atomic deploy fails, workers read partial old/new files. Symptom: Intermittent class-not-found or syntax errors. Mitigation: Use atomic deployments (symlink swap), ensure rsync atomicity.
- **Cache incoherence across instances**: Multi-server deployment where some servers have reset OpCache and others haven't. Symptom: Intermittent 200 vs 500 responses from same deploy. Mitigation: Use orchestrated reset (cachetool on all endpoints), load balancer drain during reset.
- **Preload version mismatch**: Preload script from old deployment loads classes for new code. Symptom: Autoloader fails, class not found for new classes, method not found for changed signatures. Mitigation: Always restart PHP-FPM after preload changes, use separate preload files per version.

---

## Ecosystem Usage

- **Deployer**: PHP deployment tool. Built-in task deploy:opcache:reset that calls opcache_reset() via HTTP. Supports atomic deployments with symlink swapping.
- **Envoyer**: Laravel's zero-downtime deployment tool. Automatically runs OpCache reset and cache warming after deploy. Supports deployment hooks for custom invalidation.
- **GitHub Actions / GitLab CI**: Integration patterns include: deploy step â†’ OpCache reset via SSH â†’ cache warm (curl endpoints) â†’ health check â†’ slack notification.
- **AWS CodeDeploy / ECS**: Container deployments rebuild the image. OpCache file cache on EFS/volume helps with container cold starts. ECS rolling updates handle worker rotation.

---

## Research Notes

- Research on cache invalidation atomicity: Ensuring all workers see new cache simultaneously. Distributed consensus (Raft, etcd) for coordinating cache resets across instances is an active area.
- Container cold-start mitigation: OpCache file cache + preloading reduces cold-start latency from 5-10s to 0.5-2s. Early research on checkpoint/restore (CRIU) for PHP shows promise for zero-warm-up container starts.
- Blue-green deployment patterns: The cost of maintaining two complete cache instances (old + new) during transition is an area of operational research. Most production deployments accept brief mixed-version execution during the transition window.
