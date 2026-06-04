## Plan cache invalidation for every caching layer in the deployment
---
Category: Reliability
---
Document and execute invalidation for ALL caching layers during deployment: OpCache, config cache, route cache, view cache, events cache, and application caches.
---
Reason: Partial invalidation is the most common deployment failure. Updated code may load stale config, old routes, or cached views. A deployment checklist covering every cache layer prevents post-deploy errors.
---
Bad Example:
```bash
# Only resetting OpCache — old config/route caches remain
cachetool opcache:reset --all
# Application errors from mismatched cache states
```

Good Example:
```bash
php artisan down
git pull
composer install --no-dev
php artisan optimize:clear # Clears ALL Laravel caches
php artisan optimize        # Rebuilds all caches
cachetool opcache:reset --all
php artisan up
```
---
Exceptions: Zero-downtime deployments using blue-green or rolling strategies where old traffic still uses old cache state.
---
Consequences Of Violation: Application errors from cache state mismatch, stale configurations serving after deployment.

## Use blue-green deployment for zero-downtime OpCache invalidation
---
Category: Reliability
---
Deploy via blue-green strategy where cache invalidation happens on the idle environment before traffic switch.
---
Reason: Blue-green deployment eliminates cold-start latency for users and provides instant rollback. OpCache is pre-warmed on the new environment before receiving traffic. No user experiences the 2-5s cold-start after cache reset.
---
Bad Example:
```bash
# In-place deployment — users experience cold-start
opcache_reset()
# First 10 users: 2-5s latency each
```

Good Example:
```bash
# Blue-green deployment
# 1. Deploy to green environment
# 2. Warm OpCache on green
# 3. Switch traffic to green
# 4. Users never experience cold-start
```
---
Exceptions: Single-server deployments where blue-green is not feasible.
---
Consequences Of Violation: Users experience cold-start latency after every deployment.

## Never rely on validate_timestamps=1 for deployment cache invalidation
---
Category: Reliability
---
Use explicit opcache_reset() or PHP-FPM restart for cache invalidation. Never depend on file timestamp checking in production.
---
Reason: validate_timestamps=1 adds stat() syscall overhead (1-3% CPU) and has race conditions during deployments — files may be partially updated when check runs. Explicit invalidation is deterministic and avoids both issues.
---
Bad Example:
```ini
; Relying on timestamp checking for deployment invalidation
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

Good Example:
```ini
opcache.validate_timestamps=0 ; No stat() overhead
; Deploy with explicit opcache_reset()
```
---
Exceptions: Development environments where file changes must be immediately visible.
---
Consequences Of Violation: Race conditions during deployment, stale mixed-state code serving, 1-3% CPU waste.
