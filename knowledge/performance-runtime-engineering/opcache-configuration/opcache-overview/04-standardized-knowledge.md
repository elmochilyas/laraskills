# OpCache Overview — Purpose, Architecture, Lifecycle, Throughput Impact

| Metadata | |
|----------|--|
| Domain | Performance & Runtime Engineering |
| Subdomain | OpCache Configuration & Preloading |
| Knowledge Unit | OpCache Overview — Purpose, Architecture, Lifecycle, Throughput Impact |
| Difficulty | Foundation |
| Last Updated | 2026-06-02 |

## Overview

PHP OpCache eliminates the lex/parse/compile phases (60–80% of a PHP request's CPU time for uncached files) by storing compiled opcodes in **shared memory**. With OpCache enabled and properly configured, PHP serves files from memory with zero compilation overhead — resulting in 2–4× throughput improvement over uncached operation. It is the single highest-ROI optimization for any PHP application: zero code changes, immediate impact. OpCache is a required prerequisite for JIT compilation and preloading.

## Core Concepts

- **Without OpCache**: Every request → read file from disk → lex to tokens → parse to AST → compile to opcodes → execute. Disk I/O + CPU for compilation on every request.
- **With OpCache**: First request → compile and store in shared memory. Subsequent requests → fetch opcodes from shared memory → execute. Only file stat() overhead remains (eliminated by `validate_timestamps=0`).
- **Shared memory**: OpCache stores compiled files in SysV IPC shared memory (shm) accessible by all PHP-FPM workers. No inter-process duplication.
- **OpCache phases**: Cache population (lazy, on first access) → cache hit → cache eviction (when full) → cache full detection → reset.
- **Key directives**: `opcache.enable=1`, `opcache.memory_consumption`, `opcache.interned_strings_buffer`, `opcache.max_accelerated_files`, `opcache.validate_timestamps`, `opcache.revalidate_freq`, `opcache.preload`.
- **Hit rate**: Percentage of requests that find the file already compiled in cache. Target: >99%. Below 95% indicates configuration problems.

## When To Use

- You are running PHP in production. Always. OpCache is the single highest-ROI PHP optimization.
- You want to reduce CPU usage and improve throughput with zero code changes.
- You are configuring a new PHP server — OpCache should be the first tuning step.
- You need to enable JIT compilation — JIT requires OpCache.

## When NOT To Use

- You are running a development environment with frequent file changes — disable OpCache or set `validate_timestamps=1` with low `revalidate_freq`.
- You are running a single-request CLI script — OpCache provides no benefit for single-execution scripts.
- You are running on a system without shared memory support (very rare — most systems support SysV shm).

## Best Practices (WHY)

| Practice | WHY |
|----------|-----|
| Enable OpCache first, tune later | The default settings provide significant gains (1.5–2×). Tuning provides additional 2–4× but is secondary to enabling it. |
| Set `validate_timestamps=0` in production | Eliminates stat() syscall per file per request. Saves 1–3% CPU. Requires explicit cache management during deployments. |
| Monitor hit rate and cache_full indicator | A hit rate <99% or cache_full=true indicates undersized configuration. Correct sizing is essential for maintaining gains. |
| Size `memory_consumption` for your application | Use `opcache_get_status()` to monitor free memory. If approaching zero, increase by 50%. |
| Size `max_accelerated_files` to 1.5× your PHP file count | Count files with `find . -name '*.php' | wc -l`. Multiply by 1.5 for headroom. Round to nearest prime number. |
| Configure preloading for framework classes | Preloading eliminates cold-start autoloading for large frameworks. Saves 1–3ms per request. |
| Reset OpCache after every deployment | With `validate_timestamps=0`, the cache is never invalidated automatically. Always run `opcache_reset()` after deploy. |

## Architecture Guidelines

- **Shared memory architecture**: OpCache allocates a shared memory segment at PHP-FPM startup. All workers access the same cache. Memory is never released until PHP-FPM restarts.
- **Cache population**: Files are compiled lazily — the first request to a file triggers compilation and caching. Preloading compiles files at startup, avoiding the lazy compilation penalty.
- **Memory layout**: The shared memory segment contains: opcache header (locking, statistics), hash table (file→opcode mapping), op_array structures (compiled opcodes), and interned strings table.
- **Eviction policy**: When memory is full, OpCache marks least-recently-used entries as "wasted" (removed from the hash table but memory is not reused until compacted). Compaction happens on restart.
- **Inheritance cache (PHP 8.1+)**: Caches resolved class hierarchies (parent class, interfaces, traits). Reduces class resolution overhead by ~80% in framework applications.

## Performance Considerations

- OpCache with default settings: ~1.5–2× throughput. With optimized settings: ~2–4× throughput over OpCache-disabled.
- Every 1% decrease in hit rate increases CPU usage ~0.5–1% due to recompilation.
- `validate_timestamps=0` saves 1–3% CPU by eliminating stat() syscalls.
- Preloading reduces cold-start latency by 1–3ms per request for preloaded classes.
- OpCache memory overhead: 128–512MB shared memory. This is pre-allocated and not available for other uses.
- JIT requires adequate OpCache memory. OpCache eviction forces JIT to recompile affected files.

## Security Considerations

- `opcache.validate_timestamps=0` means PHP will never detect changed files. After a deployment, stale code serves until cache is reset. Always automate `opcache_reset()` in the deployment pipeline.
- `opcache.file_cache` writes cached opcodes to disk. Ensure the file cache directory is not publicly accessible.
- Preloading executes the preload script with full privileges. Only trusted code should be preloaded.
- OpCache shared memory is readable by other processes on the same system (SysV shm permissions). Isolate applications on multi-tenant servers.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|----------------|
| Not enabling OpCache in production | 10–15% of production PHP deployments still have OpCache disabled. | Not knowing about OpCache or assuming it's enabled by default. | 50–75% lower throughput than possible. Zero cost to fix. | Always enable OpCache in production. Check with `opcache_get_status()`. |
| Using default settings for large apps | Default `memory_consumption=128MB` is too small for Laravel/Symfony. | Assuming defaults are optimal. | Cache full → eviction → recompilation → hit rate drops below 90%. | Set 256–512MB for framework applications. Monitor hit rate. |
| Setting `validate_timestamps=0` without deployment automation | Stale code serves to users after deploy. | Only configuring the performance setting without the operational procedure. | Users see outdated pages or error pages from code mismatch. | Automate `opcache_reset()` in your deployment script. |
| Not resetting OpCache after deployment | New code never executes because old opcodes are cached. | Not knowing that OpCache caches opcodes persistently. | Deploy does nothing — old code continues to serve. | Run `opcache_reset()` or `php-fpm graceful reload` after every deploy. |

## Anti-Patterns

- **Disabling OpCache for debugging**: OpCache does not affect PHP behavior (unlike Xdebug). If you're debugging, keep OpCache enabled. Debug the code, not the cache.
- **Over-allocating OpCache memory**: Setting `memory_consumption=4GB` for a small WordPress site wastes RAM. Size based on actual usage.
- **Running `opcache_reset()` on every request**: Reset is destructive — it clears all cached files. Running it frequently defeats the purpose of OpCache.
- **Ignoring cache_full and hit rate metrics**: These are free diagnostics. OpCache provides detailed status — use it.

## Examples

```php
// Check OpCache status
$status = opcache_get_status(false);
echo "Enabled: " . ($status['opcache_enabled'] ? 'Yes' : 'No');
echo "Cache full: " . ($status['cache_full'] ? 'Yes' : 'No');
echo "Hit rate: " . round($status['opcache_statistics']['hit_rate'], 2) . '%';
echo "Memory used: " . round($status['memory_usage']['used_memory'] / 1024 / 1024, 2) . 'MB';
```

```ini
; Recommended production OpCache configuration
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=20000
opcache.validate_timestamps=0
opcache.revalidate_freq=0
opcache.fast_shutdown=1
opcache.enable_cli=0
```

## Related Topics

- OpCache Memory Consumption — memory_consumption, interned_strings_buffer
- OpCache Max Accelerated Files — max_accelerated_files calculation
- OpCache Revalidation Frequency — validate_timestamps, revalidate_freq
- OpCache Preloading and Warmup
- OpCache Monitoring and Hit Rate Analysis

## AI Agent Notes

- OpCache is PHP's single highest-impact optimization — 2–4× throughput with zero code changes. For any PHP application in production, it should be the first thing tuned.
- The most common mistake is not enabling it (10–15% of production deployments). The second most common is using default settings that are too small for modern frameworks.
- The `validate_timestamps=0` setting provides the best performance but requires operational discipline — automatic cache invalidation on every deployment.
- OpCache is required for both JIT and preloading. Enabling and tuning OpCache unlocks these additional optimization paths.

## Verification

- [ ] Enable OpCache in php.ini: `opcache.enable=1`.
- [ ] Verify OpCache is active: `php -i | grep 'opcache.enable'` or `opcache_get_status()`.
- [ ] Check hit rate: target >99%.
- [ ] Monitor `cache_full` indicator — should always be false.
- [ ] Configure deployment automation: `opcache_reset()` after every deploy.
- [ ] Measure throughput: benchmark with and without OpCache to verify the gain.
- [ ] Document the OpCache configuration and deployment invalidation procedure.
