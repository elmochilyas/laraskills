# Request Duration Lifecycle Handlers — Rules

## Rule Name
Always wrap handler logic in try-catch blocks.
---
## Category
Reliability
---
## Rule
Wrap every request duration lifecycle handler's callback body in a `try-catch` block. Never let exceptions propagate from handler callbacks.
---
## Reason
Duration handlers execute in the `terminate()` phase, after the response is already sent to the client. An uncaught exception propagates through `terminate()` and may crash the PHP process. The user sees no error — the failure is invisible.
---
## Bad Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    Slack::send("Slow request: {$duration}ms"); // May throw on network failure
});
```
---
## Good Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    try {
        Slack::send("Slow request: {$duration}ms");
    } catch (\Throwable $e) {
        Log::error('Duration handler failed', [
            'error' => $e->getMessage(),
            'duration' => $duration,
        ]);
    }
});
```
---
## Exceptions
No common exceptions. The post-response phase has no error recovery mechanism — every handler must be self-protecting.
---
## Consequences Of Violation
Silent process crash after response is sent, subsequent requests may fail, monitoring gaps — slow requests that triggered the handler are not recorded, difficult to diagnose as errors are invisible to clients.

---

## Rule Name
Register duration handlers in the `boot()` method, not `register()`.
---
## Category
Architecture
---
## Rule
Always register request duration lifecycle handlers inside a service provider's `boot()` method. Never attempt registration in `register()`.
---
## Reason
The kernel contract is resolved from the container. During `register()`, the kernel may not be fully bound or the bootstrapper sequence may not have completed. The `boot()` method guarantees all services are registered and the kernel is available.
---
## Bad Example
```php
public function register(): void
{
    $kernel = $this->app->make(Kernel::class); // May fail — kernel not ready
    $kernel->whenRequestLifecycleIsLongerThan(1000, fn() => ...);
}
```
---
## Good Example
```php
public function boot(): void
{
    $kernel = $this->app->make(Kernel::class);
    $kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
        // ...
    });
}
```
---
## Exceptions
If registering in `bootstrap/app.php` (Laravel 11+), the ApplicationBuilder handles kernel resolution automatically and registration works outside the provider boot order.
---
## Consequences Of Violation
Handler is silently never registered, monitoring does not fire — slow requests go undetected, no error is thrown if the kernel is resolvable but the handler is ignored.

---

## Rule Name
Use multiple thresholds for graduated severity levels instead of a single threshold.
---
## Category
Observability
---
## Rule
Register at least two duration thresholds — one for warning-level logging (e.g., 500ms) and one for critical alerting (e.g., 5000ms). Never rely on a single threshold for all monitoring purposes.
---
## Reason
A single threshold provides no severity gradient. Low thresholds generate noise from acceptable variation. High thresholds miss emerging problems. Multiple thresholds enable graduated awareness — minor slowdowns logged, critical failures alerted.
---
## Bad Example
```php
// Single threshold — what does 2000ms mean?
$kernel->whenRequestLifecycleIsLongerThan(2000, function ($request, $response, $duration) {
    Log::warning("Slow request: {$duration}ms");
});
```
---
## Good Example
```php
// Graduated thresholds
$kernel->whenRequestLifecycleIsLongerThan(500, function ($request, $response, $duration) {
    Log::channel('slow')->info("Slow request: {$duration}ms", [
        'url' => $request->fullUrl(),
    ]);
});

$kernel->whenRequestLifecycleIsLongerThan(2000, function ($request, $response, $duration) {
    Log::channel('slow')->warning("Very slow request: {$duration}ms");
});

$kernel->whenRequestLifecycleIsLongerThan(5000, function ($request, $response, $duration) {
    Alert::critical("Request exceeded critical threshold: {$duration}ms");
});
```
---
## Exceptions
In staging or development, a single low threshold (e.g., 0ms, triggers on every request) is useful for calibration and testing.
---
## Consequences Of Violation
Alert fatigue from too many notifications, missed critical outliers in log noise, inability to distinguish between gradual degradation and acute failures.

---

