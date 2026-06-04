# Octane Lifecycle Hooks

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Long-Running Processes
- **Last Updated:** 2026-06-02

## Executive Summary
Octane provides a set of lifecycle hooks that allow developers to observe and intervene at key points in the request lifecycle: `Octane::tick()` for periodic maintenance in the master container, `RequestTerminated` listeners for sandbox teardown, `RequestReceived` for pre-request setup, and `WorkerStarting` for worker initialization. These hooks are the primary extension points for controlling state, running background tasks, and integrating monitoring.

## Core Concepts
- **`Octane::tick()`:** Registers a callback that runs at a specified interval (in seconds) in the master container, outside any request context. Ticks share state with the master container — they see all singleton instances and can mutate them. Ticks are not sandboxed.
- **`RequestTerminated` Event:** Dispatched after the response is sent and the sandbox is torn down. This is the canonical place to clean up per-request state, reset accumulators, and free resources. The event receives the request, response, and sandbox instance.
- **`RequestReceived` Event:** Dispatched when a request arrives but before the sandbox is fully initialized. Useful for early request inspection (rate limiting, IP blocking) before the full framework stack is available.
- **`WorkerStarting` / `WorkerStopping`:** Worker lifecycle events. `WorkerStarting` runs once per worker process before any requests. `WorkerStopping` runs on graceful shutdown.
- **`RouteResolved`:** Fires after the route is matched to the request but before middleware executes. Useful for route-based state initialization.

## Mental Models
- **"The Janitor's Schedule":** `tick()` is like a janitor that comes every N seconds to clean up. It runs in the background, doesn't interact with requests directly, but maintains the workspace.
- **"The Checkout Cleaner":** `RequestTerminated` is the hotel checkout cleaner — after the guest leaves, they reset the room (sandbox) for the next guest.
- **"The Concierge Desk":** `RequestReceived` is the front desk — they glance at the guest before assigning a room. Quick checks, no heavy lifting.

