# Cache Invalidation Deployment

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Cache invalidation during deployment is the practice of clearing stale caches and warming fresh ones as part of a zero-downtime deploy. The core challenge: the old application version serves requests while the new version's caches are being built. Coordinating cache state across this transition — preventing cache stampedes, avoiding stale reads, and ensuring atomic cutover — is essential for reliable deployments.

## Core Concepts
- **Zero-Downtime Deployment:** The old application continues serving traffic while the new version is being prepared. Caches must be built before traffic hits the new version, but after the new files are in place.
- **Cache Warmup:** Build all cache files (`config.php`, `routes.php`, `events.php`, `services.php`) before switching traffic to the new deployment. This prevents the first request from triggering cache generation (which would be slow and potentially race).
- **Cache Stampede:** When multiple concurrent requests all detect a missing cache and attempt to regenerate it simultaneously. This multiplies server load, potentially causing an outage.
- **Atomic Write:** Write cache files to a temporary location, then rename atomically. This prevents partial reads by concurrent requests.
- **Clear-Before-Cache Pattern:** Always clear old caches before regenerating new ones. This prevents stale data from persisting if regeneration fails.

## Mental Models
- **Traffic Light Model:** Deployment is a traffic light transition. Old app is green (serving traffic). Build phase is yellow (preparing, no traffic). New app is green (serving traffic). Cache invalidation happens during the yellow phase.
- **Hot Swap:** Like swapping a hard drive while the computer is running. You prepare the new drive (build caches), then swap the cable (switch traffic). The old drive is removed after the swap.
- **Stale-Read Analogy:** A library patron reading yesterday's newspaper because today's hasn't been delivered yet. The cache is the newspaper; deployment delays are delivery delays.

## Internal Mechanics
1. **Deployment Phase Sequence:**
   - **Code Deploy:** New code is placed in a new directory (symlink swap) or overwrites the existing directory.
   - **Pre-Build:** Dependencies installed, migrations run.
   - **Cache Clear:** `php artisan optimize:clear` removes all cached files.
   - **Cache Warm:** `php artisan optimize` (and optional `event:cache`, `composer dump-autoload -o`) regenerates caches.
   - **Traffic Switch:** Load balancer or symlink points to new version.
   - **Post-Deploy:** Optional verification and deferred cache warming.

2. **Atomic Cutover Strategies:**
   - **Symlink Swap (Envoyer):** `/current` symlink points to the active release directory. Build happens in a new directory; symlink is swapped atomically. Caches are built before the swap.
   - **Blue/Green:** Two complete environments. Traffic switches from blue to green after green is fully warmed.
   - **Rolling Deploy (Kubernetes):** Pods are replaced gradually. Cache warmup happens once per pod or via a shared volume.

3. **Race Condition Prevention:**
   - Use file-based locking when building caches (e.g., `flock()`).
   - Write cache files with `.tmp` extension, then `rename()` atomically.
   - Use OpCache preloading for Octane to avoid cold-start on worker restart.

## Patterns
- **Warm-Up Before Cutover:** Build all caches before serving traffic. The first request should never trigger a cache rebuild.
- **Clear-Then-Warm:** Delete stale caches, then regenerate. If regeneration fails, the deployment should abort — running without caches is acceptable degradation, but running with partial caches is dangerous.
- **Stale Cache as Fallback:** In some strategies, the old cache files are kept until the new ones are verified. This provides a fallback if new caches fail to load.
- **Health Check Verification:** After warmup, run a health check endpoint that verifies caches are loaded and functional before accepting traffic.

## Architectural Decisions
- **Decision:** Clear caches before regenerating (not after).
  - **Rationale:** Prevents old + new mixed state if generation fails. Consequence: application runs without cache briefly during warmup.
- **Decision:** Cache generation is part of the deployment script (not runtime).
  - **Rationale:** Runtime cache generation introduces stampede risk and increases first-request latency. Building in deployment shifts the cost to a controlled environment.
- **Decision:** Optimize for atomicity over speed.
  - **Rationale:** A 3-second cache rebuild is acceptable. A corrupted cache that takes down production is not. Atomic writes and clear-before-warm add time but prevent corruption.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-downtime cache refresh | Requires deployment infrastructure (symlink, blue/green) | Simpler deploys (e.g., git pull) have downtime |
| No cache stampede in production | Cache warmup increases deploy time by 3-10 seconds | Longer CI/CD pipeline; may time out in constrained runners |
| Consistent cache state across all servers | Shared cache storage (NFS, Redis) required for multi-server | Single-server setups are simpler but have single point of failure |
| Verification before traffic exposure | Health check endpoint must be maintained and monitored | Forgotten health checks give false confidence |

