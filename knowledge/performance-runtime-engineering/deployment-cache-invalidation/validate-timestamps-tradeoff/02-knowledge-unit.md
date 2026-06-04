# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Deployment & Cache Invalidation
Knowledge Unit: validate_timestamps=0 Tradeoff ? Eliminates stat() Syscalls at Cost of Manual Invalidation
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

opcache.validate_timestamps=0 is the highest-ROI production OpCache setting. It eliminates the stat() syscall per cached file per request ? thousands of syscalls saved per request. The tradeoff: **code changes only take effect after explicit cache invalidation** (PHP-FPM restart or opcache_reset()). For production deployments with controlled rollouts, this tradeoff is overwhelmingly positive.

---

# Core Concepts

- **With validate_timestamps=1 (default)**: Every request, PHP calls stat() on every cached file to check its modification time. A 500-file request = 500 stat() syscalls. Each stat() costs ~2-5?s = 1-2.5ms per request. At 500 RPS: 250,000 stat() calls/second.
- **With validate_timestamps=0**: Zero stat() calls for cached files. The 1-2.5ms per request overhead is eliminated. Transaction: must explicitly invalidate OpCache after deployment.
- **Implicit timing**: evalidate_freq controls how often timestamps are checked (ignored when validate_timestamps=0). Even with validate_timestamps=1 and revalidate_freq=60, 500 files ? 2?s per stat() ? once per 60s per file = 1ms per file check spread across requests.

---

# Patterns

**Development vs production**: validate_timestamps=1 + revalidate_freq=0 in development (immediate code changes). validate_timestamps=0 in production (performance + explicit invalidation).

---

# Common Mistakes

**validate_timestamps=0 in development**: Code changes don't appear without manual OpCache reset. Developers waste time debugging "why doesn't my change work?" Always keep validate_timestamps=1 in dev.

---

# Performance Considerations

- OpCache reset during deployment causes 100% miss rate until caches warm (30-120 seconds)
- PHP-FPM graceful reload (SIGUSR2) finishes current requests before spawning new workers
- Blue-green: maintain two OpCache states via separate opcache.file_cache directories
- Preloading script must be updated atomically; stale preload references cause class-not-found errors
- Container cold start: 5-30s due to OpCache warm-up; use opcache.file_cache and preloading

---

# Related Knowledge Units

OpCache Purpose and Mechanics | OpCache Production Hardening | Deployment Cache Landscape

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
