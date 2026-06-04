# Terminable Middleware

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Terminable Middleware
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Terminable middleware extends the standard middleware lifecycle with a `terminate()` method that executes after the HTTP response has been sent to the client. This enables post-response processing — logging, metrics recording, cleanup tasks — without delaying the response delivery.

The engineering significance of terminable middleware is that it provides the only framework-native mechanism for deferred execution after the response is sent. Unlike queue jobs dispatched via `dispatch()->afterResponse()`, terminable middleware runs in the same process and can access the completed request and response objects. Unlike `register_shutdown_function()`, terminable middleware is integrated into Laravel's middleware pipeline and respects middleware ordering. However, terminable middleware has critical constraints: a NEW instance is resolved for `terminate()` unless the middleware is registered as a singleton, and `terminate()` may not fire in all server configurations (RoadRunner, some Swoole setups).

---

## Core Concepts

### The terminate() Contract
A terminable middleware implements an additional method alongside `handle()`:

```php
class RequestLogger
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        // Runs AFTER response is sent to the client
        Log::info('Request completed', [
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
        ]);
    }
}
```

### When terminate() Fires
The execution order is:
1. `Kernel::handle()` returns the response.
2. `$response->send()` sends the response to the client.
3. `Kernel::terminate()` iterates through middleware and calls `terminate()` on those that implement it.

This means terminate() is called AFTER the client has received the response. The client cannot be affected by anything in terminate().

### New Instance for terminate()
By default, `terminate()` is called on a NEW instance of the middleware, NOT the same instance that handled the request. The `Kernel::terminate()` method resolves fresh middleware instances from the container:

```php
// In Kernel::terminate()
foreach ($middlewares as $middleware) {
    if (method_exists($middleware, 'terminate')) {
        $this->app->call([$middleware, 'terminate'], [$request, $response]);
    }
}
```

`$this->app->call()` resolves the middleware class from the container. This creates a new instance — any state stored on `$this` during `handle()` is lost.

---

## Mental Models

### Cleanup Crew
The middleware's `handle()` is the main event — it processes the request and produces the response. The `terminate()` is the cleanup crew that arrives after the guests have left. The cleanup crew does not interact with the guests (the client). It does not need to know what happened during the main event — it just cleans up.

### Postcard After the Trip
Sending a postcard after a trip. The trip (request handling) is over, the traveler is home (response sent), and the postcard (logging, metrics) is sent separately. The postcard does not affect the trip. If the postcard is lost (terminate not called), the trip still happened.

### The Singleton Problem
Imagine a receptionist who greets every visitor and writes a thank-you note after they leave. If the receptionist is a singleton, they remember the first visitor's name when writing the second visitor's note. This is the terminable middleware singleton problem — without singleton binding, the note writer (terminate) does not know the visitor's name because it is a different person.

---

## Internal Mechanics

### Kernel::terminate() Execution
The `Kernel::terminate()` method gathers middleware from both the global array and the route-specific pipeline and calls `terminate()` on each:

```php
public function terminate($request, $response)
{
    $middlewares = $this->app->shouldSkipMiddleware() ? [] : array_merge(
        $this->gatherRouteMiddleware($request),
        $this->middleware
    );

    foreach ($middlewares as $middleware) {
        if (! method_exists($middleware, 'terminate')) {
            continue;
        }
        $this->app->call([$middleware, 'terminate'], [$request, $response]);
    }
}
```

Key observations:
1. Both global and route middleware are checked for `terminate()`.
2. Middleware that short-circuited (never called `$next`) still has `terminate()` called.
3. The order is: route middleware first, then global middleware (same order as the pipeline).

### Instance Separation Between handle() and terminate()
Because `terminate()` is called via `$this->app->call()`, the container resolves a fresh instance. The `handle()` instance and the `terminate()` instance are different objects.

To share state between the two, register the middleware as a singleton:

```php
// In AppServiceProvider::register()
$this->app->singleton(RequestLogger::class);
```

With singleton binding, the same instance is reused for both `handle()` and `terminate()`. State set on `$this` in `handle()` is available in `terminate()`.

### terminate() Response State
The `$response` object passed to `terminate()` is the response OBJECT after sending. Some response types (streamed responses, file downloads) may have been consumed by the send process. The response's status code and headers are available, but the content body may have been sent to output and may not be re-readable.

---

## Patterns

### Request Logging Pattern
Log request details after the response is sent:

```php
class RequestLogMiddleware
{
    private array $startTimes = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTimes[spl_object_id($request)] = microtime(true);
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $duration = (microtime(true) - ($this->startTimes[spl_object_id($request)] ?? microtime(true))) * 1000;
        Log::channel('request')->info('Request', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration_ms' => round($duration, 2),
        ]);
    }
}
```

