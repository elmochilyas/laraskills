# HTTP Kernel Dispatch Rules

## Rule: Never Call bootstrap() Manually
---
## Category
Reliability
---
## Rule
Never call `$kernel->bootstrap()` or `$app->bootstrapWith()` manually from service providers or middleware.
---
## Reason
The `bootstrap()` method is guarded by `hasBeenBootstrapped()` — it runs bootstrappers only once. Manually calling it before `sendRequestThroughRouter()` or from within provider code bypasses the guard check or resets the guard, causing bootstrappers to re-execute mid-request. This resets configuration state, clears registered facades, and re-registers all providers, leading to unrecoverable corruption.
---
## Bad Example
```php
public function boot(): void
{
    $this->app->bootstrapWith(['App\Bootstrap\CustomBootstrapper']);
}
```
---
## Good Example
```php
// Register as a bootstrapper in the kernel's bootstrappers array instead,
// or use a service provider's boot() for provider-level initialization.
public function boot(): void
{
    // Provider boot is the correct hook for initialization
    $this->app->make(CustomInitializer::class)->init();
}
```
---
## Exceptions
Custom kernel implementations that intentionally re-bootstrap between requests (e.g., Octane reset logic) may call bootstrap, but must manually reset the `hasBeenBootstrapped` flag and understand all consequences.
---
## Consequences Of Violation
Configuration reset mid-request, facades become unbound, all service providers re-register, application state corruption, subtle timing-dependent bugs.

---

## Rule: Monitor Bootstrap Time Separately From Route Dispatch Time
---
## Category
Performance
---
## Rule
Track bootstrap phase duration and route dispatch duration as separate metrics; alert if bootstrap exceeds 50ms.
---
## Reason
Bootstrap (6 core bootstrappers, provider registration, provider boot) is the dominant cost in cold requests. It scales with provider count and cache state. Route dispatch is usually fast (<10ms). Treating them as a single metric hides whether optimization effort should focus on caching (bootstrap) or middleware/router (dispatch).
---
## Bad Example
```php
$start = microtime(true);
$response = $kernel->handle($request);
$duration = microtime(true) - $start; // combined metric — unactionable
```
---
## Good Example
```php
$app->booting(function () use ($app) {
    $app->instance('bootstrap.start', microtime(true));
});
$app->booted(function () use ($app) {
    $bootstrapDuration = microtime(true) - $app->make('bootstrap.start');
    Log::debug("Bootstrap duration: {$bootstrapDuration}s");
});
```
---
## Exceptions
Applications with config cache fully enabled have negligible bootstrap (<5ms). In that case, combined timing is sufficient, but separate tracking costs <0.01ms.
---
## Consequences Of Violation
Misplaced optimization effort, treating bootstrap slowdowns as route issues, inability to detect provider-bloat regressions after deployments.

---

## Rule: Audit Middleware Execution Order With Priority
---
## Category
Reliability
---
## Rule
Use `$middlewarePriority` to enforce execution order when middleware depends on state set up by other middleware.
---
## Reason
Without explicit priority, middleware runs in registration order. `StartSession` must run before `Authenticate`, `SubstituteBindings` must run after both. Priority violations cause subtle bugs: session data unavailable during auth, route bindings unset when middleware tries to authorize the bound model.
---
## Bad Example
```php
// Middleware registered without priority — order depends on array position
protected $middleware = [
    Authenticate::class,     // may run before session is started
    StartSession::class,
    SubstituteBindings::class,
];
```
---
## Good Example
```php
// In Laravel 10 App\Http\Kernel, or via middleware configuration:
protected $middlewarePriority = [
    StartSession::class,
    Authenticate::class,
    SubstituteBindings::class,
];
```

Or in Laravel 11+ `bootstrap/app.php`:
```php
->withMiddleware(function (Middleware $middleware) {
    $middleware->priority([
        StartSession::class,
        Authenticate::class,
        SubstituteBindings::class,
    ]);
});
```
---
## Exceptions
Middleware that has no dependencies on other middleware state (e.g., `TrimStrings`, `TrustProxies`) requires no priority configuration.
---
## Consequences Of Violation
Session data unavailable in authentication middleware, route model bindings unresolved during authorization, inconsistent behavior between environments.

---

## Rule: Prefer Extending Kernel Over Modifying Kernel Class
---
## Category
Architecture
---
## Rule
Extend or decorate the kernel class for structural changes; use middleware and service providers for behavioral changes.
---
## Reason
The kernel is a template-method class with specific extension points (`sendRequestThroughRouter()`, `dispatchToRouter()`). Changing kernel behavior via middleware is testable, swappable, and composable. Subclassing the kernel for logic creates coupling — middleware can be added/removed per environment, kernel subclasses cannot.
---
## Bad Example
```php
class CustomKernel extends Kernel
{
    protected function sendRequestThroughRouter($request)
    {
        $this->bootstrap();
        Log::info('Request started'); // behavioral change in kernel subclass
        return parent::sendRequestThroughRouter($request);
    }
}
```
---
## Good Example
```php
class RequestLoggerMiddleware
{
    public function handle($request, $next)
    {
        Log::info('Request started');
        return $next($request);
    }
}
```
---
## Exceptions
Adding custom bootstrappers to the kernel's bootstrapper array, changing the bootstrap order, or modifying the pipeline construction are valid reasons to extend the kernel.
---
## Consequences Of Violation
Kernel subclass coupled to framework version, behavioral changes untestable in isolation, deployment environment can't swap middleware independently.

