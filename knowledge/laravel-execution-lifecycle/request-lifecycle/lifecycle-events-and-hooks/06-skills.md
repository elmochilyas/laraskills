# Skill: Register Lifecycle Hooks at the Correct Phase

## Purpose

Choose the correct lifecycle hook (`booting`, `booted`, `RequestHandled`, `Terminating`, or bootstrap events) for a given extension point, preventing timing bugs from callbacks executing at the wrong phase.

## When To Use

When adding any lifecycle observer — logging, metrics, state initialization, cleanup, or response modification. When refactoring code that uses lifecycle hooks at the wrong phase.

## When NOT To Use

For business logic that belongs in services or controllers. For simple per-request operations that belong in middleware. For post-response heavy processing that belongs in queue jobs.

## Prerequisites

- Understanding of the 6 core bootstrappers and their order
- Knowledge of the RequestHandled vs Terminating timing difference
- Familiarity with service provider register() vs boot() methods

## Inputs

- The operation to perform (initialization, modification, cleanup, monitoring)
- Which phase of the lifecycle it must run in (pre-bootstrap, post-bootstrap, pre-send, post-send)
- Service provider registration order (if using booting/booted)

## Workflow

1. Identify the operation's required timing:
   - **Must run before providers boot** (setting config, registering extensions) → use `$app->booting()` in provider `register()` — fires during RegisterProviders bootstrapper
   - **Must run after all providers boot** (initializing services that depend on other providers) → use `$app->booted()` in provider `register()` — fires after BootProviders bootstrapper
   - **Must modify the response before send** (adding headers, transforming body) → use `RequestHandled` event — fires in `Kernel::handle()` before `$response->send()`
   - **Must run after response send** (logging, metrics, cleanup, cache invalidation) → use `Terminating` event or `$app->terminating()` callback — fires in `$kernel->terminate()` after `send()`
   - **Must run around a specific bootstrapper** → use `bootstrapping:BootstrapperClass` / `bootstrapped:BootstrapperClass` events
2. Register the callback in the appropriate provider method:
   - `booting()` callbacks → register in provider `register()` method
   - `booted()` callbacks → register in provider `register()` method (queue for after boot)
   - Event listeners → register in provider `boot()` method (event dispatcher is available)
   - `$app->terminating()` → register in provider `boot()` method
3. For bootstrap event listeners, use exact class name strings to prevent silent failures from typos:
   ```php
   $app['events']->listen('bootstrapped:Illuminate\Foundation\Bootstrap\LoadConfiguration', function () {
       // guaranteed to match
   });
   ```
4. Keep `RequestHandled` listeners sub-millisecond — they delay TTFB
5. Move heavy work from `RequestHandled` to `Terminating` or queue jobs

## Validation Checklist

- [ ] `booting()` callbacks are registered in provider `register()`, never in `boot()`
- [ ] `booted()` callbacks are used for post-boot initialization, not `booting()`
- [ ] `RequestHandled` listeners are sub-millisecond — no I/O, no heavy computation
- [ ] Response modification uses `RequestHandled`, not `Terminating`
- [ ] Post-response cleanup uses `Terminating`, not `RequestHandled`
- [ ] Bootstrap event listeners use exact class name strings — not untested wildcards
- [ ] No lifecycle hooks are registered from within other lifecycle hooks (no nested registration)
- [ ] No container resolution in `booting()` callbacks — use `booted()` for that

## Common Failures

- Registering `booting()` in `boot()` — fires immediately, not at the booting phase boundary
- Using `RequestHandled` for cleanup logic — delays response send by the cleanup duration
- Using `Terminating` for response modification — response already sent, modifications silently ignored
- Boilerplate wildcard in bootstrap event listener — `bootstrapped:*Config*` silently never matches due to wrong glob pattern
- Nesting hook registration — registering a `Terminating` listener inside a `Terminating` listener can cause infinite chains

## Decision Points

