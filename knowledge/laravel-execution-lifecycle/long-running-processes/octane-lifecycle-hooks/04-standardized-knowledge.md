# Octane Lifecycle Hooks

## Metadata
- **ID:** ku-07-octane-event-hooks
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Overview
Octane provides a set of lifecycle hooks that allow developers to observe and intervene at key points in the request lifecycle: `Octane::tick()` for periodic maintenance in the master container, `RequestTerminated` listeners for sandbox teardown, `RequestReceived` for pre-request setup, and `WorkerStarting` for worker initialization. These hooks are the primary extension points for controlling state, running background tasks, and integrating monitoring.

## Core Concepts
- **`Octane::tick()`**: Registers a callback that runs at a specified interval (seconds) in the master container, outside any request context. Ticks are not sandboxed — they see all singleton instances.
- **`RequestTerminated` Event**: Dispatched after response sent and sandbox torn down. Canonical place to clean up per-request state, reset accumulators, and free resources.
- **`RequestReceived` Event**: Dispatched when a request arrives but before sandbox fully initialized. Useful for early request inspection (rate limiting, IP blocking).
- **`WorkerStarting` / `WorkerStopping`**: Worker lifecycle events. `WorkerStarting` runs once per worker before any requests.
- **`RouteResolved`**: Fires after route matched but before middleware executes. Swoole-specific.

## When To Use
- **Static property cleanup**: `RequestTerminated` listeners to reset leaky static arrays.
- **Health metrics**: `tick()` to track memory usage, request count, connection pool status.
- **Connection pool maintenance**: `tick()` to prune idle database connections, rotate credentials.
- **Early request denial**: `RequestReceived` to block IPs or rate-limit before full bootstrap.
- **Worker-local initialization**: `WorkerStarting` to set worker-specific configuration.

## When NOT To Use
- **Response modification**: Hooks run after response is sent — cannot modify response.
- **Per-request business logic**: Use middleware for request-scoped logic. Hooks are for lifecycle management.
- **Heavy periodic work in ticks**: Ticks block the worker from accepting requests during execution. Use queues for heavy work.
- **Request-scoped state in ticks**: Ticks run in master container — `request()`, `auth()` are not available.

## Best Practices (WHY)
- **Wrap tick logic in try-catch**: A crashing tick can silently kill a worker. *Why: Ticks run outside request context — uncaught exceptions have no error handler.*
- **Guard against duplicate tick registration**: Use a flag to ensure `tick()` is only called once per worker. *Why: Workers can restart; providers can be called multiple times.*
- **Keep RequestTerminated listeners fast**: Heavy listeners delay the next request's sandbox creation. *Why: Listeners run synchronously between requests — the worker is blocked during cleanup.*
- **Test hooks with both warm and cold workers**: `WorkerStarting` only runs once; if it errors, the worker is useless. *Why: A failing WorkerStarting prevents the entire worker from serving requests.*

## Architecture Guidelines
- **Ticks run in master container**: Avoids sandbox creation overhead for background work.
- **Ticks are not persisted across restarts**: Tick callbacks re-registered by providers on each worker start.
- **Events use Laravel's dispatcher**: Consistent with Laravel conventions; allows event discovery and auto-detection.
- **`$sandbox` passed to terminal events**: Enables deep inspection of per-request state without exposing internals.

## Performance
- `RequestTerminated` listeners add to request response time (post-response, not blocking).
- Ticks execute inline between requests. A long tick blocks the worker from accepting new requests.
- Too many ticks adds O(n) overhead per request-cycle gap. Keep ticks few and interval-sparse.
- `RequestReceived` listeners run before sandbox initialization. Avoid heavy container dependencies.

## Security
- **Tick mutation risk**: A `tick()` callback can mutate singleton state (e.g., `config()`). Affects all subsequent requests.
- **Listener state accumulation**: `RequestTerminated` listeners that accumulate data in static arrays become leak sources themselves.
- **RequestReceived early return**: A listener that returns a response (blocking the request) may leave inconsistent sandbox state.
- **Tick crashing worker**: Uncaught exception in tick can terminate the entire worker depending on runtime.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Calling `tick()` without duplicate guard | Multiple worker starts | Duplicate callback registrations | Use a registered flag |
| Using `app()` in tick context | Tick runs in master container | Resolves from master, not sandbox | Capture sandbox from RequestTerminated |
| Storing tick state in static properties | Assumption of per-tick isolation | State accumulates across ticks | Use instance properties on tick class |
| Expecting RequestTerminated for all runtimes | FrankenPHP sandbox reuse | Listeners may not fire per-request | Test runtime-specific behavior |

## Anti-Patterns
- **Tick as cron replacement**: Using ticks for heavy periodic tasks (report generation, data exports). Use queued jobs instead.
- **Listener that re-request**: A `RequestTerminated` listener that sends HTTP requests — risks infinite loops if those requests are also monitored.
- **Tick mutating shared state without coordination**: Multiple ticks writing to the same static array — race conditions and data corruption.
- **Ignoring runtime-specific behavior**: Assuming Swoole hooks work identically in RoadRunner. FrankenPHP's sandbox reuse differs.

## Examples

```php
// Health metric tick
Octane::tick('health', function () {
    Metrics::gauge('worker_memory', memory_get_usage(true));
    Metrics::gauge('worker_requests', Octane::state()['app']['requestCount'] ?? 0);
}, 60);

// Static property cleanup on RequestTerminated
Event::listen(RequestTerminated::class, function ($event) {
    Str::resetCache();
    Collection::clearMacros();
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

// Worker-specific initialization
Octane::onWorkerStarting(function ($event) {
    $workerId = $event->workerId;
    Octane::state()['workerDb'] = "db_worker_{$workerId}";
});

// Early request denial
Event::listen(RequestReceived::class, function ($event) {
    if (in_array($event->request->ip(), config('app.blocked_ips'))) {
        $event->response = response('Forbidden', 403);
    }
});
```

## Related Topics
- **Octane Architecture Overview**: Lifecycle context for hooks.
- **Singleton State Leaks**: Cleanup via RequestTerminated.
- **Static Property Accumulation**: Cleanup via RequestTerminated.
- **Octane Configuration and Workers**: Worker lifecycle interplay.
- **Memory Profiling and Observability**: Tick-based metrics.

## AI Agent Notes
- Octane v2.2 introduced `Octane::state()` which provides a shared, mutable state array visible to all hooks. Not persisted across worker restarts.
- FrankenPHP's sandbox reuse optimization means `RequestTerminated` may not fire for every request. Test with `dd()` in listener during development.
- The `RouteResolved` event is only available in Swoole adapter — not universally supported.
- Research question: Should `tick()` callbacks be sandboxed per-tick? Current design intentionally uses master container for performance.

## Verification
- [ ] Register a `tick()` callback and verify it runs at the configured interval
- [ ] Register a `RequestTerminated` listener and verify cleanup executes
- [ ] Test with both warm and cold workers — ensure WorkerStarting fires only once
- [ ] Verify that `app()` in tick resolves from master container, not sandbox
- [ ] Test runtime-specific behavior — verify hooks in both Swoole and RoadRunner
- [ ] Monitor tick execution duration — ensure no tick blocks worker acceptance
