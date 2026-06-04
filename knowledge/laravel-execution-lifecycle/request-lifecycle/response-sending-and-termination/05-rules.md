# Response Sending and Termination Rules

## Rule: Offload Heavy I/O From Termination To Queue
---
## Category
Performance
---
## Rule
Move any I/O operation exceeding 5ms (database queries, API calls, filesystem writes) out of `$kernel->terminate()` and into a queued job dispatched via `dispatch()->afterResponse()`.
---
## Reason
In FPM, `fastcgi_finish_request()` closes the HTTP connection but the PHP process remains blocked until all termination handlers complete. Heavy I/O in termination reduces the number of concurrent requests a fixed pool of FPM workers can handle. A 200ms database query in termination reduces throughput by the same amount as a 200ms database query in the controller.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // 200ms API call blocks the FPM worker — reduces concurrent capacity
    Http::post('https://analytics.example.com/track', [
        'uri' => $request->getUri(),
    ]);
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Dispatched to queue after response — FPM worker is freed immediately
    TrackPageView::dispatch($request->getUri())->afterResponse();
}
```
---
## Exceptions
Operations that must complete before the kernel can handle the next request (e.g., Octane state reset, mutex release) must remain synchronous in termination.
---
## Consequences Of Violation
Reduced FPM worker capacity, request queueing under load, increased P99 latency, excessive server provisioning costs.

---

## Rule: Keep Termination Under 5ms Total
---
## Category
Performance
---
## Rule
Limit `$kernel->terminate()` execution to under 5ms total across all terminable middleware, app callbacks, and event listeners.
---
## Reason
Termination is synchronous in process time even though the HTTP connection is closed. Under Octane, termination runs *before* the next request on the same worker — every millisecond in termination directly reduces request throughput. Under FPM, the process is unavailable for new requests until termination completes.
---
## Bad Example
```php
// 3 terminable middleware, each doing 3ms work = 9ms total termination
// Under Octane: 9ms blocked before next request
// Under FPM: worker unavailable for 9ms of every request
class ThreeTerminableMiddleware
{
    public function handle($request, $next) { return $next($request); }
    public function terminate($request, $response): void
    {
        usleep(3000); // 3ms
    }
}
```
---
## Good Example
```php
// 3 terminable middleware, each doing 1ms work = 3ms total termination
class OptimizedTerminableMiddleware
{
    public function handle($request, $next) { return $next($request); }
    public function terminate($request, $response): void
    {
        usleep(1000); // 1ms — acceptable under 5ms total budget
    }
}
```
---
## Exceptions
Applications with generous FPM worker pools or Octane workers may tolerate higher termination times, but 5ms is a safe upper bound for general-purpose applications.
---
## Consequences Of Violation
Reduced throughput under load (both FPM and Octane), worker starvation during traffic spikes, higher P99 latency, increased infrastructure costs.

---

## Rule: Wrap Terminate Body In Try/Catch
---
## Category
Reliability
---
## Rule
Always wrap the body of `terminate()` methods and `Terminating` event listeners in try/catch blocks; log and swallow exceptions.
---
## Reason
Exceptions thrown in `$kernel->terminate()` are not caught by the kernel's exception handler (the try/catch in `handle()` only covers `sendRequestThroughRouter()`). An uncaught exception in termination crashes the process or worker, leaving state cleanup incomplete and potentially corrupting subsequent requests.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // An exception here crashes the worker
    $this->logger->info('Request completed', [
        'uri' => $request->getUri(),
    ]);
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    try {
        $this->logger->info('Request completed', [
            'uri' => $request->getUri(),
        ]);
    } catch (\Throwable $e) {
        // Log and swallow — termination exceptions must never propagate
        Log::error('Termination failed', ['error' => $e->getMessage()]);
    }
}
```
---
## Exceptions
No common exceptions. Termination exceptions must always be caught to prevent process crashes.
---
## Consequences Of Violation
Crashing FPM workers, Octane worker loss, incomplete state cleanup, memory leaks, data corruption from partially executed termination handlers.

---

