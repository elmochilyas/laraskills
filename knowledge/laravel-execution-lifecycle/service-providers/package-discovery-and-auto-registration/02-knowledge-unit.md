# Package Discovery and Auto-Registration

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Service Providers
- **Knowledge Unit:** Package Discovery and Auto-Registration
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Laravel's package discovery system automatically detects and registers service providers from Composer packages without manual configuration. The mechanism uses Composer's `extra.laravel` configuration, a discovery plugin, and a cached provider manifest. This system eliminates manual provider registration for third-party packages but introduces subtle failure modes when the discovery cache is stale or conflicts arise.

---

## Core Concepts
Package authors declare their service provider(s) in `composer.json` under `extra.laravel.providers`. When a user installs the package via Composer, Laravel's `Illuminate\Foundation\ComposerScripts` post-autoload-dump hook runs and discovers all installed packages that have `extra.laravel` configuration. These discovered providers are cached to `bootstrap/cache/packages.php`. On each request, Laravel reads this cache and registers those providers alongside those in `bootstrap/providers.php`. The `Illuminate\Foundation\PackageManifest` class orchestrates discovery, caching, and retrieval. Aliases and `dont-discover` config allow excluding specific packages or entire namespaces.

---

## Mental Models
Package discovery is like a **plug-and-play peripheral system**. You plug in a USB device (install a package) and the operating system (Laravel) detects it and loads the drivers (providers). The device list is cached (like Windows driver store) and only rescanned when a new device is plugged in (Composer install/update). If you manually remove a device, the driver remains loaded until the cache is refreshed.

---

## Internal Mechanics
The `PackageManifest` class reads `vendor/composer/installed.json` to find all packages, checks each for `extra.laravel.providers` and `extra.laravel.aliases`, and writes the merged result to `bootstrap/cache/packages.php`. This happens during `composer install`, `composer update`, and `composer dump-autoload`. The manifest is an array with `providers` and `aliases` keys. During application boot, `Application::registerConfiguredProviders()` calls `PackageManifest::providers()` and merges the result with `bootstrap/providers.php`. Packages listed in `extra.laravel.dont-discover` in the application's `composer.json` are skipped.

---

## Patterns
- **Standard discovery**: Package provides `extra.laravel.providers` list in `composer.json`. Works for 90% of packages.
- **Conditional discovery**: Package uses `extra.laravel.providers` but conditionally registers different providers based on Laravel version or environment.
- **Opt-out pattern**: Applications can add `"laravel/dusk": "*"` to `extra.laravel.dont-discover` in their `composer.json` to exclude specific packages.
- **Alias registration**: Packages can also define `extra.laravel.aliases` for facades, which are merged into the application's alias list.

---

## Architectural Decisions
The discovery system was introduced in Laravel 5.5 to solve a user experience problem: every package required manual provider registration in `config/app.php`. This was friction for beginners and maintenance overhead for upgrades. The tradeoff: convenience at the cost of opacity. Developers no longer need to know which providers are registered, but they also lose visibility into what's happening. The `dont-discover` mechanism was added as a safety valve for applications that need explicit control.

---

## Tradeoffs
- **Convenience vs. visibility**: Discovery "hides" provider registration. Developers may not know which providers are loaded, making debugging integration issues harder.
- **Cache staleness**: If `bootstrap/cache/packages.php` is stale (e.g., a package was removed manually), the old provider still loads until the cache regenerates.
- **Ordering**: Discovered providers are always appended after `bootstrap/providers.php` providers. If a discovered provider needs to register before a core provider, manual registration is required with `dont-discover`.
- **Alias conflicts**: Two packages may define the same alias. The last one wins, which may not be the expected behavior.

---

## Performance Considerations
The discovery cache is a single file read with a small array — negligible overhead. However, if the cache is missing (e.g., forgotten cache:clear), the framework must rebuild it on-the-fly by scanning `vendor/composer/installed.json`, which is slower. Always ensure `bootstrap/cache/packages.php` exists in production. The `dont-discover` optimization can exclude heavy packages that are not needed in production but installed for development.

---

## Production Considerations
Run `php artisan optimize` during deployment to regenerate the discovery cache. If you're deploying without Composer (e.g., building a deployment artifact), ensure the cache is built before archiving. Never manually edit `bootstrap/cache/packages.php` — changes are overwritten on the next package discovery. To exclude a package from auto-discovery, use the `extra.laravel.dont-discover` array in your application's `composer.json`.

---

## Common Mistakes
- Manually adding a discovered provider to `bootstrap/providers.php` — this registers it twice, potentially causing duplicate binding errors.
- Removing a package from Composer without regenerating the cache — the provider still loads.
- Forgetting that discovered providers run after `bootstrap/providers.php` providers — this matters for ordering-dependent code.
- Expecting `dont-discover` to work with a wildcard when only exact package names are supported.

---

## Failure Modes
- **Duplicate provider registration**: A provider listed in both `bootstrap/providers.php` and auto-discovered. Laravel's `register()` checks `$app->getProvider()` to avoid duplicates, but not all providers handle this gracefully.
- **Stale cache after package removal**: The provider's code is gone, but the cache still references it. Results in a fatal error on the next request. Fix: delete `bootstrap/cache/packages.php` or run `composer dump-autoload`.
- **Missing discovery cache**: On shared hosting with read-only `bootstrap/cache`, the framework may try to write the discovery cache and fail, causing a white screen.

---

## Ecosystem Usage
Virtually every third-party Laravel package uses discovery: Spatie packages (`spatie/laravel-permission`, `spatie/laravel-medialibrary`), `barryvdh/laravel-debugbar`, `laravel/telescope`, `laravel/sanctum`, `laravel/horizon`. The convention is so universal that packages without discovery are considered outdated. Exceptions include packages that need conditional registration based on environment or configuration.

---

## Related Knowledge Units
### Prerequisites
- provider-fundamentals (provider registration flow)
- Composer autoloading basics (vendor/composer/installed.json structure)
- Application Bootstrap (how discovered providers merge with bootstrap/providers.php)

### Related Topics
- eager-providers (discovered providers are eager by default)
- environment-specific-providers (dont-discover for dev-only packages)
- deferred-providers (discovered packages that implement DeferrableProvider)

### Advanced Follow-up Topics
- Custom package discovery implementation
- Monorepo provider management with discovery
- Kernel Architecture (PackageManifest::providers() merge with configured providers)
- Boot Order Timing (when discovered providers are loaded vs explicit providers)

---

## Research Notes
### Source Analysis
`Illuminate\Foundation\PackageManifest` in `src/Illuminate/Foundation/PackageManifest.php`. The `vendor/composer/installed.json` is parsed. `Illuminate\Foundation\ComposerScripts::postAutoloadDump()` triggers discovery.
### Key Insight
Package discovery trades explicit registration for convenience. The tradeoff is acceptable for most applications, but enterprise applications with strict security or audit requirements should use `dont-discover` and manually register providers to maintain an explicit dependency graph.
### Version-Specific Notes
Introduced in Laravel 5.5. In Laravel 11+, bootstrap/providers.php coexists with discovered providers — both contribute to the final provider list. The `dont-discover` feature works with exact package names in the root `composer.json`.
