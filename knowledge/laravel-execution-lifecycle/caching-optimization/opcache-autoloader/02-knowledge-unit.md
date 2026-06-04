# OpCache Autoloader

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
OpCache and Composer autoloader optimization are two complementary layers that reduce PHP file parsing and class resolution overhead. OpCache caches compiled PHP opcodes in shared memory, eliminating re-parsing on every request. Composer autoloader optimization pre-generates a classmap, replacing filesystem-based PSR-4 resolution with O(1) hash lookups. Together, they can reduce Laravel bootstrap time by 30-50%.

## Core Concepts

### OpCache
PHP extension that stores compiled opcodes in shared memory. All PHP files (framework, vendor, app, cache files) benefit.

### validate_timestamps
When disabled (production), OpCache never checks if files changed — eliminates stat() calls. Requires worker restart on deploy.

### memory_consumption
Shared memory allocated for OpCache. Must be large enough to hold all PHP files (typically 128-256MB for Laravel).

### Composer Classmap
`composer dump-autoload -o` generates `vendor/composer/autoload_classmap.php` — an O(1) class→file mapping.

### Authoritative Classmap
`-a` flag treats the classmap as the exclusive source — no PSR-4 filesystem fallback. Fastest but fragile with dynamic classes.

### APCu Autoloader
`--apcu` stores the classmap in APCu shared memory for even faster lookups.

## Mental Models

### The Translator's Notebook
OpCache is like a translator who memorizes translated sentences. The first time a sentence is encountered, it's translated and stored in a notebook. Subsequent encounters use the notebook — no re-translation needed.

### The Library with a Card Catalog
Without a classmap, finding a class is like searching a library without a catalog — you must walk every aisle (scan directories). The Composer classmap is the card catalog — you look up "DatabaseManager" and get the exact shelf location (file path) instantly.

### The Pre-Heated Oven
OpCache is a pre-heated oven. The first request is like putting food in a cold oven — waiting for it to heat up. OpCache keeps the oven hot — subsequent food items cook instantly.

## Internal Mechanics

### OpCache Memory
```ini
; Recommended Laravel production settings
opcache.enable=1
opcache.memory_consumption=256    ; 256MB shared memory
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=16384
opcache.validate_timestamps=0     ; Never check file mtimes
opcache.revalidate_freq=0
opcache.fast_shutdown=1
opcache.use_cwd=0                 ; Improve cache hit rate
```

### Composer Classmap Generation
```bash
# Standard optimization
composer install --no-dev --optimize-autoloader

# Generates vendor/composer/autoload_classmap.php
# Maps class names to file paths:
'App\\Models\\User' => '/app/app/Models/User.php'
'Illuminate\\Support\\Facades\\DB' => '/app/vendor/laravel/framework/...'
```

### Class Resolution Flow
```
Without classmap:
  1. Composer checks PSR-4 prefixes → finds namespace prefix
  2. Converts namespace to filesystem path
  3. Checks if file exists via file_exists()
  4. If not found, tries next PSR-4 prefix
  5. If not found, checks PSR-0 (deprecated)
  6. Includes file
  Total: 50-100µs per class

With classmap:
  1. Look up class in $classMap array → O(1)
  2. Include file
  Total: ~1µs per class
```

### OpCache Reset Strategies
```php
// Option 1: Restart PHP-FPM
sudo systemctl reload php8.3-fpm

// Option 2: Reset via PHP (requires enable_cli)
opcache_reset();

// Option 3: Touch file to trigger revalidation
touch('vendor/composer/autoload.php'); // If validate_timestamps > 0
```

## Patterns

### OpCache-Tuned Production Pattern
Configure OpCache for Laravel's file count and memory requirements. Monitor cache hit rate to ensure settings are adequate.

### Composer Optimize-On-Install Pattern
Use `composer install --optimize-autoloader` (or `-o`) in deployment to generate the classmap in one step — no separate `dump-autoload` needed.

### Preloading for Octane Pattern
Use `opcache.preload` to warm OpCache with framework classes before accepting requests in long-running processes.

## Architectural Decisions

### Why OpCache instead of APCu for file caching?
OpCache is specifically designed for caching compiled PHP files. APCu stores arbitrary user data. OpCache is the correct tool for opcode caching; APCu is for application-level caching.

