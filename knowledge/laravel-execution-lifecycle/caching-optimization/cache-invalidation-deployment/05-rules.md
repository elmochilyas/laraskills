## Warm Caches Before Routing Traffic to New Deployment
---
## Reliability
---
## Always build all bootstrap caches before the traffic switch (symlink swap, load balancer registration, or DNS cutover).
---
## Without pre-warming, the first requests to the new deployment trigger uncached bootstrap (50-150ms penalty) and risk a cache stampede where multiple concurrent requests all attempt to regenerate the same cache simultaneously.
---
```bash
ln -sfn /releases/new-release /current
# Now warming caches — first requests served uncached
php artisan optimize
```
---
```bash
php artisan optimize:clear
php artisan optimize
php artisan event:cache
ln -sfn /releases/new-release /current
```
---
## Ephemeral or serverless environments where cache files are included in the deployment artifact and cannot be written after the traffic switch.
---
## First-request latency spikes; cache stampede under load; degraded user experience during deployment window.
---
## Clear Caches Before Warming in Deployment
---
## Reliability
---
## Always run `php artisan optimize:clear` before `php artisan optimize` during every deployment.
---
## Old cache files from the previous deployment may reference removed classes, old provider paths, or stale configuration keys. Building new caches without clearing produces a hybrid state where some entries point to old code.
---
```bash
php artisan optimize
```
---
```bash
php artisan optimize:clear
php artisan optimize
php artisan event:cache
```
---
## Rollback scenarios where the previous release's caches must be preserved for instant revert.
---
## Class not found errors; provider registration failures; unpredictable behavior after deployment.
---
## Run Migrations Before Cache Warmup
---
## Reliability
---
## Always run `php artisan migrate --force` before cache warmup commands in deployment sequences.
---
## Cached routes and configuration may reference database columns, tables, or records that only exist after migrations are applied. Building caches before migrations produces artifacts that fail at runtime with missing schema errors.
---
```bash
php artisan optimize
php artisan migrate --force
```
---
```bash
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
```
---
## Deployments with zero database schema changes.
---
## Route resolution errors; query failures on non-existent columns; potential downtime during the migration window.
---
## Restart PHP Workers After Cache Build
---
## Reliability
---
## Always restart PHP-FPM or Octane workers as the final deployment step after cache files are written.
---
## With `opcache.validate_timestamps=0`, PHP processes hold stale opcodes in shared memory even after new PHP files (including cache files) are deployed. Worker restart is required to flush OpCache and load the new cached files.
---
```bash
php artisan optimize
# Caches built but PHP-FPM still serves old opcodes
```
---
```bash
php artisan optimize
php artisan event:cache
sudo systemctl reload php8.3-fpm
# or
php artisan octane:reload
```
---
## Environments using `opcache.validate_timestamps=1` (not recommended for production).
---
## Old code continues serving despite new deployment; security patches not active; debugging time wasted on "deploy not working" issues.
---
## Keep Previous Release Caches for Instant Rollback
---
## Reliability
---
## Preserve the previous release's `bootstrap/cache/` directory when using symlink-swap deployments for instant rollback capability.
---
## Rolling back to a previous release without cached files forces the old code to run uncached, causing performance degradation during the rollback. Keeping the old release's caches intact ensures zero-downtime rollbacks.
---
```bash
# Deleting old release removes its caches
rm -rf /releases/previous-release
```
---
```bash
# Symlink-swap deployment keeps previous release intact
/releases/current -> /releases/v123
/releases/previous -> /releases/v122
# Each release carries its own bootstrap/cache/
```
---
## Container-based deployments where each image is immutable and rollback means deploying the previous image.
---
## Rollback causes performance regression; users experience slow responses during incident recovery.
---
## Prevent Concurrent Cache Generation
---
## Reliability
---
## Serialize deployments or use distributed locks to prevent concurrent cache generation from overlapping CI/CD pipelines.
---
## Two simultaneous deployment processes writing to `bootstrap/cache/` can produce corrupted cache files — one process may read a partially-written file that the other is generating, or both may write interleaved data.
---
```bash
# Two CI pipelines running deploy simultaneously
Pipeline-A: php artisan optimize
Pipeline-B: php artisan optimize  # Both write to same cache files
```
---
```bash
# Use deployment locking or serialized pipelines
# GitHub Actions: concurrency group per environment
concurrency:
  group: production-deploy
  cancel-in-progress: false
```
---
## Single-developer workflows where concurrent deployments are impossible.
---
## Corrupted cache files cause 500 errors; incident required to manually clear and regenerate caches.
