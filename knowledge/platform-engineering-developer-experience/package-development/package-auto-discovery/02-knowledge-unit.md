# Knowledge Unit: Package Auto-Discovery

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/package-auto-discovery
- **Maturity:** Mature
- **Related Technologies:** Composer, Laravel, PackageManifest, Service Providers, Facades

## Executive Summary

Laravel's package auto-discovery provides automatic service provider and facade registration for packages installed via Composer. When a package declares providers and facades in its `composer.json` `extra.laravel` section, Laravel automatically loads them without requiring manual entry in `config/app.php`. The mechanism uses Composer's vendor directory scanning and caches discovered packages in `bootstrap/cache/packages.php`. Auto-discovery is the standard approach for the vast majority of Laravel packages, with opt-out available for packages that require explicit registration due to boot order dependencies or conditional loading.

## Core Concepts

- **extra.laravel:** The `composer.json` section where packages declare `providers` (service provider class names) and `aliases` (facade class names)
- **PackageManifest:** `Illuminate\Foundation\PackageManifest` reads `vendor/composer/installed.json` to discover package vendor directories and their `composer.json` files
- **packages.php:** Cached manifest file in `bootstrap/cache/` that stores all discovered providers and facades; rebuilt on `composer dump-autoload` or `php artisan optimize`
- **Opt-Out:** Individual packages can be excluded from auto-discovery via `composer.json` `extra.laravel.dont-discover` in the root application

## Mental Models

- **Discovery as Registration:** Instead of manually listing package providers, auto-discovery treats package installation as implicit registration—if it's in composer.json, it's registered
- **Caching as Compilation:** The discovery process reads many `composer.json` files on each request in development; in production, the cache "compiles" discovery into a single file
- **Opt-Out as Explicit Control:** Opting out of auto-discovery for a package means taking explicit control of when and how the provider is loaded; used for packages with specific boot order requirements
- **Versioned Manifest:** The packages.php manifest is regenerated when Composer installs/updates packages; stale manifests can cause missing provider errors

## Internal Mechanics

1. **Discovery Flow:** Application boot → `PackageManifest::manifest()` reads `bootstrap/cache/packages.php` → if missing or outdated, scans `vendor/composer/installed.json` for packages with `extra.laravel` → merges discovered providers/aliases with `config/app.php` → caches result.
2. **Vendor Scanning:** `PackageManifest` reads `installed.json` which Composer generates; it contains metadata for all installed packages including their `composer.json` content. The manifest extracts `extra.laravel.providers` and `extra.laravel.aliases`.
3. **Stale Manifest Detection:** Laravel compares the `modified` timestamp of `vendor/composer/installed.json` with `packages.php`; if `installed.json` is newer, the manifest is regenerated automatically.
4. **Opt-Out Resolution:** `config/app.php` can contain `dont_discover` array; entries are glob patterns matched against package names (e.g., `laravel/telescope`, `*` to opt-out all).
5. **Alias Registration:** Discovered aliases are registered as facade aliases (class aliases) that point to the facade class; these are registered in the same process as provider discovery.

## Patterns

- **Standard Discovery Pattern:** All packages except those with explicit boot-order requirements should use auto-discovery: `"extra": {"laravel": {"providers": ["Vendor\\Package\\PackageServiceProvider"]}}`.
- **Conditional Auto-Discovery:** Use `suggest` and documentation for packages that may not be wanted in all installations; let developers add to `providers` array manually for explicit control.
- **Discovery Exemption Pattern:** For packages requiring controlled boot order (e.g., Telescope registering error handlers early): `"extra": {"laravel": {"dont-discover": ["vendor/package"]}}`.
- **Development-Only Discovery:** Packages that are development-only (debug bars, profilers, IDE helpers) should use auto-discovery by default; developers opt-out in production via environment-specific configurations.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Discovery strategy | Auto-discovery vs manual registration | Auto-discovery for all distribution packages |
| Opt-out approach | App-level vs package-level | App-level for specific packages; package-level PR for ethical debugging tools |
| Facade registration | Auto-discovered aliases vs manual Facade::resolved() | Auto-discovered aliases for standard packages |
| Provider grouping | Single provider vs multiple auto-discovered providers | Single provider per package for simplicity |

## Tradeoffs

