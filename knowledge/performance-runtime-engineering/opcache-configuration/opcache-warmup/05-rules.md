---
## Rule Name

Use opcache_compile_file in Preload Scripts, Not require

## Category

Performance

## Rule

Always use `opcache_compile_file()` in preloading scripts. Never use `require` or `include` for preloading.

## Reason

`require` compiles AND executes the file, potentially running code with side effects at PHP-FPM startup. `opcache_compile_file()` only compiles to opcodes without executing, which is exactly what preloading needs — no side effects, no unwanted state initialization.

## Bad Example

```php
// preload.php — executes files at startup
require __DIR__ . '/vendor/autoload.php';
require __DIR__ . '/app/Models/User.php';
```

## Good Example

```php
// preload.php — compiles without executing
opcache_compile_file(__DIR__ . '/vendor/autoload.php');
opcache_compile_file(__DIR__ . '/app/Models/User.php');
```

## Exceptions

When the preload script intentionally needs to execute code to register autoloaders or define functions before compilation.

## Consequences Of Violation

Unwanted code execution at PHP-FPM startup, potential errors from side effects, application state corruption.

---

## Rule Name

Preload Framework Classes, Not Application Files

## Category

Performance

## Rule

Preload only stable framework classes (vendor libraries, framework core). Do not preload application-specific files that change frequently.

## Reason

Framework classes are stable across deployments and used on nearly every request. Application files change frequently — preloading them requires a PHP-FPM restart after every code change, negating the benefit.

## Bad Example

```php
// Preloading all application files — requires restart on every change
opcache_compile_file(__DIR__ . '/app/Http/Controllers/UserController.php');
opcache_compile_file(__DIR__ . '/app/Models/User.php');
```

## Good Example

```php
// Preloading only stable framework files
opcache_compile_file(__DIR__ . '/vendor/laravel/framework/src/Illuminate/Foundation/Application.php');
opcache_compile_file(__DIR__ . '/vendor/laravel/framework/src/Illuminate/Container/Container.php');
```

## Exceptions

Deployments using container immutability where the entire application is prebuilt and deployed as a unit.

## Consequences Of Violation

Long PHP-FPM startup times, high baseline memory consumption, stale code serving after application code changes, frequent restarts needed.

---

## Rule Name

Test Preload Script Separately Before Deployment

## Category

Reliability

## Rule

Always test the preload script by running it manually (`php preload.php`) before configuring `opcache.preload` in production.

## Reason

A failing preload script prevents PHP-FPM from starting, taking the entire application offline. Testing the script separately catches syntax errors, missing files, and permission issues before they affect production.

## Bad Example

```bash
# Deployed preload.php with a typo — PHP-FPM fails to start
# Site is down until script is fixed and PHP-FPM is restarted
```

## Good Example

```bash
# Pre-deployment test
php preload.php
if [ $? -eq 0 ]; then
    echo "Preload script OK"
else
    echo "Preload script FAILED — do not deploy"
    exit 1
fi
```

## Exceptions

No common exceptions. Always test preload scripts before production deployment.

## Consequences Of Violation

PHP-FPM fails to start on all servers, full site outage, emergency rollback required.

---

## Rule Name

Restart PHP-FPM After Preload Script Changes

## Category

Maintainability

## Rule

Always restart PHP-FPM (not just `opcache_reset()`) when the preload script or any preloaded file changes.

## Reason

Preloaded files are loaded into memory at PHP-FPM startup and are NOT affected by `opcache_reset()`. They persist until the PHP-FPM process ends. Only a full restart clears and reloads preloaded files.

## Bad Example

```bash
# Changed preload.php and called opcache_reset()
php -r 'opcache_reset();'
# Preloaded files are still the old versions — restart needed
```

## Good Example

```bash
# Preload change requires full PHP-FPM restart
sudo systemctl restart php8.5-fpm
```

## Exceptions

No common exceptions. Preloaded files are bound to the PHP-FPM process lifetime.

## Consequences Of Violation

Preloaded code changes do not take effect despite successful `opcache_reset()`, leading to confusion and wasted debugging time.

---

## Rule Name

Warm Critical Endpoints After Cache Reset

## Category

Performance

## Rule

Always warm critical API endpoints after an `opcache_reset()` or deployment to repopulate the OpCache before serving user traffic.

## Reason

After a cache reset, every file must be compiled on first access. Sending synthetic requests to critical endpoints during a warm-up phase compiles the necessary files before real users encounter slow responses.

## Bad Example

```bash
# Deploy and immediately accept traffic — first user pays compilation cost
```

## Good Example

```bash
# Warm-up phase before accepting traffic
for endpoint in "/api/health" "/api/users" "/home"; do
    curl -s -o /dev/null "https://app.example.com$endpoint"
done
# Now accept traffic — cache is populated
```

## Exceptions

Low-traffic applications where the first few requests paying compilation cost is acceptable.

## Consequences Of Violation

Slow first requests for real users, inconsistent latency distribution after deployments.

---

## Rule Name

Monitor Preload Memory Consumption

## Category

Performance

## Rule

Always increase `opcache.memory_consumption` to accommodate preloaded files and monitor that preload + normal cache fits within the allocated memory.

## Reason

Preloaded files consume OpCache shared memory from the same pool as lazily-cached files. If the combined total exceeds `memory_consumption`, files are evicted and the preload benefit is lost.

## Bad Example

```ini
opcache.memory_consumption=128  # Default — may be insufficient with preloading
opcache.preload=/var/www/html/preload.php
# Preloaded files consume 80MB, leaving only 48MB for normal cache
```

## Good Example

```ini
opcache.memory_consumption=256  # Increased for preloading
opcache.preload=/var/www/html/preload.php
# Monitor: opcache_get_status() shows memory_usage < memory_consumption
```

## Exceptions

No common exceptions. Monitor memory usage and increase as needed.

## Consequences Of Violation

Cache thrashing, preloaded files evicted, hit rate below 99%, wasted preloading benefit.

---

## Rule Name

Do Not Preload in Development Environments

## Category

Maintainability

## Rule

Never configure preloading in development environments.

## Reason

Preloading adds startup time and makes code changes harder to test (preloaded files persist until restart). Development environments benefit from immediate code feedback, which preloading hinders.

## Bad Example

```ini
; Development environment with preloading enabled
opcache.preload=/var/www/html/preload.php
opcache.preload_user=www-data
# Developer must restart PHP-FPM on every code change
```

## Good Example

```ini
; Development — no preloading, just timestamp validation
opcache.validate_timestamps=1
opcache.revalidate_freq=2
```

## Exceptions

No common exceptions. Preloading is a production-only optimization.

## Consequences Of Violation

Frustrating development experience, unnecessary PHP-FPM restarts, developers disabling OpCache to work around preloading.