- **Purpose**: Record request metrics after response is sent.
- **Benefits**: Logging does not affect response time.
- **Tradeoffs**: Requires singleton registration for timing data.

### Performance Metrics Pattern
Record performance data to external monitoring:

```php
class PerformanceMiddleware
{
    private array $timers = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->timers[spl_object_id($request)] = [
            'start' => defined('LARAVEL_START') ? LARAVEL_START : microtime(true),
            'method' => $request->method(),
            'url' => $request->fullUrl(),
        ];
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $timer = $this->timers[spl_object_id($request)] ?? null;
        if (! $timer) {
            return;
        }
        
        StatsD::timing('app.request.duration', (microtime(true) - $timer['start']) * 1000);
        StatsD::increment('app.request.count', 1, [
            'method' => $timer['method'],
            'status' => $response->getStatusCode(),
        ]);
    }
}
```

- **Purpose**: Send metrics without adding latency to the response.
- **Benefits**: Response timing includes the full lifecycle.
- **Tradeoffs**: If the metrics system is down, terminate() delays the next request (if synchronous).

### Cleanup Task Pattern
Perform cleanup after the response is sent:

```php
class CleanupTempFilesMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        if ($request->session()->has('temp_files')) {
            foreach ($request->session()->pull('temp_files') as $path) {
                @unlink(storage_path("app/temp/{$path}"));
            }
        }
    }
}
```

- **Purpose**: Delete temporary resources after the response is sent.
- **Benefits**: Cleanup does not delay the response.
- **Tradeoffs**: Temporary files may persist if terminate() does not fire (server error, process kill).

---

## Architectural Decisions

### Terminable Middleware vs dispatch()->afterResponse()
Both defer execution after the response, but differ in important ways:

| Aspect | Terminable Middleware | dispatch()->afterResponse() |
|--------|---------------------|---------------------------|
| Execution environment | Same process, same request | Queue worker, separate process |
| Access to Request/Response | Full access | Request only (if serialized) |
| Execution guarantee | May not fire (server config) | Queue ensures eventual execution |
| Delay to response | Zero (after send) | Zero (after response) |
| Failure impact | Delays next request (same process) | Isolated in queue worker |
| Scalability | Blocks the web process | Offloaded to queue workers |

Choose terminable middleware for:
- Tasks that need the Response object (metrics with status code, response size).
- Tasks that MUST complete before the next request (resource cleanup).
- Tasks with low latency requirements (fast logging, simple metrics).

Choose `dispatch()->afterResponse()` for:
- Heavy processing that should not block the web process.
- Tasks that need guaranteed execution (queue retries).
- Tasks that do not need the Response object.

### Singleton vs Non-Singleton
When to register terminable middleware as a singleton:

| Scenario | Singleton? | Reason |
|----------|-----------|--------|
| No state to share | No | handle() and terminate() are independent |
| Timing data needed | Yes | handle() stores start time for terminate() |
| Metrics counters | Yes | handle() increments counters for terminate() |
| Stateless logging | No | terminate() reads request directly |
| Octane environment | Depends | Singletons persist across requests — risk of data leakage |

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Post-response execution without delaying client | New instance for terminate() by default — handle() state lost | Register as singleton if state sharing is needed |
| Full access to Request and Response after send | Response content may be consumed (streaming) | Terminate before accessing content for streamed responses |
| Integrated into middleware pipeline | terminate() may not fire in all server configurations | Do not rely on terminate() for critical operations (use queue instead) |
| Works with route-cached middleware | Global middleware terminate() order differs from route middleware | Test termination order explicitly |

---

## Performance Considerations

### Blocking in terminate()
If `terminate()` performs synchronous I/O (database query, HTTP call, file write), it blocks the web process. In PHP-FPM, this delays the process from handling the next request. For heavy termination tasks, dispatch to a queue instead of using synchronous I/O.

### Memory in terminate()
The request and response objects are still in memory during `terminate()`. If the request uploaded large files or loaded many models, that memory is not freed until `terminate()` completes. Long-running terminate() methods increase peak memory usage.

### Octane Performance
In Octane (Swoole/RoadRunner), terminate() runs in the same process as the request handler. If terminate() blocks, it blocks the entire worker from handling concurrent requests. Octane recommends using event listeners instead of terminable middleware for post-response processing.

---

## Production Considerations

### Singleton Registration
If the middleware stores per-request data on `$this`, it MUST be registered as a singleton:

```php
// AppServiceProvider::register()
$this->app->singleton(RequestLogMiddleware::class);
```

Without singleton registration, `terminate()` gets a fresh instance with no access to data stored during `handle()`. This is the most common bug in terminable middleware.

### Testing Terminable Middleware
Test terminable middleware by calling `terminate()` directly on the resolved instance:

