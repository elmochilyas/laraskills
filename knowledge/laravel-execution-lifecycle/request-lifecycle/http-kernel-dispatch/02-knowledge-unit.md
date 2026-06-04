# HTTP Kernel Dispatch

## Metadata
- **Domain:** Laravel Execution Lifecycle & Framework Internals
- **Subdomain:** Request Lifecycle
- **Knowledge Unit:** HTTP Kernel Dispatch
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

HTTP Kernel Dispatch is the central orchestration layer between the entry point and the middleware pipeline. The `Illuminate\Foundation\Http\Kernel` class coordinates bootstrapper execution, request routing through global middleware, route dispatch, and response delivery. It implements the Template Method pattern — `handle()` defines the skeleton, while `sendRequestThroughRouter()`, `bootstrap()`, and `dispatchToRouter()` fill in the steps. Every HTTP request that reaches a Laravel application passes through this kernel, making it the single most important class for understanding request processing.

The critical engineering decision is the two-phase pipeline architecture: bootstrappers run first to establish the application state (environment, config, facades, providers), then the middleware pipeline wraps the route dispatch in an onion of pre/post processing. This separation means middleware cannot depend on services that boot during the `BootProviders` bootstrapper, and bootstrappers cannot access request data that middleware will later modify. Laravel enforces this ordering at the architectural level by calling `$this->bootstrap()` before `Pipeline::send($request)->through($this->middleware)->then($this->dispatchToRouter())`.

For production engineers, the HTTP Kernel is where performance bottlenecks manifest most visibly. The `bootstrap()` method is guarded by `$app->hasBeenBootstrapped()` so it runs exactly once per request in FPM — but under Octane it runs once per worker lifetime. Understanding this distinction is essential for diagnosing why some middleware behavior differs between FPM and Octane deployments.

---

## Core Concepts

### 1. The `handle()` Method
The public entry point wrapping all kernel logic in try/catch for exception handling:

```php
public function handle($request)
{
    try {
        $request->enableHttpMethodParameterOverride();
        $response = $this->sendRequestThroughRouter($request);
    } catch (Throwable $e) {
        $this->reportException($e);
        $response = $this->renderException($request, $e);
    }
    $this->app['events']->dispatch(
        new RequestHandled($request, $response)
    );
    return $response;
}
```

### 2. `sendRequestThroughRouter()` Flow
The core orchestration: bootstrap → pipeline → dispatch:

```php
protected function sendRequestThroughRouter($request)
{
    $this->bootstrap();
    return (new Pipeline($this->app))
        ->send($request)
        ->through($this->app->shouldSkipMiddleware() ? [] : $this->middleware)
        ->then($this->dispatchToRouter());
}
```

### 3. The `bootstrap()` Guard
Calls `$this->app->bootstrapWith($this->bootstrappers())` only once per Application instance:

```php
public function bootstrap()
{
    if (! $this->app->hasBeenBootstrapped()) {
        $this->app->bootstrapWith($this->bootstrappers());
    }
}
```

### 4. `dispatchToRouter()` Closure
The final pipeline destination — this closure receives the request after all middleware passes:

```php
protected function dispatchToRouter()
{
    return function ($request) {
        $this->app->instance('request', $request);
        return $this->router->dispatch($request);
    };
}
```

---

## Mental Models

**The Factory Assembly Line.** The kernel is a factory floor supervisor. First, the assembly line must be initialized (bootstrappers: power on machines, load materials, configure tools). Then the product (request) travels through stations (middleware) where workers inspect, modify, and validate it. At the final station (router), the product is assembled into a finished good (response). The supervisor ensures each step happens in order and handles any production failures.

**The Security Checkpoint Hierarchy.** Think of `handle()` as the airport entrance, `bootstrap()` as the system initialization (checking ID scanners are on, baggage belts are running), the middleware pipeline as the security queue (TSA checks: shoes off, liquids out, bag scan), and `dispatchToRouter()` as the boarding gate where the passenger finally boards. The kernel ensures the airport is operational before any passenger enters the queue.

**The Onion Slicer.** Each middleware layer wraps the next, creating concentric rings around the core action (route dispatch). Code before `$next($request)` runs on the way in; code after `$next($request)` runs on the way out. The kernel is the hand that pushes the request through this onion from outermost to innermost layer, then catches the response as it emerges back out.

---

## Internal Mechanics

### Complete Kernel Dispatch Flow

