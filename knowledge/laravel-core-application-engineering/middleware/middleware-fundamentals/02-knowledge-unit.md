# Middleware Fundamentals

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Middleware Fundamentals
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Middleware is the architectural layer that intercepts HTTP requests before they reach the application's business logic and HTTP responses after the business logic produces them. It implements the Pipeline pattern — a nested closure chain where each middleware wraps the next, enabling both pre-processing on the request inbound and post-processing on the response outbound.

The engineering significance of middleware is that it provides a single extensibility point for cross-cutting concerns — authentication, rate limiting, CORS, session management, and security headers — without coupling those concerns to controllers, services, or domain logic. Every request passes through the same pipeline, making middleware the universal filter for HTTP concerns that do not belong in the application's business layer.

---

## Core Concepts

### The Pipeline Pattern
Middleware does not use the Decorator pattern (wrapping a single object with layers) or the Chain of Responsibility pattern (each handler decides whether to pass along). It uses the Pipeline pattern — an ordered array of "pipes" through which a "passable" object (the Request) flows sequentially, with each pipe able to modify, inspect, or short-circuit the flow.

The pipeline is constructed by `array_reduce` over the reversed middleware array, creating nested closures. The outermost closure calls the first middleware's `handle()`. When the middleware calls `$next($request)`, it invokes the next closure, which is the next middleware's `handle()`. This continues until the destination closure (the controller) is reached.

### The Two-Pass Execution Model
Middleware executes in two passes:
1. **Inbound (pre-processing)**: Code before `$next($request)` runs as the request travels inward through the pipeline.
2. **Outbound (post-processing)**: Code after `$next($request)` runs in reverse middleware order as the response travels outward through the pipeline.

A middleware that only runs code before `$next` is "pre-middleware." A middleware that only runs code after `$next` is "post-middleware." A middleware that does both is both.

### Global vs Route Pipeline
Laravel runs middleware in two distinct pipelines:

1. **Global pipeline**: Runs every request through `$middleware` (global array) before routing occurs.
2. **Route pipeline**: After routing, runs the route-specific middleware (group middleware + route middleware + controller middleware) through a second pipeline.

Both use the same `Pipeline` class but are constructed and executed independently by the `Kernel`.

---

## Mental Models

### The Onion
Each middleware is a layer of an onion. The request travels through layers from outside to inside until it reaches the core (the controller). The response then travels back through the same layers in reverse order. A middleware layer can refuse entry (short-circuit) or modify the request on the way in and the response on the way out.

### The Russian Doll
Each middleware is a nesting doll. `$next` is the next doll inside. When a middleware calls `$next($request)`, it opens its outer shell and passes control to the next inner doll. When the inner doll returns a response, the outer doll closes its shell around it and returns to the next outer doll.

### The Assembly Line
Middleware is an assembly line where each station inspects or modifies the product (request) before passing it to the next station. After the product is assembled (the controller produces a response), it travels back through the same stations in reverse order for quality control (response modification).

---

## Internal Mechanics

### Pipeline Construction via array_reduce
The `Pipeline::then()` method constructs the middleware chain using `array_reduce` over the reversed middleware array:

```php
public function then(Closure $destination)
{
    $pipeline = array_reduce(
        array_reverse($this->pipes),
        $this->carry(),
        $this->prepareDestination($destination)
    );
    return $pipeline($this->passable);
}
```

`array_reverse` is necessary because `array_reduce` processes left-to-right, but the pipeline must execute left-to-right (first middleware first). Reversing the array so the first middleware is on the outside of the closure chain achieves the correct execution order.

### The carry() Closure
The `carry()` method returns a closure that, for each pipe, creates a new closure wrapping the previous stack:

```php
protected function carry()
{
    return function ($stack, $pipe) {
        return function ($passable) use ($stack, $pipe) {
            if (is_callable($pipe)) {
                return $pipe($passable, $stack);
            }
            $pipeInstance = Container::getInstance()->make($pipe);
            $parameters = [$passable, $stack];
            return $pipeInstance->handle(...$parameters);
        };
    };
}
```

Each middleware is resolved from the container via `Container::make()`. The resolved parameters are `[$passable, $stack]` — the request and the next closure. If the middleware has additional parameters (from `:` syntax), they are extracted and appended.

### then() vs thenReturn()
- `then($destination)`: Passes the final value through `$destination` (a closure that calls the controller) and returns its result.
- `thenReturn()`: Returns the final value directly without a destination closure — used when the last step in the pipeline is the destination itself.

In Laravel's routing pipeline, the destination closure calls `$route->run()` which triggers controller dispatch.

### Container Resolution Per Middleware
Each middleware is resolved fresh from the container via `Container::make()`. This means:
- Constructor injection works for middleware dependencies.
- Each invocation of a middleware creates a new instance (unless bound as singleton).
- The same middleware class can appear multiple times in the pipeline (each gets its own instance).