```php
public function test_it_logs_request_after_termination(): void
{
    $middleware = $this->app->make(RequestLogMiddleware::class);
    
    $request = Request::create('/test', 'GET');
    $response = response('OK');
    
    $middleware->terminate($request, $response);
    
    // Assert log was written
    Log::shouldHaveReceived('info')->withArgs(fn ($message) => 
        str_contains($message, 'Request completed')
    );
}
```

### Non-Terminable Server Configurations
In some server configurations, `terminate()` does not fire:
- **PHP-FPM**: Always fires (after response, before process recycles).
- **RoadRunner**: Does not fire by default (must be configured).
- **Swoole**: Fires if configured; may not fire for all event types.
- **FrankenPHP**: Similar to Swoole.

If termination is critical, use a queue job as a fallback.

---

## Common Mistakes

### Not Registering as Singleton for Shared State
A terminable middleware stores a start time in `handle()` and reads it in `terminate()`. Without singleton registration, the start time is always null because `terminate()` runs on a fresh instance.

### Heavy Processing in terminate()
A terminable middleware sends five API requests, writes to three databases, and processes a file. This blocks the web process until all work completes. The next request in the PHP-FPM pool cannot start until this middleware finishes. Delegate heavy work to a queue.

### Relying on terminate() for Critical Operations
If a server crashes before `terminate()` fires, the termination logic never runs. Log entries, cleanup tasks, and metrics are lost. For critical operations (payment processing, data deletion), use a queue with retries instead of terminable middleware.

### Using terminate() in Console Kernel
The console kernel does not call `terminate()`. Middleware with termination logic only fires during HTTP requests through `Kernel::terminate()`.

---

## Failure Modes

### Memory Leak in Singleton Terminable Middleware
A singleton terminable middleware that appends data to an array property on each request leaks memory across requests:

```php
class LogCollector
{
    private array $logs = []; // Grows with every request — NEVER CLEARED

    public function terminate(Request $request, Response $response): void
    {
        $this->logs[] = ['url' => $request->url(), 'time' => now()];
        // $this->logs keeps growing — memory leak
    }
}
```

In Octane, this array grows unbounded until the worker runs out of memory.

### terminate() Fatal Error Silencing
If `terminate()` throws an uncaught exception, the exception is silenced in some configurations. The error log shows the exception, but the response was already sent — the client sees a successful response while the server failed. Monitor termination errors separately from response errors.

### Race Condition in Concurrent Requests
A singleton terminable middleware that uses instance properties for per-request state is vulnerable to race conditions when multiple requests are handled concurrently (Swoole concurrent processing). Use `spl_object_id($request)` as a key for per-request data to avoid collisions.

---

## Ecosystem Usage

### Laravel Framework
The framework defines `terminate()` on several middleware internally. The `Kernel::terminate()` method iterates all middleware and calls `terminate()` on those that implement it. The framework's own middleware rarely uses `terminate()` — most post-response concerns are handled via events or queue.

### Laravel Horizon
Horizon does not use terminable middleware. It uses its own event system and queue workers for post-response processing.

### Spatie Packages
Spatie's packages generally avoid terminable middleware. They prefer event listeners or queue jobs for post-response processing, which are more reliable across server configurations.

### Third-Party Observability Packages
Observability packages (performance monitoring, request tracing) commonly use terminable middleware to record metrics after the response. These packages register as singletons to maintain timing state across the handle/terminate boundary.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — the Pipeline pattern and handle() contract
- Middleware Lifecycle — the complete request flow including the terminate phase
- Service Container — singleton vs non-singleton binding and its effect on middleware

### Related Topics
- Custom Middleware — creating middleware that implements terminate()
- Cross-Cutting Concerns — deciding whether a concern should use terminable middleware or queue

### Advanced Follow-up Topics
- Octane Architecture — how terminable middleware behaves in long-lived processes
- Queue Workers — dispatch()->afterResponse() as an alternative to terminable middleware

---

## Research Notes

- The new-instance-for-terminate behavior is documented but not emphasized. Most production middleware bugs related to terminable middleware stem from this design choice. The rationale is performance — resolving a new instance avoids the overhead of reusing instances for middleware that do not need `terminate()`.
- The singleton solution (registering as singleton to share state) has its own risks in Octane, where singletons persist across requests. The safest pattern for Octane is to avoid terminable middleware entirely and use event listeners or queue jobs.
- `Kernel::terminate()` checks for `method_exists($middleware, 'terminate')` on each middleware class. This is a string method check — the middleware class does not need to implement an interface or extend a base class. Any class with a `terminate()` method is eligible.
- `terminate()` was introduced in Laravel 4.2 and remains unchanged in behavior through Laravel 13. The method signature has not changed. The only evolution has been in how middleware is registered (affecting which middleware `terminate()` is called on).