- If the operation must modify the response AND do post-response work, split into two hooks: `RequestHandled` for modification, `Terminating` for cleanup
- If the operation is simple cleanup (flush cache, reset singleton), use `$app->terminating()` callback — simpler than event listener
- If the operation needs event infrastructure (queueable listener, subscribers, priority), use the `Terminating` event instead of callback

## Performance Considerations

Hook registration is O(1) (~0.001ms). Bootstrap event dispatching adds ~0.6ms total for 12 dispatches. `RequestHandled` listeners add client-visible latency — keep under 1ms combined. `Terminating` listeners run after send — no client impact but block the FPM/Octane worker.

## Security Considerations

`RequestHandled` listeners have access to the request and response — avoid logging sensitive data. `Terminating` listeners run after the user context may be flushed — do not perform authorization-dependent operations. Bootstrap events expose the Application instance — ensure custom code does not leak sensitive bindings.

## Related Rules

- Always Prefer Terminating Over RequestHandled For Cleanup (lifecycle-events-and-hooks:5)
- Keep RequestHandled Listeners Sub-Millisecond (lifecycle-events-and-hooks:5)
- Register booting() Only In Provider register() Methods (lifecycle-events-and-hooks:5)
- Use Exact Class Strings For Bootstrap Event Listeners (lifecycle-events-and-hooks:5)
- Do Not Nest Lifecycle Hook Registration Inside Lifecycle Hooks (lifecycle-events-and-hooks:5)
- Avoid Container Resolution In booting() Callbacks (lifecycle-events-and-hooks:5)

## Related Skills

- Implement Octane State Flushing via Terminating Callbacks (lifecycle-events-and-hooks:6)
- Monitor Slow Requests via Duration Handlers (lifecycle-events-and-hooks:6)
- Optimize Termination Phase for Throughput (response-sending-and-termination:6)

## Success Criteria

Each lifecycle hook is registered at the correct phase. `RequestHandled` listeners are under 1ms. `Terminating` handles all post-response cleanup. Bootstrap events use exact class names. No nested hook registration.

---

# Skill: Implement Octane State Flushing via Terminating Callbacks

## Purpose

Reset per-request singletons, facades, and service instances in `Terminating` callbacks or events to prevent state leakage between requests on the same Octane worker.

## When To Use

When running Octane with services that store per-request state in singleton instances, when debugging data leaking between user sessions on the same worker, or when setting up a new Octane deployment.

## When NOT To Use

Applications running under PHP-FPM (new process per request, no state leakage). Services that are already stateless or use request-scoped bindings. Read-only services that do not mutate state.

## Prerequisites

- Understanding of Octane's process model (worker persists across requests)
- Knowledge of which application services store per-request state
- Familiarity with `$app->terminating()` and `Terminating` event

## Inputs

- List of services that store per-request state (singletons with instance properties, cached auth data, etc.)
- Octane worker count and configuration

## Workflow

1. Audit all singleton services for per-request state:
   - Check services registered with `$app->singleton()` or `$this->app->singleton()`
   - Look for instance properties set during a request (e.g., `$this->currentUser`, `$this->startTime`)
   - Check facades that proxy singleton instances — facade-backed state also leaks
2. For each service that accumulates per-request state, decide the reset strategy:
   - **Singleton with mutable properties**: add a `reset()` method and call it in termination
   - **Service with request-scoped data**: switch to prototype (non-singleton) or use `spl_object_id($request)` keying
   - **Facade-backed service**: flush the facade root via `Facade::clearResolvedInstance()`
3. Implement termination flushing using callbacks for simple cases:
   ```php
   $this->app->terminating(function () {
       app()->forgetInstance(CurrentUser::class);
       app(MySingleton::class)->reset();
   });
   ```
4. Implement using the `Terminating` event for complex multi-listener orchestration:
   ```php
   Event::listen(Terminating::class, function () {
       app()->forgetInstance(CurrentUser::class);
       app(AnalyticsTracker::class)->reset();
       Facade::clearResolvedInstance('cache');
   });
   ```
5. Verify flushing with a test that simulates two requests on the same worker:
   - First request sets state (e.g., authenticates user)
   - Second request checks that state was cleared — user should be null
