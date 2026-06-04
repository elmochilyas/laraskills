# Environment-Specific Providers

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Environment-Specific Providers |
| Difficulty | Intermediate |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Not all service providers are needed in every environment. Development tooling (debug bars, profilers, IDE helpers) should not run in production. Environment-specific provider registration keeps production lean by excluding providers that are only relevant during development or testing. The most performant approach is compile-time exclusion (not registering the provider at all) via conditional `$app->register()` in a meta-provider, rather than runtime guards inside the provider itself.

## Core Concepts
- **Environment Detection** — `$this->app->environment('local')` checks `APP_ENV` environment variable.
- **Compile-Time Exclusion** — Provider never instantiated if registration is conditional: `if ($app->environment('local')) { $app->register(DebugbarProvider::class); }`.
- **Runtime Guard** — Provider is instantiated but skips logic based on environment check inside `register()`/`boot()`.
- **`dont-discover` + Manual Registration** — Exclude from auto-discovery and manually register conditionally.

## When To Use
- Debug/profiling tooling (Debugbar, Telescope) — development only.
- IDE helper generators, development-specific commands.
- Testing providers that should not affect production behavior.
- Any provider with side effects that are only appropriate in certain environments.

## When NOT To Use
- Providers that affect production behavior (registration order matters).
- Security-critical providers that must always run (auth, encryption).
- When environment string coupling creates maintenance burden — use config-driven checks instead.

## Best Practices
- **Prefer compile-time exclusion** — Conditionally register via `$app->register()` in a proxy provider, avoiding provider instantiation entirely in non-target environments.
- **Use config-driven guards over environment strings** — `config('app.debug')` is more flexible than hard-coded `'local'`.
- **Use `dont-discover` + manual registration** — Exclude development packages from auto-discovery, then conditionally register them.
- **Audit production provider list** — Confirm no development providers are registered in production.
- WHY: Development-only providers in production waste bootstrap time and can leak sensitive information (debug bars, stack traces to end users).

## Architecture Guidelines
- `$app->environment()` compares `APP_ENV` against provided value(s); supports arrays: `->environment(['local', 'staging'])`.
- The most performant guard eliminates the provider entirely — conditional `$app->register()` in a proxy provider.
- In Laravel 11, `bootstrap/providers.php` doesn't support conditional logic directly — use a proxy provider.
- Auto-discovered packages cannot be conditionally registered at the discovery level — use `dont-discover`.

## Performance Considerations
- Compile-time exclusion (not instantiating) saves PHP class loading, provider instantiation, `register()`, `boot()`, and memory allocation.
- Heavy provider like Laravel Debugbar adds 5-15ms bootstrap time if registered in production.
- Conditional `$app->register()` is the most performant guard — zero overhead in excluded environments.
- Runtime guards (checking environment inside `register()`) still pay provider instantiation cost.

## Security Considerations
- Development providers in production can leak: stack traces (Debugbar), config values (Telescope), sensitive data.
- Ensure `APP_ENV` is correctly set to `production` in production environments.
- Audit `bootstrap/cache/packages.php` and `bootstrap/providers.php` for unintended development providers.
- Config cache (`php artisan config:cache`) locks `config('app.debug')` values — runtime changes don't take effect.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Only guarding in `boot()` but registering bindings in `register()` | Partial guard | Production bindings potentially overwritten | Guard the registration, not just the boot |
| Using environment check in `register()` for auto-discovered provider | Provider still instantiated every request | Wasted instantiation cost | Use `dont-discover` + conditional manual registration |
| `APP_ENV` misconfigured as `local` in production | Deployment mistake | Development providers activate; sensitive data leaked | Validate `APP_ENV` in deployment pipeline |
| Environment guards in deferred providers | Deferred provider loads mid-request | Environment may differ between manifest build and load time | Don't use environment guards in deferred providers |

## Anti-Patterns
- **Guard in boot() Only** — Provider still registers bindings in `register()` that may affect production.
- **Environment String Hard-Coding** — Using `'local'` instead of config-driven check reduces flexibility.
- **Partial Deferral** — Making a development-only provider deferred but still listed in providers array — it's still available for resolution.

## Examples

### Conditional registration via proxy provider
```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('local')) {
            $this->app->register(TelescopeServiceProvider::class);
            $this->app->register(DebugbarServiceProvider::class);
        }
    }
}
```

### Config-driven guard
```php
public function register(): void
{
    if (config('app.debug')) {
        $this->app->register(DebugServiceProvider::class);
    }
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Application Environment Configuration
- **Closely Related:** Package Discovery and Auto-Registration, Eager Providers
- **Advanced:** Provider Organization Strategies, CI/CD Provider Validation
- **Cross-Domain:** Deployment Configuration (APP_ENV management)

## AI Agent Notes
- When a development provider appears in production, check: (1) `bootstrap/cache/packages.php` for auto-discovered, (2) `bootstrap/providers.php` for manually listed, (3) `config/app.php` for legacy Laravel 10 pattern.
- `dont-discover` in root `composer.json` is the cleanest way to exclude development packages in production.
- Validate production provider list as part of deployment — catch regressions early.

## Verification
- [ ] Can implement compile-time exclusion vs runtime guard
- [ ] Understand why compile-time exclusion is more performant
- [ ] Can use `dont-discover` + conditional manual registration for development packages
- [ ] Know how to audit the production provider list
- [ ] Can identify when a config-driven guard is better than environment string check
