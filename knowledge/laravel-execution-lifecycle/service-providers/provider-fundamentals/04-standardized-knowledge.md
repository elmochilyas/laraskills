# Provider Fundamentals

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Provider Fundamentals |
| Difficulty | Foundation |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Service providers are the central bootstrapping mechanism in Laravel — every framework component is registered and initialized through them. The provider contract, base class (`Illuminate\Support\ServiceProvider`), registration orchestration via `bootstrap/providers.php`, and the two-phase model (register-then-boot) form the foundation of all Laravel service configuration. The critical architectural decision is the two-phase model: providers may depend on bindings defined by other providers, so the framework ensures all `register()` calls complete before any `boot()` call runs.

## Core Concepts
- **ServiceProvider Base Class** — Provides `$app` instance, `register()` and `boot()` methods, plus `$bindings`, `$singletons` shortcuts.
- **Two-Phase Model** — `register()` for bindings only; `boot()` for post-registration initialization.
- **`bootstrap/providers.php`** — Returns array of provider class names in registration order (Laravel 11+).
- **Provider Discovery** — `PackageManifest` reads `vendor/composer/installed.json` for auto-discovered providers.
- **Eager vs Deferred** — Listed providers are eager unless they implement `DeferrableProvider`.

## When To Use
- Registering service container bindings for application services.
- Bootstrapping package functionality (routes, views, config, events).
- Centralizing all dependency wiring in the composition root.

## When NOT To Use
- Resolving services inside `register()` (before all bindings exist).
- Adding logic in `register()` that depends on other services being available.
- Creating providers for trivial single-line bindings (use `$bindings`/`$singletons` shortcuts).

## Best Practices
- **Keep `register()` pure — bindings only** — Never resolve from container in `register()`. Use `boot()` for any code that depends on registered services.
- **Order providers deliberately** — `bootstrap/providers.php` order determines registration order; dependent providers must come after their dependencies.
- **Use `$app->booted()` for post-boot logic** — Actions that require the entire application to be booted belong here.
- **Audit provider count** — Each provider adds bootstrap overhead; prefer deferred providers for rarely-used services.
- WHY: Providers are the composition root — all dependency wiring is centralized here. Correct provider design prevents a class of bugs where bindings don't exist at resolution time.

## Architecture Guidelines
- Providers are the composition root pattern from DI literature — controllers and services never construct their own dependencies.
- `register()` is called immediately when provider is registered; `boot()` is called in a second pass after all providers registered.
- `bootstrap/providers.php` is the single registration point (Laravel 11+); previously providers were in `config/app.php`.
- Auto-discovered providers (from packages) are appended after manual providers.

## Performance Considerations
- Each eager provider adds constructor + `register()` + `boot()` overhead — ~0.1-0.5ms per provider.
- At 50+ providers, cumulative overhead reaches 10-50ms bootstrap time.
- Deferred providers add zero bootstrap time until their services are requested.
- Config cache serializes provider registration, eliminating per-request provider iteration overhead.

## Security Considerations
- Provider registration order can affect which bindings are available — verify order in `bootstrap/providers.php`.
- Environment-specific providers (debug bars, profilers) must not register in production.
- Package discovery can auto-register providers without explicit approval — audit `bootstrap/cache/packages.php`.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Resolving services inside `register()` | Ignoring two-phase contract | Intermittent "Target class does not exist" errors | Use `boot()` for resolution-dependent logic |
| Forgetting to add provider to `bootstrap/providers.php` | Missed step after creation | Provider never runs; services unavailable | Test `$app->bound()` for expected bindings |
| Assuming `boot()` runs after all providers booted | Misunderstanding iteration | Order-dependent boot failures; Provider A's boot before Provider B's register | Use `$app->booted()` for post-boot actions |
| Overriding constructor without calling parent | Adding dependencies | Provider not registered; `$app` not set | Override `register()`/`boot()`, not constructor |

## Anti-Patterns
- **God Provider** — Putting all bootstrapping in `AppServiceProvider` — creates untestable monolithic registration.
- **Registering Providers in Loop** — Dynamically registering providers based on database content — makes bootstrap non-deterministic.
- **Resolution in register()** — Using `make()` inside `register()` when bindings may not exist.

## Examples

### Standard provider structure
```php
class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
        $this->mergeConfigFrom(__DIR__.'/../config/payments.php', 'payments');
    }

    public function boot(): void
    {
        Route::group([], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });
    }
}
```

## Related Topics
- **Prerequisites:** Service Container, Application Bootstrap
- **Closely Related:** Register vs Boot Methods, Deferred Providers, Eager Providers
- **Advanced:** Provider Organization Strategies, Provider Sprawl and Governance
- **Cross-Domain:** Package Development (package service providers)

## AI Agent Notes
- When debugging "Target class not found" at bootstrap, check if the provider is in `bootstrap/providers.php` and ordered correctly.
- `register()` during config caching runs in a special context — avoid side effects that depend on request data.
- For package providers, always call `parent::register()` if overriding `register()` — otherwise `$bindings`/`$singletons` shortcuts are skipped.

## Verification
- [ ] Can explain the two-phase register-then-boot model and why it exists
- [ ] Understand where providers are registered (`bootstrap/providers.php`)
- [ ] Know the difference between eager and deferred providers
- [ ] Can identify the correct method (`register()` vs `boot()`) for a given operation
- [ ] Can debug common provider failures (missing provider, wrong order, resolution in register)
