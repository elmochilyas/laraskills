# Phase 5: Rules — Terminable Middleware

---

## Rule Name

Register Terminable Middleware as Singleton When State Sharing Is Needed

---

## Category

Reliability

---

## Rule

When a terminable middleware stores data in `handle()` and reads it in `terminate()`, register the middleware class as a singleton in the container. Never assume the same instance is reused for both methods.

---

## Reason

By default, `Kernel::terminate()` resolves a fresh instance of each middleware via `$this->app->call()`. Any state stored on `$this` during `handle()` — start times, resolved data, accumulated metrics — is lost. The `terminate()` method receives a blank instance with no access to the handle-time state. This is the most common bug in terminable middleware, and it produces silent failures because `terminate()` exceptions are not surfaced in the HTTP response.

---

## Bad Example

```php
class RequestTimingMiddleware
{
    private float $startTime;

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTime = microtime(true); // Stored on instance
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        // $this->startTime is null — fresh instance!
        Log::info('Duration', ['ms' => (microtime(true) - $this->startTime) * 1000]);
    }
}
```

---

## Good Example

```php
class RequestTimingMiddleware
{
    private array $startTimes = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTimes[spl_object_id($request)] = microtime(true);
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $id = spl_object_id($request);
        $duration = (microtime(true) - ($this->startTimes[$id] ?? microtime(true))) * 1000;
        Log::info('Duration', ['ms' => round($duration, 2)]);
        unset($this->startTimes[$id]);
    }
}

// AppServiceProvider::register():
$this->app->singleton(RequestTimingMiddleware::class);
```

---

## Exceptions

Terminable middleware that does not need state sharing (reads all data from `$request` and `$response` parameters) does not require singleton registration.

---

## Consequences Of Violation

Reliability risks: state-dependent logic in `terminate()` silently fails with null values. Debugging difficulty: the failure is invisible because terminate exceptions are not shown in the response. Operational blindness: monitoring, logging, and cleanup silently stop working.

---

---

## Rule Name

Keep terminate() Lightweight — Never Perform Synchronous I/O

---

## Category

Performance

---

## Rule

Terminable middleware must complete in under 10ms. Never perform synchronous database queries, HTTP API calls, file writes, or other I/O operations in `terminate()`. For heavy processing, dispatch a queue job instead.

---

## Reason

`terminate()` runs in the same process after `$response->send()`. It blocks the web process from accepting the next request until it completes. In PHP-FPM, this delays the worker from handling the next request — a 500ms terminate() reduces throughput by 500ms per request. In Octane, blocking terminate() stalls the entire worker, preventing it from handling concurrent requests. Heavy processing in terminate() directly reduces application throughput.

---

## Bad Example

```php
class HeavyLogMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Synchronous API call — blocks the process
        $this->httpClient->post('https://analytics.example.com/events', [
            'json' => ['method' => $request->method(), 'status' => $response->getStatusCode()],
        ]);
    }
}
```

---

## Good Example

```php
class LightLogMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Lightweight: log to local file or in-memory buffer
        Log::channel('request')->info('Request', [
            'method' => $request->method(),
            'status' => $response->getStatusCode(),
        ]);
    }
}

// Heavy processing dispatched to queue
dispatch(new SendAnalyticsEvent($request, $response));
```

---

## Exceptions

Lightweight cache writes (Redis SET, Memcached set) are acceptable if they complete in under 1ms. Database INSERT of a single row is acceptable if the query is indexed and simple.

---

## Consequences Of Violation

Performance risks: web process blocked, reducing request throughput. Scalability risks: need more workers to compensate for blocked time. Octane risks: concurrent request handling is blocked by a single terminate call.

---

---

## Rule Name

Do Not Use Terminable Middleware for Critical Operations That Must Execute

---

## Category

Reliability

---

## Rule

Never use terminable middleware for operations that must execute for application correctness — financial recording, critical data persistence, or mandatory notifications. Use queue jobs with retries for operations that require guaranteed execution.

---

## Reason

