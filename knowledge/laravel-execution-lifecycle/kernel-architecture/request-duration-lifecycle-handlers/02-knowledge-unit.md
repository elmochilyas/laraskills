# Request Duration Lifecycle Handlers

## Metadata
**Domain:** Laravel Execution Lifecycle & Framework Internals  
**Subdomain:** Kernel Architecture  
**Last Updated:** 2026-06-02

## Executive Summary
Request Duration Lifecycle Handlers are threshold-based callbacks that fire when a request's execution time exceeds a specified duration. Introduced in Laravel 11, they enable passive performance monitoring without external profiling tools. Handlers are registered in the kernel bootstrap phase and execute in the terminate lifecycle — long after the response has been sent to the client. This makes them ideal for logging slow requests, triggering alerts, or gathering diagnostic data without impacting response time.

## Core Concepts
- **Threshold-Based Execution**: Each handler is tied to a time threshold (e.g., 1000ms). When the total request duration exceeds the threshold at termination time, the handler fires.
- **Terminate-Phase Execution**: Handlers run in the `terminate()` phase — after the response is sent to the client. This ensures monitoring overhead doesn't affect the user-facing response time.
- **Kernel Registration**: Handlers are registered via the kernel's `whenRequestLifecycleIsLongerThan()` method (or `$kernel->whenRequestLifecycleIsLongerThan(1000, $callback)`).
- **Duration Measurement**: Duration is calculated from the start of the kernel `handle()` call to the start of `terminate()`, excluding the actual response transmission.

## Mental Models
- **Slow Request Alarm Bell**: Visualize each handler as an alarm bell set to a specific time threshold. The bell only rings if the request is still "in flight" past the threshold time. Faster requests never trigger it.
- **Post-Response Inspector**: The handler is like a security guard who inspects the building *after* visitors have left — monitoring happens without any visitor impact. If the visit took too long, the guard files a report.
- **Timer with Thresholds**: Picture a stopwatch that starts at kernel `handle()`. At `terminate()`, the elapsed time is compared against defined thresholds — only thresholds that the elapsed time exceeds trigger their handlers.

## Internal Mechanics

**Registration** (`src/Illuminate/Foundation/Http/Kernel.php` or `Console/Kernel.php`):
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response) {
    Log::warning('Slow request detected', [
        'duration' => $request->server->get('REQUEST_TIME'),
        'url' => $request->fullUrl(),
    ]);
});
```

**Implementation flow:**
1. **Pre-handle**: At the start of `handle()`, the kernel records `$this->requestStartedAt = microtime(true)`.
2. **Request processing**: Normal middleware pipeline and routing execute.
3. **Response returned**: `handle()` returns the response to the framework.
4. **Terminate called**: The framework calls `$kernel->terminate($request, $response)`.
5. **Duration calculation**: At the beginning of `terminate()`, kernel computes `$duration = (microtime(true) - $this->requestStartedAt) * 1000`.
6. **Threshold comparison**: Kernel iterates registered handlers (stored in `$this->lifecycleRequestDurationHandlers` array), checks if `$duration >= $threshold`.
7. **Handler execution**: For each matching threshold, the associated callback fires with `($request, $response, $duration)` arguments.

**Code structure** (simplified):
```php
// Kernel constructor or registration method
public function whenRequestLifecycleIsLongerThan(int $threshold, callable $handler): void
{
    $this->lifecycleRequestDurationHandlers[] = [$threshold, $handler];
}

