# HTTP Kernel Internals — Rules

## Rule Name
Keep global middleware minimal; prefer group or route middleware.
---
## Category
Performance
---
## Rule
Register middleware at the most specific level possible: route-local middleware over group middleware over global middleware. Never add middleware globally that only applies to a subset of routes.
---
## Reason
Each global middleware executes on every request — 100% of traffic. Adding unnecessary layers to the global stack multiplies pipeline resolution overhead and execution time across all endpoints.
---
## Bad Example
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(EnsureTokenIsValid::class); // Only 3 routes need this
})
```
---
## Good Example
```php
// Route-level: only applies to specific routes
Route::get('/api/data', [DataController::class, 'index'])->middleware('token.valid');

// Or route group:
Route::middleware('token.valid')->group(function () {
    Route::get('/api/data', ...);
});
```
---
## Exceptions
Security middleware (auth, CORS, HTTPS redirect) that must protect every route should remain global. Trusted proxy configuration is also correctly global.
---
## Consequences Of Violation
Unnecessary overhead on every request, degraded Time to First Byte (TTFB), measurable latency increase in high-traffic applications.

---

## Rule Name
Always return `$next($request)` from middleware handle methods.
---
## Category
Reliability
---
## Rule
Every middleware `handle()` method must return the result of `$next($request)`. Never omit the return statement.
---
## Reason
The middleware pipeline chains closures via return values. A missing return drops the entire response chain, causing the downstream response to be lost and the pipeline to return `null`.
---
## Bad Example
```php
public function handle(Request $request, Closure $next): Response
{
    Log::info('Request: '.$request->path());
    $next($request); // Missing return — breaks the pipeline
}
```
---
## Good Example
```php
public function handle(Request $request, Closure $next): Response
{
    Log::info('Request: '.$request->path());
    return $next($request);
}
```
---
## Exceptions
Middleware that short-circuits (returns its own response without calling `$next`) is the only valid case for omitting `return $next($request)`.
---
## Consequences Of Violation
Silent pipeline breakage — downstream middleware and route handler never execute, empty responses returned to client, difficult-to-debug 500 errors or blank pages.

---

## Rule Name
Keep `terminate()` methods lightweight; defer heavy work to queues.
---
## Category
Performance
---
## Rule
Limit terminable middleware and lifecycle handler logic to fast operations (logging, metrics increment). Move database writes, HTTP calls, and file processing to queued jobs.
---
## Reason
Post-response terminate handlers still occupy the PHP worker process. In PHP-FPM, the worker cannot accept the next request until terminate completes. In Laravel Octane, heavy terminate logic delays the next sandbox creation.
---
## Bad Example
```php
public function terminate(Request $request, Response $response): void
{
    ProcessAnalytics::dispatchSync($request, $response); // Blocks until done
    ExternalApi::reportMetric($request->url(), $response->status()); // HTTP call
}
```
---
## Good Example
```php
public function terminate(Request $request, Response $response): void
{
    if (config('logging.slow_requests.enabled')) {
        Log::channel('slow')->warning('Request completed', [
            'url' => $request->fullUrl(),
            'status' => $response->status(),
        ]);
    }
    // Heavy work dispatched asynchronously
    ProcessAnalytics::dispatch($request->url(), $response->status());
}
```
---
## Exceptions
Octane applications running a single worker may accept slightly more terminate work since the sandbox refresh is lightweight. Still prefer queues.
---
## Consequences Of Violation
Reduced request throughput in PHP-FPM, delayed response to next request, increased queue latency when terminate blocks worker pool, Octane request timeout errors.

---

## Rule Name
Do not override `handle()` on the HTTP Kernel — use middleware or bootstrappers.
---
## Category
Architecture
---
## Rule
Never extend and override the kernel's `handle()` method for request customization. Use middleware for request/response manipulation and bootstrappers for initialization logic.
---
## Reason
The kernel's `handle()` is a template method orchestrating the pipeline, bootstrap, and dispatch flow. Overriding it bypasses the structured lifecycle — middleware, terminable handlers, and request duration handlers may not execute.
---
## Bad Example
```php
class Kernel extends HttpKernel
{
    public function handle($request): Response
    {
        $this->bootstrap();
        // Custom logic bypasses pipeline
        return app('router')->dispatch($request);
    }
}
```
---
## Good Example
```php
// Middleware for request/response logic
class CustomHeaderMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('X-Custom', 'value');
        return $next($request);
    }
}
```
---
## Exceptions
Implementing a completely different request lifecycle (e.g., async ReactPHP kernel) that implements `Illuminate\Contracts\Http\Kernel` is a legitimate override — but this creates a new kernel, not an extension of the existing one.
---
## Consequences Of Violation
Lost middleware pipeline, skipped bootstrappers, missing terminate lifecycle, broken request duration handlers, incompatibility with framework updates.

---

## Rule Name
Verify middleware execution order with `php artisan route:list -v`.
---
## Category
Maintainability
---
## Rule
After adding or reordering middleware, run `php artisan route:list -v` to verify the resolved execution order matches your intent. Document any `$middlewarePriority` overrides with inline comments.
---
## Reason
Middleware execution order is non-obvious: global → group → route, with `$middlewarePriority` reordering across these boundaries. Order-dependent bugs (e.g., auth running after data binding) are silent and hard to debug.
---
## Bad Example
```php
// No verification after adding new middleware
protected $middlewareGroups = [
    'web' => [
        SubstituteBindings::class, // Runs before auth if priority not set
        Authenticate::class,
    ],
];
```
---
## Good Example
```php
// After configuration: run php artisan route:list -v
// Verify: EnsureTokenIsValid runs after StartSession, before SubstituteBindings
protected $middlewarePriority = [
    StartSession::class,
    EnsureTokenIsValid::class,  // Added here — comment explains why
    SubstituteBindings::class,
];
```
---
## Exceptions
Trivial projects with 1-2 global middleware and no groups may skip verification, though it costs little to run.
---
## Consequences Of Violation
Silent security bypass (auth running after parameter binding), session data missing in middleware, difficult debugging of intermittent ordering issues.

---

## Rule Name
Use `Contracts\Http\Kernel` for type-hints instead of concrete kernel classes.
---
## Category
Maintainability
---
## Rule
Always type-hint `Illuminate\Contracts\Http\Kernel` in constructor signatures, method parameters, and service provider code. Never type-hint `App\Http\Kernel` or `Illuminate\Foundation\Http\Kernel`.
---
## Reason
The userland `App\Http\Kernel` was removed in Laravel 11+. Code referencing it throws "Class not found" on new skeleton projects. The contract is stable across all versions.
---
## Bad Example
```php
class PerformanceServiceProvider extends ServiceProvider
{
    public function boot(App\Http\Kernel $kernel): void // Breaks in Laravel 11+
    {
        $kernel->whenRequestLifecycleIsLongerThan(1000, fn() => ...);
    }
}
```
---
## Good Example
```php
class PerformanceServiceProvider extends ServiceProvider
{
    public function boot(\Illuminate\Contracts\Http\Kernel $kernel): void
    {
        $kernel->whenRequestLifecycleIsLongerThan(1000, fn() => ...);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
"Class not found" errors on Laravel 11+ skeleton projects, broken service providers, package incompatibility across framework versions.

---

## Rule Name
Understand the guarded bootstrap flag when testing sub-requests.
---
## Category
Testing
---
## Rule
When dispatching multiple requests through the same kernel instance in tests, be aware that bootstrappers run exactly once. Reset the `$hasBeenBootstrapped` flag or use a fresh Application instance if testing requires re-bootstrapping.
---
## Reason
The kernel guards bootstrappers with `$this->hasBeenBootstrapped` to prevent redundant initialization. In tests calling `handle()` multiple times, subsequent requests skip bootstrapping. For most tests this is correct, but some may depend on re-execution.
---
## Bad Example
```php
public function test_sub_request_session_mutation(): void
{
    $response1 = $this->get('/login');
    // Bootstrapped state persists
    $response2 = $this->get('/dashboard');
    // Bootstrappers did not re-run — expected for normal flow
}
```
---
## Good Example
```php
public function test_bootstrapper_isolation(): void
{
    $app = $this->createApplication();
    $kernel = $app->make(Kernel::class);
    $kernel->handle(Request::create('/route-a'));

    // For tests requiring fresh bootstrap:
    $app = $this->createApplication(); // New Application = new bootstrap
    $kernel = $app->make(Kernel::class);
    $kernel->handle(Request::create('/route-b'));
}
```
---
## Exceptions
Most tests correctly expect bootstrappers to run once per test case. Only isolation tests that explicitly verify bootstrapper behavior need a fresh instance.
---
## Consequences Of Violation
Tests that accidentally depend on bootstrapper re-execution pass in isolation but fail when run in a suite, or vice versa.
