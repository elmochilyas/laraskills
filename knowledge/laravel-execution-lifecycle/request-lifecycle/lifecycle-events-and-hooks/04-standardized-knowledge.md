# Lifecycle Events and Hooks

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Execution Lifecycle & Framework Internals |
| Subdomain | Request Lifecycle |
| Knowledge Unit | Lifecycle Events and Hooks |
| Difficulty | Advanced |
| Lifecycle Phase | Cross-cutting |
| Framework Version | Laravel 10+ |
| Last Updated | 2026-06-02 |

## Overview
Lifecycle Events and Hooks covers the event system and callback registration points that fire at specific phases of the request lifecycle: bootstrapping events (`bootstrapping:*`, `bootstrapped:*`), application callbacks (`booting`, `booted`, `terminating`), request-specific events (`RequestHandled`, `Terminating`), and request duration lifecycle handlers (`whenRequestLifecycleDurationExceeds`). The critical engineering distinction is between **synchronous callbacks** (registered via `$app->booting()`, `$app->booted()`, `$app->terminating()`) and **event-driven listeners** (registered via `EventServiceProvider`). Callbacks execute immediately in the current call stack; events go through the full event dispatcher pipeline. Choosing the wrong mechanism leads to subtle ordering bugs.

## Core Concepts
- **Application Boot Callbacks** — `$app->booting($callback)` fires during `RegisterProviders` bootstrapper; `$app->booted($callback)` fires after `BootProviders`.
- **Bootstrap Events** — String-based events like `bootstrapping:LoadConfiguration` dispatched before/after each bootstrapper via `bootstrapWith()`.
- **RequestHandled Event** — Dispatched inside `Kernel::handle()` after route dispatch but before `send()`, carrying `$request` and `$response`.
- **Terminating Event/Callbacks** — Dual mechanism: `$app->terminating()` callbacks and `Event::listen(Terminating::class)` fire during `$kernel->terminate()`.
- **Request Duration Handlers** — Registered via `$kernel->whenRequestLifecycleDurationExceeds($thresholdMs, $handler)`, threshold-sorted, fire only if duration exceeds threshold.

## When To Use
- Adding observability (logging, metrics) without modifying middleware
- Implementing Octane state flushing between requests
- Monitoring slow requests via duration handlers
- Extending the bootstrap sequence with custom initialization

## When NOT To Use
- Moving business logic into lifecycle hooks (belongs in services)
- Using `RequestHandled` for cleanup that should run after send (use `Terminating`)
- Registering `booting()` callbacks in `boot()` method (they fire immediately during boot)

## Best Practices
- **Use `Terminating` for cleanup, not `RequestHandled`** — `RequestHandled` fires before send, delaying time-to-first-byte.
- **Keep `RequestHandled` listeners sub-millisecond** — Slow listeners increase client-visible latency.
- **Use `booting()` for logic that must run after all providers register** — `booted()` callbacks are queued during register and fire after BootProviders.
- **Test wildcard bootstrap event listeners** — A listener on `bootstrapping:*` with regex mismatch silently never fires.
- WHY: Lifecycle hooks are the primary mechanism for framework-level extensions. Incorrect hook choice causes subtle ordering bugs that are difficult to reproduce because they depend on provider registration order.

## Architecture Guidelines
- `booting` callbacks registered in a provider's `register()` fire during that provider's `register()` method, not after all providers register.
- `booted()` callbacks are queued during `register()` and fire after ALL providers have booted.
- Bootstrap events use string names (`bootstrapping:ClassName`) rather than event objects to enable wildcard listeners.
- Duration handlers iterate sorted by threshold; handlers with threshold <= request duration are invoked.
- The dual system (callbacks + events) lets simple cleanup use callbacks while complex operations use events.

## Performance Considerations
- Hook registration is O(1) — ~0.001ms per registration; 100 hooks = ~0.1ms.
- Bootstrap event dispatching adds ~0.05ms per bootstrapper × 12 dispatches = ~0.6ms total.
- Duration handler threshold comparison is O(n) — 10 handlers × ~0.002ms = negligible.
- `Terminating` event with 20 listeners adds ~0.5-1ms total dispatch time (runs after send, no client impact).

## Security Considerations
- Duration handlers run after response send; avoid modifying response, session, or auth state.
- Terminating listeners should not perform authorization-dependent cleanup (user context may be flushed).
- Bootstrap events expose the Application instance; ensure custom bootstrappers don't leak sensitive container bindings.

## Common Mistakes
| Description | Cause | Consequence | Better Approach |
|-------------|-------|-------------|-----------------|
| Assuming `booted()` fires after all providers register | Misunderstanding callback queue | `booted()` registered in `register()` fires after BootProviders, not after RegisterProviders | Use `booting()` for post-register logic |
| Registering `booting()` in `boot()` | Confusion about lifecycle phases | Fires immediately during boot, not at booting phase | Register `booting()` only in `register()` |
| Heavy computation in `RequestHandled` listener | Unaware of send() before Terminating | Increases time-to-first-byte | Move heavy work to `Terminating` or dispatch queue job |
| Typo in bootstrap event wildcard listener | String event names lack type safety | Listener silently never fires | Use exact class name strings; test with Artisan Tinker |

## Anti-Patterns
- **Registering lifecycle hooks inside lifecycle hooks** — E.g., registering a terminating callback inside a terminating listener; can cause infinite loops.
- **Using `RequestHandled` for state flushing** — Fires before send; should use `Terminating` instead.
- **Resolution in `booting()` callbacks** — Not all services are available during `booting` (fired during RegisterProviders).

## Examples

### Octane state flushing via Terminating event
```php
Event::listen(Terminating::class, function () {
    app()->forgetInstance(CurrentUser::class);
    MySingleton::reset();
});
```

### Bootstrapping performance monitoring
```php
$app['events']->listen('bootstrapping: *', function ($event, $data) {
    $data[0]->instance('bootstrap.start.'.$event, microtime(true));
});
$app['events']->listen('bootstrapped: *', function ($event, $data) {
    $start = $data[0]->bound('bootstrap.start.'.$event)
        ? $data[0]->make('bootstrap.start.'.$event) : LARAVEL_START;
    Log::debug("Bootstrap phase: $event took ".(microtime(true)-$start).'s');
});
```

## Related Topics
- **Prerequisites:** HTTP Kernel Dispatch, Response Sending and Termination, Service Providers
- **Closely Related:** Boot Order & Timing, Long-Running Process Architecture
- **Advanced:** Laravel Event Dispatcher Internals, Octane Sandbox and Reset
- **Cross-Domain:** Observability (Pulse, Telescope), Queue (queueable event listeners)

## AI Agent Notes
- When debugging lifecycle issues, trace the exact hook timing using the timeline diagram in this KU.
- For Octane state leaks, check if cleanup is in `RequestHandled` (wrong) or `Terminating` (correct).
- Duration handlers are added by Pulse/Telescope — if they cause issues, check handler count and threshold values.

## Verification
- [ ] Can list all lifecycle hooks in chronological order
- [ ] Understand the difference between callbacks and event dispatcher listeners
- [ ] Know when `booting()` vs `booted()` callbacks actually fire
- [ ] Can explain the dual `Terminating` mechanism (callbacks + event)
- [ ] Can identify whether a hook fires before or after `response->send()`