// terminate() method
public function terminate($request, $response): void
{
    $duration = (microtime(true) - $this->requestStartedAt) * 1000;
    foreach ($this->lifecycleRequestDurationHandlers as [$threshold, $handler]) {
        if ($duration >= $threshold) {
            $handler($request, $response, $duration);
        }
    }
    parent::terminate($request, $response);
}
```

**Where handlers are registered**: Typically in `AppServiceProvider::boot()`, `bootstrap/app.php` (Laravel 11+), or a custom service provider. The kernel instance must be resolved before registration.

## Patterns
- **Observer Pattern**: Handlers observe the kernel's lifecycle events (termination) and react when a condition (threshold exceeded) is met.
- **Threshold-Based Alerting**: Classic threshold pattern — define multiple thresholds for different severity levels (e.g., 500ms → warning log, 2000ms → critical alert, 5000ms → page Slack channel).
- **Decorator on Terminate**: The duration check decorates the existing `terminate()` method without changing its behavior — handlers run in addition to normal terminable middleware.
- **Registry Pattern**: Handlers are registered in a list and iterated at evaluation time — new handlers can be added without modifying kernel internals.

## Architectural Decisions
- **Terminate-Phase Execution**: Handlers run in terminate rather than after the middleware pipeline. This keeps the handler overhead invisible to the client — the response is already sent.
- **Threshold Array, Not Events**: Using threshold arrays rather than dispatching lifecycle events avoids the event system overhead for every request. Only requests that exceed thresholds trigger any work.
- **Both Kernels**: The mechanism exists in both HTTP and Console kernels. Console commands can also be monitored for duration, which is useful for long-running scheduled tasks.
- **No Default Handlers**: Laravel doesn't ship with any default handlers — they are opt-in. This ensures zero overhead for applications that don't need duration monitoring.

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Zero overhead for fast requests | microtime(true) call on every request (negligible ~0.001ms) | Acceptable — microtime is a syscall but trivially fast |
| Handler logic doesn't affect response time | Handlers run after response sent — can't modify response | Useful for logging, but cannot prevent slow request or return early response |
| Multiple thresholds enable multi-tier monitoring | Each threshold comparison evaluates all registered handlers | With 10+ handlers, duration check adds minimal overhead (~0.01ms) |
| Available for both HTTP and Console kernels | Console kernel duration includes bootstrap time | CLI command duration is total process time — less granular than HTTP |
| Simple registration API (single method) | No built-in sampling — every request is measured | High-traffic apps may want percentage-based sampling |

## Performance Considerations
- **microtime(true) overhead**: The start-time recording (`microtime(true)`) is called once per request (in `handle()`). This adds approximately 0.001ms — effectively zero.
- **Duration calculation**: The calculation at `terminate()` is a single subtraction and multiplication — negligible cost.
- **Threshold iteration**: Iterating over the handler array is O(n) where n = number of registered handlers. With 3-5 handlers, this is microseconds.
- **Handler callback cost**: The handler itself may do expensive work (database queries, external API calls). Since it runs post-response, it won't slow the client, but can consume server resources under high concurrency (PHP-FPM process blocking).
- **No memory overhead**: Duration handlers don't accumulate memory between requests — they are registered once per kernel instance.

## Production Considerations
- **Logging slow requests**: The most common use case — log duration, URL, user ID, and memory usage to a dedicated slow-query log channel. Use `Log::channel('slow')->warning(...)`.
- **Alerting integration**: Handlers can trigger external monitoring alerts (Sentry, DataDog, Slack) for requests exceeding critical thresholds. Be aware that external API calls in handlers may fail — wrap in try-catch.
- **Threshold tuning**: Start with high thresholds (2000ms), monitor results, then lower incrementally. Setting thresholds too low generates noise, too high misses issues.
- **Console command monitoring**: For queue workers or scheduled tasks, register duration handlers to detect commands that exceed expected runtime.
- **Sampling in high-traffic apps**: In applications serving 1000+ requests/second, handlers run for every slow request — implement in-handler sampling or rate limiting to prevent handler overload.

## Common Mistakes
- **Treating handler as middleware**: Handlers cannot modify the response or short-circuit the request — they are purely observational. All handler logic should be read-only.
- **Throwing exceptions in handlers**: If a handler throws an uncaught exception, it can crash the terminate phase, which runs in a different error context — always wrap handler logic in try-catch.
- **Performance work in handlers**: Placing expensive operations (DB writes, HTTP calls) in handlers in high-traffic apps — the post-response phase still occupies PHP-FPM workers.
- **Registering handlers in wrong location**: Attempting to register handlers in service provider `register()` method before kernel is resolved — handlers must be registered in `boot()` or `bootstrap/app.php`.
- **Assuming millisecond precision**: `microtime()` has varying precision across platforms — on some Windows configurations, precision is ~15ms. Thresholds below 50ms may not be reliable.

## Failure Modes
- **Handler exception crashes terminate()**: An uncaught exception in a handler propagates through `terminate()` — if the framework doesn't catch it, the process crashes (though response is already sent).
- **Handler infinite loop**: A handler that triggers another slow request (e.g., logging via an API call that is itself slow) can create infinite recursion if the handler's request is also monitored.
- **Memory exhaustion in handlers**: Handlers that allocate large amounts of data (e.g., dumping full request objects to Slack) can exhaust PHP memory in the post-response phase.
- **microtime drift**: On VMs with clock skew between CPU cores, `microtime(true)` at handle start vs terminate end can produce negative durations or nonsensical values.

## Ecosystem Usage
- **First-party packages**: Laravel Pulse uses duration handlers internally to track request performance metrics. Horizon could use it for monitoring long-running queue jobs.
- **Third-party packages**: Performance monitoring packages (Scout APM, New Relic, DataDog) could use duration handlers as a lightweight alternative to full-instrumentation agents.
- **Application code**: Most common in-house usage is slow-request logging, alerting (PagerDuty/Slack for requests >10s), and performance regression detection in staging environments.

## Related Knowledge Units

### Prerequisites
- **HTTP Kernel Internals** — understanding the `handle()` → `terminate()` lifecycle where handlers execute
- **Console Kernel Internals** — the console kernel's equivalent lifecycle for CLI command duration monitoring
- **PHP microtime() Precision** — platform-aware timing for reliable threshold measurement

### Related Topics
- **Middleware Terminable Interface** — how `TerminableMiddleware` also runs in the terminate phase
- **Laravel Pulse** — first-party package using duration handlers for performance metrics
- **Performance Monitoring** — broader observability strategies including logging, APM integration, and profiling

### Advanced Follow-up Topics
- **Custom Lifecycle Hooks** — extending the kernel with additional pre/post processing hooks
- **Kernel Extension Patterns** — decorating or extending kernel behavior for cross-cutting concerns
- **Long-Request Debugging Strategies** — diagnosing and resolving performance bottlenecks identified by handlers

## Research Notes
* **Source Analysis:** The feature was introduced in Laravel 11.x. The implementation is compact — approximately 30 lines across `src/Illuminate/Foundation/Http/Kernel.php` and `src/Illuminate/Foundation/Console/Kernel.php`. The `$lifecycleRequestDurationHandlers` property and `whenRequestLifecycleIsLongerThan()` method are the entire API surface.
* **Key Insight:** Duration handlers leverage the existing `terminate()` method rather than adding a new hook point. This is architecturally elegant — no new middleware interface, no events, no pipeline modification. Just threshold checks in the existing termination flow.
* **Version-Specific Notes:** Laravel 12 extended duration handlers to include `$response` as a third parameter (originally only `$request` and `$duration`). Laravel 13 added async handler execution option — handlers can return a Closure (for post-response execution) or be marked as `shouldRunAsync()` for true background processing in Swoole/ReactPHP environments.
