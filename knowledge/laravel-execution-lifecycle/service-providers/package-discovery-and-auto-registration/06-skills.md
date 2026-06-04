# Skill: Configure Package Discovery for a New Package

## Purpose

Install a Laravel package and verify its service provider is correctly auto-discovered and registered via the package discovery system.

## When To Use

- Installing a new third-party Laravel package via Composer.
- Developing a package that needs to auto-register its service provider.
- Setting up a project with package auto-discovery.

## When NOT To Use

- Packages that should NOT auto-register (development-only, environment-specific).
- Enterprise applications requiring explicit provider registration for audit purposes.
- When provider ordering is critical (discovered providers always append after manual ones).

## Prerequisites

- Composer autoloader understanding
- `extra.laravel` configuration in `composer.json`
- `PackageManifest` cache mechanism

## Inputs

- Package name (`vendor/package`)
- Package's `composer.json` contents (specifically `extra.laravel.providers`)
- Root application `composer.json`

## Workflow

1. Install the package: `composer require vendor/package`.
2. Verify the package declares providers via `extra.laravel.providers` in its `composer.json`.
3. Run `composer dump-autoload` if the package discovery cache hasn't been rebuilt.
4. Inspect `bootstrap/cache/packages.php` to confirm the provider appears in the `providers` array.
5. Verify the provider registers at runtime: `php artisan about --json` and check the providers list.
6. If the package provides facades, verify aliases are also discovered.

## Validation Checklist

- [ ] Package `composer.json` contains `extra.laravel.providers` array
- [ ] `bootstrap/cache/packages.php` includes the package entry with its providers
- [ ] Provider appears in `php artisan about` output
- [ ] Package services are available via container resolution
- [ ] No `dont-discover` entry excludes this package
- [ ] Package's provider is NOT duplicated in `bootstrap/providers.php`

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider not loading after install | Stale cache — run `composer dump-autoload` or `php artisan optimize` |
| Duplicate registration | Provider also manually added to `bootstrap/providers.php` |
| Development package registered in production | Auto-discovered — add to `dont-discover` |
| Provider loads but services unavailable | Package provider is deferred — rebuild deferred manifest with `php artisan optimize` |

## Decision Points

- **Auto-Discovery vs Manual Registration**: For most packages → auto-discovery is fine. For ordering-sensitive or audit-required → use `dont-discover` + manual registration.
- **Cache Strategies**: `composer dump-autoload` updates the discovery cache; `php artisan optimize` regenerates all caches including the provider manifest.

## Performance Considerations

- Discovery cache is a single file read with a small array — negligible overhead.
- Missing cache forces on-the-fly scan of `vendor/composer/installed.json` — slower but rare.
- Discovered providers are eager by default — consider deferral for rarely-used packages.

## Security Considerations

- Auto-discovered providers run automatically — audit new package providers before installation.
- Review `extra.laravel.providers` in each package to understand exactly what gets registered.
- Stale cache after package removal can reference deleted provider classes, causing fatal errors.

## Related Rules

- Rule 1: Always Run `php artisan optimize` During Deployment
- Rule 2: Use `dont-discover` for Development-Only Packages
- Rule 3: Never Manually Edit `bootstrap/cache/packages.php`
- Rule 4: Never Add an Auto-Discovered Provider to `bootstrap/providers.php`
- Rule 5: Audit Discovered Providers After Every Package Installation
- Rule 6: Use Manual Registration When Provider Ordering Is Critical

## Related Skills

- Exclude Packages from Auto-Discovery with dont-discover
- Implement a Deferred Provider

## Success Criteria

- New package's provider appears in the discovered provider list.
- All package services are available after installation.
- No duplicate or missing provider entries.
- Package works correctly in all environments.
---

# Skill: Exclude Packages from Auto-Discovery with dont-discover

## Purpose

Prevent specific packages from being auto-discovered by Laravel's package discovery system, giving explicit control over when and how their service providers are registered.

## When To Use

- Development-only packages (Debugbar, Telescope, IDE helpers) that should not register in production.
- Enterprise applications requiring explicit provider governance.
- Providers where registration order must be controlled relative to other providers.
- Environment-specific or conditionally registered providers.

## When NOT To Use

- Packages needed in all environments (auth, payments, logging).
- When auto-discovery ordering is sufficient and no conditional registration is needed.
- Simple applications with no provider governance requirements.

## Prerequisites

- Understanding of `extra.laravel.dont-discover` configuration
- Knowledge of `bootstrap/providers.php` manual registration
- Conditional registration via proxy provider patterns

## Inputs

- Package names to exclude (exact composer package names)
- Root application `composer.json`
- Conditional registration strategy (proxy provider, environment guard)

## Workflow

1. Add package names to `extra.laravel.dont-discover` array in root `composer.json`:
   ```json
   {
       "extra": {
           "laravel": {
               "dont-discover": [
                   "barryvdh/laravel-debugbar",
                   "laravel/telescope"
               ]
           }
       }
   }
   ```
2. Run `composer dump-autoload` to rebuild discovery cache.
3. Verify the package no longer appears in `bootstrap/cache/packages.php`.
4. In a proxy provider (e.g., `AppServiceProvider`), conditionally register the excluded provider:
   ```php
   public function register(): void
   {
       if ($this->app->environment('local')) {
           $this->app->register(TelescopeServiceProvider::class);
       }
   }
   ```
5. Verify the provider is registered only in the intended environments.

## Validation Checklist

- [ ] Package name added to `dont-discover` array using exact string match
- [ ] `composer dump-autoload` run to rebuild cache
- [ ] Package no longer in `bootstrap/cache/packages.php`
- [ ] Provider conditionally registered via proxy provider or `bootstrap/providers.php`
- [ ] Provider loads correctly in target environments
- [ ] Provider does NOT load in excluded environments

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Package still auto-discovers | Typo in package name — must match exactly as in `composer.json` |
| `dont-discover` excludes all packages | Setting `"dont-discover": ["*"]` disables all discovery |
| Package excluded but never manually registered | Excluded but no manual registration — provider never loads |
| Package loads in production despite dont-discover | Manual registration in `bootstrap/providers.php` without environment guard |

## Decision Points

- **Exclude vs Not**: Does the package need to register in all environments? → If no, exclude. If yes, keep auto-discovery.
- **Conditional Strategy**: Environment-specific → proxy provider with `environment()` or `config()` guard. Ordering-specific → manual registration in `bootstrap/providers.php` at correct position.

## Performance Considerations

- Excluding packages with `dont-discover` removes their provider entirely from the auto-discovered list.
- Conditional manual registration still incurs the cost of `$app->register()` call — but compile-time exclusion (not registering at all) is more performant.
- For development-only packages, exclusion saves 5-15ms bootstrap time in production.

## Security Considerations

- Primary use case is security — preventing development tooling in production.
- `dont-discover` is the first line of defense; CI audit is the second.
- Ensure excluded packages are audited for any security implications.

## Related Rules

- Rule 2: Use `dont-discover` for Development-Only Packages
- Rule 6: Use Manual Registration When Provider Ordering Is Critical

## Related Skills

- Conditionally Register Environment-Specific Providers
- Audit Production Provider List for Development Providers

## Success Criteria

- Excluded packages do not auto-discover — verified in `bootstrap/cache/packages.php`.
- Packages are correctly conditionally registered in intended environments.
- No stale discovery cache issues after modifications.
