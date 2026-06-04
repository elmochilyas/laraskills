# OpCache Configuration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
PHP OpCache stores compiled PHP opcodes in shared memory, eliminating the need to parse and compile PHP files on every request. For Laravel, correct OpCache configuration can reduce time-to-first-byte by 30-50% by ensuring all framework files are cached, validated infrequently, and sized appropriately. This is especially critical for Octane, FastCGI, and serverless environments where PHP file overhead directly impacts response latency.

## Core Concepts
- **Opcode Cache:** PHP scripts are compiled to opcodes (Zend opcode) on first execution. OpCache stores these in shared memory for reuse across requests.
- **Shared Memory:** The cache lives in a memory segment accessible by all PHP-FPM workers (or Octane workers). Memory size must be sufficient for all cached scripts.
- **File Validation:** OpCache checks whether cached files have changed on disk. This can be disabled (`opcache.validate_timestamps=0`) in production to eliminate stat() calls.
- **Preloading:** PHP 8.0+ feature (`opcache.preload`) that loads and caches specified scripts before any request arrives. For Laravel Octane, this pre-warms OpCache with framework classes.
- **JIT Compilation:** PHP 8.0+ includes a JIT compiler that can further optimize hot code paths. For Laravel (CPU-bound), JIT provides marginal benefit; for compute-heavy applications, it helps.

## Mental Models
- **CPU Cache for PHP:** OpCache is like L1/L2 cache for CPU — it keeps frequently-used translations close at hand, avoiding the cost of re-translation.
- **Library Analogy:** A library that remembers where every book is located. Without OpCache, the librarian re-files every book after each checkout (re-parses PHP). With OpCache, the librarian has a perfect memory.
- **Freezer Model:** OpCache freezes compiled PHP files. Cold start (first request) fills the freezer. Subsequent requests open the freezer door and grab pre-frozen opcodes. The freezer capacity (`opcache.memory_consumption`) determines how much can be stored.

## Internal Mechanics
1. **PHP File Loading:** When `include`/`require` is called, PHP checks OpCache for the file's opcode.
2. **Cache Hit:** If the file is in OpCache and is valid (timestamp check, if enabled), the cached opcode is loaded — no parsing or compilation.
3. **Cache Miss:** The file is read from disk, parsed, compiled to opcodes, and stored in shared memory.
4. **File Validation:** If `opcache.validate_timestamps=1`, PHP calls `stat()` on the file to check if it was modified. If modified, the cache entry is invalidated and the file is recompiled.
5. **Memory Management:** When shared memory is full, OpCache evicts least-recently-used entries (or old entries, depending on configuration).
6. **Preloading:** During PHP startup, files specified in `opcache.preload` are loaded, compiled, and cached permanently. These entries are immutable and never expire.

## Patterns
- **Immutable Cache for Production:** Disable timestamp validation in production (`opcache.validate_timestamps=0`). Files never change between deployments, so stat() calls are wasted.
- **Reset on Deploy:** When `validate_timestamps=0`, OpCache must be reset after deployment. This is done by restarting PHP-FPM, restarting Octane, or calling `opcache_reset()`.
- **Sufficient Capacity:** Configure `opcache.memory_consumption` to hold all application and framework files. Insufficient memory causes cache thrashing.
- **Preload Critical Paths:** Use `opcache.preload` for Octane to pre-warm the most-used classes (framework core, application service providers).

## Architectural Decisions
- **Decision:** Set `opcache.validate_timestamps=0` in production.
  - **Rationale:** Eliminates stat() syscalls on every file include. Files only change on deployment, which triggers a full OpCache reset via PHP restart.
- **Decision:** Set `opcache.max_accelerated_files` to cover total PHP file count.
  - **Rationale:** Insufficient slots cause caching failure for some files. Calculate `find . -name "*.php" | wc -l` and set to a power of two above that count.
