# Anti-Patterns: Terminable Middleware

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Terminable Middleware |
| Difficulty | Advanced |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Not Registering as Singleton When State Is Needed | Reliability | Critical |
| 2 | Heavy Synchronous I/O in `terminate()` | Performance | High |
| 3 | Relying on `terminate()` for Critical Operations | Reliability | Critical |
| 4 | Singleton Terminable Middleware with Unbounded Data Accumulation | Performance | High |
| 5 | Race Condition in Singleton Terminable Middleware | Reliability | Medium |

---

## Anti-Pattern 1: Not Registering as Singleton When State Is Needed

### Category
Reliability

### Description
Writing a terminable middleware that stores data on `$this` during `handle()` and reads it during `terminate()`, without registering the middleware as a singleton. Because `terminate()` receives a new instance by default, the data stored during `handle()` is lost and `terminate()` sees empty or null state.

### Why It Happens
The default behavior of `Kernel::terminate()` is to resolve a fresh middleware instance from the container — `$this->app->call([$middleware, 'terminate'], ...)`. This is not obvious from the middleware code. Developers assume the same instance is reused because the method is on the same class. The single-instance assumption is natural and rarely documented at the point of use.

### Warning Signs
- Terminable middleware sets `$this->startTime = microtime(true)` in `handle()` and reads it in `terminate()`
- Duration in termination logs is always 0 or near-zero (fallback timestamp used)
- Metrics counters show zero values for response codes or durations
- Cleanup tasks reference request data that is empty/null in `terminate()`
- Debugging: `$this` properties are null in `terminate()` despite being set in `handle()`

### Why Harmful
The termination logic silently fails — no error is thrown because the missing state is handled with fallback values (null coalescing, default parameters). Log entries show incorrect durations (always 0ms). Metrics collectors record no useful data. Cleanup tasks cannot find the files to delete. The middleware appears to work but produces no useful output.

### Real-World Consequences
- `PerformanceMiddleware` stores `$this->timers[spl_object_id($request)]` in `handle()`
- `terminate()` reads `$this->timers` → empty array (new instance)
- Fallback: `$this->timers[spl_object_id($request)] ?? microtime(true)` → duration = 0ms
- All metrics show 0ms response time for months
- Team believes application responds in <1ms
- Real response time is 200ms; no one notices because metrics are wrong
- Fix: register as singleton → data shared between handle() and terminate()

### Preferred Alternative
Register terminable middleware as a singleton if state must be shared between `handle()` and `terminate()`. Or avoid shared state entirely by reading all needed data from the `$request` and `$response` parameters passed to `terminate()`.

```php
// Wrong: no singleton — $this state lost between handle() and terminate()
class PerformanceMiddleware
{
    private array $timers = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->timers[spl_object_id($request)] = microtime(true);
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $start = $this->timers[spl_object_id($request)] ?? null; // ALWAYS null without singleton
    }
}

// Correct: register as singleton in AppServiceProvider
// AppServiceProvider::register()
$this->app->singleton(PerformanceMiddleware::class);

// Or: avoid shared state entirely — read from request attributes
class RequestLogMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('_start_time', microtime(true));
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $start = $request->attributes->get('_start_time'); // Available without singleton
        // ...
    }
}
```

### Refactoring Strategy
1. Audit terminable middleware for `$this` state shared between `handle()` and `terminate()`
2. Register as singleton in `AppServiceProvider` if state sharing is needed
3. Alternatively, move shared state to `$request->attributes` to avoid singleton requirement
4. Test that state from `handle()` is available in `terminate()`
5. Document: "This middleware must be registered as a singleton"

### Detection Checklist
- [ ] Terminable middleware with shared state is registered as singleton
- [ ] Or: all data needed by `terminate()` is passed via `$request->attributes`
- [ ] No `$this` state is written in `handle()` and read in `terminate()` without singleton
- [ ] Duration/monitoring values in `terminate()` are accurate (not fallback defaults)
- [ ] Test verifies state from `handle()` is available in `terminate()`

### Related Rules/Skills/Trees
- Rule: Register terminable middleware as singleton when state is shared
- Rule: terminate() receives a new instance by default — `$this` state is lost
- Related KU: Service Container, Singleton Binding

---

## Anti-Pattern 2: Heavy Synchronous I/O in `terminate()`

### Category
Performance

### Description
Performing expensive synchronous operations — HTTP API calls, database writes, file processing, external service calls — inside `terminate()`. These operations block the web process from handling the next request.

### Why It Happens
Developers use `terminate()` to defer work after the response, but choose synchronous API calls or database operations instead of dispatching to a queue. The work is not heavy enough to warrant a full queue infrastructure, or the developer does not want to add the complexity of queue job classes.