## Internal Mechanics
1. **Tick Registration:** `Octane::tick('metric-aggregator', $callback, 30)` registers the tick in the `Octane` facade's tick registry. Ticks are stored in an array: `['name' => ['callback' => $fn, 'interval' => 30, 'lastExecuted' => 0]]`.
2. **Tick Execution Cycle:** After each request (in Swoole's event loop after the response is sent), Octane checks each tick's interval. If `time() - lastExecuted > interval`, the callback runs. Ticks run in the master container context.
3. **RequestTerminated Dispatch:** `Octane\Events\RequestTerminated` is fired with `$request, $response, $sandbox`. The event contains the sandbox's scoped instances array, allowing listeners to inspect or destroy individual scoped instances.
4. **Listener Registration:** Standard Laravel event/listener pattern: register in `EventServiceProvider` or `$listen` array. Listeners are singletons by default — ensure they store no per-request state.
5. **Sandbox Rebuild:** After `RequestTerminated` listeners complete, Octane calls `$sandbox->flush()` which clears all scoped bindings. Then the sandbox is ready for the next request.

## Patterns
- **Cleanup Listener:** Register a `RequestTerminated` listener that calls static reset methods: `Str::resetCache()`, `Collection::clearMacros()`, custom static accumulators.
- **Health Metric Tick:** Use `Octane::tick('health', function() { Metrics::gauge('memory', memory_get_usage(true)); }, 60)` to track worker health.
- **Connection Pool Maintenance:** In a `tick()`, prune idle database connections from the pool, reconnect stale Redis connections, rotate API credentials.
- **Early Denial in RequestReceived:** Inspect `$request->ip()` against a blocklist and return a 403 response directly from `RequestReceived` listener, saving the overhead of a full request cycle.
- **Worker-Specific Initialization:** In `WorkerStarting`, set worker-local config values: `Octane::state()['workerDbConn'] = "db_worker_{$workerId}"`, then reference in requests.

## Architectural Decisions
| Decision | Rationale |
|---|---|
| Ticks run in master container | Avoids overhead of sandbox creation for background work |
| Ticks are not persisted across restarts | Tick callbacks are re-registered by providers on each worker start |
| Events use Laravel's dispatcher | Consistent with Laravel conventions; allows event discovery and auto-detection |
| `$sandbox` is passed to terminal events | Enables deep inspection of per-request state without exposing internals |

## Tradeoffs
| Benefit | Cost | Consequence |
|---|---|---|
| Fine-grained lifecycle control | Hook misuse can cause leaks | Cleaning state in wrong hook misses cleanup window |
| Ticks enable background work | Tick callbacks share master container state | Tick closures must not assume request context (no `request()`, no `auth()`) |
| Event-based extension | Events are singletons; listeners accumulate state | Must ensure listeners are stateless or scoped |
| Worker lifecycle hooks | WorkerStarting may be called many times (restarts) | Deferred provider registration must guard against double-registration |

## Performance Considerations
- `RequestTerminated` listeners add to request response time (post-response, not blocking). Heavy listeners (DB writes, HTTP calls) delay the next request's sandbox creation.
- Ticks execute inline between requests. A long tick (e.g., 30-second database cleanup) blocks the worker from accepting new requests during execution. Use `async` dispatch or offload to queue for heavy tick work.
- Too many ticks (e.g., 100 ticks checking every second) adds O(n) overhead per request-cycle gap. Keep ticks few and interval-sparse.
- `RequestReceived` listeners run before sandbox initialization. Avoid heavy container dependencies here — only use values that can be resolved from the master container.

## Production Considerations
- Log tick execution failures separately from request failures. A crashing tick can silently kill a worker.
- Monitor tick execution time. A tick that slows over time (e.g., accumulating data in a static array) indicates a leak.
- Test listeners with both warm and cold workers. `WorkerStarting` only runs once; if it errors, the worker is useless.
- For Swoole coroutines, `tick()` callbacks run outside the coroutine context. They must not use coroutine-aware APIs unless they create a coroutine manually.
- RoadRunner does not support `tick()` in the same way — ticks are run on the HTTP plugin's loop. Check RoadRunner docs for admin endpoint equivalents.

## Common Mistakes
- Calling `tick()` in a service provider without checking if already registered. Multiple worker starts cause duplicate tick registrations and duplicate executions.
- Using `app()` or `resolve()` inside a `tick()` — these resolve from the master container. To use the sandbox, capture `$sandbox` from a `RequestTerminated` event.
- Storing per-tick state in static properties. Tick state accumulates across ticks but is not per-request. Use instance properties on the tick listener class.
- Expecting `RequestTerminated` to fire for every event in all runtimes. FrankenPHP sometimes reuses sandboxes without full termination. Test runtime-specific behavior.
- Using `$_SERVER`, `$_ENV`, or `$_REQUEST` superglobals in hooks. These are set per-request but hooks may run outside request context.

## Failure Modes
- **Tick Mutation Leak:** A `tick()` callback sets `config('app.timeout', 60)`. This mutates the singleton Config repository. All subsequent requests see the new timeout.
- **Listener State Accumulation:** A `RequestTerminated` listener accumulates request data in a static array for "logging." After 10,000 requests, the static array consumes 500MB.
- **Tick Crash Kills Worker:** A tick callback throws an uncaught exception. Depending on runtime, the entire worker may terminate. Wrap tick bodies in try-catch.
- **Early RequestReceived Error:** A `RequestReceived` listener returns a response (blocking the request). The sandbox was partially initialized, leaving inconsistent state. Return early carefully.

## Ecosystem Usage
- **Laravel Telescope:** Registers a `RequestTerminated` listener to record watched entries (queries, mails, events). Flushes its own state after recording.
- **Spatie Laravel Permission:** Registers a `RequestTerminated` listener to clear the `PermissionRegistrar` cache between requests.
- **Laravel Debugbar:** Under Octane, uses `RequestTerminated` to collect and send debug data, then resets internal state.
- **Laravel Horizon:** Does not use Octane hooks directly but runs its own worker lifecycle that mirrors Octane's pattern (WorkerStarting → JobReceived → JobProcessed → WorkerStopping).

## Related Knowledge Units
### Prerequisites
- octane-architecture-overview (lifecycle context)

### Related Topics
- singleton-state-leaks (cleanup via RequestTerminated)
- static-property-accumulation (cleanup via RequestTerminated)
- octane-configuration-and-workers (worker lifecycle interplay)

### Advanced Follow-up Topics
- memory-profiling-and-observability (tick-based metrics)
- queue-worker-lifecycle (parallel lifecycle pattern)
- scoped-bindings-for-octane (scoped binding flush lifecycle)

## Research Notes
- Octane v2.2 introduced `Octane::state()` which provides a shared, mutable state array visible to all hooks. Not persisted across worker restarts.
- FrankenPHP's sandbox reuse optimization means `RequestTerminated` may not fire for every request. Test with `dd()` in listener during development.
- The `RouteResolved` event is only available in Swoole adapter — not universally supported.
- Research question: Should `tick()` callbacks be sandboxed per-tick? Current design intentionally uses master container for performance, but this means tick callbacks have elevated access.
- PHP 8.3 allowed `#[OctaneHook('tick')]` attribute-based hook registration (proposed RFC, not merged). Current hook registration is event-based.