### Kernel's Two-Pipeline Architecture
The `Kernel::handle()` method:
1. Calls `$app->bootstrap()` to load service providers and configuration.
2. Calls `sendRequestThroughRouter($request)` which runs the global middleware pipeline.
3. After global middleware passes, calls `$router->dispatch($request)`.
4. The router matches the route, gathers route-specific middleware, sorts by priority, and runs the route middleware pipeline.
5. The final destination calls `$route->run()` → controller dispatch.

---

## Patterns

### Pre-Middleware Pattern
Code runs before `$next($request)`. The middleware can inspect the request, modify it, or short-circuit it.

- **Purpose**: Gatekeeping — decide whether the request should proceed.
- **Benefits**: Prevents unauthorized or invalid requests from reaching business logic.
- **Tradeoffs**: Pre-middleware runs on every request — must be fast or cached.

### Post-Middleware Pattern
Code runs after `$response = $next($request)`. The middleware can inspect or modify the response.

- **Purpose**: Response augmentation — add headers, compress, wrap in envelope.
- **Benefits**: Response modifications are decoupled from controllers.
- **Tradeoffs**: Post-middleware cannot prevent the controller from executing.

### Combined Pre/Post Pattern
Code runs both before and after `$next($request)`:

```php
public function handle(Request $request, Closure $next): Response
{
    // Pre: capture start time
    $start = microtime(true);
    
    $response = $next($request);
    
    // Post: calculate duration, add header
    $response->headers->set('X-Duration', (microtime(true) - $start) * 1000);
    
    return $response;
}
```

- **Purpose**: Operations that need both inbound and outbound context (timing, transaction management).
- **Benefits**: Single middleware handles both phases without needing two separate classes.
- **Tradeoffs**: The pre and post phases are coupled in the same class — cannot be independently configured.

### Short-Circuit Pattern
Middleware returns a response directly without calling `$next($request)`:

- **Purpose**: Terminate the request before it reaches the controller (auth redirect, 403, 429).
- **Benefits**: Business logic is never executed for rejected requests — saves resources.
- **Tradeoffs**: The response bypasses subsequent middleware. Headers added by downstream middleware are missing. Short-circuited responses must be complete.

---

## Architectural Decisions

### Why Pipeline Over Decorator or Chain of Responsibility
The Pipeline pattern was chosen over alternatives because:
1. The middleware order is determined by configuration, not by class hierarchy (unlike Decorator).
2. Every middleware executes on every request (unlike Chain of Responsibility where one handler handles and stops).
3. The pipeline provides two-pass execution (inbound + outbound), which neither Decorator nor CoR naturally support.

### Why Two Pipelines (Global + Route)
The two-pipeline architecture separates infrastructure middleware (trusted proxies, CORS, maintenance mode, input sanitization) from application middleware (auth, throttle, bindings). Infrastructure middleware must run before routing, because they modify how the request is interpreted. Application middleware requires the route context (which guard, which limiter, which model binding).

### Why Middleware Is Resolved Per Request
Middleware instances are resolved fresh each request to prevent state leakage. If a middleware stored per-request data on instance properties and was reused across requests (Octane), that data would leak. Fresh resolution ensures each request gets a clean middleware instance.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Pipeline pattern gives predictable execution order | Closure construction overhead per request | ~0.01ms per middleware — negligible |
| Fresh container resolution per request prevents state leakage | Constructor dependencies resolved per request, not cached | For expensive middleware deps, consider singletons |
| Two-pipeline architecture separates concerns | Middleware registration spread across multiple files | Laravel 11+ consolidates in bootstrap/app.php |
| Short-circuit prevents unnecessary business logic | Short-circuited responses skip downstream middleware | Ensure short-circuit responses are complete (headers, cookies) |

---

## Performance Considerations

### Pipeline Construction Overhead
Each middleware in the pipeline adds one closure allocation. For a typical route with 8 middleware, the pipeline creates 8 closures plus the destination closure. This adds approximately 0.01-0.05ms per route — negligible for single requests but measurable in high-throughput scenarios (10,000+ RPM).

### Container Resolution Overhead
Each middleware is resolved via `Container::make()`, which reflects on the constructor. For middleware with simple dependencies (no constructor or only built-in type hints), this is ~0.01ms. For middleware with deep dependency chains, resolution adds ~0.05-0.1ms per middleware. In an 8-middleware pipeline, this totals ~0.1-0.8ms.

### Global Middleware on Every Request
Global middleware (trusted proxies, CORS, maintenance mode, input sanitization) runs on EVERY request, including asset requests and health checks. A global middleware that performs a database query or external API call adds that latency to every response, not just application routes.

---

## Production Considerations

