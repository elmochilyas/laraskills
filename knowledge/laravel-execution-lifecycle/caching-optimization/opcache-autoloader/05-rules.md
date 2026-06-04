## Enable OpCache with Sufficient Memory in Production
---
## Performance
---
## Always enable OpCache in production with `opcache.memory_consumption` set to at least 256MB for Laravel applications.
---
## Without OpCache, PHP recompiles every PHP file on every request — 100-300ms overhead. Insufficient memory causes OpCache to evict compiled files, reducing hit ratio and causing cache thrashing that is worse than no OpCache at all.
---
```ini
opcache.memory_consumption=64  ; Default — too small for Laravel
```
---
```ini
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.interned_strings_buffer=32
```
---
## Systems with extreme memory constraints (<512MB total RAM). In these cases, monitor hit ratio closely and reduce memory allocation.
---
## Cache thrashing degrades performance below uncached levels; wasted debugging time attributing slowness to application code.
---
## Disable validate_timestamps in Production
---
## Performance
---
## Set `opcache.validate_timestamps=0` in production PHP configuration.
---
## Timestamp validation adds a `stat()` system call for every PHP file OpCache checks. With `validate_timestamps=0`, OpCache serves compiled opcodes from shared memory with zero filesystem interaction until explicitly reset.
---
```ini
opcache.validate_timestamps=1
opcache.revalidate_freq=2  ; Periodic stat() overhead
```
---
```ini
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```
---
## Development environments where code changes must be immediately visible.
---
## 1 stat() call per PHP file per request; code changes on production require explicit reset; stale opcodes may serve old code if reset is forgotten.
---
## Reset OpCache After Every Deployment
---
## Reliability
---
## Always call `opcache_reset()` or restart PHP-FPM/Octane workers as the final step after every code deployment.
---
## With `opcache.validate_timestamps=0`, PHP never checks if files changed. Newly deployed PHP files are ignored — the old compiled opcodes continue serving. Only an explicit OpCache reset or worker restart loads the new files.
---
```bash
php artisan optimize
# Deployed but PHP still serves old compiled code
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
## Deployments appear to fail; security patches not active; debugging time wasted on "deploy not working."
---
## Use --optimize-autoloader with composer install in Production
---
## Performance
---
## Always pass `--optimize-autoloader` (or `-o`) when running `composer install` in production deployment scripts.
---
## The optimized autoloader generates `vendor/composer/autoload_classmap.php` — an O(1) class-to-file mapping. Without it, Composer relies on PSR-4 filesystem resolution for every class, adding 5-50µs per class and 2-5ms total bootstrap overhead.
---
```bash
composer install --no-dev
```
---
```bash
composer install --no-dev --optimize-autoloader
```
---
## No common exceptions.
---
## 2-5ms avoidable bootstrap overhead; filesystem stat() calls on every class resolution.
---
## Use Authoritative Mode (-a) Only When Classmap Is Complete
---
## Framework Usage
---
## Use `composer dump-autoload -a` (authoritative mode) only when every class in the application is resolvable from the classmap and no dynamic class generation occurs.
---
## Authoritative mode skips all PSR-4 filesystem fallback checks entirely. This is the fastest autoloading mode but causes `ClassNotFoundException` for dynamically generated classes (factories, proxies, stubs) that exist on the filesystem but are not in the classmap.
---
```bash
composer dump-autoload -a
# Dynamic factory classes not in classmap — ClassNotFoundException
```
---
```bash
# Audit first: no dynamic classes
composer dump-autoload -a
# If dynamic classes exist, use optimized mode instead
composer dump-autoload -o
```
---
## Octane deployments where the worker process has a stable class set and no dynamic class generation is used.
---
## ClassNotFoundException for factory/proxy classes; production incidents requiring emergency classmap regeneration.
---
## Set max_accelerated_files Above Your PHP File Count
---
## Performance
---
## Set `opcache.max_accelerated_files` to a value above your total PHP file count (at least 20000 for typical Laravel apps).
---
## OpCache stops caching new files once the `max_accelerated_files` limit is reached. Laravel projects typically have 5000-15000 PHP files. A value below the file count means some files are never cached, causing them to compile on every request.
---
```ini
opcache.max_accelerated_files=4000  ; Below typical Laravel file count
```
---
```ini
; Find your file count: find . -name "*.php" | Measure-Object -Line
opcache.max_accelerated_files=20000
```
---
## No common exceptions.
---
## Some PHP files compile on every request; inconsistent performance depending on which files OpCache evicts.
---
## Preload Framework Files for Octane Deployments
---
## Performance
---
## Use `opcache.preload` to load and compile stable framework files at PHP server startup in Octane environments.
---
## Preloading eliminates file loading, parsing, and compilation entirely for preloaded files. In Octane, where workers are long-lived, preloading the Laravel framework core and common vendor classes provides the maximum bootstrap speedup.
---
```ini
; No preloading configured
```
---
```ini
opcache.preload=/var/www/preload.php
opcache.preload_user=www-data
```
```php
// preload.php
opcache_compile_file('/var/www/vendor/laravel/framework/src/Illuminate/Foundation/Application.php');
```
---
## Traditional PHP-FPM deployments where preloading provides no benefit (each request is a fresh process).
---
## 5-10ms extra bootstrap overhead per Octane request; preloadable speedup left unrealized.
---
## Monitor OpCache Hit Ratio in Production
---
## Maintainability
---
## Monitor `opcache_get_status()['memory_usage']` to ensure OpCache hit ratio stays above 95% in production.
---
## A declining hit ratio indicates OpCache memory or max files settings are insufficient for the growing application. Left undetected, this causes gradual performance degradation as more files fall out of the cache.
---
```php
// Not monitoring OpCache status
```
---
```php
$status = opcache_get_status();
$hitRatio = $status['opcache_statistics']['hit_rate'] ?? 0;
if ($hitRatio < 95) {
    Log::warning("OpCache hit ratio dropped to {$hitRatio}%", $status['memory_usage']);
}
```
---
## No common exceptions.
---
## Gradual, undetected performance degradation; cache thrashing at scale; production incidents triggered by deployment scale changes.