## Rule Name
Calibrate thresholds from real traffic data — start high, lower incrementally.
---
## Category
Performance
---
## Rule
Begin with a conservative threshold of 2000ms when first enabling duration handlers. Monitor for one week, analyze the distribution, then adjust downward in 500ms increments. Never set thresholds below 100ms without platform precision verification.
---
## Reason
Setting thresholds too low generates noise that desensitizes the team. Setting thresholds too high misses actionable problems. Real traffic data reveals the natural latency distribution of your application, which varies by endpoint, user geography, and infrastructure.
---
## Bad Example
```php
// Arbitrary threshold — 300ms with no data to support it
$kernel->whenRequestLifecycleIsLongerThan(300, function ($request, $response, $duration) {
    // Generates thousands of alerts on first day
});
```
---
## Good Example
```php
// Week 1: 2000ms threshold — surfaces genuine outliers
// Week 2: analyze, drop to 1500ms
// Week 3: analyze, drop to 1000ms
// Final calibrated threshold
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    // Actionable alerts — real outliers only
});
```
---
## Exceptions
Applications with known strict SLAs (e.g., <200ms p99) may start lower, but still base thresholds on measured data, not assumptions.
---
## Consequences Of Violation
Alert fatigue from noisy low thresholds, team ignores monitoring entirely, genuine slow requests drowned in noise, or conversely, critical regressions missed entirely.

---

## Rule Name
Do not log full request or response objects in duration handlers.
---
## Category
Security
---
## Rule
Selectively extract only the fields needed for diagnostics from the request and response objects. Never pass the full objects to logging, storage, or external services.
---
## Reason
Duration handlers receive the complete `Request` and `Response` objects. The request object contains potentially sensitive data: authorization headers, cookies, user input (passwords, tokens, PII). Dumping full objects risks exposing this data in logs or external monitoring systems.
---
## Bad Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    Log::warning('Slow request', [
        'request' => $request->all(),    // Exposes passwords, tokens, PII
        'headers' => $request->headers->all(), // Exposes auth tokens
        'duration' => $duration,
    ]);
});
```
---
## Good Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    Log::warning('Slow request', [
        'url' => $request->fullUrl(),
        'method' => $request->method(),
        'status' => $response->status(),
        'duration' => $duration,
        'size' => $response->headers->get('content-length'),
    ]);
});
```
---
## Exceptions
Local development environments where full request logging aids debugging. Never apply this exception to any shared, staging, or production environment.
---
## Consequences Of Violation
Exposure of user credentials in log aggregation systems, PII leakage violating GDPR/CCPA compliance, auth tokens captured in monitoring dashboards, security audit findings.

---

## Rule Name
Guard against handler recursion when handlers trigger their own requests.
---
## Category
Reliability
---
## Rule
Ensure that duration handler logic — especially HTTP calls or queued job dispatch — does not itself trigger a new request that could exceed the same duration threshold. Always implement recursion guards.
---
## Reason
A handler that logs to an external monitoring API via HTTP creates a new request through the application. If that request also exceeds the threshold, it triggers the handler again, leading to infinite recursion until resource exhaustion or stack overflow.
---
## Bad Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    // HTTP call to monitoring API — itself a new request
    Http::post('https://monitor.internal/alert', [
        'duration' => $duration,
        'url' => $request->fullUrl(),
    ]);
    // If monitoring API is slow, triggers itself recursively
});
```
---
## Good Example
```php
$kernel->whenRequestLifecycleIsLongerThan(1000, function ($request, $response, $duration) {
    // Write to local log — no HTTP call
    Log::channel('slow')->warning('Slow request', [
        'duration' => $duration,
        'url' => $request->fullUrl(),
    ]);

    // If external alerting is needed, use queue (async, separate process)
    if ($duration > 5000) {
        AlertSlowRequest::dispatch($request->fullUrl(), $duration);
    }
});
```
---
## Exceptions
If the external monitoring endpoint explicitly excluded from monitoring (e.g., via a path-based middleware filter), HTTP calls to it are safe from recursion. Document this exclusion clearly.
---
## Consequences Of Violation
Infinite recursive handler invocations, process crash from stack overflow or memory exhaustion, cascading failure across monitoring infrastructure, dropped legitimate monitoring events.