## Rule: Use RequestHandled For Response Modification, Never Terminating
---
## Category
Architecture
---
## Rule
Modify the response (add headers, transform body, set cookies) in `RequestHandled` event listeners; never attempt modification in `Terminating` or terminable middleware.
---
## Reason
`RequestHandled` fires inside `Kernel::handle()` before `$response->send()`. `Terminating` fires in `$kernel->terminate()` after `$response->send()` and after `fastcgi_finish_request()`. Any modification in terminating code is silently ignored — headers have already been sent and the output stream is closed.
---
## Bad Example
```php
// Silently ignored — response already sent
Event::listen(Terminating::class, function ($event) {
    $event->response->headers->set('X-Debug', 'true');
});
```
---
## Good Example
```php
// Correct — fires before send, modification is applied
Event::listen(RequestHandled::class, function ($event) {
    $event->response->headers->set('X-Debug', 'true');
});
```
---
## Exceptions
No common exceptions. The termination phase is for cleanup and post-response logic only; the response object is read-only at that point.
---
## Consequences Of Violation
Response modifications silently not applied, debugging time wasted investigating why headers don't appear, incorrect assumption that code executes.

---

## Rule: Use Class-Based Middleware For Terminable Behavior
---
## Category
Reliability
---
## Rule
Implement terminable middleware as named classes with explicit `terminate($request, $response): void` methods; never use closures for middleware that needs termination.
---
## Reason
The kernel resolves terminable middleware by class-string to match the pipeline instance with the terminate instance. Closure-based middleware cannot be resolved by class-string — the kernel cannot find the closure instance to call `terminate()` on it, so terminable behavior silently never executes.
---
## Bad Example
```php
// Closure middleware — terminate() will never be called
$middleware->add(function ($request, $next) {
    return $next($request);
});
// There is no way to attach terminate behavior to this closure
```
---
## Good Example
```php
class TrackTermination
{
    public function handle($request, $next)
    {
        return $next($request);
    }
    
    public function terminate($request, $response): void
    {
        Log::info('Request terminated');
    }
}

// Registered by class-string — kernel can resolve and invoke terminate()
$middleware->add(TrackTermination::class);
```
---
## Exceptions
Middleware with no terminable behavior has no restriction — closures are fine for non-terminable middleware.
---
## Consequences Of Violation
Termination behavior silently skipped, post-response cleanup not executed, state not flushed, hard-to-detect bugs that only manifest under load or in Octane.

---

