# ku-01: Register vs Boot

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Boot Order & Timing
- **KU:** ku-01-register-vs-boot
- **Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Laravel service providers implement a two-phase initialization: `register()` then `boot()`. The `register()` phase is for adding bindings to the container only. The `boot()` phase runs after all providers have registered, enabling safe resolution of any provider's services. Mixing these two phases is the most common source of bootstrap bugs.

## Core Concepts
- **`register()`**: Pure binding phase — only `$this->app->bind()`, `$this->app->singleton()`, or the `$bindings`/`$singletons` properties. No service resolution, no side effects.
- **`boot()`**: Post-registration phase — safe to resolve services, register routes, listeners, views. All providers have completed `register()`.
- **Two-phase guarantee**: Every provider's `register()` completes before any provider's `boot()` starts. This eliminates dependency ordering issues during initialization.
- **Auto-processing**: After `register()` runs, Laravel automatically processes `$provider->bindings` and `$provider->singletons` properties.
- **Late registration**: If a provider is registered after the app is already booted, `register()` runs and then `boot()` is called immediately on that provider.
- **Deferred providers**: Have `register()` called lazily (on first service resolution), then auto-boot immediately since the app is already booted.

## When To Use
- `register()`: For all container bindings, singletons, contextual bindings, and interface-to-concrete mappings.
- `boot()`: For route registration, event listener registration, view composers, gate definitions, command registration, config publishing, and any code that depends on services from other providers.
- Use `$bindings`/`$singletons` shortcut properties for simple bindings to keep `register()` minimal.

## When NOT To Use
- Never resolve (`$this->app->make()`) in `register()`. The dependency may be registered by a later provider.
- Never call `register()` manually. Let the framework orchestrate the phase.
- Never perform I/O or side effects in `register()` — it should only configure the container.

## Best Practices (WHY)
- **Keep register() pure**: Container bindings are declarative. Side effects in `register()` break the phase contract and cause non-deterministic behavior when providers are deferred.
- **Use boot() for initialization**: All providers are available, all config is loaded, the environment is known. This is the correct time for setup logic.
- **Document phase expectations**: If your provider depends on another provider's bindings in `boot()`, document this dependency so future developers don't reorder the provider list.
- **Prefer $bindings/$singletons properties**: These are processed consistently after `register()`, making simple bindings visible at a glance without reading closure code.

## Architecture Guidelines
- Split large providers: put bindings in a `register()`-only provider and boot logic in a separate provider if the class becomes large.
- Order providers in `config/app.php` with dependency order in mind: providers that other providers depend on should appear earlier.
- Use deferred providers for providers that only bind services and have no boot logic — this skips both phases unless the service is actually used.

## Performance
- Every non-deferred provider calls `register()` on every request. Keeping `register()` lightweight reduces bootstrap time.
- `boot()` iteration is O(n) on provider count. Each empty `boot()` still incurs ~1-2µs dispatch overhead.
- `$app->call([$provider, 'boot'])` uses Reflection for method injection, adding ~10-20µs per provider with dependencies.
- Heavy boot operations (route loading, view registration, file publishing) should be cached (route cache, config cache).

## Security
- Bindings registered in `register()` are visible to all subsequent providers. Ensure sensitive services (auth, gate) are not overridable by later providers unless intended.
- `boot()` runs after all registrations — code here has access to the fully configured application. Avoid logging sensitive configuration in boot hooks.
- In packages, use `mergeConfigFrom()` in `register()` to allow user overrides — merging in `boot()` would override user config.

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Resolving in register() | `$this->app->make()` called inside register() | Developer thinks all bindings exist | BindingResolutionException if dependency provider hasn't registered yet | Move resolution to boot() |
| Heavy I/O in register() | Database/config calls in register() | Assuming register() is for setup | Slows every provider registration; affects bootstrap time | Move to boot() or defer |
| Phase order assumptions | Boot code assumes specific provider order | Not understanding provider list merge | Package providers append after app providers — boot order may surprise | Explicitly add package providers in config/app.php at desired position |
| Skipping boot() entirely | All logic in register() | Not knowing boot() exists | Early binding resolution may fail; deferred providers skip boot() | Use register() for bindings, boot() for initialization |
| Modifying container in boot() | Rebinding resolved services in boot() | Need to change implementation at boot time | Already-resolved instances are not affected by rebind | Use `$app->instance()` or contextual binding |

## Anti-Patterns
- **Fat register()**: A provider that does extensive setup, file parsing, or network calls in `register()` violates the phase contract and increases bootstrap latency.
- **Boot-in-register()**: Emulating `boot()` by calling `$this->app->boot()` from within `register()` forces immediate boot of all providers, defeating the two-phase design.
- **Silent failures in register()**: Catching exceptions in `register()` and swallowing them hides missing binding errors until runtime.

## Examples
```php
// Correct: register() for bindings, boot() for initialization
class ExampleProvider extends ServiceProvider
{
    public $bindings = [
        PaymentInterface::class => StripeGateway::class,
    ];

    public function register()
    {
        $this->app->singleton(AnalyticsService::class, function ($app) {
            return new AnalyticsService($app['config']['analytics.key']);
        });
    }

    public function boot()
    {
        Route::middleware('web')->group(function () {
            $this->loadRoutesFrom(__DIR__.'/../routes/web.php');
        });
        Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
    }
}

// Wrong: resolving in register()
public function register()
{
    $this->app->bind(ReportingService::class, function ($app) {
        return new ReportingService($app->make(Logger::class));
    });
    $logger = $this->app->make(Logger::class); // MAY FAIL — Logger provider may not have registered
}
```

## Related Topics
- Deferred Providers (ku-03) — providers that skip both phases until their service is needed
- Provider Registration Order (ku-02) — how the order of providers determines what's available during boot
- Boot Phase Order — the exact loop that calls boot() on each provider
- Service Provider Design — organizing providers by concern

## AI Agent Notes
- When diagnosing bootstrap errors, check if code runs in `register()` vs `boot()`. Resolution in `register()` is the #1 cause.
- To extract bindings from a provider: move `$this->app->bind()` calls to `register()`, move initialization to `boot()`.
- The `$bindings` and `$singletons` properties on providers are processed AFTER `register()` runs — not before.

## Verification
- [ ] No `$this->app->make()` calls exist in any `register()` method
- [ ] All container bindings are in `register()` or `$bindings`/`$singletons` properties
- [ ] Route/view/listener registration is in `boot()`, not `register()`
- [ ] The provider passes `php artisan optimize` without errors
- [ ] Deferred providers have no `boot()` method (or it's intentionally minimal)