- **Convenience vs Visibility:** Auto-discovery is convenient but reduces visibility into what packages are registered. Some teams prefer manual registration for auditability, listing all providers in `config/app.php`.
- **Boot Time vs Developer Experience:** Auto-discovery reads multiple files during development (slow but tolerable) and caches in production (fast). The performance impact of discovery is negligible.
- **Control vs Automation:** Auto-discovery leaves boot order to Laravel's sorting logic. Packages with specific boot dependencies need manual registration or deferred provider `when()` declarations.
- **Package Discovery vs Security:** Auto-discovering every installed package means packages added to dev dependencies are also auto-discovered. Ensure no production-relevant logic exists in dev-only packages.

## Performance Considerations

- **Manifest Caching:** In production, `packages.php` is cached and auto-discovery adds zero additional runtime overhead. The cache is a simple PHP array include operation.
- **Installed.json Parsing:** Parsing `installed.json` is the expensive part of discovery; this only happens when the cache is stale (post-install/update) or missing (fresh deploy without optimization).
- **Package Count Impact:** Auto-discovery of 100+ packages adds ~5-10ms to boot time during cache rebuild only. After caching, package count has no impact on discovery performance.
- **Optimization Command:** `php artisan optimize` explicitly rebuilds the packages manifest; include in deploy scripts to prevent lazy cache rebuild on first production request.

## Production Considerations

- **Deployment Optimization:** Always run `php artisan optimize` in deployment scripts to pre-cache the package manifest; first request after deploy triggers cache rebuild, causing a slow response.
- **Package Removal:** When removing a package via `composer remove`, the manifest is invalidated and automatically rebuilt on next request. In production, run `php artisan optimize` to immediately rebuild.
- **Environment-Specific Providers:** For packages registered only in specific environments (debugbar in development), use auto-discovery but wrap provider boot logic in environment checks.
- **Security Advisory:** Monitor auto-discovered package providers for security updates; a compromised package with auto-discovery automatically registers its provider on the next `composer update`.

## Common Mistakes

- **No extra.laravel in composer.json:** Forgetting to add the `extra.laravel` section; package installs but provider is never loaded, causing "class not found" errors
- **Wrong namespace in providers array:** Typo or incorrect class name in the providers array; no error until the provider is loaded, which may fail silently
- **Autoload instead of extra.laravel:** Using PSR-4 autoloading instead of the extra.laravel section for provider registration; providers must be explicitly declared, not auto-loaded
- **Globally opting out with `*` and forgetting:** Opting out all auto-discovery without manually registering required providers breaks package functionality
- **Not clearing cache after adding packages:** Adding a package without running `composer dump-autoload` or clearing bootstrap cache leaves manifest stale; provider not registered

## Failure Modes

- **Missing providers after deployment:** Deploy without `php artisan optimize` and first request tries to rebuild cache, which may fail due to filesystem permissions. Mitigate: include optimize in deploy script.
- **Provider order conflicts:** Two auto-discovered packages need a specific boot order but Laravel sorts alphabetically. Mitigate: opt one package out of auto-discovery and register manually.
- **Corrupted packages.php cache:** Partial write or permissions error corrupts the cache file. Mitigate: `php artisan optimize:clear` to regenerate all cache files.
- **Installed.json not updated:** Composer's `installed.json` can get out of sync if vendor directory is modified manually. Mitigate: always use `composer install/update` for dependency changes.

## Ecosystem Usage

- **Laravel Core:** Laravel's own packages (Sanctum, Horizon, Telescope, Passport, Sail) all use auto-discovery
- **Package Ecosystem:** Over 95% of Laravel packages on Packagist use auto-discovery (estimated from top 1000 packages)
- **Spatie Package Tools:** Automatically handles auto-discovery configuration in the package skeleton
- **Debugbar/Telescope:** Use auto-discovery but wrap boot logic in environment checks to prevent production registration
- **IDE Helper:** Uses auto-discovery for development-only provider registration

## Related Knowledge Units

- package-service-provider-patterns
- spatie-laravel-package-tools
- service-provider-registration-boot
- laravel-telescope
- laravel-debugbar

## Research Notes

- Auto-discovery was introduced in Laravel 5.5 (2017) as part of the "Laravel 5.5 LTS" release and remains the standard pattern
- The mechanism is inspired by Composer's own autoloading discovery and follows the "convention over configuration" philosophy
- The `dont-discover` feature was added in response to community requests for control over provider loading
- Auto-discovery is specific to Laravel; Lumen requires manual provider registration, which is a common migration consideration
