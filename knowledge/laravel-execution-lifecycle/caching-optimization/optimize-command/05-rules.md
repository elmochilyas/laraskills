## Run optimize as the Final Deployment Step
---
## Performance
---
## Always run `php artisan optimize` as the last command in deployment scripts, after all code is in place and migrations are complete.
---
## `optimize` generates caches that reflect the deployed code state. Running it before code is fully deployed produces caches that reference non-existent files; running it before migrations produces caches that reference non-existent schema.
---
```bash
php artisan optimize
composer install --no-dev
php artisan migrate --force
```
---
```bash
composer install --no-dev
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
php artisan event:cache
```
---
## No common exceptions.
---
## Cached config references missing classes; cached routes reference missing schema columns; deployment must be rolled back and re-run.
---
## Run event:cache Separately After optimize
---
## Framework Usage
---
## Always run `php artisan event:cache` as a separate command after `php artisan optimize` in deployment scripts.
---
## In most Laravel versions, `event:cache` is NOT part of the `optimize` composite command. Relying on `optimize` to cache events leaves event discovery uncached.
---
```bash
php artisan optimize
# Event listeners still run auto-discovery on every request
```
---
```bash
php artisan optimize
php artisan event:cache
php artisan event:list
```
---
## Laravel versions where the framework explicitly includes `event:cache` in `optimize` (verify with `php artisan help optimize`).
---
## 10-30ms per-request auto-discovery overhead; listeners may silently not fire if `event:cache` was never run.
---
## Clear Before Optimize: Run optimize:clear First
---
## Reliability
---
## Always execute `php artisan optimize:clear` immediately before `php artisan optimize` to prevent stale cache artifacts.
---
## `optimize` builds new cache files but does not automatically remove entries from previous cache files for sub-commands. Old provider references, old route definitions, or old config values may persist if old files are not cleared first.
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
## No common exceptions.
---
## Hybrid stale/fresh cache state; class not found errors; unpredictable application behavior after deployment.
---
## Never Run optimize in Local Development
---
## Maintainability
---
## Never run `php artisan optimize` in local development environments; use `php artisan optimize:clear` to ensure fresh state.
---
## Running `optimize` in development caches the current state of config, routes, and providers. Subsequent changes to these files go unnoticed until the cache is cleared, causing confusion and wasted debugging time.
---
```bash
php artisan optimize
# Editor made, but config changes don't take effect
```
---
```bash
php artisan optimize:clear
# Config and routes load fresh on every request
```
---
## No common exceptions.
---
## Developers lose time debugging phantom issues; environment-specific cache files may be accidentally committed.
---
## Verify optimize Output for Errors
---
## Reliability
---
## Always check the exit code and output of `php artisan optimize` in deployment scripts; fail the deployment on any error.
---
## `optimize` runs sub-commands sequentially. If `config:cache` succeeds but `route:cache` fails (e.g., due to a Closure), the command exits with an error and leaves the app in a partially cached state — config cached, routes not.
---
```bash
php artisan optimize
# Ignoring error output — deployment continues
```
---
```bash
php artisan optimize
if ($LASTEXITCODE -ne 0) {
    Write-Error "Optimize failed — aborting deployment"
    exit 1
}
```
---
## No common exceptions.
---
## Partially cached application deployed to production; some features work, others fail; debugging time wasted on non-deterministic behavior.
---
## Ensure bootstrap/cache/ Has Correct Permissions
---
## Maintainability
---
## Verify that the `bootstrap/cache/` directory is writable by the deployment user and readable by the web server user.
---
## `optimize` silently fails when it cannot write cache files. If permissions are incorrect, the command completes with a warning but does not fail the deployment — leaving the application uncached without clear notification.
---
```bash
# bootstrap/cache/ owned by root
php artisan optimize  # Succeeds silently but writes nothing
```
---
```bash
chown -R deploy:www-data bootstrap/cache/
chmod -R 775 bootstrap/cache/
php artisan optimize
```
---
## No common exceptions.
---
## Production runs uncached despite "optimize" running in deployment script; performance regression goes undetected.
