# Experience Curation: Package Auto-Discovery

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-auto-discovery
- **Maturity:** Mature
- **Related Technologies:** Composer, Laravel, PackageManifest, Service Providers, Facades
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Laravel's package auto-discovery provides automatic service provider and facade registration for packages installed via Composer. When a package declares providers and facades in its `composer.json` `extra.laravel` section, Laravel automatically loads them without requiring manual entry in `config/app.php`. The mechanism uses Composer's vendor directory scanning and caches discovered packages in `bootstrap/cache/packages.php`. Auto-discovery is the standard approach for the vast majority of Laravel packages, with opt-out available for packages that require explicit registration due to boot order dependencies or conditional loading.

## Core Concepts
- **extra.laravel:** The `composer.json` section where packages declare `providers` (service provider class names) and `aliases` (facade class names)
- **PackageManifest:** `Illuminate\Foundation\PackageManifest` reads `vendor/composer/installed.json` to discover package vendor directories and their `composer.json` files
- **packages.php:** Cached manifest file in `bootstrap/cache/` that stores all discovered providers and facades; rebuilt on `composer dump-autoload` or `php artisan optimize`
- **Opt-Out:** Individual packages can be excluded from auto-discovery via `composer.json` `extra.laravel.dont-discover` in the root application
- **Discovery as Registration:** Instead of manually listing package providers, auto-discovery treats package installation as implicit registration—if it's in composer.json, it's registered
- **Caching as Compilation:** The discovery process reads many `composer.json` files on each request in development; in production, the cache "compiles" discovery into a single file

## When To Use
- All distribution packages should use auto-discovery for seamless developer experience
- Development-only packages (debug bars, profilers, IDE helpers) benefit from auto-discovery with environment-guarded boot logic
- Packages with no boot order dependencies should always use auto-discovery
- Application developers should use auto-discovery for the vast majority of installed packages

## When NOT To Use
- Packages with specific boot order requirements relative to other packages (opt-out and register manually)
- Security-sensitive packages where explicit provider registration is desired for auditability
- Lumen applications (Lumen requires manual provider registration; auto-discovery is Laravel-specific)
- Packages where the provider should only be conditionally available based on application configuration

## Best Practices
- **WHY:** Always include `extra.laravel.providers` in composer.json for distribution packages; auto-discovery is the standard and expected behavior for 95%+ of packages
- **WHY:** Use `dont-discover` at the application level only for packages with specific boot order requirements; avoid globally opting out with `*` unless you plan to manually register every provider
- **WHY:** Include `php artisan optimize` in deployment scripts to pre-cache the package manifest; the first request after deploy triggers a cache rebuild if not pre-cached, causing a slow response
- **WHY:** Run `composer dump-autoload` or `php artisan optimize` after adding new packages to ensure the manifest is rebuilt; stale manifests cause missing provider errors
- **WHY:** Use environment-guarded boot logic in auto-discovered packages rather than opting out of auto-discovery; opt-out should be reserved for boot order conflicts, not conditional loading

## Architecture Guidelines
- **Standard Discovery Pattern:** `"extra": {"laravel": {"providers": ["Vendor\\Package\\PackageServiceProvider"]}}` in the package's composer.json
- **Conditional Auto-Discovery:** Use `suggest` and documentation for packages that may not be wanted in all installations; let developers add to `providers` array manually for explicit control
- **Discovery Exemption Pattern:** For packages requiring controlled boot order: `"extra": {"laravel": {"dont-discover": ["vendor/package"]}}` in the root composer.json
- **Development-Only Discovery:** Packages that are development-only should use auto-discovery by default; developers opt-out in production via environment-specific configurations
- **Facade Registration:** Auto-discovered aliases are registered as class aliases that point to the facade class; include in `extra.laravel.aliases` for facades consumers will use
- **Provider Grouping:** Single provider per package for simplicity; multiple providers are possible but increase boot time

## Performance
- In production, `packages.php` is cached and auto-discovery adds zero additional runtime overhead—the cache is a simple PHP array include operation
- Parsing `installed.json` is the expensive part of discovery; this only happens when the cache is stale (post-install/update) or missing (fresh deploy without optimization)
- Auto-discovery of 100+ packages adds ~5-10ms to boot time during cache rebuild only; after caching, package count has no impact on discovery performance
- `php artisan optimize` explicitly rebuilds the packages manifest; include in deploy scripts to prevent lazy cache rebuild on first production request