- **Decision:** Use `opcache.preload` for Octane but not for traditional PHP-FPM.
  - **Rationale:** Preloading requires a PHP process that persists across requests (Octane/Swoole/RoadRunner). PHP-FPM's process-per-request model gains nothing from preloading.
- **Decision:** Enable `opcache.interned_strings_buffer` to 16-32MB.
  - **Rationale:** Laravel uses many duplicate strings (class names, method names). Interning them saves memory and speeds up comparisons.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| 30-50% reduction in PHP execution time | OpCache memory must be provisioned (64-256MB typical) | Memory contention with other PHP processes if undersized |
| Eliminates stat() calls per file (validate_timestamps=0) | Requires PHP restart or opcache_reset() on deploy | Adds deployment step complexity |
| Preloading eliminates first-hit compilation for key files | Preloaded files cannot be invalidated without restart | Files listed in preload must be stable across requests |
| JIT can accelerate compute-heavy routes | JIT adds memory overhead (~same as OpCache again) | For typical CRUD Laravel apps, JIT benefit is minimal |

## Performance Considerations
- **Memory Consumption:** Laravel applications have 2000-10000 PHP files. Typical `opcache.memory_consumption` recommendations: 128MB (small), 256MB (medium), 512MB (large).
- **File Slots:** `opcache.max_accelerated_files` must exceed your PHP file count. Use a power of two: 4096 (small), 8192 (medium), 16384 (large). Formula: `opcache.max_accelerated_files = next_power_of_2(total_php_files + 20%)`.
- **Preloading for Octane:** Preload `vendor/laravel/framework/src/**/*.php` and `app/**/*.php`. This adds 1-3 seconds to Octane startup but eliminates compilation overhead during operation.
- **JIT Buffers:** `opcache.jit_buffer_size=100M` is recommended for most setups. JIT tracing compiles frequently-executed methods to machine code. Measure before enabling.
- **Interned Strings:** Set `opcache.interned_strings_buffer=32` for medium applications. Monitor shared memory usage via `opcache_get_status()`.

## Production Considerations
- **Recommended settings for Laravel production:**
  ```ini
  opcache.enable=1
  opcache.enable_cli=1
  opcache.memory_consumption=256
  opcache.interned_strings_buffer=32
  opcache.max_accelerated_files=16384
  opcache.max_wasted_percentage=10
  opcache.use_cwd=0
  opcache.validate_timestamps=0
  opcache.revalidate_freq=0
  opcache.fast_shutdown=1
  ```
- **For Octane with preloading:**
  ```ini
  opcache.preload=/path/to/app/Preload.php
  opcache.preload_user=www-data
  ```
- **Restart PHP-FPM after every deployment** when `validate_timestamps=0`. Use `sudo systemctl reload php8.x-fpm` or `sudo kill -USR2 $(cat /var/run/php-fpm.pid)`.
- **Octane:** Use `php artisan octane:reload` to restart workers gracefully. This resets OpCache state.
- **Monitor OpCache usage** via `opcache_get_status()`. Create a health-check endpoint or use a monitoring tool. Watch for `cache_full` and `oom_restarts` metrics.
- **For serverless (Vapor):** Lambda runtime manages OpCache automatically. The `validate_timestamps=0` behavior is the default in Vapor's custom runtime.
- **Shared hosting:** You may not control OpCache settings. Verify current settings via `phpinfo()` and request changes if needed.

## Common Mistakes
- **Setting `opcache.revalidate_freq=60` thinking it works like config TTL.** It only triggers revalidation during the cron-based check, not instantly. Use `0` or disable validation entirely.
- **Not restarting PHP after deployment** when `validate_timestamps=0`. Old opcodes are served until PHP-FPM is restarted.
- **Undersized memory_consumption.** OpCache fills up and evicts Laravel framework files, causing recompilation. This hurts performance more than not having OpCache at all.
- **Setting `opcache.max_accelerated_files` too low.** OpCache cannot cache all PHP files. Monitor `opcache_get_status()['opcache_statistics']['num_cached_scripts']`.
- **Preloading with an incorrect file path.** If the preload script references files that don't exist, PHP-FPM fails to start entirely. Validate the preload path.
- **Forgetting `opcache.preload_user`.** The preload script runs during PHP startup as root; the user must be specified to avoid permission issues.