`terminate()` has no execution guarantee. It may not fire in RoadRunner (disabled by default), some Swoole configurations, or the console kernel. It does not fire if the server crashes between `$response->send()` and `Kernel::terminate()`. It does not retry on failure. If an operation must execute for the application to function correctly, the operation must use a queue worker with retry logic that survives process crashes and server restarts.

---

## Bad Example

```php
class OrderConfirmationMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        DB::table('order_confirmations')->insert([
            'order_id' => $request->attributes->get('order_id'),
            'confirmed_at' => now(),
        ]);
        // If terminate() doesn't fire, order is never confirmed — critical data lost
    }
}
```

---

## Good Example

```php
class AnalyticsTrackingMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Non-critical: analytics — acceptable if occasionally lost
        Log::channel('analytics')->info('Order completed', [
            'order_id' => $request->attributes->get('order_id'),
        ]);
    }
}

// Critical operation uses queue with retries
dispatch(new ConfirmOrder($order))->onQueue('critical');
```

---

## Exceptions

No common exceptions. Any operation whose absence would cause data loss or business impact must use a queue with retries, not terminable middleware.

---

## Consequences Of Violation

Data integrity risks: critical data persistence fails silently. Financial risks: order confirmations, payment recordings, and audit trails are lost without recovery. Debugging difficulty: the failure is silent and may go unnoticed for days.

---

---

## Rule Name

Test terminate() Directly — Feature Tests Do Not Exercise terminate()

---

## Category

Testing

---

## Rule

Test terminable middleware by calling `$middleware->terminate($request, $response)` directly in unit tests. Never assume that HTTP feature tests exercise the termination path.

---

## Reason

HTTP feature tests send a request through the pipeline and assert on the response, but they do not call `Kernel::terminate()`. A terminable middleware that logs requests, records metrics, or cleans up resources is never exercised during feature tests. Developers who write only feature tests may believe their terminable middleware works when it has never actually executed in a test. Direct `terminate()` calls verify the termination logic in isolation.

---

## Bad Example

```php
// Feature test — terminate() is never called
public function test_request_is_logged(): void
{
    $response = $this->get('/api/data');
    $response->assertOk();
    // No assertion on logging — terminate() never ran in this test
}
```

---

## Good Example

```php
// Direct unit test — calls terminate explicitly
public function test_logs_request_information(): void
{
    Log::shouldReceive('info')->once();

    $middleware = $this->app->make(RequestLogMiddleware::class);
    $request = Request::create('/test', 'GET');
    $response = response('OK');

    $middleware->terminate($request, $response);
}

// Feature test validates pipeline integration only
public function test_middleware_is_registered(): void
{
    $response = $this->get('/api/data');
    $response->assertOk();
}
```

---

## Exceptions

Terminable middleware that is a pure no-op with no side effects requires no terminate-specific tests.

---

## Consequences Of Violation

Operational risks: logging, metrics, and cleanup silently stop working in production. Testing blind spot: terminable middleware is never exercised. Debugging difficulty: failures are only discovered by inspecting production logs.

---

---

## Rule Name

Prevent Memory Leaks in Singleton Terminable Middleware

---

## Category

Performance

---

## Rule

When terminable middleware is registered as a singleton and accumulates per-request data, ensure every `handle()` addition is matched by a `terminate()` cleanup. Never use unbounded arrays or collections that grow with each request.

---

## Reason

Singleton middleware persists across requests. If the middleware appends data to an array property on every `handle()` call (e.g., `$this->logs[] = [...]`), that array grows unboundedly until the worker restarts. In PHP-FPM (process per request), the process exits after each request — no leak. In Octane (long-lived worker), the array grows until memory exhaustion. This is a silent memory leak that eventually crashes the worker.

---

## Bad Example

```php
class RequestLogMiddleware
{
    private array $logs = []; // Grows with every request — memory leak in Octane

    public function handle(Request $request, Closure $next): Response
    {
        $this->logs[spl_object_id($request)] = [...];
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        foreach ($this->logs as $log) {
            Log::info('Request', $log);
        }
        // Never cleans up — array keeps growing
    }
}
```

---

## Good Example