## Rule: Do Not Assume fastcgi_finish_request() Availability
---
## Category
Reliability
---
## Rule
Do not rely on `fastcgi_finish_request()` for application correctness; always test termination behavior in your actual deployment environment (FPM, Octane, RoadRunner, php -S).
---
## Reason
`fastcgi_finish_request()` is only available under PHP-FPM with the FastCGI protocol. It is not available in `php -S` (built-in server), CGI mode, phpdbg, or when PHP is embedded. Code that depends on early-connection-close for correctness (e.g., assuming response is sent before terminate runs) will fail in non-FPM environments.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Assumes fastcgi_finish_request() has been called and connection is closed
    // In php -S, connection remains open during termination
    // Race condition: browser may timeout waiting for connection to close
    sleep(5); // heavy processing
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Does not depend on connection state — termination is always synchronous
    Log::info('Request terminated');
    // Heavy work goes to queue
    ProcessJob::dispatch()->afterResponse();
}
```
---
## Exceptions
Time-critical termination that must complete before the next request may use `fastcgi_finish_request()` as an optimization, but must have a fallback path for non-FPM environments.
---
## Consequences Of Violation
Race conditions in development (php -S), broken termination in CLI commands, timeout errors in non-FPM deployments, different behavior between environments.

---

## Rule: Avoid Global State Modification In Termination Under Octane
---
## Category
Reliability
---
## Rule
Never modify global state (static properties, singleton instances, facades, service container bindings) inside `$kernel->terminate()` when running Octane.
---
## Reason
Under Octane, `terminate()` runs in the same worker process that will handle subsequent requests. Global state modified during termination carries over to the next request on the same worker, leaking data between users, corrupting service singletons, and causing non-deterministic behavior.
---
## Bad Example
```php
public function terminate($request, $response): void
{
    // Modifies global state — leaks to next request on same Octane worker
    Cache::set('last_user_id', auth()->id());
    app()->forgetInstance(Logger::class); // breaks logger for next request
    UserService::$counter++; // static mutation persists
}
```
---
## Good Example
```php
public function terminate($request, $response): void
{
    // Read-only telemetry — no state modification
    Log::info('Request terminated', ['duration' => ...]);
    // Queue-based side effects
    TrackVisit::dispatch()->afterResponse();
}
```
---
## Exceptions
Explicit Octane state flushing (resetting singletons to fresh state) is the intended use of termination in Octane and is correct — but it must reset *to default*, not to per-request state.
---
## Consequences Of Violation
Data leakage between requests on same Octane worker, user A sees user B's data, singleton corruption, non-deterministic behavior, difficult-to-reproduce bugs.

---

## Rule: Register Terminable Middleware As Singletons
---
## Category
Architecture
---
## Rule
Ensure terminable middleware classes are registered as singletons in the container when termination behavior is required.
---
## Reason
The kernel's `terminate()` method resolves each terminable middleware by class-string to call `terminate()`. If the middleware is not a singleton, the container creates a *new instance* for termination, which is a different object than the one that ran in the pipeline — it has none of the pipeline instance's state. The singleton contract ensures the same middleware instance is used for both pipeline and termination.
---
## Bad Example
```php
// Middleware registered without singleton — terminate gets a fresh instance
$this->app->bind(TrackTime::class); // new instance each resolution

class TrackTime
{
    private float $startTime;

    public function handle($request, $next)
    {
        $this->startTime = microtime(true); // set on pipeline instance
        return $next($request);
    }

    public function terminate($request, $response): void
    {
        $elapsed = microtime(true) - $this->startTime; // $startTime is null — fresh instance has no state
    }
}
```
---
## Good Example
```php
// Middleware registered as singleton — same instance for pipeline and terminate
$this->app->singleton(TrackTime::class);

class TrackTime
{
    private float $startTime;

    public function handle($request, $next)
    {
        $this->startTime = microtime(true);
        return $next($request);
    }

    public function terminate($request, $response): void
    {
        $elapsed = microtime(true) - $this->startTime; // correct — same instance
    }
}
```
---
## Exceptions
Terminable middleware that captures no instance state (no properties set in `handle()`) does not require singleton registration, though singleton is still recommended for consistency.
---
## Consequences Of Violation
Terminable middleware receives fresh instances with no pipeline state, `terminate()` methods silently read null/uninitialized properties, debugging confusion about missing termination behavior.

---

## Rule: Log Termination Exceptions Separately From Request Exceptions
---
## Category
Testing
---
## Rule
Use a dedicated log channel or distinct error message prefix for exceptions caught during `$kernel->terminate()`.
---
## Reason
Termination exceptions are caught, logged, and swallowed. Without a distinct prefix or channel, they are indistinguishable from request-phase exceptions in log aggregation tools. This masks patterns of failing termination handlers — a consistently crashing terminable middleware goes undetected because its errors blend into the general error stream.
---
## Bad Example
```php
try {
    $this->analytics->track($request->getUri());
} catch (\Throwable $e) {
    Log::error($e->getMessage()); // indistinguishable from request errors
}
```
---
## Good Example
```php
try {
    $this->analytics->track($request->getUri());
} catch (\Throwable $e) {
    Log::channel('termination')->error('[TERMINATE] Analytics tracking failed', [
        'error' => $e->getMessage(),
        'uri' => $request->getUri(),
    ]);
}
```
---
## Exceptions
Applications using structured logging with distinct event type fields (e.g., `"type": "termination"`) may omit the prefix as long as the type field is always present and queryable.
---
## Consequences Of Violation
Silent degradation of post-response processing, undetected terminable middleware failures, metrics inaccuracies from silent termination crashes, no alerting on termination failures.