### Warning Signs
- `terminate()` makes HTTP calls to external APIs
- `terminate()` performs database INSERT/UPDATE operations
- `terminate()` writes large files to disk
- Response time is fast, but request throughput is low (process blocked on I/O)
- PHP-FPM worker processes show high I/O wait time in monitoring
- Log entries show termination tasks taking seconds to complete

### Why Harmful
In PHP-FPM, each worker process can handle one request at a time. If `terminate()` blocks for 500ms on an API call, that worker cannot accept the next request for 500ms + the actual request time. Total request throughput is reduced. In Octane/Swoole, the entire worker blocks, affecting concurrent requests. The application appears fast to clients but handles fewer requests per second.

### Real-World Consequences
- `AnalyticsMiddleware` sends analytics data via HTTP POST in `terminate()`
- POST takes 200-800ms depending on analytics server load
- PHP-FPM pool of 10 workers: each request holds a worker for an extra ~400ms
- Peak throughput drops from 100 req/s to 50 req/s
- New relic: "Middleware termination" is the biggest contributor to process hold time
- Fix: dispatch to queue → worker freed immediately → throughput doubles

### Preferred Alternative
Dispatch heavy work to a queue job from `terminate()`. Keep `terminate()` lightweight — only perform fast operations (log writes, memory cache updates, simple metric increments).

```php
// Wrong: synchronous API call blocks the process
class AnalyticsMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        HttpClient::post('https://analytics.example.com/event', [
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
        ]); // Blocks for 200-800ms
    }
}

// Correct: dispatch to queue — process freed immediately
class AnalyticsMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        SendAnalyticsEvent::dispatch(
            url: $request->fullUrl(),
            status: $response->getStatusCode(),
        ); // Returns immediately (~0.1ms)
    }
}
```

### Refactoring Strategy
1. Audit terminable middleware for synchronous I/O operations
2. Extract heavy operations into queue job classes
3. Dispatch jobs from `terminate()` instead of executing inline
4. Keep only fast operations (log writes, cache sets, counter increments) in `terminate()`
5. Test that `terminate()` returns in <1ms after refactoring

### Detection Checklist
- [ ] `terminate()` does not make synchronous API calls
- [ ] `terminate()` does not perform database writes
- [ ] `terminate()` does not process large files
- [ ] Heavy operations are dispatched to queue jobs
- [ ] `terminate()` returns in <1ms
- [ ] Process pool utilization is not held by termination tasks

### Related Rules/Skills/Trees
- Rule: Keep terminate() lightweight — dispatch heavy work to queue
- Rule: Synchronous I/O in terminate() blocks the web process
- Related KU: Queue Workers, dispatch()->afterResponse()

---

## Anti-Pattern 3: Relying on `terminate()` for Critical Operations

### Category
Reliability

### Description
Using terminable middleware for operations that must execute — payment processing, data deletion, audit logging required by regulation, email notifications. `terminate()` is not guaranteed to fire in all server configurations or if the process crashes.

### Why It Happens
`terminate()` is the most convenient post-response hook in Laravel. Developers use it for all deferred tasks because it is already in the middleware pipeline. The reliability difference between "runs after response" and "guaranteed to run" is not obvious until a crash occurs.

### Warning Signs
- Terminable middleware processes payments or refunds
- Terminable middleware deletes user data or cleans up sensitive records
- Terminable middleware sends mandatory regulatory notifications
- Terminable middleware writes audit records required by compliance
- No fallback mechanism exists if `terminate()` does not fire

### Why Harmful
If the PHP process crashes before `Kernel::terminate()` completes (segfault, OOM kill, worker restart), the termination logic never runs. In RoadRunner and some Swoole configurations, `terminate()` may not fire at all. Critical operations are silently skipped. Users are not charged, data is not deleted, notifications are not sent, and audit trails have gaps — without any error indication.

### Real-World Consequences
- `AuditLogMiddleware` writes regulatory audit records in `terminate()`
- Server runs on RoadRunner (terminate() does not fire by default)
- 20% of audit records are missing
- Compliance audit finds the gap; company faces regulatory fines
- Root cause: `terminate()` never fires in RoadRunner
- Fix: move audit logging to a queue job with database persistence and retries

### Preferred Alternative
Use queue jobs with retries for critical operations. Reserve terminable middleware for non-critical, best-effort tasks like metrics, debugging logs, and performance monitoring.