## Failure Modes
- **OOM Restart:** OpCache runs out of memory and restarts, losing all cached opcodes. This causes a burst of cache misses as opcodes are recompiled. Mitigation: increase `memory_consumption` and monitor `oom_restarts`.
- **Cache Eviction Thrashing:** Undersized OpCache evicts files frequently. Common files (framework, vendor) are compiled on nearly every request. Mitigation: monitor `misses` vs `hits` in `opcache_get_status()`.
- **Stale Opcodes After Deploy:** PHP-FPM not restarted after deploy with `validate_timestamps=0`. Old code runs even though new files are on disk. This is the most common OpCache failure in Laravel deployments.
- **Preloading Failure:** Preload script throws an error during PHP startup. PHP-FPM process exits. Entire application goes down. Mitigation: test preload locally before deployment.
- **Empty Preload Script:** Preload script exists but doesn't actually load any classes. Preloading has no effect but startup cost is paid.

## Ecosystem Usage
- **Laravel Octane:** Deeply dependent on OpCache. Preloading is the primary optimization. Octane's worker pool benefits from OpCache shared memory across all workers.
- **Laravel Vapor:** Uses a custom PHP runtime with OpCache configured for serverless. `validate_timestamps=0` is enforced; cache is reset when the Lambda execution environment rotates.
- **Laravel Forge:** Forge servers have a toggle to apply recommended OpCache settings. The `opcache_reset()` is triggered during deployment scripts.
- **Laravel Homestead/Sail:** Local development typically uses `validate_timestamps=1` and `revalidate_freq=0` so file changes are visible immediately.
- **Blackfire.io:** Profiling tool that integrates with OpCache to provide insights into compilation overhead and OpCache memory usage.

## Related Knowledge Units

### Prerequisites
- [Complete Boot Sequence](../boot-order-timing/complete-boot-sequence/02-knowledge-unit.md) — the boot pipeline where OpCache has the greatest impact.
- [Composer Autoloader Optimization](./composer-autoloader-optimization/02-knowledge-unit.md) — OpCache caches autoloader files, reducing class resolution overhead.

### Related Topics
- [Config Caching](./config-caching/02-knowledge-unit.md) — OpCache caches the compiled config.php file.
- [Route Caching](./route-caching/02-knowledge-unit.md) — OpCache caches the compiled routes.php file.
- [Services Cache](./services-cache/02-knowledge-unit.md) — OpCache caches the services manifest PHP file.

### Advanced Follow-up Topics
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — OpCache's interaction with warmup strategies.
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — OpCache reset as part of deployment.
- [Octane Boot Timing](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how OpCache preloading optimizes Octane worker startup.

## Research Notes
- OpCache is enabled in PHP 5.5+ by default (compiled with `--enable-opcache`). It is part of the PHP distribution, not a third-party extension.
- `opcache.fast_shutdown=1` enables a fast shutdown sequence that doesn't execute destructors in a specific order. This is safe for Laravel but can cause issues with poorly-written destructors in third-party packages.
- `opcache.use_cwd=0` disables the current-working-directory check when matching file paths in the cache. This improves cache hit rates when the same file is included from different working directories.
- Preloading (`opcache.preload`) was introduced in PHP 7.4 as an experimental feature and stabilized in PHP 8.0. It requires `opcache.file_cache` to be disabled.
- JIT (Just-In-Time compilation) in PHP 8.0+ uses four modes: `1255` (CPU-specific tracing), `1224` (generic tracing), `1205` (function-level), and off. For Laravel, `opcache.jit=tracing` with `opcache.jit_buffer_size=100M` is the standard recommendation.
