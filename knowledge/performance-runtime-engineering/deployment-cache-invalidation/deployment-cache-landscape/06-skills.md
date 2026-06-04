# Skill: Plan Multi-Layer Cache Invalidation Order for PHP Deployments

## Purpose
Plan and execute invalidation for all PHP caching layers (OpCache, preloading, config cache, route cache, view cache, events cache, and application caches) in the correct order during deployment — OpCache reset first (fast, clears compiled opcodes), then preloading refresh via full PHP-FPM restart (if preloading changed), then Laravel `optimize:clear`, then worker reload via graceful USR2 signal — verifying each step before proceeding.

## When To Use
- Every PHP deployment to production
- Planning a deployment pipeline for PHP applications
- Diagnosing stale-code serving issues after deployments
- Training operations teams on PHP-specific deployment procedures

## When NOT To Use
- Development environments where code changes frequently
- Static sites without PHP execution
- Read-only deployments where code doesn't change

## Prerequisites
- Inventory of all caching layers used by the application
- cachetool installed for OpCache operations
- Systemd/supervisor access for PHP-FPM management
- Understanding of cache invalidation mechanisms per layer

## Inputs
- Application cache layer inventory (OpCache, preloading, config, route, view, events)
- Deployment script with step-by-step invalidation
- Health check endpoint for verification

## Workflow

### 1. Identify All Caching Layers
- OpCache: compiled PHP opcodes in shared memory
- Preloading: eagerly loaded classes at startup (PHP-FPM restart required)
- Laravel/application caches: config, route, view, events, compiled services
- Application cache stores: Redis, Memcached entries
- Deploy as atomic symlink swap to prevent mixed file reads

### 2. Invalidate in the Correct Order
- Step 1: Code deploy (symlink swap)
- Step 2: OpCache reset: `cachetool opcache:reset --all` (fastest)
- Step 3: Preloading refresh (if changed): full PHP-FPM restart with load balancer drain
- Step 4: Application cache clear: `php artisan optimize:clear` (Laravel)
- Step 5: Application cache rebuild: `php artisan optimize`
- Step 6: PHP-FPM graceful reload: `systemctl reload php8.x-fpm`
- Step 7: Cache warm: hit critical endpoints
- Step 8: Health check: verify all layers

### 3. Verify Each Invalidation Step
- OpCache: confirm `opcache_get_status()['hit_rate'] == 0` after reset
- Preloading: confirm `opcache_get_status()['preload_statistics']` populated after restart
- Application caches: confirm cache files are regenerated
- Never assume invalidation succeeded — always verify

### 4. Handle Preloading Changes Separately
- Preloading requires full PHP-FPM restart (not just reload)
- Coordinate with load balancer: drain, restart, warm, rejoin
- opcache_reset() does NOT refresh preloaded classes
- Document when preloading changes are made

### 5. Document the Sequence in Deployment Runbook
- Write the invalidation sequence in the deployment script
- Include verification checks after each invalidation
- Test the full sequence in staging
- Rollback procedure should follow the same order in reverse

## Validation Checklist
- [ ] All caching layers identified (OpCache, preloading, config, route, view, events)
- [ ] Invalidation sequence documented and correct
- [ ] Each step verified (not just assumed)
- [ ] Preloading changes handled with full restart
- [ ] Cache warm step included after invalidation
- [ ] Health check verifies successful invalidation
- [ ] Load balancer drain configured for full restarts
- [ ] Rollback procedure tested and documented

## Related Rules
- Invalidate ALL caching layers (`05-rules.md:1`)
- Use blue-green for zero-downtime (`05-rules.md:31`)
- Never rely on validate_timestamps (`05-rules.md:59`)

## Related Skills
- OpCache Reset Strategies
- PHP-FPM Graceful Reload Patterns
- Preloading Update Procedure
- CI/CD Cache Invalidation Steps

## Success Criteria
- All caching layers identified and invalidated in correct order
- Each invalidation verified (not assumed)
- Preloading changes handled with full restart and load balancer drain
- Cache warm-up prevents first-user cold-start
- Rollback procedure follows the same sequence in reverse
- Deployment runbook documents the complete invalidation procedure
