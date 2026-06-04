# Composer Autoloader Optimization

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Caching & Optimization |
| Knowledge Unit | Composer Autoloader Optimization |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Composer's autoloader optimization transforms PSR-4/PSR-0 namespace-based autoloading into a classmap-based autoloader, eliminating filesystem lookups during class resolution. The `composer dump-autoload -o` command generates `vendor/composer/autoload_classmap.php` containing an exhaustive class-to-file mapping. For Laravel, this optimization reduces autoloader overhead from filesystem-intensive namespace resolution to a simple array lookup, shaving 2-5ms off bootstrap time.

## Core Concepts
- **PSR-4 autoloading**: Maps namespace prefixes to directories. Class resolution requires iterating namespace rules and checking file existence.
- **Classmap autoloading**: Maps fully-qualified class names directly to file paths. Resolution is a single O(1) array lookup.
- **`composer dump-autoload -o`**: The command that generates the optimized classmap. The `-o` flag stands for "optimize."
- **`composer dump-autoload -a`**: The "authoritative" classmap mode — Composer assumes the classmap is complete and never falls back to filesystem scanning.
- **Authoritative mode**: Faster than standard classmap because it skips filesystem checks entirely. Only use when the classmap is guaranteed complete.
- **APCu autoloader**: Composer can store the classmap in APCu shared memory for near-zero lookup cost across requests.

## When To Use
- Always in production — `composer dump-autoload -o` should be part of the deployment build.
- For Octane deployments — authoritative mode is recommended since the classmap is stable per worker.
- After any `composer install`/`update` — regenerate the optimized autoloader.

## When NOT To Use
- In development — classmap must be regenerated after every new class file is added.
- When using dynamic class generation — generated classes not in the classmap will not be found.
- With authoritative mode if any class files are loaded dynamically outside the classmap.

## Best Practices (WHY)
- **Run `composer dump-autoload -o` in deployment**: Include in deploy script after `composer install --no-dev`. *Why: Optimized autoloader eliminates filesystem overhead on every class resolution.*
- **Use authoritative mode (-a) for Octane**: Octane workers have a stable class set per worker lifecycle. *Why: Authoritative mode skips filesystem checks, further reducing overhead.*
- **Regenerate after any composer change**: Running `composer require` or `composer update` invalidates the classmap. *Why: Stale classmap causes class-not-found errors for newly added packages.*
- **Combine with OpCache**: The autoloader itself is a PHP file — OpCache caches its opcodes. *Why: Both the array lookup and the autoloader execution benefit from opcode caching.*

## Architecture Guidelines
- The optimized classmap is in `vendor/composer/autoload_classmap.php`.
- PSR-4 rules remain in `autoload_psr4.php` as a fallback — optimized mode checks the classmap first.
- Authoritative mode (`-a`) sets `$includeFile = false`, skipping filesystem fallback entirely.
- APCu autoloader stores the classmap in shared memory — requires the `apcu` extension and `apc.enable_cli=1` for CLI.
- The autoloader is the first PHP code loaded in the bootstrap sequence — optimizing it reduces time-to-first-class-resolution.

## Performance
- Standard autoloading: PSR-4 lookup requires namespace prefix iteration + file_exists check per resolution — ~0.01-0.1ms per class.
- Optimized classmap: single `isset()` array lookup — ~0.001ms per class.
- Authoritative classmap: same as optimized but skips fallback — ~0.001ms per class.
- Total bootstrap savings: 2-5ms for typical Laravel application with 300-500 classes resolved during bootstrap.
- APCu autoloader: classmap loaded from APCu instead of reading the PHP file — saves ~0.5ms on first boot.

## Security
- The classmap file is generated from the autoloader configuration — ensure no malicious class paths are injected via composer.json.
- Authoritative mode assumes the classmap is complete — if a class is missing, the application crashes with ClassNotFoundException.
- APCu autoloader shares the classmap across all PHP processes — ensure the classmap is consistent across deployments.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Not optimizing autoloader in production | Running composer install without -o or -a | 2-5ms avoidable overhead per request | Always use -o in deploy |
| Using authoritative mode with dynamic classes | Generated classes, tests, or cached files not in classmap | ClassNotFoundException for dynamic classes | Use standard optimized (-o) mode for dynamic scenarios |
| Stale classmap after composer update | Updating packages without dump-autoload | Classes from new packages not found | Run dump-autoload -o after any composer change |
| Not regenerating after adding files | Adding new classes to existing namespace | Class not found until autoloader regenerated | Regenerate classmap in dev workflow or use PSR-4 fallback |

## Anti-Patterns
- **Optimizing autoloader without deploying**: Running dump-autoload -o and wondering why new classes aren't found in production — the classmap must be deployed.
- **Authoritative mode in development**: Adding classes constantly — authoritative mode requires regeneration after every new file.
- **Manual classmap editing**: Modifying `autoload_classmap.php` by hand — always regenerate via composer.

## Examples
```bash
# Production deployment autoloader setup
composer install --no-dev --optimize-autoloader
# or equivalently:
composer install --no-dev -o

# For Octane/authoritative:
composer install --no-dev -a
```

## Related Topics
- **Prerequisites:** None — autoloader optimization is the first optimization in the bootstrap pipeline.
- **Closely Related:** OpCache Configuration — OpCache caches the optimized autoloader file.
- **Advanced:** Bootstrap Warmup in CI/CD — autoloader optimization in deployment pipeline.
- **Cross-Domain:** Composer Configuration, PHP Autoloading Standards.

## AI Agent Notes
- The autoloader is registered in `vendor/autoload.php` which is the first file required in `public/index.php`.
- `composer dump-autoload -o` generates `vendor/composer/autoload_classmap.php` and `vendor/composer/autoload_static.php`.
- `-a` (authoritative) mode skips the `file_exists()` check — class must exist in the classmap or fails.
- APCu autoloader is configured by adding `"apcu-autoloader": true` in `composer.json` config section.
- For Laravel Octane, the combination of `-a` + APCu autoloader is the most performant option.

## Verification
- [ ] `composer install --no-dev -o` is used in production deployment
- [ ] `autoload_classmap.php` exists and is up to date
- [ ] Authoritative mode (-a) is used for Octane deployments
- [ ] Autoloader is regenerated after every composer change
- [ ] OpCache is configured to cache the autoloader files