---

## Rule: Do Not Mutate $middleware At Runtime
---
## Category
Reliability
---
## Rule
Do not modify the `$middleware` or `$middlewareGroups` arrays after the kernel has been constructed.
---
## Reason
The middleware arrays are populated during kernel construction from property definitions. Runtime mutations (`$kernel->middleware[] = ...`) are not reflected in the pipeline because the pipeline receives a snapshot built at construction time. Changes silently have no effect.
---
## Bad Example
```php
// In a service provider:
public function boot(): void
{
    app(Kernel::class)->middleware[] = CustomMiddleware::class;
    // This change is silently ignored — pipeline was already constructed
}
```
---
## Good Example
```php
// Configure middleware in bootstrap/app.php (Laravel 11+):
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(CustomMiddleware::class);
});
```
---
## Exceptions
No common exceptions. All middleware configuration must happen through the designated configuration API (kernel properties or `ApplicationBuilder`).
---
## Consequences Of Violation
Middleware silently ignored, security middleware not applied, debugging confusion when runtime changes have no effect.

---

## Rule: Add Global Middleware Only When Truly Global
---
## Category
Code Organization
---
## Rule
Limit global middleware to functionality required on every route; use middleware groups or route-specific middleware for scoped behavior.
---
## Reason
Global middleware runs on every request, including asset files, health-check endpoints, webhook receivers, and static pages. Adding authentication, rate limiting, or authorization middleware globally forces every endpoint to handle these concerns unnecessarily.
---
## Bad Example
```php
// Kernel.php — rate limiting on every endpoint
protected $middleware = [
    ThrottleRequests::class, // affects health checks, asset serving, webhooks
];
```
---
## Good Example
```php
// Kernel.php — rate limiting only on API routes
protected $middlewareGroups = [
    'api' => [
        ThrottleRequests::class,
    ],
    'web' => [
        // web-specific middleware
    ],
];
```
---
## Exceptions
Middleware for security hardening (HTTPS redirect, HSTS headers, CSP headers), request normalization (TrimStrings, TrustProxies), or observability (request logging) is appropriately global.
---
## Consequences Of Violation
Unnecessary middleware overhead on every request, rate limiting health checks, authentication required for public assets, increased attack surface from unnecessary middleware.

---

## Rule: Maintain The Kernel's Execution Phase Order
---
## Category
Architecture
---
## Rule
Do not restructure the kernel execution order: keep the sequence as bootstrappers → middleware pipeline → route dispatch → response → terminate.
---
## Reason
The kernel execution order is designed to establish foundational state first (bootstrappers), apply cross-cutting concerns (middleware), then execute application logic (route dispatch). Reordering this sequence breaks assumptions throughout the framework — bootstrappers like `LoadConfiguration` and `BootProviders` must complete before any middleware or route runs.
---
## Bad Example
```php
protected function sendRequestThroughRouter($request)
{
    // Reversed order — route dispatch before bootstrap
    $response = $this->router->dispatch($request);
    $this->bootstrap();
    return $response;
}
```
---
## Good Example
```php
protected function sendRequestThroughRouter($request)
{
    $this->bootstrap();
    return (new Pipeline($this->app))
        ->send($request)
        ->through($this->middleware)
        ->then($this->dispatchToRouter());
}
```
---
## Exceptions
Octane's long-running process model may restructure how bootstrappers fire (once per worker, not per request), but the relative order of bootstrap → middleware → dispatch remains unchanged.
---
## Consequences Of Violation
Configuration not loaded when middleware runs, facades unavailable, providers not registered, services missing during route dispatch, unrecoverable errors.

---

## Rule: Use sendRequestThroughRouter Internal Pattern For Custom Kernels
---
## Category
Framework Usage
---
## Rule
When implementing a custom kernel, replicate the three-phase structure: bootstrap → pipeline → dispatch-to-router closure.
---
## Reason
The three-phase structure provides clear separation of concerns: phase 1 establishes application state, phase 2 applies cross-cutting filters, phase 3 executes application code. Collapsing these phases into a single method eliminates the ability to extend each phase independently.
---
## Bad Example
```php
class CustomKernel implements KernelContract
{
    public function handle($request)
    {
        $this->app->bootstrapWith($this->bootstrappers());
        return $this->router->dispatch($request); // no middleware pipeline
    }
}
```
---
## Good Example
```php
class CustomKernel implements KernelContract
{
    public function handle($request)
    {
        return $this->sendRequestThroughRouter($request);
    }

    protected function sendRequestThroughRouter($request)
    {
        $this->bootstrap();
        return (new Pipeline($this->app))
            ->send($request)
            ->through($this->middleware)
            ->then(function ($request) {
                return $this->router->dispatch($request);
            });
    }
}
```
---
## Exceptions
Minimal kernels for micro-framework use cases or API-gateway proxies that intentionally skip middleware may omit the pipeline, but must document which cross-cutting concerns are bypassed.
---
## Consequences Of Violation
Middleware bypassed, bootstrap timing incorrect, custom kernel incompatible with framework extensions that hook into the pipeline or bootstrap events.
