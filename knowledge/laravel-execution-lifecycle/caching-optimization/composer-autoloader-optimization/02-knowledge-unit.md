# Composer Autoloader Optimization

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Caching & Optimization
- **Last Updated:** 2026-06-02

## Executive Summary
Composer's autoloader optimization generates a classmap that maps fully-qualified class names to their file paths, eliminating the need for filesystem-based namespace resolution (PSR-4) at runtime. In production, `composer dump-autoload -o` (optimize) or `composer dump-autoload -a` (authoritative) can reduce class loading time by 60-80%, directly impacting Laravel's bootstrap performance where hundreds of classes are loaded per request.

## Core Concepts
- **PSR-4 Autoloading:** The default autoloading strategy. Composer scans the namespace-to-directory mapping to find class files. This involves checking multiple directories and file paths before finding the class.
- **Classmap Optimization:** Composer pre-scans all registered directories and builds an associative array: `ClassName => FilePath`. The autoloader looks up the class name in this array — a direct O(1) operation.
- **Authoritative Classmap:** (`-a` flag) Composer trusts the classmap exclusively and never falls back to PSR-4 filesystem scanning. If a class is not in the classmap, it is not found. This eliminates all fallback checking overhead.
- **APCu Autoloader:** Composer can store the classmap in APCu shared memory, making lookups faster than reading from a PHP file on disk. Enabled with `--apcu`.
- **Generated File:** `vendor/composer/autoload_classmap.php` contains the optimized classmap array. `vendor/composer/autoload_static.php` provides a static version without closure overhead.

## Mental Models
- **Phone Directory vs. On-the-Fly Lookup:** PSR-4 is like finding a person by their name by searching every building on a street. Classmap is like looking them up in a phone book — one lookup, no searching.
- **Cache vs. No-Cache:** The classmap is a pre-computed cache of the filesystem. Without it, each class resolution requires 1-3 `file_exists()` or `is_file()` calls. With it, resolution is a hash lookup.
- **Trust Model:** Authoritative mode says "I trust this list completely — don't look anywhere else." This is faster but fragile if the classmap is outdated.

## Internal Mechanics
1. **`composer dump-autoload -o`** (optimize) scans all directories specified in `autoload` and `autoload-dev` sections of `composer.json`.
2. It generates `vendor/composer/autoload_classmap.php` containing a mapping of every class found.
3. **`composer dump-autoload -a`** (authoritative) does the same but also sets a flag (`$vendorDir/autoload_real.php`) that skips PSR-4 filesystem fallback.
4. **Runtime Flow (Optimized):**
   - `spl_autoload_register()` registers Composer's autoloader.
   - When a class is requested, the autoloader checks:
     1. Static classmap (`autoload_static.php`) — fastest, no closure overhead.
     2. Dynamic classmap (`autoload_classmap.php`) — if static map not used.
     3. PSR-4 fallback — only if not authoritative; checks namespace patterns.
     4. PSR-0 fallback — legacy.
   - With authoritative mode, steps 3 and 4 are skipped entirely.
5. **APCu mode:** The classmap is stored in APCu shared memory. The autoloader reads from APCu instead of including the classmap file, saving file I/O.

## Patterns
- **Pre-computation:** Expensive filesystem scanning is done once (during `composer dump-autoload -o`) instead of on every autoload event.
- **Fallback Cascading:** The autoloader has a cascade of strategies: fastest first (classmap), slower next (PSR-4), slowest last (PSR-0). Optimization removes the slower tiers.
- **Compile-Time Optimization:** The optimization happens at build/deployment time, not runtime. This shifts cost from the request path to the deployment path.

## Architectural Decisions
- **Decision:** Default to PSR-4 without optimization.
  - **Rationale:** During development, classes are added frequently. The classmap would be stale constantly. PSR-4 "just works" without rebuilding.
- **Decision:** Provide `-o` and `-a` flags for production.
  - **Rationale:** Production environments have stable class sets. The optimization is safe. Authoritative mode provides maximum performance at the cost of requiring rebuild on any class addition.
- **Decision:** Support APCu as an optional storage backend.
  - **Rationale:** APCu provides even faster lookups than file-based classmap. However, it requires the APCu PHP extension and dedicated memory.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| O(1) class resolution vs O(n) filesystem search | Classmap must be regenerated when classes are added | Run `composer dump-autoload -o` after install/update |
| Authoritative mode eliminates all fallback checks | Classes not in classmap are not found | Dynamic class generation (factories, proxies) must be registered manually |
| APCu reduces lookup time to ~1μs | Requires APCu extension; consumes shared memory | OpCache already caches the autoloader PHP file; APCu benefit is marginal |
| Faster bootstrap = fewer class resolution iterations | Map file can be 500KB-3MB (large for slow disks) | File size affects require time; mitigated by OpCache |

## Performance Considerations
- **Bootstrap Impact:** Laravel loads 100-300 classes per request (framework core + application classes). Each PSR-4 resolution takes 5-50μs vs ~1μs with classmap. Total savings: 5-15ms per request.
- **Classmap File Size:** `vendor/composer/autoload_classmap.php` is typically 1-3MB. With OpCache, the parse cost is paid only once per PHP process lifetime.
- **APCu vs OpCache:** APCu stores the classmap array directly in shared memory, accessible without parsing PHP. OpCache caches the compiled PHP file. APCu is marginally faster but adds an extension dependency.
- **Authoritative Mode Savings:** For applications that dynamically generate classes (e.g., Eloquent models with dynamic properties), authoritative mode may miss these classes. Evaluate carefully.

