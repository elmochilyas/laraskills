# Register vs Boot Methods

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Service Providers |
| Knowledge Unit | Register vs Boot Methods |
| Difficulty | Foundation |
| Lifecycle Phase | Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The `register()` and `boot()` methods on `ServiceProvider` are the two phases of provider initialization. `register()` is for binding only — contract-to-implementation mappings, singletons, config merges. `boot()` runs after all providers have completed `register()`, so all bindings are guaranteed available. The critical engineering insight is that the separation is not a convenience feature — it is an architectural constraint designed to eliminate provider ordering dependencies. Writing code that violates this constraint (resolving in `register()`) creates non-deterministic failures where bindings may or may not exist depending on provider registration order.

## Core Concepts
- **`register()`** — Bindings only: `bind()`, `singleton()`, `mergeConfigFrom()`, contextual binding. Never resolve from container.
- **`boot()`** — Post-registration initialization: route registration, event listeners, view composers, Blade directives, macros.
- **Post-Boot Callbacks** — `$this->app->booted(fn($app) => ...)` for actions after all providers have booted.
- **Boot Method Injection** — `boot()` supports type-hinted parameters auto-resolved from the container (Laravel 9+).
- **Two-Phase Guarantee** — All `register()` calls complete before any `boot()` call begins.

## When To Use
- `register()` for all container bindings, config merges, and declarative shortcuts.
- `boot()` for any initialization that depends on other registered services.
- `$app->booted()` for actions requiring the entire application to be booted.

## When NOT To Use
- `$this->app->make()` in `register()` — bindings from other providers may not exist yet.
- Routes, views, event listeners in `register()` — these depend on services registered by core providers.
- Heavy computation or I/O in either method — they run on every request for eager providers.

## Best Practices
- **Keep `register()` pure** — Only bindings, no side effects, no resolution. This ensures config caching works correctly.
- **Use boot method injection** — Laravel resolves type-hinted parameters in `boot()`, providing auto-documentation and ensuring dependencies exist.
- **Use `booted()` for non-critical initialization** — Post-boot callbacks run after all providers boot, suitable for actions that can be deferred.
- **Never log or write files from `register()`** — Config caching calls `register()` in a special context where writing to disk may fail.
- WHY: The register/boot separation eliminates an entire class of dependency bugs. If you could resolve in `register()`, provider ordering would matter — and debugging ordering issues is notoriously hard.

## Architecture Guidelines
- When `$app->register($provider)` is called before boot: `register()` runs immediately, `boot()` is deferred.
- When `$app->register($provider)` is called after boot: both `register()` and `boot()` run immediately.
- `boot()` calls are in registration order — not guaranteed to be after all providers have booted.
- `booted()` callbacks are queued if app hasn't booted, called immediately if it has.

## Performance Considerations
- `register()` runs on every request for eager providers — keeping it lightweight is critical.
- `boot()` is the primary contributor to bootstrap time (route registration, event listeners, etc.).
- Deferred providers skip both `register()` and `boot()` until their services are first requested.
- Use `boot()` method injection over `$this->app->make()` — the container resolves parameters once, not on every call.

## Security Considerations
- `register()` runs during config caching — avoid logic that depends on request context or environment variables that may differ.
- `boot()` runs with full application context — ensure authorization checks are in place for security-sensitive registrations.
- Never register debug-only routes or listeners in `boot()` without environment guards.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Calling `$this->app->make()` in `register()` | Convenience or habit | Intermittent "Target class does not exist" errors | Use `boot()` for resolution |
| Defining routes in `register()` | Unaware of Router binding timing | Routes registered before Router is bound | Define routes in `boot()` |
| Expecting `boot()` to run after all others | Misunderstanding iteration | Boot runs in registration order, not after all boot | Use `$app->booted()` |
| Heavy I/O in `register()` | Not understanding config cache context | Failures during `php artisan config:cache` | Keep `register()` pure bindings |

## Anti-Patterns
- **Resolution in register()** — The most common and most dangerous provider anti-pattern.
- **register() as boot()** — Using `register()` for route/view/event registration instead of `boot()`.
- **Empty register(), full boot()** — If `register()` is empty, consider if the provider needs to exist at all.

## Examples

### Correct provider structure
```php
class PaymentServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(PaymentGateway::class, StripeGateway::class);
        $this->mergeConfigFrom(__DIR__.'/../config/payments.php', 'payments');
    }

    public function boot(PaymentGateway $gateway, LoggerInterface $logger): void
    {
        $gateway->setLogger($logger);
        Route::group([], function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });
    }
}
```

### Post-boot callback
```php
public function boot(): void
{
    $this->app->booted(function ($app) {
        $app->make(Scheduler::class)->schedule();
    });
}
```

## Related Topics
- **Prerequisites:** Provider Fundamentals, Service Container
- **Closely Related:** Deferred Providers, Eager Providers
- **Advanced:** Boot Order Timing, Application bootstrap sequence
- **Cross-Domain:** Service Container (bind vs resolve lifecycle)

## AI Agent Notes
- When debugging "Target class doesn't exist" at bootstrap, check if `make()` is being called in `register()`.
- Config cache failures often trace back to `register()` methods with request-dependent side effects.
- `boot()` method injection is Laravel's auto-resolution — type-hint what you need.

## Verification
- [ ] Can explain why resolving in `register()` is harmful (non-deterministic failures)
- [ ] Know what belongs in `register()` (bindings only) vs `boot()` (initialization)
- [ ] Understand the `$app->booted()` callback and when it fires
- [ ] Can identify the two-phase guarantee and why it exists
- [ ] Can use boot method injection for auto-resolved dependencies
