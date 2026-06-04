## Warm Caches Before Traffic Is Routed in CI/CD
---
## Performance
---
## Always generate all bootstrap caches during the CI/CD deploy step, before the symlink swap, load balancer registration, or DNS cutover.
---
## Servers that start serving traffic without pre-generated caches pay 50-150ms bootstrap penalty on every first request. Under load, the first concurrent requests may trigger a cache stampede where multiple workers regenerate the same cache files simultaneously.
---
```bash
# CI/CD deploy script
ln -sfn /releases/new-release /current
php artisan optimize  # First requests already hitting uncached app
```
---
```yaml
- name: Deploy & Warmup
  run: |
    php artisan optimize:clear
    php artisan optimize
    php artisan view:cache
    php artisan route:list --format=json
```
---
## Symlink-swap deployments where the warmup runs on the server in the activate hook immediately before the swap.
---
## First-request latency spikes; cache stampede under load; degraded user experience during deployment window.
---
## Use Build-Time Warmup for Container Deployments
---
## Performance
---
## Generate bootstrap caches during the Docker image build step and include them in the final container image.
---
## Container images built without pregenerated caches must generate them at container startup or on first request. Build-time warmup moves the 5-30 second cache generation cost to build time, reducing deployment latency and startup time.
---
```dockerfile
FROM php:8.3-fpm AS final
COPY . /var/www
# Missing: cache generation during build
```
---
```dockerfile
FROM php:8.3-fpm AS build
COPY . /var/www
RUN composer install --no-dev --optimize-autoloader
RUN php artisan optimize:clear && php artisan optimize && php artisan event:cache

FROM php:8.3-fpm AS final
COPY --from=build /var/www /var/www
```
---
## Environments where the build environment has different environment variables than production (secrets cannot be resolved at build time).
---
## Cold-start latency on container initialization; cache stampede when multiple containers start simultaneously.
---
## Use Production-Like Environment Variables for Cache Builds in CI
---
## Reliability
---
## Always use production-like environment variable values when building caches in CI/CD pipelines.
---
## Caches freeze `env()` calls at build time. Building caches with CI-specific env values (staging keys, local database URLs) results in production running with CI environment values frozen in the cached config.
---
```yaml
# CI pipeline builds caches with CI environment variables
- run: php artisan optimize
```
---
```yaml
- run: |
    cp .env.production .env
    php artisan optimize
# Or pass production-like values as CI secrets
```
---
## Applications that use zero `env()` calls in their config files (config only uses `config()` calls with hardcoded defaults).
---
## Production database connections fail; API calls use wrong API keys; secrets from CI environment leak into production cache files.
---
## Verify Cache Integrity After Warmup
---
## Testing
---
## Include a cache verification step after warmup in CI/CD pipelines to confirm all caches were generated correctly.
---
## A failed warmup (permissions error, missing directory, Closure route) silently falls back to uncached mode. Without verification, the deployment succeeds but production runs without optimization benefits.
---
```bash
php artisan optimize
php artisan event:cache
# No verification
```
---
```bash
php artisan optimize
php artisan event:cache
php artisan route:list --format=json | Out-Null
Test-Path bootstrap/cache/config.php
Test-Path bootstrap/cache/routes.php
```
---
## No common exceptions.
---
## Production runs uncached after every deployment; performance regression goes undetected until load testing or incident.
---
## Reset OpCache After Cache Files Are Written
---
## Reliability
---
## Always reset OpCache or restart PHP workers after writing new cache files during warmup.
---
## With `opcache.validate_timestamps=0`, PHP serves stale opcodes for the old cache files even after new files are written. The warmup is invisible until OpCache is cleared.
---
```bash
php artisan optimize
# Warmup complete but OpCache still serves old cache files
```
---
```bash
php artisan optimize
php artisan optimize:clear
php artisan optimize
php artisan event:cache
sudo systemctl reload php8.3-fpm
```
---
## Environments using `opcache.validate_timestamps=1`.
---
## Deploy appears successful but old caches continue serving; debugging time wasted on "changes not taking effect."
---
## Run optimize:clear Before optimize in CI/CD
---
## Reliability
---
## Always execute `php artisan optimize:clear` before `php artisan optimize` in CI/CD deployment scripts.
---
## Build artifacts or cached files from a previous CI run may contaminate the new deployment. Clearing first ensures a clean slate and prevents hybrid old/new cache states.
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
## Rollback deployments where the previous release's caches must be preserved.
---
## Class not found errors; stale provider references; unpredictable behavior after deployment.
---
## Fail the Deployment on Cache Build Errors
---
## Reliability
---
## Configure CI/CD pipelines to fail the deployment if any cache generation command exits with a non-zero status.
---
## A failed warmup (e.g., `route:cache` blocked by a Closure) leaves the application without cached routes but still deploys. The error is silent — no alert, no rollback — and production runs degraded.
---
```bash
php artisan optimize
# Ignoring exit code — deployment proceeds
```
---
```yaml
- run: php artisan optimize
  shell: bash
- run: php artisan event:cache
  shell: bash
# Pipeline fails automatically on any non-zero exit
```
---
## No common exceptions.
---
## Degraded production performance; deployment pipeline provides false confidence; incidents discovered only through user complaints.