## Production Considerations
- **Always run `composer install --no-dev --optimize-autoloader` in production.** This installs without dev dependencies and generates the optimized classmap in one step.
- **Authoritative mode is recommended for most Laravel applications:** `composer dump-autoload -a` after every `composer install` or `composer update`.
- **Avoid authoritative mode if your application generates classes dynamically** (factories, proxies, IdeHelper generated files). These classes won't be in the classmap and will not be found.
- **CI/CD Pipeline:**
  1. `composer install --no-dev --optimize-autoloader`
  2. `composer dump-autoload -a` (optional, if no dynamic classes)
  3. Include `vendor/` in deploy artifact
- **Verify classmap completeness** by checking that all your application classes appear in `vendor/composer/autoload_classmap.php`.
- **APCu mode:** Add `--apcu` to `dump-autoload` and ensure `apc.enable_cli=1` if running in CLI.
- **Symfony's ClassLoader component** is NOT used by Laravel — Laravel uses Composer's autoloader exclusively.

## Common Mistakes
- **Running `composer dump-autoload` without `-o` in production.** This generates only the PSR-4 mapping, not the classmap. No performance benefit.
- **Running `composer install` without `--optimize-autoloader`.** The classmap is not generated. Subsequent `dump-autoload -o` is needed.
- **Using authoritative mode with dynamically-generated classes.** Proxies, factories, and generated models (e.g., from `ide-helper:models`) fail with "class not found."
- **Forgetting to regenerate classmap after adding a new class.** PSR-4 may still find it, but authoritative mode fails. Symptoms: random "class not found" errors.
- **Assuming `optimize` flag and `dump-autoload -o` are the same.** `composer install -o` runs `dump-autoload -o` after installation. They produce the same result.
- **Committing `vendor/` with stale classmap to version control.** The classmap is environment-specific. Regenerate on each environment.

## Failure Modes
- **Class Not Found in Authoritative Mode:** A class exists on the filesystem but is not in the classmap. PSR-4 fallback is disabled, so the class cannot be loaded. Mitigation: regenerate the classmap or disable authoritative mode.
- **Stale Classmap After Composer Update:** The classmap references old file paths or classes. `composer install --no-dev -o` must be re-run.
- **APCu Full:** APCu memory fills up and evicts classmap entries. Lookups degrade to filesystem checks. Mitigation: increase `apc.shm_size`.
- **Mixed Autoloading Strategies:** Some packages use PSR-4 with custom registrations. Authoritative mode may miss package-specific autoloading paths.

## Ecosystem Usage
- **Laravel Framework:** The framework's own classes are in `vendor/laravel/framework`. The classmap includes all of them, making resolution O(1).
- **Laravel Octane:** Octane workers benefit from authoritative classmap — the classmap is loaded once at worker start, and subsequent class resolutions are instant.
- **Laravel Vapor:** Vapor runs `composer install --no-dev --optimize-autoloader` during build. The classmap is included in the Lambda deployment artifact.
- **Package Development:** Package developers should ensure their `composer.json` `autoload` section correctly maps namespaces to directories so the classmap generator picks up all classes.
- **Spatie Packages:** All Spatie packages use PSR-4 and are compatible with classmap optimization and authoritative mode.

## Related Knowledge Units

### Prerequisites
- [Bootstrapper Sequence](../application-bootstrap/bootstrapper-sequence/02-knowledge-unit.md) — how class resolution feeds into the bootstrap pipeline.
- [Path Helpers and Environment Detection](../application-bootstrap/path-helpers-and-environment-detection/02-knowledge-unit.md) — how `getNamespace()` parses PSR-4 mappings from composer.json.

### Related Topics
- [Services Cache](./services-cache/02-knowledge-unit.md) — classmap affects how service provider classes are resolved.
- [OpCache Configuration](./opcache-configuration/02-knowledge-unit.md) — OpCache caches the autoloader PHP files.
- [Optimize Command](./optimize-command/02-knowledge-unit.md) — autoloader optimization complements artisan caching.

### Advanced Follow-up Topics
- [Bootstrap Warmup in CI/CD](./bootstrap-warmup-in-cicd/02-knowledge-unit.md) — classmap generation as part of CI pipeline.
- [Cache Invalidation Deployment](./cache-invalidation-deployment/02-knowledge-unit.md) — classmap regeneration during deployment.
- [Octane Boot Timing](../boot-order-timing/octane-boot-timing/02-knowledge-unit.md) — how authoritative classmap reduces per-worker overhead.

## Research Notes
- Composer's autoloader was rewritten in Composer 2.0 to use `autoload_static.php` which avoids closure overhead. The static classmap is returned from the class loader without any function calls.
- The `ClassLoader` class is at `vendor/composer/ClassLoader.php`. Its `findFileWithExtension()` method implements the classmap-first, then PSR-4, then PSR-0 cascade.
- In Composer 2.x, the classmap generation process is more efficient — it uses `Symfony\Component\Finder\Finder` with filters, reducing memory usage during generation.
- The `--apcu` option stores the classmap using `apcu_store()` with the prefix `autoload_`. The autoloader checks APCu before falling back to the file-based classmap.
- Composer 2.8+ improved the PSR-4 fallback to cache negative lookups (classes not found), avoiding repeated filesystem scans for missing classes.
