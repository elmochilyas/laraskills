# OpCache Configuration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | OpCache Configuration |
| Difficulty | Intermediate |
| Lifecycle Phase | Runtime |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
PHP OpCache caches compiled PHP opcodes in shared memory, eliminating the need to re-parse and compile PHP source files on every request. For Laravel, OpCache is critical because the framework loads hundreds of PHP files during bootstrap. Proper OpCache configuration can reduce bootstrap overhead by 50-70%, while misconfiguration can cause stale code to run after deployment or prevent updates from taking effect until the cache expires.

## Core Concepts
- **Opcode caching**: PHP compiles source code to opcodes (Zend engine instructions). OpCache stores these in shared memory, skipping compilation on subsequent requests.
- **opcache.validate_timestamps**: When enabled, OpCache checks file modification timestamps. Disabling it (production) improves performance but requires manual cache reset on deploy.
- **opcache.revalidate_freq**: How often (seconds) OpCache checks for file changes when validate_timestamps is enabled.
- **opcache.memory_consumption**: Total shared memory allocated for OpCache. Must be large enough to hold all compiled framework files.
- **opcache.max_accelerated_files**: Maximum number of PHP files OpCache can cache. Must be >= your total PHP file count.
- **opcache.preload**: PHP 8.0+ feature that preloads and caches files into OpCache permanently, including class definitions.

## When To Use
- Always in production — running Laravel without OpCache is a severe performance regression.
- In any PHP environment serving HTTP requests — FPM, Octane, RoadRunner, FrankenPHP.
- With `opcache.preload` for Octane deployments to preload framework files.

## When NOT To Use
- In local development with `validate_timestamps=0` — code changes won't be reflected.
- On systems with very limited memory (e.g., some shared hosting) — allocate at least 128MB.
- When using `opcache.file_cache_only` without shared memory — file-based caching is slower.

## Best Practices (WHY)
- **Set memory_consumption to at least 256MB**: Laravel + common packages require 128-256MB of OpCache memory. *Why: Insufficient memory causes OpCache to evict files, reducing cache hit rate.*
- **Set max_accelerated_files to at least 20000**: Laravel projects typically have 5000-15000 PHP files. *Why: Too low a limit causes OpCache to stop caching files once the limit is reached.*
- **Use validate_timestamps=0 in production**: Disable timestamp checks for maximum performance. *Why: Timestamp checking adds overhead and delays; cache is reset on deployment.*
- **Use opcache.preload for critical paths**: Preload framework and application base classes for zero-compile bootstrap. *Why: Preloading eliminates file loading and compilation for preloaded files.*
- **Reset OpCache after deployment**: Call `opcache_reset()` or restart PHP-FPM after code changes. *Why: With validate_timestamps=0, stale opcodes persist until explicitly cleared.*

## Architecture Guidelines
- OpCache is a PHP extension (`zend opcache`) — configured in `php.ini` or `opcache.ini`.
- Shared memory is allocated per PHP-FPM pool — multiple pools have separate OpCache memory.
- In CLI mode, OpCache is typically disabled — it's only beneficial for long-running processes.
- Octane workers share OpCache memory — opcache_reset() affects all workers.
- `opcache.preload` loads files on PHP-FPM/Octane server startup, before any request.
- Preloaded files cannot be invalidated without server restart — use only for stable framework files.

## Performance
- Without OpCache: PHP compiles every file on every request — 100-300ms overhead per request.
- With OpCache (default): ~30-50ms overhead for shared memory lookup.
- With OpCache + preload: ~5-10ms overhead — compilation cost is fully eliminated.
- OpCache memory usage: 128-256MB for a typical Laravel application.
- Cache hit ratio should be 95%+ in production — lower indicates insufficient memory or max_files.

## Security
- Stale OpCache can serve old, vulnerable code after a security patch — always reset OpCache after patching.
- `opcache.preload` loads files with the server user's permissions — ensure preloaded files are not writable by untrusted users.
- OpCache status pages (if exposed) reveal file paths and compilation statistics — disable in production.
- Preloaded files cannot be hot-patched — a server restart is required to update preloaded code.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| validate_timestamps=1 in production | Default PHP config | Timestamp check overhead; delayed code updates on deploy | Set to 0 in production |
| Insufficient memory_consumption | Default 128MB for large app | OpCache evictions — cache hit ratio drops | Monitor and increase to 256MB+ |
| No OpCache reset after deploy | validate_timestamps=0 without reset | Stale code runs until PHP-FPM restart | Call opcache_reset() in deploy |
| Preloading application code | Preloading classes that change frequently | Requires server restart for every update | Only preload stable framework files |
| Exposing OpCache status | opcache.status page publicly accessible | Information disclosure: file paths, compilation stats | Disable status page or protect with auth |

## Anti-Patterns
- **opcache_reset() on every request**: Draining the OpCache on each request defeats its purpose — only reset during deployment.
- **Infinite memory allocation**: Setting memory_consumption too high starves other processes — monitor actual usage.
- **Preloading everything**: Preloading all application files — requires server restart on every code change.
- **Not monitoring OpCache**: Deploying without checking OpCache hit ratio — unknowingly serving suboptimal performance.

## Examples
```ini
; php.ini OpCache configuration for Laravel production
opcache.enable=1
opcache.memory_consumption=256
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.fast_shutdown=1
```

## Related Topics
- **Prerequisites:** None — OpCache is a PHP-level concern, not framework-level.
- **Closely Related:** Composer Autoloader Optimization — OpCache caches autoloader files too.
- **Advanced:** Bootstrap Warmup in CI/CD — OpCache reset as part of deployment.
- **Cross-Domain:** PHP-FPM Configuration, Octane Preloading.

## AI Agent Notes
- Check OpCache status: `php -i | grep opcache` or use `opcache_get_status()` in a debug endpoint.
- OpCache preload file: uses `opcache.preload=/path/to/preload.php` in php.ini.
- For Octane: preload framework files (`vendor/autoload.php`, `laravel/framework/src/**/*.php`) for maximum performance.
- `opcache_reset()` is a privileged function — may be disabled in some hosting environments via `disable_functions`.
- OpCache file cache: `opcache.file_cache=/tmp/opcache` — fallback when shared memory is full.

## Verification
- [ ] OpCache is enabled in production PHP configuration
- [ ] memory_consumption is sufficient for the application (256MB+)
- [ ] max_accelerated_files >= total PHP file count
- [ ] validate_timestamps=0 in production
- [ ] Deployment script calls opcache_reset() or restarts PHP-FPM
- [ ] OpCache hit ratio is monitored and >95%
