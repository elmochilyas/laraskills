# Request Duration Lifecycle Handlers

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Kernel Architecture
- **Last Updated:** 2026-06-02

## Overview
Request Duration Lifecycle Handlers are threshold-based callbacks that fire when a request's execution time exceeds a specified duration. Introduced in Laravel 11, they enable passive performance monitoring without external profiling tools. Handlers run in the terminate phase — after the response is sent — making monitoring overhead invisible to the client. They are ideal for logging slow requests, triggering alerts, or gathering diagnostic data.

## Core Concepts
- **Threshold-Based Execution**: Each handler is tied to a time threshold in milliseconds. When total request duration exceeds the threshold at termination, the handler fires.
- **Terminate-Phase Execution**: Handlers run in `terminate()` — after response is sent. Monitoring overhead doesn't affect user-facing response time.
- **Kernel Registration**: Registered via `$kernel->whenRequestLifecycleIsLongerThan(int $threshold, callable $handler)`.
- **Duration Measurement**: Calculated from kernel `handle()` start to `terminate()` start, excluding response transmission.
- **Handler Signature**: `function ($request, $response, int $duration) { ... }` — receives the request, response, and measured duration in milliseconds.

## When To Use
- **Slow request logging**: Log requests exceeding a performance threshold to a dedicated log channel.
- **Performance alerting**: Trigger PagerDuty/Slack alerts for requests exceeding critical thresholds.
- **Diagnostic data gathering**: Capture slow request context for offline analysis.
- **Console command monitoring**: Monitor long-running scheduled tasks or queue workers.
- **Performance regression detection**: Compare duration distributions across deployments in staging.

## When NOT To Use
- **Response modifications**: Handlers cannot modify the response or short-circuit the request.
- **Request blocking**: Handler logic must not block the user experience — runs post-response.
- **High-frequency critical path**: For per-request timing that must affect the response, use middleware instead.
- **Real-time alerting for fast requests**: Handlers only run when threshold is exceeded — zero overhead for fast requests.

## Best Practices (WHY)
- **Wrap handler logic in try-catch**: An uncaught exception in a handler can crash the terminate phase. *Why: The response is already sent — errors in terminate() are invisible to users but can crash the process.*
- **Keep handlers lightweight**: Heavy operations (database writes, HTTP calls) in handlers still consume server resources. *Why: The PHP process remains occupied during terminate; heavy handlers block the next request in PHP-FPM or delay sandbox creation in Octane.*
- **Use multiple thresholds for severity tiers**: 500ms → warning log, 2000ms → critical alert, 5000ms → page Slack channel. *Why: Different thresholds give graduated awareness — minor slowdowns vs critical failures.*
- **Start with high thresholds**: Begin at 2000ms, monitor results, then lower incrementally. *Why: Setting thresholds too low generates noise; too high misses issues. Calibrate based on real traffic patterns.*

## Architecture Guidelines
- **Terminate-Phase over Events**: Using threshold arrays rather than dispatching lifecycle events avoids event system overhead for every request. Only requests that exceed thresholds trigger work.
- **Both Kernels**: Exists in HTTP and Console kernels. Console commands can also be monitored.
- **No Default Handlers**: Laravel ships with no default handlers — zero overhead for apps that don't need monitoring.
- **Simple Registration API**: Single `whenRequestLifecycleIsLongerThan()` method is the entire API surface.

## Performance
- **microtime(true) overhead**: Call once per request in `handle()` — approximately 0.001ms, effectively zero.
- **Duration calculation**: Single subtraction and multiplication at terminate() — negligible cost.
- **Threshold iteration**: O(n) where n = number of registered handlers. With 3-5 handlers, this is microseconds.
- **Handler callback cost**: Handler itself may do expensive work. Since it runs post-response, it won't slow the client, but can consume server resources under high concurrency.
- **No memory overhead**: Handlers are registered once per kernel instance — no accumulation between requests.