## Security
- Auto-discovering every installed package means packages added as dev dependencies are also auto-discovered; ensure no production-relevant logic exists in dev-only packages
- Monitor auto-discovered package providers for security updates; a compromised package with auto-discovery automatically registers its provider on the next `composer update`
- For packages registered only in specific environments, use auto-discovery but wrap provider boot logic in environment checks
- Opt-out individual packages from auto-discovery if they handle sensitive operations and require explicit opt-in

## Common Mistakes

### No extra.laravel in composer.json
- **Description:** Forgetting to add the `extra.laravel` section to the package's composer.json
- **Consequence:** Package installs but provider is never loaded; all package functionality is unavailable
- **Better Approach:** Always include `extra.laravel.providers` as part of the package skeleton; verify it's present before release

### Wrong namespace in providers array
- **Description:** Typo or incorrect class name in the providers array
- **Consequence:** No error until the provider is resolved, which may fail silently or cause obscure bootstrap errors
- **Better Approach:** Test that the provider class exists at the declared namespace; use fully qualified class names (with leading backslash)

### Globally opting out with `*` and forgetting
- **Description:** Setting `dont-discover: ["*"]` in the root composer.json to opt out of all auto-discovery
- **Consequence:** All package auto-discovery is disabled; providers must be manually registered, and it's easy to forget some
- **Better Approach:** Opt out only specific packages that actually need manual registration; avoid blanket `*` opt-out

### Not clearing cache after adding packages
- **Description:** Adding a package via `composer require` but not running `php artisan optimize` or `composer dump-autoload`
- **Consequence:** The packages.php manifest is stale; the newly added package's provider is not registered
- **Better Approach:** Run `composer dump-autoload` after any composer change; include `php artisan optimize` in deployment scripts

### Using autoload instead of extra.laravel
- **Description:** Adding the provider class to PSR-4 autoloading instead of the `extra.laravel` section
- **Consequence:** The class is autoloadable but never registered as a service provider; Laravel doesn't scan autoloaded classes for providers
- **Better Approach:** Use `extra.laravel.providers` for provider registration; PSR-4 is for class autoloading

## Anti-Patterns
- **Disabling auto-discovery globally:** Using `dont-discover: ["*"]` as the default for all projects; this eliminates the convenience of auto-discovery and forces manual registration for every package
- **Manual registration for every package:** Adding every provider to `config/app.php` even though auto-discovery works; duplicates effort and is error-prone
- **Relying on auto-discovery for boot order:** Assuming auto-discovered providers boot in a specific order; use deferred provider `when()` for dependency ordering
- **Dev-only packages without environment guards:** Auto-discovering development packages that have side effects in production; always wrap boot logic in environment checks

## Examples
- **Laravel Sanctum:** Uses auto-discovery with `extra.laravel.providers` and `extra.laravel.aliases` in composer.json
- **Spatie/laravel-permission:** Auto-discovers its service provider and facade via Spatie Package Tools skeleton defaults
- **barryvdh/laravel-debugbar:** Auto-discovers but wraps boot logic in `if (! app()->environment('production'))` to prevent production registration

## Related Topics
- package-service-provider-patterns (auto-discovery registers service providers automatically)
- spatie-laravel-package-tools (package skeleton includes auto-discovery configuration)
- service-provider-registration-boot (auto-discovered providers follow standard register/boot lifecycle)
- laravel-optimization (php artisan optimize and manifest caching)
- package-skeleton-structure (skeleton includes recommended auto-discovery configuration)

## AI Agent Notes
- Auto-discovery is the default and expected behavior; only recommend manual registration for specific boot order or security requirements
- When debugging missing package functionality, always check the `extra.laravel` configuration first
- The `packages.php` cache is a common source of confusion; recommend `php artisan optimize:clear` as a first troubleshooting step
- For organizational packages, standardize on auto-discovery with environment-guarded boot logic for conditional registration
- Lumen does not support auto-discovery; this is a common migration consideration

## Verification
- [ ] `composer.json` includes `extra.laravel.providers` array with the service provider class
- [ ] `extra.laravel.aliases` is included for facade classes (if the package provides facades)
- [ ] Provider class names in extra.laravel are fully qualified and correct
- [ ] `php artisan optimize` or `composer dump-autoload` has been run after adding packages
- [ ] `bootstrap/cache/packages.php` exists and contains the discovered provider
- [ ] No production-relevant logic exists in dev-only auto-discovered packages
- [ ] Environment guards are applied in boot() for development-only functionality
- [ ] Opt-out is used sparingly and only for specific packages with boot order requirements
- [ ] Manual provider registration is not duplicating auto-discovered providers
- [ ] Deployment script includes `php artisan optimize` to pre-cache the manifest