### Why authoritative classmap is risky?
An authoritative classmap (`-a`) has no PSR-4 fallback. If a class is not in the classmap, it's not found. This breaks with dynamically generated classes (Eloquent factories, proxies, IDE helper stubs).

### Why validate_timestamps=0 in production?
The stat() call per file is expensive (Laravel loads 100-300 files per request). Disabling timestamp validation eliminates all stat() calls. The tradeoff: file changes require a worker restart.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero stat() calls per file include | Worker restart needed on deploy | Extra deployment step |
| O(1) classmap lookup (1µs vs 50µs) | Classmap must be regenerated after file changes | Deploy must include composer install |
| 30-50% bootstrap reduction | Memory allocated for OpCache (128-256MB) | Memory pressure on smaller servers |
| OpCache for entire app | Stale opcodes if not properly invalidated | Must restart workers after deploy |

## Performance Considerations

- **OpCache with validate_timestamps=0:** zero stat() calls per file include (vs 1 stat() per file with validation enabled).
- **Classmap lookup:** ~1µs vs PSR-4 filesystem resolution: 5-50µs per class.
- **Laravel loads 100-300 classes per request** — classmap saves 5-15ms total.
- **OpCache memory:** 128-256MB for medium Laravel apps. Monitor with `opcache_get_status()`.

## Production Considerations

- **Configure OpCache for Laravel:** 256MB memory, 16384 files, `validate_timestamps=0`.
- **Restart PHP on deploy:** With `validate_timestamps=0`, OpCache never re-reads files. Restart PHP-FPM or Octane workers after deploy.
- **Use `--optimize-autoloader` with composer install:** Generates the classmap in one step.
- **Preload for Octane:** Use `opcache.preload` to warm OpCache with framework classes before accepting requests.
- **Monitor OpCache status:** Use `opcache_get_status()` to monitor cache hits, memory usage, and file count.

## Common Mistakes

- **Not restarting PHP after deploy:** Old code still runs — changes not reflected for hours.
- **Undersized memory_consumption:** Default 64MB too small for Laravel — cache thrashing.
- **Authoritative mode with dynamic classes:** Proxy/factory classes not found.
- **Not running dump-autoload -o:** No classmap generated — PSR-4 fallback on every class.
- **Preloading in non-Octane:** Preloading requires persistent process — no benefit for traditional PHP-FPM.

## Failure Modes

| Failure | Symptom | Root Cause | Mitigation |
|---|---|---|---|
| Old code after deploy | New features not visible | validate_timestamps=0 and no restart | Restart PHP-FPM/Octane after deploy |
| Class not found | Autoload error | Authoritative classmap missing dynamic class | Use -o instead of -a |
| OpCache thrashing | High CPU, slow responses | Undersized memory_consumption | Increase to 256MB |
| Preload failure | PHP-FPM won't start | opcache.preload path wrong or user missing | Set opcache.preload_user |

## Ecosystem Usage

- **Laravel Forge:** Configures OpCache by default with recommended settings for Laravel.
- **Laravel Vapor:** Lambda environment uses OpCache with optimized settings. Classmap generated during vapor build.
- **Laravel Octane:** Uses OpCache preloading to warm framework classes at worker startup. Recommend opcache.preload with framework core classes.
- **Spatie packages:** Are autoloaded via Composer — benefit from classmap optimization without package-specific configuration.

## Related Knowledge Units

### Related Topics
- [Config Caching (ku-01)](../config-caching/02-knowledge-unit.md) — OpCache caches the compiled config.php.
- [Route Caching (ku-02)](../ku-02-route-caching/02-knowledge-unit.md) — OpCache caches the compiled routes.php.
- [Compilation Optimization (ku-06)](../ku-06-compilation-optimization/02-knowledge-unit.md) — broader optimization ecosystem.
- [Cache Invalidation (ku-08)](../cache-invalidation-deployment/02-knowledge-unit.md) — OpCache reset during deployment.

## Research Notes
- OpCache status: `opcache_get_status()` returns cache statistics, memory usage, and file list.
- Use `opcache_reset()` in a deploy script to clear OpCache without restarting PHP (requires `opcache.enable_cli=1`).
- Composer 2.x uses `autoload_static.php` for zero-overhead classmap — default in Composer 2+.
- The `--apcu` autoloader flag stores the classmap in APCu — adds extension dependency but marginally improves lookup speed.