```php
// Wrong: critical operation in terminate()
class PaymentMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        if ($response->getStatusCode() === 200) {
            ProcessPayment::dispatchNow(); // Blocks! What if terminate() doesn't fire?
        }
    }
}

// Correct: queue job with retries
class PaymentMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Still dispatch to queue, not terminate() directly
        if ($response->getStatusCode() === 200) {
            ProcessPayment::dispatch(
                $request->attributes->get('payment_id')
            ); // Queue ensures eventual execution with retries
        }
    }
}

// Correct: separate queue architecture
// Controller dispatches the job directly — no terminate() dependency
class OrderController
{
    public function store(Request $request): Response
    {
        $order = Order::create(...);
        ProcessPayment::dispatch($order->id)
            ->onQueue('payments')
            ->onConnection('redis');
        return response()->json($order, 201);
    }
}
```

### Refactoring Strategy
1. Identify all critical operations in terminable middleware (payments, data deletion, mandatory notifications, regulatory audit)
2. Move to queue jobs with retries and dead-letter handling
3. Add monitoring for queued job failures
4. Keep only non-critical, best-effort tasks in `terminate()`
5. Document: "terminate() is NOT guaranteed — use queue for critical operations"

### Detection Checklist
- [ ] No critical operations (payments, deletions, mandatory notifications) in `terminate()`
- [ ] Queue jobs with retries handle all critical post-response work
- [ ] `terminate()` only handles non-critical tasks (metrics, debug logs)
- [ ] Fallback exists if `terminate()` does not fire
- [ ] Queue job failure handling (retries, dead-letter queue, alerting) is in place

### Related Rules/Skills/Trees
- Rule: Do NOT use terminate() for critical operations — use queue jobs
- Rule: terminate() may not fire in all server configurations
- Related KU: Queue Workers, Job Retries and Failure Handling

---

## Anti-Pattern 4: Singleton Terminable Middleware with Unbounded Data Accumulation

### Category
Performance

### Description
A singleton terminable middleware that appends data to an array property on each request, never clearing it. The array grows with every request in long-lived processes (Octane, Swoole), eventually consuming all available memory.

### Why It Happens
Singleton registration is necessary for sharing state between `handle()` and `terminate()`. Developers store per-request data in an array property on `$this`, assuming it is scoped to the current request. In a long-lived process (Octane), the singleton persists across requests, and the array accumulates entries forever.

### Warning Signs
- Singleton terminable middleware stores data in an array property: `$this->logs[] = [...], $this->metrics[] = [...]`
- The array is never cleared or pruned in `terminate()`
- Memory usage grows steadily in Octane/Swoole workers
- Worker restarts are required to free memory
- Application crashes with "Out of memory" error after processing many requests

### Why Harmful
In long-lived processes, the singleton middleware instance lives for the entire worker lifecycle. Each request appends data to the array. After 10,000 requests, the array contains 10,000 entries. Even small entries (100 bytes each) consume 1MB after 10,000 requests. After 1,000,000 requests, the array consumes 100MB. The application eventually runs out of memory.

### Real-World Consequences
- `LogCollector` middleware registered as singleton with `$this->logs = []`
- Each `terminate()` call appends log entry: `$this->logs[] = ['url' => ..., 'time' => ...]`
- After 24 hours on Octane (500,000 requests), array has 500,000 entries
- Memory usage: 500,000 × ~200 bytes = ~100MB
- Octane worker hits PHP memory limit (128MB default)
- Worker crashes; all subsequent requests to that worker fail

### Preferred Alternative
Clear per-request data after processing in `terminate()`. Use `spl_object_id($request)` keys and unset them after use. Or avoid accumulating data entirely by writing directly to external storage.

```php
// Wrong: unbounded accumulation
class LogCollector
{
    private array $logs = [];

    public function terminate(Request $request, Response $response): void
    {
        $this->logs[] = ['url' => $request->url(), 'time' => now()];
        // Never cleared — grows forever in Octane
    }
}

// Correct: clear after processing
class LogCollector
{
    private array $logs = [];

    public function terminate(Request $request, Response $response): void
    {
        $key = spl_object_id($request);
        $this->logs[$key] = ['url' => $request->url(), 'time' => now()];
        // Process and immediately clear
        $this->flushLogEntry($this->logs[$key]);
        unset($this->logs[$key]);
    }

    private function flushLogEntry(array $entry): void
    {
        // Write to external storage, send to logging service, etc.
    }
}

// Best: write directly — no accumulation at all
class LogCollector
{
    public function terminate(Request $request, Response $response): void
    {
        Log::channel('request')->info('Request completed', [
            'url' => $request->fullUrl(),
            'time' => now(),
        ]);
        // No $this state — safe in Octane
    }
}
```