6. Monitor memory growth in production — if resident memory increases over time, a service is not being properly flushed

## Validation Checklist

- [ ] All singletons with per-request state have a `reset()` or flush mechanism
- [ ] Terminating callbacks cover every stateful singleton identified in the audit
- [ ] Facades are cleared with `Facade::clearResolvedInstance()` or `Facade::clearResolvedInstances()`
- [ ] No global/static mutable state is modified in termination (only reset to default)
- [ ] Termination callbacks are wrapped in try/catch — exceptions must not crash the worker
- [ ] Memory usage is stable across 1000+ requests in the same worker
- [ ] Test covers two-request state isolation (state set in R1 is absent in R2)

## Common Failures

- Using `RequestHandled` instead of `Terminating` for flushing — `RequestHandled` fires before send, not all middleware may have completed
- Forgetting to clear facades — facade root instances hold singleton references that are not garbage collected
- Resetting services to per-request values instead of defaults — `forgetInstance` is correct, setting to null may break the next request
- No try/catch in termination — an exception during flush crashes the Octane worker, dropping all subsequent requests
- Only flushing container bindings but not static properties — `UserService::$counter++` in a previous request affects the next

## Decision Points

- For simple singleton resets (`forgetInstance`, `reset()`), use `$app->terminating()` callback
- For complex orchestration (multiple listeners with ordering), use the `Terminating` event
- If a service is expensive to reinitialize, consider switching to request-scoped binding instead of singleton + flush

## Performance Considerations

Flushing adds 0.1-1ms per terminated request. Not flushing causes memory growth (leaks) and data corruption bugs that take hours to debug. The performance cost of flushing is negligible compared to the cost of debugging state leaks.

## Security Considerations

State leakage between requests is a security vulnerability — User A's session data, auth state, or permissions could be visible to User B on the same worker. Incomplete flushing is a critical security bug in Octane deployments. Validate flushing with a security-focused test that verifies auth isolation.

## Related Rules

- Avoid Global State Modification In Termination Under Octane (response-sending-and-termination:5)
- Use Callbacks For Simple Cleanup, Events For Complex Operations (lifecycle-events-and-hooks:5)
- Always Prefer Terminating Over RequestHandled For Cleanup (lifecycle-events-and-hooks:5)

## Related Skills

- Register Lifecycle Hooks at the Correct Phase (lifecycle-events-and-hooks:6)
- Optimize Termination Phase for Throughput (response-sending-and-termination:6)
- Implement Safe Terminable Middleware (response-sending-and-termination:6)

## Success Criteria

All stateful singletons are identified and flushed in `Terminating` callbacks. Facades are cleared. Termination handlers are wrapped in try/catch. Memory usage is stable across 1000+ requests in the same Octane worker. A two-request test verifies state isolation.

---

# Skill: Monitor Slow Requests via Duration Handlers

## Purpose

Register request lifecycle duration handlers to log, track, or alert on slow requests without adding client-visible latency or modifying response state.

## When To Use

When setting up performance monitoring without adding middleware overhead, when requests exceed expected P99 latency, when integrating with observability tools (Pulse, Telescope), or when debugging production slowdowns.

## When NOT To Use

For modifying the response based on duration — handlers run after send, response is immutable. For business logic or side effects — handlers should only perform read-only telemetry. For per-second granularity monitoring — use middleware or profiling tools instead.

## Prerequisites

- Understanding of `whenRequestLifecycleDurationExceeds` API
- Knowledge that handlers run in `$kernel->terminate()` after response send
- Slow request threshold appropriate for your application

## Inputs

- Slow request threshold in milliseconds (e.g., 1000ms, 5000ms)
- Log channel or metric destination
- Desired telemetry data (URI, status, duration, memory)

## Workflow

1. Define the slow request threshold based on P99 latency or SLA requirements:
   - Web (HTML): 500-2000ms threshold typical
   - API (JSON): 200-500ms threshold typical
   - Admin/CMS: 1000-5000ms threshold acceptable
