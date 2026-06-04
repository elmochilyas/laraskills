# Boot Phase Order

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Boot Phase Order |
| Difficulty | Intermediate |
| Lifecycle Phase | Provider Initialization |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The `boot()` phase is the second half of Laravel's two-phase service provider initialization. After all providers have completed `register()`, the framework iterates the registered provider list and calls `boot()` on each. This phase is where providers initialize services, register routes, event listeners, view composers, and perform any setup that depends on other providers' bindings being available.

## Core Concepts
- **Boot mirrors register order**: Providers `boot()` in the exact order they were registered. The `$serviceProviderList` preserves insertion order.
- **Phase guarantee**: Every provider's `register()` completes before any provider's `boot()` starts — this is enforced by `Application::boot()`.
- **Application::boot()**: The method that iterates all registered providers and calls `$provider->boot()` on each.
- **booted flag**: `Application::$booted` prevents double-booting. Once set, subsequent `boot()` calls return immediately.
- **Late registration**: Providers registered after the app is booted call `register()` then immediately `boot()` on that provider.
- **Deferred providers**: When resolved lazily, `register()` runs and then `boot()` is called immediately since the app is already booted.

## When To Use
- For any initialization that depends on services from other providers — route registration, event listeners, view composers.
- When resolving services from the container during provider setup.
- For registering routes, gates, policies, and commands that should be available application-wide.

## When NOT To Use
- Never register bindings in `boot()` — use `register()` for bindings. Bindings in `boot()` may be unreachable by deferred providers.
- Never call `$app->boot()` manually in application code — it's called by the framework automatically.
- Don't depend on boot order between unrelated providers — refactor to use the container if boot ordering becomes fragile.

## Best Practices (WHY)
- **Keep boot() focused on initialization**: Register routes, listeners, views in `boot()`. *Why: This is the phase where all bindings are available and safe to resolve.*
- **Document boot dependencies**: If your provider expects another provider's services in `boot()`, document this. *Why: Future reordering could break your initialization silently.*
- **Use boot() for conditional registration**: Environment-aware route registration, feature-flag-based listener registration. *Why: Config and environment are fully loaded by boot() time.*
- **Avoid heavy I/O in boot()**: Heavy operations in boot() add to every request's bootstrap time. *Why: boot() runs on every request for eager providers.*

## Architecture Guidelines
- Providers boot in registration order — arrange `config/app.php` so that providers with initialization dependencies are ordered correctly.
- Framework core providers boot first, then app providers, then package providers.
- The `booting()` and `booted()` application callbacks wrap the boot phase — `booting()` runs before any provider boots, `booted()` runs after all providers have booted.
- Use `DeferrableProvider` for providers that only bind and have no boot logic — they skip boot() entirely.

## Performance
- `boot()` iteration is O(n) on provider count. Each empty `boot()` still incurs ~1-2µs dispatch overhead.
- Heavy boot operations (route loading, view registration) can add 5-50ms per request.
- Deferred providers only boot when their service is first resolved — use them to avoid paying boot cost on every request.
- The `$app->call([$provider, 'boot'])` call uses Reflection for method injection, adding ~10-20µs per provider with dependencies.

## Security
- All services are available during `boot()` — ensure sensitive initialization (auth gates, policies) runs in `boot()`, not `register()`.
- Package providers boot after app providers — a package's `boot()` can read but not override app bindings.
- Avoid logging or exposing configuration values during `boot()` as they are fully resolved and may contain secrets.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Registering bindings in boot() | Not understanding register/boot separation | Bindings invisible to deferred providers; unpredictable behavior | Use register() for all bindings |
| Assuming boot order with package providers | Package providers append and boot last | Package initialization may override app setup | Explicitly position package providers in config/app.php |
| Heavy boot() with no deferral | Route/view/event registration in boot() of every provider | Adds 5-50ms bootstrap overhead per request | Use deferred providers where possible |
| Forgetting parent::boot() | Extending a package provider without calling parent | Parent initialization skipped | Always call parent::boot() when extending |
| Modifying container bindings in boot() | Rebinding resolved services at boot time | Already-resolved instances not affected by rebind | Use `$app->instance()` or contextual binding |

## Anti-Patterns
- **Boot() as catch-all**: Dumping all initialization in boot() without considering whether it's needed on every request.
- **Side-effect-heavy boot()**: Database writes, API calls, file operations in boot() that execute on every request.
- **Boot-time service resolution storms**: Resolving dozens of services in boot() that are only conditionally used, paying cost on every request.
- **Calling boot() manually**: Invoking `$app->boot()` from middleware or controllers — forces double boot or errors.

## Examples
```php
class EventServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Event::listen(OrderPlaced::class, SendOrderConfirmation::class);
        Event::listen(UserRegistered::class, SendWelcomeEmail::class);
    }
}

class RouteServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Route::middleware('web')
            ->group(base_path('routes/web.php'));
    }
}
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the 16-step pipeline that positions boot() as step 10.
- **Closely Related:** Register Phase Order — the first phase that runs before boot().
- **Advanced:** Lifecycle Callback Hooks — booting()/booted() hooks wrapping the boot phase.
- **Cross-Domain:** Deferred Provider Loading Timing — how deferred providers interact with boot timing.

## AI Agent Notes
- `Application::boot()` is the method that iterates providers. It's guarded by `$this->booted` flag.
- The boot phase dispatches `bootstrapping: bootProviders` and `bootstrapped: bootProviders` events.
- For late-registered providers (after app is booted), `register()` runs then `boot()` is called immediately on that single provider.
- To debug boot order, add `dd('before boot')` and `dd('after boot')` in your provider methods.

## Verification
- [ ] All container bindings are in register(), not boot()
- [ ] boot() does not call `$app->boot()` or `app()->boot()`
- [ ] Route/view/event/listener registration is in boot(), not register()
- [ ] No heavy I/O in boot() that could slow every request
- [ ] Deferred providers have no boot() method (or it's intentionally minimal)
