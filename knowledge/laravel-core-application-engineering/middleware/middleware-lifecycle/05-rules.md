# Phase 5: Rules — Middleware Lifecycle

---

## Rule Name

Differentiate Global and Route Pipeline Placement by Route Context Requirement

---

## Category

Architecture

---

## Rule

Register middleware in the global pipeline only for concerns that must run before routing (trusted proxies, CORS, maintenance mode, input sanitization). Register all other middleware in the route pipeline (group, route, or controller level). Never register middleware that needs route context (matched route, parameters, resolved bindings) as global.

---

## Reason

The global pipeline executes before `Router::dispatch()`. At that point, no route has been matched — `$request->route()` returns null. Middleware that needs route data (auth guard selection, route model bindings, route parameters) will fail or produce incorrect results when registered globally. The two-pipeline architecture exists precisely to separate infrastructure concerns (before routing) from application concerns (after routing).

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(CheckRoleMiddleware::class); // Global — needs route data
});

class CheckRoleMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route(); // null — route not yet matched
        // ...
    }
}
```

---

## Good Example

```php
Route::get('/admin', [AdminController::class, 'index'])
    ->middleware(CheckRoleMiddleware::class); // Route pipeline — has access to route
```

---

## Exceptions

Path-based middleware (checking `$request->is()`, `$request->path()`, `$request->segment()`) can run globally because it operates on the URI string, not the matched route object.

---

## Consequences Of Violation

Reliability risks: middleware crashes or produces incorrect results. Debugging difficulty: the error is a null reference on the route object, which may be misinterpreted as a routing issue.

---

---

## Rule Name

Keep Controller Constructors Lightweight — They Execute Before Middleware Short-Circuits

---

## Category

Performance

---

## Rule

Never place expensive or side-effecting logic in controller constructors. Controllers are instantiated before middleware runs, so constructor code executes even for requests that middleware will reject with a 401, 403, or redirect.

---

## Reason

The framework instantiates the controller during route dispatch (to gather controller-level middleware) before the route pipeline begins. If middleware short-circuits with an authentication failure, the controller constructor has already executed. Database queries, API calls, and file operations in constructors are wasted on every unauthorized request.

---

## Bad Example

```php
class OrderController extends Controller
{
    public function __construct(
        private AnalyticsService $analytics
    ) {
        $this->analytics->loadReport(); // DB query — runs even for unauthorized requests
    }
}
```

---

## Good Example

```php
class OrderController extends Controller
{
    public function __construct(AnalyticsService $analytics)
    {
        $this->analytics = $analytics; // Just store — no side effects
    }

    public function index(): View
    {
        $report = $this->analytics->loadReport(); // Only runs if middleware passes
        return view('orders.index', $report);
    }
}
```

---

## Exceptions

Controllers that have no guard middleware (public routes are always accessible) have no constraint on constructor weight.

---

## Consequences Of Violation

Performance risks: unauthorized requests waste resources on expensive initialization. Security risks: side effects in constructors (audit logs, notification sends) execute for attackers who trigger auth failures. Scalability risks: high volume of unauthorized requests amplifies wasted resource consumption.

---

---

## Rule Name

Never Rely on Terminable Middleware for Critical Operations That Must Execute

---

## Category

Reliability

---

## Rule

Use terminable middleware only for non-critical, best-effort post-response tasks. Never use terminable middleware for operations that must execute for correctness — financial recording, critical data persistence, or mandatory cleanup. Use queue jobs with retries for operations that require guaranteed execution.

---

## Reason

`terminate()` may not fire in all environments. It does not fire in the console kernel, may not fire in RoadRunner or Swoole, and does not fire if the server crashes between `$response->send()` and `Kernel::terminate()`. The method is a best-effort hook, not a reliable execution guarantee. Queue jobs with retry mechanisms provide the guaranteed execution that critical operations require.

---

## Bad Example

```php
class OrderConfirmationMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Critical: recording order confirmation
        DB::table('order_confirmations')->insert([
            'order_id' => $request->attributes->get('order_id'),
            'confirmed_at' => now(),
        ]);
        // If terminate() doesn't fire, the order is never confirmed
    }
}
```

---

## Good Example

```php
class OrderConfirmationMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        // Non-critical: analytics tracking — best effort is acceptable
        Log::channel('analytics')->info('Order completed', [
            'order_id' => $request->attributes->get('order_id'),
        ]);
    }
}

