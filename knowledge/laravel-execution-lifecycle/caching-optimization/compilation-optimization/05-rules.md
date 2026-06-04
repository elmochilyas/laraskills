## Always Run optimize in Production Deployments
---
## Performance
---
## Always run `php artisan optimize` as the final deployment step before directing traffic to the new version.
---
## Each bootstrap cache (config, routes, events, services) independently reduces request overhead. Together they eliminate 50-150ms of bootstrap time per request. Omitting `optimize` leaves significant performance on the table.
---
```bash
php artisan migrate --force
# Deployed without optimize — production runs uncached
```
---
```bash
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
php artisan event:cache
```
---
## Ephemeral environments or single-request containers where bootstrap time is irrelevant.
---
## 50-150ms unnecessary overhead on every request; throughput reduced under load; auto-scaling environments pay this cost on every new instance.
---
## Run optimize:clear Before Every optimize
---
## Reliability
---
## Always execute `php artisan optimize:clear` immediately before `php artisan optimize` in deployment scripts.
---
## Cached files from a previous deployment may reference old classes, old provider paths, or old file structures. Building new caches on top of stale ones creates a hybrid state where some cache entries point to old code and others point to new code.
---
```bash
php artisan optimize
# Old cache files from previous deploy still present
```
---
```bash
php artisan optimize:clear
php artisan optimize
```
---
## No common exceptions.
---
## Class not found errors from old references; unpredictable behavior where some requests get new code and others get old code.
---
## Run Migrations Before optimize
---
## Reliability
---
## Always run `php artisan migrate --force` before `php artisan optimize` in deployment sequences.
---
## Cached routes and configurations may reference database columns or tables that only exist after migrations. Building caches before migrations causes runtime errors when the cached code tries to access non-existent schema.
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
## Deployments with zero database schema changes (configuration-only or route-only changes).
---
## Route resolution errors; queries referencing missing columns; non-zero downtime during the migration window.
---
## Cache in the Correct Dependency Order
---
## Framework Usage
---
## Build caches in dependency order: config cache first, then route cache, then event cache.
---
## Route caching depends on resolved configuration (URL defaults, middleware parameters). Event service providers may read config to conditionally register listeners. The wrong order produces caches with unresolved or incorrect values.
---
```bash
php artisan route:cache
php artisan config:cache
php artisan event:cache
```
---
```bash
php artisan config:cache
php artisan route:cache
php artisan event:cache
```
---
## Running individual cache commands independently when only one cache type is stale.
---
## Cached routes reference wrong URL defaults; event listeners registered with unresolved config values.
---
## Use Targeted Cache Commands for Focused Changes
---
## Performance
---
## Prefer individual cache commands (`config:cache`, `route:cache`, `event:cache`) over full `optimize` when only one cache type has changed.
---
## `php artisan optimize` runs all sub-commands sequentially, taking 2-5 seconds. When only routes changed, a targeted `route:cache` completes in 1-2 seconds, reducing deployment time and risk.
---
```bash
php artisan optimize:clear
php artisan optimize
# When only one route file was modified
```
---
```bash
# Only routes changed
php artisan route:cache
# Verify
php artisan route:list
```
---
## Deployments that include multiple types of changes (config + routes + providers) or where the deployment time budget allows full optimize.
---
## Unnecessary deployment latency; increased window for race conditions during zero-downtime deploys.
---
## Verify Cache Integrity After Optimization
---
## Testing
---
## Run health checks that exercise cached paths after `php artisan optimize` completes to confirm all caches are valid.
---
## A partial cache failure (e.g., `route:cache` fails due to a Closure but `config:cache` succeeds) leaves the application in an inconsistent state. Health checks catch these failures before they reach users.
---
```bash
php artisan optimize
# No verification step
```
---
```bash
php artisan optimize
php artisan route:list --format=json | Out-Null
php artisan config:get('app.name')
```
---
## No common exceptions.
---
## Inconsistent application state deployed to production; some features work, others fail; debugging time wasted on non-deterministic behavior.
---
## Never Run optimize in Development
---
## Maintainability
---
## Never run `php artisan optimize` in local development environments; use `php artisan optimize:clear` to ensure fresh state.
---
## Optimize caches freeze configuration, routes, and provider state. In development, where these change frequently, optimize masks all changes until the cache is cleared — causing confusion, wasted debugging, and accidental commits of cache files.
---
```bash
php artisan optimize
# Wondering why route changes don't take effect
```
---
```bash
php artisan optimize:clear
# Routes and config load fresh on every request
```
---
## No common exceptions.
---
## Developer confusion and lost productivity; environment-specific cache files accidentally committed to version control.