```
┌──────────────────────────────────────────────────────────────────┐
│ Kernel::handle($request)                                          │
│                                                                   │
│ 1. enableHttpMethodParameterOverride()                            │
│    → Allows _method=PUT/DELETE in POST forms                      │
│                                                                   │
│ 2. sendRequestThroughRouter($request)                              │
│    │                                                              │
│    ├─ 2a. $this->bootstrap()                                      │
│    │    → if (! $app->hasBeenBootstrapped())                      │
│    │      → $app->bootstrapWith([                                 │
│    │           LoadEnvironmentVariables,                          │
│    │           LoadConfiguration,                                 │
│    │           HandleExceptions,                                  │
│    │           RegisterFacades,                                   │
│    │           RegisterProviders,                                 │
│    │           BootProviders,                                     │
│    │         ])                                                    │
│    │      → Dispatches bootstrapping:* / bootstrapped:* events    │
│    │                                                              │
│    ├─ 2b. new Pipeline($this->app)                                │
│    │    → send($request)                                          │
│    │    → through($this->middleware)  (global middleware array)   │
│    │    → via('handle')                                           │
│    │                                                              │
│    └─ 2c. then($this->dispatchToRouter())                         │
│         → Closure sets $app->instance('request', $request)        │
│         → $this->router->dispatch($request)                       │
│           → Router matches route → runs route middleware          │
│           → Calls controller/closure → returns Response           │
│                                                                   │
│ 3. Exception catch wraps any Throwable                            │
│    → $this->reportException($e)  (ExceptionHandler::report())     │
│    → $this->renderException($e)   (ExceptionHandler::render())    │
│                                                                   │
│ 4. Dispatch RequestHandled event (with request + response)         │
│                                                                   │
│ 5. Return $response to caller (public/index.php)                  │
└──────────────────────────────────────────────────────────────────┘
```

### Kernel Bootstrappers

The six bootstrappers execute in strict order via `Application::bootstrapWith()`:

```
Order | Bootstrapper                     | Responsibility
──────┼──────────────────────────────────┼──────────────────────────────
  1   | LoadEnvironmentVariables        | Read .env, set $_ENV
  2   | LoadConfiguration               | Merge config/*.php into repo
  3   | HandleExceptions                | Set error/exception handlers
  4   | RegisterFacades                 | Register Facade aliases
  5   | RegisterProviders               | Call register() on all providers
  6   | BootProviders                   | Call boot() on all providers
```

### Middleware Resolution

The kernel's `$middleware` property is populated from `bootstrap/app.php` via `->withMiddleware()`. In Laravel 11+, the kernel reads middleware configuration from the `ApplicationBuilder` middleware configuration rather than a user-defined `Kernel` class:

```php
// bootstrap/app.php (Laravel 11)
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(TrustProxies::class);
})
```

### Request Duration Lifecycle Handlers

```php
// Handlers registered via bootstrapping that fire after response send
public function whenRequestLifecycleDurationExceeds($threshold, $handler)
{
    // Handler receives ($request, $response)
    // Called after response send if request exceeded threshold
}
```

---

## Patterns

### 1. Custom Bootstrapper Injection
**When**: You need to run logic before all service providers register.
**How**: Extend the bootstrapper array by overriding in `bootstrap/app.php`:

```php
// Not natively supported via ApplicationBuilder — requires a service provider
class CustomBootstrapper implements Bootstrapable
{
    public function bootstrap(Application $app): void
    {
        // Run BEFORE all providers register
        $app->instance('critical.config', $customConfig);
    }
}
```

