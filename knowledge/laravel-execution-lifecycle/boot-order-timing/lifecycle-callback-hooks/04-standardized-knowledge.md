# Lifecycle Callback Hooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Lifecycle Callback Hooks |
| Difficulty | Intermediate |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Laravel provides lifecycle callback hooks — `booting()`, `booted()`, and their Application Builder equivalents — that allow code to execute at specific points during the application initialization sequence. These hooks wrap the service provider boot phase, providing extension points before and after all providers boot. They are the primary mechanism for performing actions that must execute relative to the entire provider boot process rather than a single provider's lifecycle.

## Core Concepts
- **booting() callback**: Registers a closure that runs immediately before the first provider's `boot()` method is called.
- **booted() callback**: Registers a closure that runs immediately after all providers have completed `boot()`.
- **Application::booting()**: Adds a callback to `$this->bootingCallbacks[]` array. Callbacks execute in registration order.
- **Application::booted()**: Adds a callback to `$this->bootedCallbacks[]` array. Executes after all providers boot.
- **ApplicationBuilder hooks**: `->withRouting()`, `->withMiddleware()` delegate some setup to booted callbacks.
- **Fire-once semantics**: Callbacks registered after the app is already booted execute immediately (fire-once pattern).

## When To Use
- Performing setup that must run after all providers have booted but before middleware executes.
- Registering callbacks that wrap the entire provider boot process.
- Use in package development when your package must observe the boot phase without extending providers.

## When NOT To Use
- For setup that belongs in a specific provider's boot() — use the provider's boot() method directly.
- For request-lifecycle hooks — use middleware or request lifecycle events instead.
- For bootstrap-phase monitoring — use the bootstrap event system (`bootstrapping:*`, `bootstrapped:*`).

## Best Practices (WHY)
- **Use booted() for post-provider setup**: Any logic that needs all providers to be booted before running. *Why: booted() guarantees all providers have completed initialization.*
- **Keep hooks focused**: Each hook should do one thing. *Why: Multiple concerns in one hook are hard to debug and reorder.*
- **Register hooks early**: Call `$app->booting()` or `$app->booted()` in service provider `register()` methods. *Why: If you call them in boot(), the app may already be past that phase.*
- **Prefer provider boot() over hooks**: If the logic belongs to a specific provider, use that provider's boot() method. *Why: Hooks are for cross-provider coordination, not individual provider setup.*

## Architecture Guidelines
- `booting()` callbacks run before any provider's boot(). `booted()` callbacks run after all providers have booted.
- Callbacks are stored in arrays (`$this->bootingCallbacks`, `$this->bootedCallbacks`) and executed sequentially.
- If the app is already booted when a `booted()` callback is registered, it fires immediately (fire-once).
- The `ApplicationBuilder` registers several internal callbacks via `booted()` for route, middleware, and exception configuration.
- Callbacks registered via `$app->booting()` are NOT cleared on flush — they persist across the application lifecycle.

## Performance
- Each callback is a closure dispatch — negligible overhead (~0.5-2µs per callback).
- Excessive callbacks (20+) add measurable overhead to the boot phase (10-40µs each).
- Octane: booting/booted callbacks fire once per worker start, not per request — cost is amortized.
- Heavy callbacks (database queries, network calls) directly increase time-to-first-byte.

## Security
- `booted()` callbacks run after all providers have booted — all services, including security services, are available.
- Callbacks have full container access — avoid exposing sensitive data in callback closures captured from outer scope.
- Third-party packages can register booting/booted callbacks — audit package callbacks for security implications.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Registering hook too late | `$app->booted()` called inside a booted() callback | Callback fires immediately but may run before expected | Register in register() phase |
| Registering booting() in booted() | Mixing up callback phases | booting() callback registered after booting phase has passed | Use booted() for post-boot logic, booting() for pre-boot |
| Heavy work in booting() | Database query or API call before providers boot | Slows entire request bootstrap | Move to booted() or middleware |
| Assuming hook order with Builder | Builder ->withMiddleware() callbacks may fire at different times | Middleware config applied before or after expected | Check ApplicationBuilder source for callback order |

## Anti-Patterns
- **Callback spaghetti**: Registering booting/booted callbacks in multiple places without clear coordination.
- **Using hooks instead of provider boot()**: A provider should initialize itself in its own boot() method, not via a global hook.
- **State mutation in booting()**: Modifying container bindings before providers boot can cause unexpected behavior.
- **Forgetting fire-once semantics**: Relying on a booted() callback to fire on every test case — it only fires once per application instance.

## Examples
```php
// In a service provider's register() method
public function register()
{
    $this->app->booting(function ($app) {
        // Runs before any provider boots
        Log::info('Application booting — providers about to start');
    });

    $this->app->booted(function ($app) {
        // Runs after all providers have booted
        $this->registerPostBootRoutes();
    });
}
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the pipeline that positions booting/booted around the boot phase.
- **Closely Related:** Bootstrap With Event System — bootstrap events that fire per-bootstrapper vs. the global boot phase hooks.
- **Advanced:** Application Builder Configuration — how withRouting/withMiddleware use booted callbacks.
- **Cross-Domain:** Service Provider Boot Order — the boot phase that runs between booting and booted.

## AI Agent Notes
- `Application::boot()` calls `fireAppEvent('bootstrapping: bootProviders')`, then iterates providers calling boot(), then calls all bootedCallbacks.
- The `booting()` callbacks are fired immediately before the provider boot loop in `Application::boot()`.
- Fire-once semantics: if a callback is registered via `booted()` after the app is booted, it's called immediately.
- To see registered callbacks: inspect `$app->bootingCallbacks` and `$app->bootedCallbacks` (protected — use reflection in debugging).

## Verification
- [ ] booting/booted hooks are registered in register() phase, not boot()
- [ ] No heavy I/O in booting() callbacks
- [ ] booted() callbacks are not used to replace provider boot() logic
- [ ] Fire-once semantics are understood and accounted for in testing
- [ ] ApplicationBuilder callback order is verified for middleware/routing setup