## Performance Considerations
- **Warmup Duration:** 2-5 seconds for `optimize`, 1-2 seconds for `event:cache`, 2-5 seconds for `composer dump-autoload -o`. Total: 5-12 seconds.
- **Cache File Size:** 500KB-3MB total. Writing these to disk is I/O-bound. Use fast storage (SSD, tmpfs) for cache files.
- **Concurrency During Warmup:** If warmup runs on the server serving traffic, CPU and I/O contention with active requests must be managed. Use `nice` or run warmup on a separate instance.
- **OpCache Reset:** PHP workers must be restarted after cache generation to pick up new files. Use `php artisan octane:reload` or equivalent.

## Production Considerations
- **Lock cache generation** to prevent concurrent builds (e.g., from overlapping deployments). Use file locks or deployment pipeline serialization.
- **Monitor cache file timestamps** to verify they were regenerated during the last deployment. A deployment that skipped `optimize` silently serves stale caches.
- **Use tmpfs or shared memory** for cache directories in high-throughput environments. Writing to disk is slower and wears SSDs.
- **Consider OpCache preloading** for Octane deployments to avoid cold-start after worker restart.
- **Include `optimize:clear` in rollback scripts.** Rolling back to a previous deployment requires clearing the stale cache written by the rolled-back deployment.
- **Cache warmup order matters:** `config:cache` first (config affects routes and services), then `route:cache`, then `event:cache`.
- **Database migrations and cache interaction:** Cached routes may reference table columns that exist only after migrations. Run migrations before cache generation.

## Common Mistakes
- **Clearing cache without regenerating it.** Application runs uncached until first request triggers cache rebuild (or until next deploy). Performance degrades immediately.
- **Regenerating cache before code is in place.** The cached config reflects old code paths, causing class-not-found errors.
- **Concurrent deployments on the same server.** Both try to generate caches at the same time, producing corrupted or overlapping cache files.
- **Not restarting PHP-FPM or Octane workers after cache generation.** The old opcode cache serves stale cached files until workers are recycled.
- **Cache generation in the wrong order.** Routes cached before config may use wrong URL defaults.

## Failure Modes
- **Cache Stampede on Deploy Failure:** If warmup is skipped (deploy script fails), the first production request triggers cache generation under load. Multiple concurrent requests all generate caches simultaneously, spiking CPU.
- **Race Condition in Symlink Swap:** Traffic switch happens while cache write is in progress. Partial cache file is read, causing PHP parse error.
- **Cross-Version Cache Incompatibility:** Deploying a new Laravel version. The new framework reads old-format cache files during warmup, causing deserialization errors.
- **Shared Cache on NFS:** File locking via `flock()` does not work reliably on NFS. Network filesystem latency extends warmup time.
- **Deployment Script Timeout:** `optimize` takes longer than the CI/CD timeout (e.g., 10 minutes). The script is killed mid-cache-warmup, leaving partial caches.

## Ecosystem Usage
- **Laravel Envoyer:** The reference implementation. Deployments create a new directory, install deps, run migrations, clear `bootstrap/cache`, run `optimize`, then atomically switch the symlink. Envoyer runs health checks before completing.
- **Forge:** Simpler deployment: `git pull` on the server, then run `optimize`. No atomic symlink swap; brief downtime or manual maintenance mode.
- **Vapor:** Serverless deployments build caches during `vapor build`. The cached files are included in the Lambda deployment artifact. Cold starts use built caches.
- **Kubernetes with Helm:** Init containers run cache warmup before the main application container starts. Readiness probes verify cache health.
- **GitHub Actions / GitLab CI:** Cache files can be built in CI and deployed as artifacts, reducing warmup time during actual deployment.

## Related Knowledge Units

### Prerequisites
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — the command run during deployment warmup.
- [Config Caching](./config-caching/02-knowledge-unit.md) — the primary cache that must be invalidated.

### Related Topics
- [Route Caching](./route-caching/02-knowledge-unit.md) — cache with the most complex invalidation constraints.
- [Services Cache](./services-cache/02-knowledge-unit.md) — most commonly stale cache during deployment.
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md) — OpCache's own cache must be invalidated via worker restart.
- [Events Caching](./events-caching/02-knowledge-unit.md) — event manifest invalidation during deployment.

### Advanced Follow-up Topics
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — warmup strategies in CI vs. on-server.
- [Octane Boot Timing](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how Octane's graceful reload interacts with cache invalidation.
- [Application Flush and Reset](../application-bootstrap/application-flush-and-reset/02-knowledge-unit.md) — state management during deployment transitions.

## Research Notes
- The term "cache stampede" was popularized in distributed systems literature. In the PHP context, it applies when multiple PHP-FPM workers simultaneously regenerate the same cache file.
- Laravel's `bootstrap/cache` directory is designed for atomic writes via PHP's `file_put_contents()` with `LOCK_EX` flag. However, not all cache commands use this flag consistently.
- Octane (Swoole/RoadRunner) changes the game: workers are long-lived and share memory. Cache invalidation requires restarting all workers (graceful restart via `octane:reload`).
- Vapor's approach of building caches as part of `vapor build` (not during deployment) is ideal for serverless but requires the build environment to match the production environment (same PHP version, same extensions).