```php
class RequestLogMiddleware
{
    private array $logs = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->logs[spl_object_id($request)] = [...];
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $id = spl_object_id($request);
        if (isset($this->logs[$id])) {
            Log::info('Request', $this->logs[$id]);
            unset($this->logs[$id]); // Cleanup — prevents memory leak
        }
    }
}
```

---

## Exceptions

Non-singleton terminable middleware (fresh instance per request) cannot leak memory because the instance is discarded after each request.

---

## Consequences Of Violation

Memory risks: unbounded array growth in Octane workers causes out-of-memory errors. Stability risks: workers crash periodically, causing request failures. Debugging difficulty: memory leak is gradual and hard to attribute to a specific middleware.

---

---

## Rule Name

Verify terminate() Behavior in the Target Deployment Environment

---

## Category

Reliability

---

## Rule

Before deploying terminable middleware, verify that `terminate()` fires in the target server environment (PHP-FPM, RoadRunner, Swoole, FrankenPHP). Document the environment-specific behavior and adjust the middleware strategy accordingly.

---

## Reason

`terminate()` fires reliably in PHP-FPM (process per request, Kernel::terminate() is always called). In RoadRunner, `terminate()` does not fire by default — the kernel does not call it. In Swoole and FrankenPHP, it depends on configuration. Teams developing on PHP-FPM and deploying to RoadRunner often discover that their logging, metrics, and cleanup middleware silently stopped working only after production deployment.

---

## Bad Example

```php
// Developed and tested on PHP-FPM where terminate() fires
// Deployed to RoadRunner where terminate() does NOT fire
// Request logging middleware silently stops working in production
```

---

## Good Example

```php
// Document platform behavior
// Target: PHP-FPM — terminate() fires reliably
// If migrating to RoadRunner, replace with queue-based logging
class RequestLogMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        if (PHP_SAPI === 'fpm-fcgi') {
            Log::channel('requests')->info('Request completed', [...]);
        }
    }
}
```

---

## Exceptions

Applications deployed exclusively to PHP-FPM with no plans to change server environments can rely on `terminate()` behavior.

---

## Consequences Of Violation

Data loss: logs, metrics, and audit trails silently go missing in production. Operational blindness: monitoring dashboards show gaps. Debugging difficulty: no error is thrown — the data simply stops appearing.

---

---

## Rule Name

Use spl_object_id($request) as Key for Per-Request Data in Singleton Middleware

---

## Category

Reliability

---

## Rule

When singleton terminable middleware stores per-request data, key the data by `spl_object_id($request)` rather than a request-derived value (user ID, IP, session ID). Clean up the key in `terminate()`.

---

## Reason

Singleton middleware handling concurrent requests (Octane, Swoole) may interleave `handle()` and `terminate()` calls across different requests. Using a simple instance property (`$this->timer = microtime(true)`) causes race conditions — one request's start time is overwritten by another request before `terminate()` reads it. `spl_object_id($request)` provides a unique, non-reusable identifier for each request instance. Cleaning up in `terminate()` prevents the keyed data from accumulating.

---

## Bad Example

```php
class TimingMiddleware
{
    private float $lastStartTime; // Single value — race condition in concurrent requests

    public function handle(Request $request, Closure $next): Response
    {
        $this->lastStartTime = microtime(true); // Overwritten by concurrent request
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        // May read a different request's start time
        Log::info('Timing', ['ms' => (microtime(true) - $this->lastStartTime) * 1000]);
    }
}
```

---

## Good Example

```php
class TimingMiddleware
{
    private array $startTimes = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTimes[spl_object_id($request)] = microtime(true);
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $id = spl_object_id($request);
        $duration = (microtime(true) - ($this->startTimes[$id] ?? microtime(true))) * 1000;
        Log::info('Timing', ['ms' => round($duration, 2)]);
        unset($this->startTimes[$id]);
    }
}
```

---

## Exceptions

Non-singleton terminable middleware (fresh instance per request) does not need keyed data storage because each request gets its own instance.

---

## Consequences Of Violation

Reliability risks: concurrent requests see incorrect or corrupted data. Debugging difficulty: race condition bugs are intermittent and environment-specific. Data corruption: one request's timing or metadata is attributed to another request.
