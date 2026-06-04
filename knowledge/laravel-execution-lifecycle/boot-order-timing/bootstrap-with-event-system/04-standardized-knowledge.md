# Bootstrap With Event System

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Boot Order & Timing |
| Knowledge Unit | Bootstrap With Event System |
| Difficulty | Advanced |
| Lifecycle Phase | Application Bootstrap |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
The bootstrap event system dispatches `bootstrapping:*` and `bootstrapped:*` events for each bootstrapper in the kernel's bootstrap pipeline. These events allow third-party code to observe and interact with the bootstrap process at specific phases — before environment loading, after configuration is loaded, before providers register, etc. They provide an extension point for monitoring, profiling, and cross-cutting concerns without modifying the kernel or bootstrapper classes.

## Core Concepts
- **bootstrapping:name event**: Dispatched immediately before a bootstrapper executes. Name matches the bootstrapper class basename in snake_case (e.g., `bootstrapping: loadConfiguration`).
- **bootstrapped:name event**: Dispatched immediately after a bootstrapper completes successfully.
- **Event payload**: Both events receive the Application instance as the payload.
- **Listeners**: Registered via `Event::listen()` on the Application's event dispatcher.
- **Framework events**: `bootstrapping: bootProviders` and `bootstrapped: bootProviders` are the most commonly observed events.
- **Guard**: Events are only dispatched if `$app->events` is set. The base `Application` class registers the event dispatcher before running bootstrappers.

## When To Use
- Monitoring bootstrap timing with custom profilers.
- Injecting pre-bootstrap configuration overrides (e.g., force environment before LoadEnvironmentVariables).
- Observing which bootstrappers execute and in what order for debugging.
- Integration with APM tools (Telescope, Debugbar) that need bootstrap-phase metrics.

## When NOT To Use
- Application initialization logic that depends on specific bootstrapper state belongs in service providers, not bootstrap event listeners.
- Do not use bootstrap events for request-lifecycle concerns — use middleware or request lifecycle events.
- Avoid heavy listeners on bootstrap events — they delay the entire request before any application code runs.

## Best Practices (WHY)
- **Keep bootstrap listeners lightweight**: Bootstrap events run before middleware and routing. Heavy listeners delay every request. *Why: Bootstrap events execute in the critical path before any application code.*
- **Use specific event names**: Listen to `bootstrapping: loadConfiguration` rather than a wildcard. *Why: Wildcard listeners add overhead to every bootstrapper step.*
- **Prefer boot() over bootstrap events**: If your code needs configuration or providers, it likely belongs in a provider's `boot()` method. *Why: The provider system is the intended extension point for application code.*
- **Register listeners early**: Bootstrap event listeners must be registered before the bootstrap pipeline runs — register them in a service provider's `register()` method or in `bootstrap/app.php`. *Why: If the listener is registered in boot(), it's too late — the bootstrap events have already fired.*

## Architecture Guidelines
- Bootstrap events are dispatched by `Application::bootstrapWith()` which iterates the bootstrapper list.
- The event name convention is `bootstrapping:` + snake_case of the bootstrapper class basename.
- Event listeners receive the Application instance — they can modify the application state before a bootstrapper executes.
- The event dispatcher is registered in `Application::registerBaseServiceProviders()` (EventServiceProvider) before bootstrappers run.
- Custom bootstrappers automatically get bootstrap events if they are passed to `bootstrapWith()`.

## Performance
- Event dispatch overhead per bootstrapper: ~1-3µs (no listeners) to 10-50µs (with listeners).
- Six core bootstrappers × 2 events each = 12 events per request maximum.
- Heavy listeners (database queries, API calls) on bootstrap events directly increase time-to-first-byte.
- Octane: bootstrap events fire once per worker start, not per request — listener cost is amortized.

## Security
- Bootstrap event listeners have access to the raw Application before security middleware runs. Ensure listeners don't expose or log sensitive data.
- Third-party packages can observe all bootstrap events — audit package listeners for data leakage.
- The Application instance passed to listeners is the full container — avoid passing it to untrusted code.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Registering listener too late | Listener registered in boot() of a provider | Bootstrap events already fired; listener never executes | Register in register() or bootstrap/app.php |
| Heavy I/O in bootstrap listener | Database query or API call in listener | Every request delayed by listener execution | Move logic to middleware or a queued job |
| Using wildcard event names | `Event::listen('bootstrapping:*', ...)` | Catches all bootstrap events; added overhead per step | Use specific event names |
| Modifying container in listener | Adding bindings during bootstrap event | Bindings may conflict with provider-registered bindings | Use service providers for bindings |

## Anti-Patterns
- **Bootstrap listener as service locator**: Using a bootstrap listener to resolve services and perform setup instead of using provider boot().
- **Listener registration chaos**: Registering bootstrap listeners in multiple places without coordination — leads to unpredictable bootstrap behavior.
- **Overriding bootstrapper behavior**: Using a `bootstrapping:loadConfiguration` listener to replace the configuration array — fragile and version-specific.

## Examples
```php
// In a service provider's register() method
public function register()
{
    $this->app['events']->listen('bootstrapping: loadConfiguration', function ($app) {
        // Override a config value before LoadConfiguration runs
        $app->instance('config.override', true);
    });

    $this->app['events']->listen('bootstrapped: bootProviders', function ($app) {
        // Log the bootstrap completion time
        Log::info('Bootstrap completed', [
            'duration' => microtime(true) - LARAVEL_START,
        ]);
    });
}
```

## Related Topics
- **Prerequisites:** Complete Boot Sequence — the 16-step pipeline that defines which bootstrappers fire events.
- **Closely Related:** Lifecycle Callback Hooks — booting()/booted() callbacks that complement bootstrap events.
- **Advanced:** Octane Boot Timing — how bootstrap events change in long-running processes.
- **Cross-Domain:** Kernel Architecture — the kernel's bootstrap() method that dispatches these events.

## AI Agent Notes
- The event names use snake_case of the bootstrapper class name: `LoadEnvironmentVariables` → `load_environment_variables`.
- Only six core bootstrappers dispatch events. Custom bootstrappers passed to `bootstrapWith()` also fire events.
- To verify bootstrap events are firing, add `Event::listen('bootstrapping:*', fn() => logger('Bootstrap: '.current_event()))`.
- The event dispatcher is the Application's internal events instance, not the global Event facade.

## Verification
- [ ] Bootstrap event listeners are registered in register() or bootstrap/app.php, not boot()
- [ ] No wildcard event listeners unless intentionally observing all bootstrap events
- [ ] Bootstrap event listeners are lightweight (no I/O, no API calls)
- [ ] Custom bootstrappers correctly fire bootstrapping/bootstrapped events
- [ ] Octane deployments handle bootstrap events correctly (one-time fire)