### Refactoring Strategy
1. Identify singleton terminable middleware with array properties
2. Add cleanup: unset array entries after processing in `terminate()`
3. Or refactor to write directly to external storage without accumulating
4. Add memory monitoring for Octane workers
5. Test that memory does not grow over many requests in long-lived process

### Detection Checklist
- [ ] No unbounded array accumulation in singleton terminable middleware
- [ ] Per-request data is cleared after processing in `terminate()`
- [ ] Memory usage is stable over thousands of requests in Octane
- [ ] Workers do not need restarts due to memory growth
- [ ] No `$this->array[] = ...` pattern without cleanup

### Related Rules/Skills/Trees
- Rule: Clear per-request data in terminate() to prevent memory leaks in Octane
- Rule: Singleton terminable middleware with unbounded arrays leaks memory
- Related KU: Octane Architecture, Memory Management

---

## Anti-Pattern 5: Race Condition in Singleton Terminable Middleware

### Category
Reliability

### Description
A singleton terminable middleware uses instance properties (`$this->timer`, `$this->startTime`) without keying by request ID. In concurrent request handling (Swoole, FrankenPHP), multiple requests run `handle()` simultaneously, overwriting each other's state on the shared singleton instance.

### Why It Happens
Singleton middleware shares the same instance across all requests. When `handle()` writes to `$this->startTime = microtime(true)` and `terminate()` reads it, concurrent requests overwrite the value. The last request to write wins, and earlier requests read the wrong start time.

### Warning Signs
- Singleton middleware uses `$this->timer = microtime(true)` (single scalar, not keyed by request)
- Metrics show negative durations or impossibly large values
- Log entries show wrong data (request A's URL with request B's duration)
- Bug only occurs under load (concurrent requests in Swoole)
- Debugging: `$this` properties have values from different requests

### Why Harmful
Data corruption across concurrent requests. Request A's timing data is overwritten by Request B before `terminate()` for Request A runs. Both requests end up with corrupted data — A uses B's start time, B uses A's URL. Inconsistent and wrong data is recorded without any error indication. The bug is intermittent and load-dependent, making it extremely difficult to reproduce and debug.

### Real-World Consequences
- `PerformanceMiddleware` singleton with `$this->startTime = microtime(true)` in `handle()`
- Swoole server handles 10 concurrent requests
- Request 5 sets `$this->startTime`, then Request 6 overwrites it
- Request 5's `terminate()` reads Request 6's startTime → negative duration or very short duration
- All metrics are wrong: durations are random, URLs are mismatched
- Monitoring alerts: "Response time negative" — team spends days debugging

### Preferred Alternative
Key per-request data by the request object's ID (`spl_object_id($request)`). This ensures concurrent requests store and retrieve their own data without collisions.

```php
// Wrong: single scalar — race condition in concurrent requests
class PerformanceMiddleware
{
    private float $startTime;
    private string $url;

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTime = microtime(true);
        $this->url = $request->fullUrl();
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $duration = (microtime(true) - $this->startTime) * 1000; // Wrong request's start time!
    }
}

// Correct: key by request ID
class PerformanceMiddleware
{
    private array $timers = [];

    public function handle(Request $request, Closure $next): Response
    {
        $this->timers[spl_object_id($request)] = [
            'start' => microtime(true),
            'url' => $request->fullUrl(),
        ];
        return $next($request);
    }

    public function terminate(Request $request, Response $response): void
    {
        $key = spl_object_id($request);
        $timer = $this->timers[$key] ?? null;

        if ($timer) {
            $duration = (microtime(true) - $timer['start']) * 1000;
            // Process metrics...
            unset($this->timers[$key]); // Clean up
        }
    }
}
```

### Refactoring Strategy
1. Audit singleton terminable middleware for scalar instance properties used in `handle()`/`terminate()`
2. Replace with array keyed by `spl_object_id($request)`
3. Clear the entry after processing in `terminate()`
4. Test under concurrent load (Swoole, parallel PHPUnit)
5. Add test that verifies data isolation across simulated concurrent requests

### Detection Checklist
- [ ] Singleton middleware does not use scalar properties for per-request data
- [ ] Per-request data is keyed by `spl_object_id($request)`
- [ ] Data is cleaned up after `terminate()` processes it
- [ ] No race condition under concurrent request load
- [ ] Metrics are correct for each individual request

### Related Rules/Skills/Trees
- Rule: Key per-request data by spl_object_id($request) in singleton middleware
- Rule: Scalar instance properties cause race conditions in concurrent requests
- Related KU: Octane Architecture, Concurrency Handling
