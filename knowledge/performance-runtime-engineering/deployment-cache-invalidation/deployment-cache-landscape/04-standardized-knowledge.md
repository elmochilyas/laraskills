# Standardized Knowledge: Deployment Cache Invalidation Landscape

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Deployment Cache Invalidation Landscape |
| Difficulty | Foundation |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Deploying new PHP code requires invalidating multiple caches: OpCache (stale opcodes), preloading (stale class definitions), PHP-FPM workers (stale process state), and alternative runtime workers (Octane/Swoole stale state). Each cache has a different invalidation mechanism and cost. A deployment script must coordinate all invalidations to ensure zero stale-code serving.

## Core Concepts

- **OpCache Invalidation**: opcache_reset() (full) or opcache_invalidate() (per-file). Required when validate_timestamps=0. Must be called on every PHP-FPM worker via cachetool CLI.
- **Preloading Invalidation**: Full PHP-FPM restart required. Preloaded classes are loaded at startup. No partial invalidation possible.
- **PHP-FPM Worker State**: Graceful reload (USR2 signal) restarts workers one-by-one. Each new worker has fresh state.
- **Octane Worker State**: `php artisan octane:reload` gracefully restarts workers. OpCache also needs reset if code changed.
- **Deployment Ordering**: Deploy code → OpCache reset → Preloading reload → Worker reload → Health check → Enable traffic.

## When To Use

- Every PHP deployment to production
- Planning a deployment pipeline for PHP applications
- Diagnosing stale-code serving issues after deployments
- Training operations teams on PHP-specific deployment procedures

## When NOT To Use

- Development environments where code changes frequently (use validate_timestamps=1)
- Static sites without PHP execution
- Read-only deployments where code doesn't change

## Best Practices

- **Always invalidate OpCache after deployment**: With validate_timestamps=0 (production best practice), OpCache never checks for changes. Explicit invalidation is mandatory.
- **Restart PHP-FPM after preloading changes**: opcache_reset() does NOT refresh preloaded classes. Only a full restart re-executes the preloading script.
- **Use graceful reload for PHP-FPM**: kill -USR2 (or systemctl reload) restarts workers without dropping connections. Never use SIGTERM for production deployments.
- **Coordinate with load balancer**: Drain connections before restarting when preloading changes. This prevents connection drops during the brief window of full restart.
- **Warm caches after invalidation**: Run warm-up requests on critical endpoints after reset to prevent slow first-user experience.

## Architecture Guidelines

- **Cache Invalidation Taxonomy**: OpCache (shared memory opcodes), Preloading (class definitions), Worker state (process memory), Alternative runtime (Octane worker state). Each requires different handling.
- **Deployment Step Sequence**: Code deploy → OpCache reset → Preload refresh (if changed) → Worker restart → Cache warm → Health check → Traffic enable. Each step must succeed before the next begins.
- **Atomicity**: Code deployment should use symlink swaps for atomic file replacement. Partial reads of mixed code versions cause fatal errors.

## Performance Considerations

- OpCache reset causes 100% miss rate until caches warm (30-120 seconds)
- PHP-FPM graceful reload finishes current requests before spawning new workers
- Preloading requires full restart — drops in-flight connections unless coordinated with load balancer
- Container cold start: 5-30s due to OpCache warm-up

## Security Considerations

- opcache_reset() web endpoints must be protected (internal network only, authentication required)
- Preloading script changes can introduce class-not-found errors if not properly tested
- Rolling deployments with mixed versions require backward-compatible database schemas

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| OpCache reset but no preloading reload | Assuming opcache_reset() refreshes everything | Stale class definitions served indefinitely | Full PHP-FPM restart when preloading changes |
| SIGTERM instead of SIGUSR2 | Confusing restart with reload | In-flight requests dropped | Use graceful reload (SIGUSR2) for zero-downtime |
| No cache warm after invalidation | Not accounting for cold-start latency | Users experience 3-5s response times | Run warm-up requests before enabling traffic |
| Assuming shared OpCache across instances | Not understanding OpCache architecture | Some instances serve stale code | Invalidate OpCache on every instance independently |

## Anti-Patterns

- **One invalidation strategy for all caches**: Each cache type (OpCache, preloading, worker) needs a different strategy. One-size-fits-all fails.
- **No rollback plan for cache invalidation**: If deployment fails after cache invalidation, the system is in a mixed state. Always have a tested rollback procedure.
- **Skipping deployment verification**: After invalidation, verify OpCache hit rate, preloaded classes, and worker status. Don't assume invalidation succeeded.
- **Manual cache invalidation**: Automated pipelines prevent human error. Manual opcache_reset() calls are error-prone.

## Examples

```bash
# Deployment script sequence
rsync -a --delete /build/ /app/         # Step 1: Deploy code
systemctl reload php8.3-fpm             # Step 2: OpCache reset + worker reload
sleep 5                                 # Step 3: Wait for reload
cachetool opcache:reset --all           # Step 4: Verify OpCache reset
curl -s http://localhost/api/warm       # Step 5: Warm critical endpoints
curl -s http://localhost/health         # Step 6: Health check
# Step 7: Remove from load balancer maintenance
```

## Related Topics

- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- Preloading Update Procedure
- CI/CD Cache Invalidation Steps

## AI Agent Notes

- Caches must be invalidated in order: OpCache → preloading → workers. Wrong order causes stale-code serving.
- opcache_reset() does NOT clear preloaded classes. Preloaded classes survive reset.
- PHP-FPM graceful reload (SIGUSR2) and PHP-FPM restart (SIGTERM) are different. Reload is zero-downtime.
- Multi-instance deployments require per-instance cache invalidation — OpCache is not shared across servers.

## Verification

- [ ] All cache types identified (OpCache, preloading, worker, runtime)
- [ ] Invalidation procedure defined for each cache type
- [ ] Deployment script follows correct invalidation sequence
- [ ] Cache warm step included after invalidation
- [ ] Health check verifies successful invalidation
- [ ] Load balancer drain configured for preloading updates
- [ ] Rollback procedure tested and documented
