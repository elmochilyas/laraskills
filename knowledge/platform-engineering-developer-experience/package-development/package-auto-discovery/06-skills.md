# Skill: Configure Package Auto-Discovery for Laravel Packages

## Purpose
Set up Laravel's package auto-discovery in a distribution package's `composer.json`, enabling automatic service provider and facade registration without manual configuration in `config/app.php`.

## When To Use
- Publishing any distribution package that needs provider or facade registration
- Building organizational packages for internal use
- Converting a package from manual registration to auto-discovery

## When NOT To Use
- Packages with specific boot order requirements relative to other packages
- Security-sensitive packages where explicit registration is desired for auditability
- Lumen applications (Lumen requires manual registration)

## Prerequisites
- Package with a service provider class and optional facade class
- `composer.json` file in the package

## Inputs
- Service provider fully qualified class name (e.g., `Vendor\Package\PackageServiceProvider`)
- Facade fully qualified class names (if any)

## Workflow (numbered)
1. **Add `extra` section** — Add to `composer.json`: `"extra": {"laravel": {"providers": ["Vendor\\Package\\PackageServiceProvider"]}}`; use double backslashes
2. **Add facade aliases** — If the package provides facades, add: `"aliases": {"FacadeName": "Vendor\\Package\\FacadeClass"}` within `extra.laravel`
3. **Verify namespace** — Confirm the provider class exists at the declared namespace; test with `composer dump-autoload` and class existence check
4. **Test auto-discovery** — Install the package in a fresh Laravel app; verify provider is registered without manual config
5. **Cache manifest** — Run `php artisan optimize` and verify `bootstrap/cache/packages.php` contains the discovered provider
6. **Add environment guards** — If the package is development-only or environment-specific, wrap boot logic in `if ($this->app->environment('production'))` guards

## Validation Checklist
- [ ] `composer.json` includes `extra.laravel.providers` array with fully qualified provider class
- [ ] `extra.laravel.aliases` included for facade classes (if any)
- [ ] Provider class names use double backslashes and match actual filesystem/namespace
- [ ] Installation in fresh Laravel app auto-registers provider without manual config
- [ ] `php artisan optimize` produces correct `packages.php` cache
- [ ] Environment guards applied for development-only functionality
- [ ] No production-relevant logic in dev-only packages

## Common Failures
- **No extra.laravel in composer.json** — package installs but provider never loaded; all functionality unavailable
- **Wrong namespace in providers array** — typo or incorrect class name; no error until provider is resolved
- **Globally opting out with `*` and forgetting** — all auto-discovery disabled; providers must be manually registered
- **Not clearing cache after adding packages** — stale `packages.php` means newly added providers not registered
- **Using autoload instead of extra.laravel** — class is autoloadable but never registered as service provider

## Decision Points
- Auto-discovery vs manual registration: default to auto-discovery for 95%+ of packages
- Opt-out strategy: use `dont-discover` for specific packages, not blanket `*`
- Facade registration: include in aliases for facades consumers will use; skip internal facades
- Environment-aware registration: auto-discover with boot guards; don't opt-out for conditional loading

## Performance/Security Considerations
- Zero runtime overhead in production — `packages.php` is a cached PHP array include
- 100+ packages adds ~5-10ms during cache rebuild only; after caching, no impact
- Auto-discovered packages include dev dependencies; ensure no production-relevant logic in dev-only packages
- Monitor auto-discovered package providers for security updates; compromised packages auto-register
- Opt-out individual packages from auto-discovery if they handle sensitive operations

## Related Rules (from 05-rules.md)
- DISCOVERY-RULE-001: Always include extra.laravel.providers
- DISCOVERY-RULE-002: Use dont-discover sparingly
- DISCOVERY-RULE-003: Environment-guarded boot
- DISCOVERY-RULE-004: Run optimize after package changes
- DISCOVERY-RULE-010: Wrong namespace in providers array

## Related Skills
- Implement Service Provider Registration (register vs boot)
- Set Up a Package Service Provider with Spatie Tools
- Publish a Laravel Package to Packagist