// Critical operation dispatched to queue with retries
dispatch(new ConfirmOrder($order))->onQueue('critical');
```

---

## Exceptions

No common exceptions. If an operation must execute for the application to function correctly, it must use a queue with retries.

---

## Consequences Of Violation

Data integrity risks: critical data persistence fails silently when `terminate()` does not fire. Financial risks: order confirmations, payment recordings, and audit trails are lost. Debugging difficulty: the failure is silent because terminate exceptions are not surfaced.

---

---

## Rule Name

Test for Terminable Middleware State Sharing via Singleton Registration

---

## Category

Testing

---

## Rule

When writing terminable middleware that needs to share state between `handle()` and `terminate()`, register the middleware as a singleton. Document this requirement explicitly in the middleware class docblock. Test both methods directly by calling `$middleware->terminate($request, $response)` after `$middleware->handle($request, $next)`.

---

## Reason

By default, `terminate()` receives a fresh middleware instance. Any state set on `$this` during `handle()` is lost. This is the most common bug in terminable middleware — developers store a start time in `handle()` and find it null in `terminate()`. Singleton registration ensures the same instance is reused. Testing directly (not through HTTP feature tests) verifies both methods work with shared state.

---

## Bad Example

```php
class TimingLogger
{
    private float $startTime;

    public function handle(Request $request, Closure $next): Response
    {
        $this->startTime = microtime(true); // Set on instance
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
/**
 * Must be registered as a singleton for state sharing between handle() and terminate().
 */
class TimingLogger
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
```

---

## Exceptions

Terminable middleware that does not need state sharing (e.g., it reads all data from `$request` or `$response` parameters) does not require singleton registration.

---

## Consequences Of Violation

Reliability risks: state-dependent logic in `terminate()` silently fails with null values. Debugging difficulty: the bug is invisible because `terminate()` exceptions are not surfaced to the HTTP response. Production impact: logging, metrics, and cleanup silently stop working after initial deployment.

---

---

## Rule Name

Do Not Assume terminate() Fires in All Server Environments

---

## Category

Reliability

---

## Rule

Always verify terminable middleware behavior in the target deployment environment. Document which server environment the application uses and whether `terminate()` fires in that environment. Never deploy terminable middleware without environment-specific testing.

---

## Reason

`terminate()` fires reliably in PHP-FPM but may not fire in RoadRunner (does not by default), Swoole (depends on configuration), or FrankenPHP (depends on configuration). Teams deploying to multiple environments may have different terminate behavior in each. Relying on terminate behavior that does not exist in the target environment causes silent failures — logging stops, metrics drop, cleanup never runs.

---

## Bad Example

```php
// Developed and tested on PHP-FPM where terminate() fires
// Deployed to RoadRunner where terminate() does not fire
// Logging middleware silently stops recording — nobody notices for weeks
class RequestLogMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        Log::channel('requests')->info('Request completed', [...]);
    }
}
```

---

## Good Example

```php
// Document platform requirement
// Target: PHP-FPM (terminate() fires reliably)
// RoadRunner: dispatch to queue instead
class RequestLogMiddleware
{
    public function terminate(Request $request, Response $response): void
    {
        if (app()->environment('production')) {
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

Data loss: logs, metrics, and audit trails silently go missing. Operational blindness: monitoring dashboards show gaps that may not be noticed immediately. Debugging difficulty: no error is thrown — the logs simply stop appearing.

---

---

## Rule Name

Understand That Short-Circuited Middleware Still Has terminate() Called

---

## Category

Architecture

---

## Rule

When a middleware short-circuits (returns a response without calling `$next`), all middleware that already executed still has its post-processing code run. The short-circuited middleware's own post-processing code (after `$next`) does not run. All middleware that was part of the pipeline (including short-circuited ones) still has `terminate()` called after the response is sent.

---

## Reason

This behavior is non-obvious and leads to bugs when middleware relies on data from downstream middleware that never executed. For example, a logging middleware that captures the response status from downstream middleware will see a different status when a guard middleware short-circuits. Understanding short-circuit propagation prevents incorrect assumptions about which middleware ran and what data is available.

---

## Bad Example

```php
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        // If a guard middleware short-circuits before this middleware,
        // this code never runs — but if a guard middleware short-circuits
        // between this middleware and the controller, this code DOES run
        // with the guard's response, not the controller's response.
        Log::info('Controller executed', ['status' => $response->getStatusCode()]);
        return $response;
    }
}
```

---

## Good Example

```php
class AuditMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        // Log regardless — this captures the actual response sent
        Log::info('Request completed', ['status' => $response->getStatusCode()]);
        return $response;
    }
}
```

---

## Exceptions

No common exceptions. All middleware should be written to handle the case where downstream middleware or the controller may not have executed.

---

## Consequences Of Violation

Reliability risks: middleware incorrectly assumes specific middleware ran or specific data is available. Debugging difficulty: short-circuit-related bugs only appear when guard conditions are triggered.