## Security
- **Handler exception crashes terminate()**: Uncaught exception propagates through terminate() — process may crash (though response already sent).
- **Handler infinite loop risk**: A handler that triggers another slow request (e.g., logging via API call that's itself slow) can create infinite recursion.
- **Data exposure in handlers**: Handlers receive the full request and response objects — ensure logging doesn't expose sensitive data.

## Common Mistakes

| Description | Cause | Consequence | Better Approach |
|---|---|---|---|
| Throwing exceptions in handlers | Not wrapping handler logic | Crashes terminate phase | Always wrap in try-catch |
| Heavy work in handlers | Placing expensive operations (DB writes, HTTP calls) | Blocks PHP process; reduces throughput | Use queues for heavy post-response work |
| Registering in wrong location | Attempting to register in `register()` method before kernel resolved | Handler not registered | Register in `boot()` or `bootstrap/app.php` |
| Assuming millisecond precision | `microtime()` precision varies across platforms | On some Windows configs, precision is ~15ms | Don't set thresholds below 50ms |
| Treating handler as middleware | Trying to modify response in handler | Handler cannot modify response — purely observational | Use middleware for response modifications |

## Anti-Patterns
- **Single global threshold**: Using only one threshold (e.g., 1000ms) for all monitoring. Loss of granularity — can't distinguish warning vs critical.
- **Handler that triggers another monitored request**: Creating infinite recursion where handler's HTTP call is itself slow and triggers another handler invocation.
- **Logging full request objects in handlers**: Dumping entire request/response objects to logs — exposing sensitive data (passwords, tokens, PII).
- **Disabling handlers in production**: Removing or commenting out handlers because they produce too much noise. Tune thresholds instead.

## Examples

```php
// Registration in AppServiceProvider::boot()
public function boot(): void
{
    $kernel = $this->app->make(\Illuminate\Contracts\Http\Kernel::class);
    
    // Warning level: log requests > 500ms
    $kernel->whenRequestLifecycleIsLongerThan(500, function ($request, $response, $duration) {
        Log::channel('slow')->warning('Slow request', [
            'duration' => $duration,
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'user' => $request->user()?->id,
        ]);
    });
    
    // Critical level: alert for requests > 5000ms
    $kernel->whenRequestLifecycleIsLongerThan(5000, function ($request, $response, $duration) {
        try {
            Slack::send("Critical: Request took {$duration}ms: {$request->fullUrl()}");
        } catch (\Throwable $e) {
            Log::error('Alerting failed', ['error' => $e->getMessage()]);
        }
    });
}
```

## Related Topics
- **HTTP Kernel Internals**: The `handle()` → `terminate()` lifecycle where handlers execute.
- **Console Kernel Internals**: Console kernel's equivalent lifecycle for CLI command duration monitoring.
- **Middleware Terminable Interface**: How `TerminableMiddleware` also runs in the terminate phase.
- **Laravel Pulse**: First-party package using duration handlers for performance metrics.
- **PHP microtime() Precision**: Platform-aware timing for reliable threshold measurement.

## AI Agent Notes
- Introduced in Laravel 11.x. Implementation is compact — ~30 lines across HTTP and Console Kernel files.
- The `$lifecycleRequestDurationHandlers` property and `whenRequestLifecycleIsLongerThan()` method are the entire API surface.
- Duration handlers leverage the existing `terminate()` method rather than adding a new hook point — no new middleware interface, no events, no pipeline modification.
- Laravel 12 extended handlers to include `$response` as a parameter. Laravel 13 added async handler execution option.

## Verification
- [ ] Register a duration handler with `->whenRequestLifecycleIsLongerThan(0, ...)` (triggers on every request)
- [ ] Verify handler fires after response is sent
- [ ] Measure the difference between microtime at handle start and terminate
- [ ] Test with both HTTP and Console kernels
- [ ] Verify exception in handler doesn't crash the main request
- [ ] Check that handler cannot modify the response