## Success Criteria
- Package auto-discovers correctly in fresh Laravel installation without manual registration
- Provider registration works on first `composer install` without additional commands
- Production environment has zero overhead from discovery mechanism
- `packages.php` cache is correctly built on `php artisan optimize`
- Environment-specific packages (debug tools) only register in development environments

---

# Skill: Troubleshoot Package Auto-Discovery Issues

## Purpose
Diagnose and resolve common Laravel package auto-discovery failures, including missing provider registration, stale cache, and manifest configuration errors.

## When To Use
- A package is installed but its service provider is not loading
- `php artisan` commands from a package are not available
- Package facade or class is not found at runtime
- After `composer install` or `composer update`, a package's features are missing

## When NOT To Use
- Provider registration is functional (no issue exists)
- Issue is with package code, not auto-discovery

## Prerequisites
- Access to the Laravel application's composer.json and bootstrap/cache directory
- Composer and Artisan CLI access

## Inputs
- Package name and version
- Error message or missing functionality description
- composer.json contents (root and package's composer.json)
- bootstrap/cache/packages.php contents

## Workflow (numbered)
1. **Check extra.laravel config** — Verify `composer.json` of the package has `extra.laravel.providers` with correct fully qualified class name
2. **Check root composer.json** — Look for `dont-discover` that might be excluding the package; check for `*` blanket opt-out
3. **Clear and rebuild cache** — Run `php artisan optimize:clear` then `php artisan optimize`; verify `bootstrap/cache/packages.php` contains the provider
4. **Verify class autoloading** — Run `composer dump-autoload`; check the provider class exists at the declared namespace with `class_exists()` test
5. **Test manual registration** — Add the provider to `config/app.php` `providers` array; if it works, the issue is with auto-discovery configuration
6. **Check boot order** — If the provider depends on bindings from another provider, verify boot order or use deferred provider patterns
7. **Verify Lumen compatibility** — If using Lumen, confirm auto-discovery is not supported; register manually

## Validation Checklist
- [ ] `extra.laravel.providers` exists in package composer.json with correct class name
- [ ] Root composer.json does not have blanket `dont-discover: ["*"]`
- [ ] `bootstrap/cache/packages.php` contains the provider entry
- [ ] Provider class is autoloadable; `composer dump-autoload` succeeds
- [ ] Manual registration in config/app.php works (confirms auto-discovery issue)
- [ ] No syntax errors in composer.json (extra.laravel section)
- [ ] Application is Laravel, not Lumen

## Common Failures
- **Missing extra.laravel section** — most common cause; package developer forgot to configure auto-discovery
- **Namespace mismatch** — typo or wrong class name in providers array; use fully qualified with double backslashes
- **Stale cache** — `packages.php` not rebuilt after composer changes; run `php artisan optimize`
- **Blanket opt-out** — `dont-discover: ["*"]` in root composer.json disables all auto-discovery
- **Lumen application** — auto-discovery is Laravel-only; Lumen requires manual registration

## Decision Points
- Fix: repair auto-discovery config vs switch to manual registration (prefer repair for packages you own; use manual registration as temporary workaround)
- Root cause: package configuration error vs application configuration error (package error: contact maintainer; app error: fix root composer.json)

## Performance/Security Considerations
- After fixing auto-discovery, always run `php artisan optimize` to rebuild the cached manifest
- If the package handles sensitive operations, consider keeping it as manual registration for auditability
- When globally opting out, ensure all providers are listed in `config/app.php` `providers` array

## Related Rules (from 05-rules.md)
- DISCOVERY-RULE-010: Wrong namespace in providers array
- DISCOVERY-RULE-011: Not clearing cache after adding packages
- DISCOVERY-RULE-012: Using autoload instead of extra.laravel
- DISCOVERY-RULE-013: Avoid disabling auto-discovery globally

## Related Skills
- Configure Package Auto-Discovery for Laravel Packages
- Implement Service Provider Registration (register vs boot)

## Success Criteria
- Package provider registers correctly without manual configuration
- `bootstrap/cache/packages.php` contains correct provider entry
- Resolution time: under 5 minutes for common causes
- Root cause identified and fixed (package config or application config)