### 2. Middleware Bypass for Specific URIs
**When**: Health checks or webhooks must bypass global middleware.
**How**:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->excludeFromGlobal(
        '/health', '/webhook/*'
    );
})
```

### 3. Kernel Decorator for Response Transformation
**When**: You need uniform response transformation (e.g., JSON wrapping for API).
**How**: Extend the kernel and decorate `handle()`:

```php
class ApiKernel extends \Illuminate\Foundation\Http\Kernel
{
    public function handle($request)
    {
        $response = parent::handle($request);
        return response()->json([
            'data' => json_decode($response->getContent(), true),
            'meta' => ['timestamp' => now()],
        ]);
    }
}
```

---

## Architectural Decisions

**Why `bootstrap()` is guarded by `hasBeenBootstrapped()`.** FPM creates a fresh Application per request, so bootstrap runs every request (no duplication risk). Under Octane, the Application persists across requests — without the guard, bootstrappers would re-run on every request, resetting configuration, providers, and facades. The guard ensures one-time boot in both environments.

**Why middleware runs as a Pipeline rather than a loop.** The Pipeline pattern (`Illuminate\Pipeline\Pipeline`) enables both pre-request and post-response middleware code (the onion model). A simple foreach loop would only support pre-processing. Pipeline also handles exception propagation correctly — if middleware after `$next` throws, the wrapping middleware can catch and transform the exception.

**Why `dispatchToRouter()` is a closure rather than a direct call.** The closure is passed to `Pipeline::then()` as the final destination. This decouples the kernel from Pipeline internals — the Pipeline only knows it calls a callable at the end. The closure also captures `$this` scope, enabling access to `$this->router` without exposing it as public.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Bootstrap guard prevents re-execution | Unconventional behavior when Application is reset mid-request | If `hasBeenBootstrapped()` is reset, the kernel silently re-bootstraps, potentially duplicating provider registration |
| Pipeline enables onion middleware architecture | Pipeline adds ~0.2ms overhead per middleware layer | With 10+ middleware, overhead reaches 2-3ms — negligible for most apps but measurable in Octane |
| Exception wrapping in `handle()` centralizes error handling | All exceptions are caught, even those that should crash (e.g., out of memory) | Fatal errors mask underlying issues; use `HandleExceptions` bootstrapper's `report()` for visibility |
| Request Duration handlers are decoupled from middleware | Handlers run after `terminate()` — cannot modify response | Duration monitoring must use separate logging path, not response modification |

---

## Performance Considerations

- **Bootstrap is the dominant cost.** Each of the 6 bootstrappers has sub-millisecond cost individually, but `RegisterProviders` and `BootProviders` scale with provider count. With config cache, `LoadConfiguration` drops from ~15ms to ~0.1ms. With 60 providers (typical for an app with 20 packages), provider registration adds 5-15ms.
- **Pipeline carrier cost.** `Illuminate\Pipeline\Pipeline` uses array_reduce internally to compose middleware closures. Each middleware adds ~0.15ms for closure construction plus the middleware execution time. With 15 global middleware + 5 route middleware, pipeline overhead is ~3ms.
- **Request Duration handlers trigger after response send.** These handlers run outside the request time budget (after `fastcgi_finish_request()` or response `close()`). They process in the same PHP process but do not block the client. Heavy handlers (API calls, logging) can delay the next request in FPM.
- **`$request->enableHttpMethodParameterOverride()` is a no-op unless `_method` is present.** The Symfony method checks `_method` POST parameter. Empty check cost: ~0.01ms.

---

## Production Considerations

- **Monitor bootstrap time separately from route time.** Laravel Telescope's "Request Watcher" or custom middleware around `handle()` start time vs. `dispatchToRouter()` entry reveals bootstrap overhead. If bootstrap exceeds 50ms, enable config cache and audit provider count.
- **Use `php artisan optimize` in CI/CD.** Config cache eliminates `LoadConfiguration` provider iteration. Route cache eliminates route file parsing. Without these, bootstrap time doubles.
- **Audit middleware order.** The `$middlewarePriority` array (or `->withMiddleware()->priority()` in Laravel 11+) ensures middleware like `SubstituteBindings` runs after `StartSession` and `Authenticate`. Incorrect ordering causes subtle bugs (binding substitution attempting to load models before auth identity is established).
- **Under Octane, the bootstrap guard prevents re-initialization but middleware instances persist.** Every middleware resolved via the container is a singleton under Octane unless registered as `scoped()`. Test middleware instance independence.

---

## Common Mistakes

**Why it happens:** Developers call `$this->bootstrap()` manually inside service providers or middleware.  
**Why it's harmful:** If `hasBeenBootstrapped()` returns false (e.g., after Application flush in tests), it re-runs all bootstrappers, resetting configuration and double-registering providers.  
**Better approach:** Never call `bootstrap()` directly. If you need bootstrap-time logic, implement a custom bootstrapper.

**Why it happens:** Confusion between the kernel's middleware pipeline and route middleware.  
**Why it's harmful:** Adding global middleware that should be route-specific (e.g., `auth`) — every URL requires authentication, including static assets and webhooks.  
**Better approach:** Register route-specific middleware in `bootstrap/app.php` with `->withMiddleware(function ($m) { $m->api(/* ... */); })` or use middleware groups.

**Why it happens:** Developers assume `$middleware` runs before boot providers.  
**Why it's harmful:** Provider `boot()` depends on services registered by other providers. If a middleware triggered provider boot out of order, dependencies would be missing.  
**Better approach:** Trust the kernel ordering — bootstrappers → middleware → router. Middleware never causes provider registration.

---

## Failure Modes

**Failure: `hasBeenBootstrapped()` returns stale true.** If an Application instance is reused (test suites, Octane worker) and the flag is not reset, configuration may be stale. Detection: Configuration changes don't take effect without worker restart. Mitigation: In tests, call `$app->flush()` or use `RefreshDatabase` trait that resets Application state.

**Failure: Middleware returns non-Response object.** If a middleware returns `null` or an array instead of a Response, the Pipeline throws an unexpected type error. Detection: `TypeError: Return value of Pipeline::then() must be an instance of Symfony\Component\HttpFoundation\Response`. Mitigation: Add a response assertion helper or use `response()` macro to ensure type consistency.

**Failure: Kernel constructor fails due to missing Router binding.** The kernel constructor requires `Router` contract from container. If the Router is not bound (e.g., running in a context where `bootstrap/app.php` didn't configure routing), kernel instantiation throws. Detection: `Target [Illuminate\Contracts\Routing\Registrar] is not instantiable`. Mitigation: Ensure `->withRouting()` is called in `bootstrap/app.php`.

---

## Ecosystem Usage

**Laravel Horizon** relies on the Console kernel path, but Horizon's web dashboard uses the HTTP kernel. The Horizon service provider registers its own routes via `Route::group()`, which get processed by the HTTP kernel's `dispatchToRouter()` closure — the same path as application routes.

**Laravel Pulse** uses the HTTP kernel's duration lifecycle handlers (`whenRequestLifecycleDurationExceeds`) to record slow request warnings. Pulse registers a handler in its service provider that captures request timing data after the response is sent.

**Spatie's Laravel Health** package registers routes that bypass global middleware via the kernel's middleware exclusion API, ensuring health check endpoints remain fast and independent of session/auth middleware overhead.

**Akaunting** (open-source accounting) extends the HTTP kernel to add multi-tenant middleware at the global level, demonstrating how custom global middleware can intercept requests before routing to establish tenant context (database connection, configuration) for the entire request lifecycle.

---

## Related Knowledge Units

### Prerequisites
- Entry Point Mechanics (the flow that enters the kernel)
- Application Bootstrap (Application initialization before kernel dispatch)
- Service Container (kernel and router resolution)

### Related Topics
- Middleware Pipeline (the Pipeline class used by `sendRequestThroughRouter()`)
- Console Kernel Dispatch (parallel dispatch path for CLI)
- Boot Order & Timing (the exact sequence within `bootstrap()`)
- Response Sending and Termination (the output side after kernel handle)
- Kernel Architecture (HTTP kernel class hierarchy and bootstrapper array)
- Lifecycle Events and Hooks (RequestHandled event, bootstrap events)

### Advanced Follow-up Topics
- Custom Kernel Implementations
- Middleware Bypass and Security Internals
- Octane Lifecycle Differences
- Pipeline Pattern and Middleware Resolution Internals
- Request Duration Lifecycle Handler Optimization

---

## Research Notes

### Source Analysis
- `Illuminate\Foundation\Http\Kernel` — The central HTTP kernel class with `handle()`, `bootstrap()`, `sendRequestThroughRouter()`, and `dispatchToRouter()`.
- `Illuminate\Pipeline\Pipeline` — The carrier that composes middleware layers using `array_reduce` and invokes the destination closure.
- `Illuminate\Foundation\Application::bootstrapWith()` — Orchestrates the six bootstrappers in strict order, dispatching bootstrap events before/after each.
- `Illuminate\Foundation\Http\Kernel::dispatchToRouter()` — Closure passed to `Pipeline::then()` that sets request instance and calls `$this->router->dispatch()`.
- `Illuminate\Foundation\Configuration\ApplicationBuilder` — Laravel 11+ fluent API for middleware configuration.
- `Illuminate\Contracts\Http\Kernel` — The contract interface that enables kernel swapping for testing and Octane.

### Key Insight
The HTTP kernel implements the Template Method pattern: `handle()` defines the skeleton algorithm (try/catch → bootstrap → pipeline → dispatch → event), while `sendRequestThroughRouter()`, `bootstrap()`, and `dispatchToRouter()` are the overridable steps. The bootstrap guard (`$app->hasBeenBootstrapped()`) is the critical performance switch: in FPM it runs on every request; under Octane it runs once per worker. Misunderstanding this guard leads to deployment-specific bugs where configuration changes fail to take effect until worker restart, or where middleware behavior differs between FPM and Octane.

### Version-Specific Notes
- **Laravel 10**: Dedicated `App\Http\Kernel` class with `$middleware`, `$middlewareGroups`, `$routeMiddleware` properties. `bootstrap/app.php` returns a simple Application.
- **Laravel 11**: `App\Http\Kernel` removed. Middleware configured in `bootstrap/app.php` via `->withMiddleware()`. `ApplicationBuilder` introduced.
- **Laravel 12**: `whenRequestLifecycleDurationExceeds` added for post-response monitoring. Middleware bypass API (`->excludeFromGlobal()`) formalized.
- **Laravel 13**: Custom bootstrapper injection support via ApplicationBuilder. Pipeline performance optimizations reduce middleware carrier overhead.
