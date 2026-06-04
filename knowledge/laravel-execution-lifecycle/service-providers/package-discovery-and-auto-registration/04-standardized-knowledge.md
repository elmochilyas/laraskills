# Package Discovery and Auto-Registration

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Package Discovery and Auto-Registration |
| Difficulty | Intermediate |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 5.5+ |
| Last Updated | 2026-06-02 |

## Overview
Laravel's package discovery system automatically detects and registers service providers from Composer packages without manual configuration. The mechanism uses Composer's `extra.laravel` configuration in `composer.json`, a discovery plugin, and a cached provider manifest (`bootstrap/cache/packages.php`). The critical tradeoff is convenience vs. opacity: developers no longer need to manually register providers, but they also lose visibility into what's loaded and may face stale cache issues when packages are added or removed.

## Core Concepts
- **`extra.laravel.providers`** — Package declares its service providers in `composer.json`.
- **`PackageManifest`** — Reads `vendor/composer/installed.json` to discover packages.
- **`bootstrap/cache/packages.php`** — Cached manifest of discovered providers and aliases.
- **`dont-discover`** — Application can exclude specific packages from auto-discovery.
- **Discovery Trigger** — Runs on `composer install`, `composer update`, `composer dump-autoload`.

## When To Use
- Installing third-party Laravel packages (the default mechanism).
- Package development — declare providers via `extra.laravel.providers`.
- Rapid development where manual provider registration would be friction.

## When NOT To Use
- Enterprise applications requiring explicit dependency graph (use `dont-discover` + manual registration).
- When provider ordering is critical (discovered providers always append after manual ones).
- When you need environment-specific or conditional provider registration.

## Best Practices
- **Run `php artisan optimize` during deployment** — Regenerates the discovery cache.
- **Use `dont-discover` for development-only packages** — Exclude Debugbar, IDE helpers from production.
- **Never manually edit `bootstrap/cache/packages.php`** — Changes overwritten on next discovery.
- **Verify discovered provider list** — Check `bootstrap/cache/packages.php` contents after installation.
- WHY: Package discovery trades explicit registration for convenience — acceptable for most applications, but enterprise apps with strict audit requirements should use `dont-discover` and manually register providers.

## Architecture Guidelines
- Discovered providers are always appended after providers in `bootstrap/providers.php`.
- `PackageManifest::providers()` merges discovered providers with the manual list.
- `extra.laravel.aliases` also supports facade alias auto-discovery.
- `dont-discover` supports exact package names in the root `composer.json` under `extra.laravel.dont-discover`.

## Performance Considerations
- Discovery cache is a single file read with small array — negligible overhead.
- Missing cache forces on-the-fly scan of `vendor/composer/installed.json` — slower.
- Discovered providers are eager by default unless they implement `DeferrableProvider`.
- `dont-discover` optimization excludes heavy packages not needed in production.

## Security Considerations
- Auto-discovered providers run automatically — audit new package providers before installation.
- Stale cache after package removal can reference deleted provider classes, causing fatal errors.
- Use `dont-discover` to exclude packages that should not auto-register in production.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Manually adding discovered provider to `bootstrap/providers.php` | Unaware of auto-discovery | Registers the provider twice; potential duplicate binding errors | Trust auto-discovery; check `packages.php` |
| Not regenerating cache after removing package | Missing deployment step | Old provider still loads; may cause fatal errors | Run `composer dump-autoload` or `php artisan optimize` |
| Expecting `dont-discover` wildcards | Misunderstanding feature | Only exact package names work | Check `composer.json` `extra` documentation |
| Discovered provider ordering issues | Provider runs later than expected | May be too late for certain boot-time registrations | Use manual registration in `bootstrap/providers.php` for ordering |

## Anti-Patterns
- **Duplicate Registration** — Adding a discovered provider to `bootstrap/providers.php`.
- **No Cache After Deploy** — Deploying without regenerating `bootstrap/cache/packages.php`.
- **Ignoring Discovered Aliases** — Two packages defining the same alias; last one wins silently.

## Examples

### Package declaring providers in composer.json
```json
{
    "extra": {
        "laravel": {
            "providers": [
                "Spatie\\Permission\\PermissionServiceProvider"
            ],
            "aliases": {
                "Permission": "Spatie\\Permission\\Facades\\Permission"
            }
        }
    }
}
```

### Application excluding packages from discovery
```json
{
    "extra": {
        "laravel": {
            "dont-discover": [
                "laravel/dusk",
                "barryvdh/laravel-debugbar"
            ]
        }
    }
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Composer Autoloading
- **Closely Related:** Eager Providers, Environment-Specific Providers
- **Advanced:** Provider Sprawl and Governance, Custom Package Development
- **Cross-Domain:** Composer Scripts (postAutoloadDump hook)

## AI Agent Notes
- When a package's provider isn't loading, check: (1) `dont-discover` exclusions, (2) stale `packages.php` cache, (3) `extra.laravel.providers` in package's `composer.json`.
- Stale cache after package removal causes fatal errors — always clear `bootstrap/cache/packages.php` when removing packages.
- Discovered providers are eager by default — defer them by implementing `DeferrableProvider`.

## Verification
- [ ] Can explain how `PackageManifest` discovers and caches providers
- [ ] Understand how `dont-discover` works and when to use it
- [ ] Know that discovered providers append after manual providers
- [ ] Can diagnose stale cache issues after package add/remove
- [ ] Can configure `extra.laravel` in a package's `composer.json`