2. Register the duration handler in a service provider's `boot()` method:
   ```php
   $kernel = $this->app->make(Kernel::class);
   $kernel->whenRequestLifecycleDurationExceeds(1000, function ($request, $response) {
       Log::warning('Slow request detected', [
           'uri' => $request->getUri(),
           'method' => $request->getMethod(),
           'status' => $response->getStatusCode(),
           'duration_ms' => round((microtime(true) - LARAVEL_START) * 1000, 2),
       ]);
   });
   ```
3. Use read-only operations only — no database writes, no cache updates, no API calls:
   ```php
   $kernel->whenRequestLifecycleDurationExceeds(2000, function ($request, $response) {
       // CORRECT: read-only telemetry
       Metrics::increment('slow_request_count', ['uri' => $request->getUri()]);
       // INCORRECT: side effect after response sent
       // DB::table('slow_requests')->insert([...]);
   });
   ```
4. Set multiple thresholds for different severity levels:
   ```php
   $kernel->whenRequestLifecycleDurationExceeds(1000, $warningHandler);
   $kernel->whenRequestLifecycleDurationExceeds(5000, $criticalHandler);
   ```
5. Ensure the handler is wrapped in try/catch — exceptions in duration handlers are not caught by the kernel
6. Verify handlers work in all deployment environments (FPM, Octane, RoadRunner)

## Validation Checklist

- [ ] Threshold is set based on P99 latency or SLA — not an arbitrary value
- [ ] Handler body contains only read-only telemetry — no side effects
- [ ] Handler is wrapped in try/catch to prevent process crashes
- [ ] URI and sensitive data are sanitized before logging (no auth tokens, session IDs)
- [ ] Multiple thresholds are used for different severity levels if needed
- [ ] Handler works in target deployment environment (FPM, Octane, etc.)
- [ ] Duration calculation uses `LARAVEL_START` or a custom start time

## Common Failures

- Writing to the database in duration handlers — response already sent, client can't be notified of failure, Octane state leaks
- No try/catch — an exception in the handler crashes the worker/process
- Using a single threshold — misses differentiation between "slow" and "critical"
- Not sanitizing URI parameters — sensitive data (tokens, passwords) logged in plaintext
- Assuming `LARAVEL_START` is defined — it's defined in `public/index.php` but may not be in all contexts

## Decision Points

- If duration handlers have side effects, move to `RequestHandled` (pre-send, client can be notified) or queue jobs
- If using Pulse/Telescope, they register their own duration handlers — verify your handler doesn't duplicate or conflict
- For Octane, ensure duration handlers don't mutate any state that persists across requests

## Performance Considerations

Duration handler registration is O(1). Threshold comparison is O(n) (n = number of handlers). Handler execution cost depends on the handler body — keep under 1ms for log-only handlers. The key advantage vs middleware: duration handlers run after response send, adding zero client-visible latency.

## Security Considerations

Never log request bodies, auth tokens, passwords, or session IDs in duration handlers. Sanitize URL parameters before logging. Duration handlers run after the user context may be flushed — do not perform authorization checks or user-specific operations.

## Related Rules

- Use Duration Handlers For Telemetry, Never For Logic (lifecycle-events-and-hooks:5)
- Always Prefer Terminating Over RequestHandled For Cleanup (lifecycle-events-and-hooks:5)
- Use Callbacks For Simple Cleanup, Events For Complex Operations (lifecycle-events-and-hooks:5)

## Related Skills

- Register Lifecycle Hooks at the Correct Phase (lifecycle-events-and-hooks:6)
- Implement Octane State Flushing via Terminating Callbacks (lifecycle-events-and-hooks:6)
- Profile and Optimize Kernel Bootstrap Time (http-kernel-dispatch:6)

## Success Criteria

Duration handler is registered with an appropriate threshold, contains only read-only telemetry, and is wrapped in try/catch. Slow requests are logged with URI, method, status, and duration. No side effects in handler body. Handler works in the target deployment environment.
