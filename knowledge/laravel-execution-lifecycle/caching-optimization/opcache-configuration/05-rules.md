## Allocate Sufficient OpCache Memory for Laravel
---
## Performance
---
## Set `opcache.memory_consumption` to at least 256MB for Laravel production environments.
---
## Laravel with common packages requires 128-256MB of OpCache shared memory to hold all compiled PHP files. Insufficient memory causes OpCache to evict previously cached files to make room for new ones — cache thrashing that degrades performance below uncached levels.
---
```ini
opcache.memory_consumption=64  ; Default — causes evictions
```
---
```ini
opcache.memory_consumption=256
```
---
## Systems with severe memory constraints (<512MB RAM). Monitor hit ratio and reduce allocation proportionally.
---
## Cache hit ratio drops below 50%; performance worse than running without OpCache due to eviction overhead.
---
## Disable validate_timestamps in Production
---
## Performance
---
## Set `opcache.validate_timestamps=0` in production; never use `opcache.revalidate_freq` as a compromise.
---
## Timestamp validation adds stat() system call overhead for every PHP file OpCache checks. Disabling it eliminates all filesystem interaction for cached files. `revalidate_freq` only reduces the frequency but still causes periodic stat() storms.
---
```ini
opcache.validate_timestamps=1
opcache.revalidate_freq=2  ; Periodic stat() overhead on every request
```
---
```ini
opcache.validate_timestamps=0
opcache.revalidate_freq=0
```
---
## Development environments where code changes must reflect immediately without manual cache reset.
---
## Unnecessary stat() calls on every request; unpredictable revalidation delays causing inconsistent behavior.
---
## Reset OpCache After Every Deployment
---
## Reliability
---
## Always reset OpCache or restart PHP workers after every code deployment when using `validate_timestamps=0`.
---
## With `validate_timestamps=0`, OpCache never checks if PHP files have changed. Newly deployed files are ignored — the old compiled opcodes continue serving until a reset or restart occurs. This is the most common OpCache-related deployment mistake.
---
```bash
php artisan optimize
# PHP-FPM not restarted — old opcodes still serve
```
---
```bash
php artisan optimize
sudo systemctl reload php8.3-fpm
# or
php artisan octane:reload
```
---
## Environments using `validate_timestamps=1` (not recommended for production).
---
## Deployments appear to fail; security patches not active; debugging sessions wasted on "deploy not working."
---
## Set max_accelerated_files Above Total PHP File Count
---
## Performance
---
## Set `opcache.max_accelerated_files` to at least 20000 or above your total PHP file count.
---
## OpCache stops accelerating files once the `max_accelerated_files` limit is reached. Laravel applications typically contain 5000-15000 PHP files. Files beyond the limit compile on every request, creating unpredictable performance.
---
```ini
opcache.max_accelerated_files=4000
```
---
```ini
opcache.max_accelerated_files=20000
```
---
## No common exceptions.
---
## Some PHP files never cached; inconsistent request latency; hard-to-diagnose performance issues.
---
## Use opcache.preload Only for Stable Framework Files
---
## Performance
---
## Preload only stable framework and vendor files via `opcache.preload`; never preload application code that changes between deployments.
---
## Preloaded files are permanently cached in OpCache and cannot be invalidated without a full PHP server restart. Preloading application code that changes frequently forces server restarts on every deployment, defeating the purpose of zero-downtime deployments.
---
```php
// preload.php — preloading application code
opcache_compile_file('/var/www/app/Models/User.php');
opcache_compile_file('/var/www/app/Http/Controllers/DashboardController.php');
```
---
```php
// preload.php — preloading only stable framework files
opcache_compile_file('/var/www/vendor/laravel/framework/src/Illuminate/Foundation/Application.php');
opcache_compile_file('/var/www/vendor/composer/autoload.php');
```
---
## Octane deployments where the server restarts on every deploy anyway and preloading application code is acceptable.
---
## Server restart required for every code change; zero-downtime deployment strategy undermined.
---
## Never Expose OpCache Status Endpoint in Production
---
## Security
---
## Disable the `opcache.status` page or protect it with authentication in production environments.
---
## OpCache status pages expose server file paths, compilation statistics, memory usage, and cached file lists. This information aids attackers in understanding the application structure and identifying potential attack vectors.
---
```ini
; Default allows public status page access
opcache.status=1
```
---
```ini
opcache.status=0
```
---
## Internal monitoring tools that require OpCache status for observability. In these cases, restrict access via firewall or authentication.
---
## Information disclosure: file paths, compilation statistics, and memory layout exposed to potential attackers.
---
## Monitor OpCache Hit Ratio and Memory Usage
---
## Maintainability
---
## Continuously monitor OpCache hit ratio and memory usage using `opcache_get_status()` in production observability.
---
## A declining hit ratio or increasing memory usage indicates the application has outgrown the current OpCache configuration. Early detection prevents gradual performance degradation and unplanned capacity issues.
---
```php
// Not monitoring OpCache
```
---
```php
$status = opcache_get_status();
$hitRatio = $status['opcache_statistics']['hit_rate'];
$usedMemory = $status['memory_usage']['used_memory'];
$freeMemory = $status['memory_usage']['free_memory'];
Log::info("OpCache: {$hitRatio}% hit ratio, using " . round($usedMemory / 1024 / 1024, 1) . "MB");
```
---
## No common exceptions.
---
## Gradual, unnoticed performance degradation; production incidents during traffic spikes when OpCache is thrashing.
---
## Use Fast Shutdown for Clean Process Termination
---
## Performance
---
## Set `opcache.fast_shutdown=1` in production PHP configuration.
---
## Fast shutdown enables an optimized process termination sequence that releases OpCache resources more efficiently. It reduces request tail latency and is safe for all Laravel deployments.
---
```ini
; Default or disabled
opcache.fast_shutdown=0
```
---
```ini
opcache.fast_shutdown=1
```
---
## Environments where the setting causes process termination issues (rare, test in staging first).
---
## Marginal latency increase (microseconds) on request termination.
