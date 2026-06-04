# ku-07: OpCache Autoloader

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **KU:** ku-07-opcache-autoloader
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
OpCache and Composer autoloader optimization are two complementary layers that reduce PHP file parsing and class resolution overhead. OpCache caches compiled PHP opcodes in shared memory, eliminating re-parsing on every request. Composer autoloader optimization pre-generates a classmap, replacing filesystem-based PSR-4 resolution with O(1) hash lookups. Together, they can reduce Laravel bootstrap time by 30-50%.

## Core Concepts
- **OpCache**: PHP extension that stores compiled opcodes in shared memory. All PHP files (framework, vendor, app, cache files) benefit.
- **validate_timestamps**: When disabled (production), OpCache never checks if files changed — eliminates stat() calls. Requires worker restart on deploy.
- **memory_consumption**: Shared memory allocated for OpCache. Must be large enough to hold all PHP files (typically 128-256MB for Laravel).
- **Composer classmap**: `composer dump-autoload -o` generates `vendor/composer/autoload_classmap.php` — an O(1) class→file mapping.
- **Authoritative classmap**: `-a` flag treats the classmap as the exclusive source — no PSR-4 filesystem fallback. Fastest but fragile.
- **APCu autoloader**: `--apcu` stores the classmap in APCu shared memory for even faster lookups.

## When To Use
- OpCache: **Always in production**. Essential for PHP performance.
- Composer classmap optimization: **Always in production**. `composer install --no-dev --optimize-autoloader`.
- Authoritative classmap: When no dynamic class generation occurs (proxies, factories).
- APCu: When the APCu extension is available and memory is sufficient.

## When NOT To Use
- OpCache `validate_timestamps=0`: Never in development — file changes won't be visible.
- Authoritative classmap: When using dynamically generated classes (Eloquent factories, IDE helper stubs, proxies).
- APCu: When APCu extension is not installed or conflicts with other caching layers.

## Best Practices (WHY)
- **Configure OpCache for Laravel**: 256MB memory, 16384 files, `validate_timestamps=0`, `interned_strings_buffer=32`.
- **Restart PHP on deploy**: With `validate_timestamps=0`, OpCache never re-reads files. Restart PHP-FPM or Octane workers after deploy.
- **Use `--optimize-autoloader` with composer install**: This generates the classmap in one step — no separate `dump-autoload` needed.
- **Preload for Octane**: Use `opcache.preload` to warm OpCache with framework classes before accepting requests.

## Architecture Guidelines
- Set `opcache.max_accelerated_files` to a power of 2 above your total PHP file count. Find count: `find . -name "*.php" | wc -l`.
- `opcache.use_cwd=0` improves cache hit rates by ignoring the working directory when matching cached files.
- `opcache.fast_shutdown=1` enables optimized shutdown sequence — safe for Laravel.
- For Octane, preload the most-used classes: framework core, application service providers, and common facades.
- Composer authoritative mode (`-a`) is safe for most Laravel apps — test thoroughly before enabling.

## Performance
- OpCache with validate_timestamps=0: zero stat() calls per file include (vs 1 stat() per file with validation enabled).
- Classmap lookup: ~1µs vs PSR-4 filesystem resolution: 5-50µs per class.
- Laravel loads 100-300 classes per request — classmap saves 5-15ms total.
- OpCache memory: 128-256MB for medium Laravel apps. Monitor with `opcache_get_status()`.

## Security
- OpCache caches compiled PHP — no security implications (opcodes are not accessible to users).
- Preloading loads files into shared memory at PHP startup — no data exposure.
- Classmap files are plain PHP arrays — no secrets leaked.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Not restarting PHP after deploy | Old code still runs | validate_timestamps=0 and no restart | Changes not reflected for hours | Always restart PHP-FPM/Octane after deploy |
| Undersized memory_consumption | OpCache evicts files frequently | Default 64MB too small for Laravel | Cache thrashing — worse than no OpCache | Set to 256MB for medium Laravel apps |
| Authoritative mode with dynamic classes | Proxy/factory classes not found | Using -a flag without auditing | Class not found errors | Verify no dynamic classes, or use -o instead |
| Not running dump-autoload -o | No classmap generated | Running plain composer install | PSR-4 fallback on every class resolution | Use --optimize-autoloader flag |
| Forgetting opcache.preload_user | PHP-FPM fails to start | Preload path correct but user missing | Entire app down | Set opcache.preload_user=www-data |

## Anti-Patterns
- **OpCache with revalidate_freq**: Setting a revalidation frequency instead of disabling entirely — still causes periodic stat() overhead.
- **Preloading in non-Octane**: Preloading requires a persistent PHP process — no benefit for traditional PHP-FPM.
- **Combining OpCache + APCu for same purpose**: Both cache PHP files — OpCache already handles file caching; APCu for classmap adds marginal benefit.

## Examples
```ini
; Recommended OpCache settings for Laravel production
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

```bash
# Composer autoloader optimization
composer install --no-dev --optimize-autoloader
# Authoritative mode (if applicable)
composer dump-autoload -a
```

## Related Topics
- Config Caching (ku-01) — OpCache caches the compiled config.php
- Route Caching (ku-02) — OpCache caches the compiled routes.php
- Compilation Optimization (ku-06) — broader optimization ecosystem
- Cache Invalidation (ku-08) — OpCache reset during deployment
- Octane Boot Timing — preloading for Octane worker startup

## AI Agent Notes
- OpCache status: `opcache_get_status()` returns cache statistics, memory usage, and file list.
- Use `opcache_reset()` in a deploy script to clear OpCache without restarting PHP (requires `opcache.enable_cli=1`).
- Composer 2.x uses `autoload_static.php` for zero-overhead classmap — this is the default in Composer 2+.
- The `--apcu` autoloader flag stores the classmap in APCu — adds extension dependency but marginally improves lookup speed.

## Verification
- [ ] OpCache is enabled in production (`php -i | grep opcache.enable`)
- [ ] `memory_consumption` is sufficient (monitor `opcache_get_status()['memory_usage']`)
- [ ] `validate_timestamps=0` is set in production
- [ ] PHP-FPM or Octane workers are restarted after deployment
- [ ] `composer install --optimize-autoloader` is used in deployment
- [ ] No dynamic class generation conflicts with authoritative classmap