### Middleware Ordering Documentation
Every Laravel project should document the middleware priority list and explain why each middleware is ordered where it is. Without documentation, developers add middleware without understanding where in the pipeline it should run.

### Middleware Performance Budget
Establish a per-middleware performance budget. If a middleware adds more than 5ms to every request, it needs optimization (caching, deferred execution, or reconsideration of whether it belongs in the pipeline).

### Monitoring Middleware Execution
Use terminable middleware or service provider hooks to record middleware execution time per route. Sudden increases in middleware execution time indicate configuration drift, cache misses, or upstream service degradation.

### Octane Statelessness
In Octane, middleware instances may persist across requests if bound as singletons. Any middleware that stores per-request data on `$this` leaks that data to subsequent requests. Use `$request->attributes->set()` instead of instance properties for per-request data.

---

## Common Mistakes

### Middleware as Business Logic Layer
The most common mistake is placing business logic in middleware because "it runs before the controller." Middleware is for cross-cutting concerns — concerns that affect all or many routes. Business logic belongs in services and actions.

### Assuming $next Always Returns Response
`$next($request)` can throw an exception instead of returning a response. Middleware that calls `$response = $next($request)` and then manipulates `$response` without considering the exception path will fail with a type error or access null properties.

### Modifying Request Input Without Awareness
Using `$request->merge()` or `$request->request->set()` in middleware modifies the user's input. Controllers using `$request->all()` or `$request->validated()` receive the modified data, which may bypass intended constraints. Use `$request->attributes->set()` for middleware-to-controller communication.

### Not Returning the Response
Forgetting `return $next($request)` is the most common middleware bug. Without the return, the response is discarded, and the pipeline returns null. Laravel converts null to an empty 200 response, masking the issue.

---

## Failure Modes

### Middleware State Leakage in Octane
A middleware that stores per-request data on an instance property (e.g., `$this->startTime = microtime(true)`) leaks that data when the middleware instance is reused across requests in Octane. The solution: use `$request->attributes->set()` for per-request state.

### Short-Circuit Bypassing Downstream Middleware
A middleware that returns `response('Unauthorized', 401)` without calling `$next` skips all subsequent middleware in the pipeline. If downstream middleware was expected to add security headers or compress the response, those modifications are missing from the short-circuit response.

### Global Middleware Modifying API Responses
A global middleware that modifies responses (e.g., adding CSRF cookie) runs on API routes where it is not needed. API responses carry unnecessary overhead. Solution: add response-modifying middleware to the `web` group only, not globally.

---

## Ecosystem Usage

### Laravel Horizon
Horizon registers route-level middleware for dashboard authentication (`auth`, `can:viewHorizon`). It does not use global middleware — all middleware is assigned at the route group level.

### Laravel Sanctum
Sanctum registers `EnsureFrontendRequestsAreStateful` middleware for SPA cookie authentication. It adds middleware to the `api` group automatically via `install:api`.

### Spatie Laravel Permission
Provides parameterized middleware for role and permission checking: `RoleMiddleware`, `PermissionMiddleware`, `RoleOrPermissionMiddleware`. Usage: `Route::middleware('role:admin,super-admin')`.

### Spatie CORS
Provides CORS middleware that handles preflight OPTIONS requests and adds CORS headers. In earlier Laravel versions, Spatie's CORS package was the standard. In Laravel 11+, the framework's built-in `HandleCors` middleware replaces it.

---

## Related Knowledge Units

### Prerequisites
- Bootstrapping Lifecycle — how the Kernel is configured and booted
- Route Definition — how middleware is assigned to routes

### Related Topics
- Middleware Lifecycle — the complete request flow through the middleware pipeline
- Middleware Ordering and Priority — how middleware execution order is determined
- Controller Middleware — middleware assigned at the controller level

### Advanced Follow-up Topics
- Parameterized Middleware — passing configuration to middleware
- Terminable Middleware — post-response execution
- Cross-Cutting Concerns — the architectural framework for deciding what belongs in middleware

---

## Research Notes

- Laravel uses `Illuminate\Pipeline\Pipeline` for middleware execution, not Symfony's `HttpKernelInterface::TERMINABLE` or `EventDispatcher` middleware patterns. The Pipeline class was written specifically for Laravel's middleware model.
- The `then()` vs `thenReturn()` distinction is subtle: `then()` wraps the final passable in a destination callback; `thenReturn()` returns the passable directly. In the middleware context, the destination callback is the route's controller dispatch.
- The two-pipeline architecture (global then route) is unique to Laravel. Symfony uses a single middleware stack. Laravel's approach enables infrastructure middleware to run before routing logic, which is necessary for request modification (trusted proxies, CORS) that affects route matching.
- Container resolution per middleware means every middleware instance is freshly created. This is a deliberate design choice to prevent state leakage, but it means middleware cannot directly hold per-request state across the pipeline — they must use the request object as a state carrier.