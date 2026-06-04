# ECC Standardized Knowledge — Middleware Fundamentals

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Middleware Fundamentals |
| **Difficulty** | Foundation |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Middleware is the architectural layer that intercepts HTTP requests before they reach the application's business logic and HTTP responses after the business logic produces them. It implements the Pipeline pattern — a nested closure chain where each middleware wraps the next, enabling both pre-processing on the request inbound and post-processing on the response outbound.

The engineering significance of middleware is that it provides a single extensibility point for cross-cutting concerns — authentication, rate limiting, CORS, session management, and security headers — without coupling those concerns to controllers, services, or domain logic. Every request passes through the same pipeline, making middleware the universal filter for HTTP concerns that do not belong in the application's business layer.

---

## Core Concepts

### The Pipeline Pattern

Middleware uses the Pipeline pattern — an ordered array of "pipes" through which a "passable" object (the Request) flows sequentially, with each pipe able to modify, inspect, or short-circuit the flow. The pipeline is constructed by `array_reduce` over the reversed middleware array, creating nested closures. When a middleware calls `$next($request)`, it invokes the next closure, which is the next middleware's `handle()`. This continues until the destination closure (the controller) is reached.

### The Two-Pass Execution Model

Middleware executes in two passes: inbound (pre-processing) code before `$next($request)` runs as the request travels inward, and outbound (post-processing) code after `$next($request)` runs in reverse middleware order as the response travels outward. A middleware can be pre-only, post-only, both, or pass-through.

### Global vs Route Pipeline

Laravel runs middleware in two distinct pipelines. The global pipeline runs every request through `$middleware` (global array) before routing occurs. After routing, the route-specific middleware (group middleware + route middleware + controller middleware) runs through a second pipeline. Both use the same `Pipeline` class but are constructed and executed independently by the `Kernel`.

### Container Resolution Per Middleware

Each middleware is resolved fresh from the container via `Container::make()`. Constructor injection works for middleware dependencies. Each invocation creates a new instance (unless bound as singleton). The same middleware class can appear multiple times in the pipeline.

---

## When To Use

- **Global middleware** for infrastructure concerns that must run before routing: trusted proxies, CORS, maintenance mode, input sanitization.
- **Route group middleware** for application concerns shared by route collections: session management, CSRF, rate limiting for API routes.
- **Route middleware** for per-route concerns: authentication, authorization, specific rate limits.
- **Pre-middleware pattern** for gatekeeping — decide whether the request should proceed (auth, throttle, CSRF).
- **Post-middleware pattern** for response augmentation — add headers, compress, wrap in envelope (security headers, CORS, timing).
- **Combined pre/post pattern** for operations that need both inbound and outbound context (request timing, transaction management).
- **Short-circuit pattern** for terminating requests before they reach the controller (auth redirect, 403 response, 429 response).

---

## When NOT To Use

- Do NOT place business logic in middleware — middleware is for cross-cutting HTTP concerns, not domain rules.
- Do NOT assume `$next($request)` always returns a Response — it can throw an exception.
- Do NOT use `$request->merge()` for middleware-to-controller communication — use `$request->attributes->set()` instead.
- Do NOT forget to `return $next($request)` — forgetting the return discards the response and produces an empty 200 response.
- Do NOT register response-modifying middleware (CORS, security headers) as global if they only apply to specific route groups (API vs web).

---

## Best Practices (WHY)

- **Use the Pipeline pattern** because it provides predictable execution order, two-pass execution, and container resolution per middleware. The pipeline is constructed by `array_reduce` over the reversed middleware array — this is the foundation of all middleware behavior.
- **Separate global and route pipelines** because infrastructure middleware (trusted proxies, CORS) must run before routing, while application middleware (auth, throttle) needs route context. This two-pipeline architecture is unique to Laravel and enables both layers to function independently.
- **Resolve middleware per request** to prevent state leakage. If middleware stored per-request data on instance properties and was reused across requests (in Octane), that data would leak. Fresh resolution ensures each request gets a clean middleware instance.
- **Use `$request->attributes->set()` for middleware-to-controller communication.** The attributes bag is serialized and persists through the pipeline. Modifying `$request->merge()` pollutes user input and affects `$request->all()` and `$request->validated()`.
- **Document the middleware priority list.** Every Laravel project should document why each middleware is ordered where it is. Without documentation, developers add middleware without understanding where in the pipeline it should run.

---

## Architecture Guidelines

- **Pipeline construction:** `array_reduce` over reversed middleware array creates the nested closure chain. The first middleware in the array is the outermost closure — it runs first.
- **Global pipeline:** Runs before routing via `Kernel::sendRequestThroughRouter()`. Cannot access route parameters.
- **Route pipeline:** Runs after routing via `Router::dispatch()`. Can access route parameters, route-level configuration.
- **Short-circuit behavior:** A middleware that returns a response without calling `$next` prevents all subsequent middleware from executing. The response bypasses downstream middleware.
- **Middleware registration (Laravel 11+):** `bootstrap/app.php` via `->withMiddleware()`. Fluent API replaces `Kernel.php` property arrays.
- **Middleware registration (Laravel 10-):** `app/Http/Kernel.php` via `$middleware`, `$middlewareGroups`, `$routeMiddleware` properties.
- **Octane statelessness:** Middleware instances may persist across requests if bound as singletons. Use `$request->attributes->set()` instead of instance properties for per-request data.

---

## Performance

Each middleware in the pipeline adds one closure allocation (~0.01-0.05ms per middleware). Container resolution for each middleware adds ~0.01-0.1ms depending on dependency depth. For a typical route with 8 middleware, total overhead is ~0.1-0.8ms. Global middleware runs on EVERY request, including asset requests and health checks — keep global middleware minimal. Short-circuit middleware saves the cost of downstream middleware and controller dispatch.

---

## Security

Middleware is the first line of defense for request security. Auth middleware prevents unauthenticated access. Rate limiting prevents abuse. CSRF protection prevents cross-site request forgery. Security headers prevent common web vulnerabilities. Each middleware class should handle exactly one security concern. The Pipeline pattern ensures that security middleware executes in a predictable order independent of registration order (via the priority system).

---

## Common Mistakes

- **Middleware as business logic layer:** Placing business rules in middleware because "it runs before the controller." Middleware is for cross-cutting HTTP concerns; business logic belongs in services and actions.
- **Forgetting to return $next($request):** The most common middleware bug. Without the return, the response is discarded, and the pipeline returns null. Laravel converts null to an empty 200 response, masking the issue.
- **Modifying request input without awareness:** Using `$request->merge()` in middleware modifies user input. Controllers using `$request->all()` or `$request->validated()` receive the modified data, which may bypass intended constraints.
- **Assuming $next always returns Response:** `$next($request)` can throw an exception. Middleware that manipulates `$response` without considering the exception path will fail with a type error.

---

## Anti-Patterns

- **Middleware with multiple unrelated concerns.** A `UserMiddleware` that checks auth, loads profile, checks subscription, and sets locale violates single responsibility. Each concern should be its own middleware class.
- **Heavy database queries in global middleware.** A global middleware querying the database for every request (tenant resolution, feature flags) adds database load to every response, including 404s and asset requests.
- **Short-circuit responses missing downstream headers.** A middleware that short-circuits with a 401 or 403 bypasses downstream middleware that would add security headers. Ensure short-circuit responses include all necessary headers.
- **Middleware that stores per-request state on instance properties.** In Octane, this leaks state across requests. Use `$request->attributes->set()` instead.

---

## Examples

### Pre-Middleware (Gatekeeping)
```php
class EnsureUserIsSubscribed
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->subscribed()) {
            return redirect()->route('subscription.required');
        }
        return $next($request);
    }
}
```

### Post-Middleware (Response Augmentation)
```php
class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        return $response;
    }
}
```

### Combined Pre/Post (Request Timing)
```php
class ResponseTimingMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);
        $response->headers->set('X-Duration', (microtime(true) - $start) * 1000);
        return $response;
    }
}
```

### Short-Circuit (Auth Redirect)
```php
class Authenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            return redirect('/login');
        }
        return $next($request);
    }
}
```

---

## Related Topics

- **Bootstrapping Lifecycle** (prerequisite) — how the Kernel is configured and booted.
- **Route Definition** (prerequisite) — how middleware is assigned to routes.
- **Middleware Lifecycle** — the complete request flow through the middleware pipeline.
- **Middleware Ordering and Priority** — how middleware execution order is determined.
- **Controller Middleware** — middleware assigned at the controller level.
- **Parameterized Middleware** — passing configuration to middleware.
- **Terminable Middleware** — post-response execution.
- **Cross-Cutting Concerns** — the architectural framework for deciding what belongs in middleware.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Routing (prerequisite). Serves as prerequisite for all other middleware KUs.
- **Core pattern:** Pipeline via `array_reduce` over reversed middleware array. First middleware in array = outermost closure = runs first.
- **Two-pass execution:** Code before `$next` = inbound (pre-processing). Code after `$next` = outbound (post-processing in reverse order).
- **Two pipelines:** Global runs before routing; route pipeline runs after routing. Both use the same Pipeline class.
- **Fresh resolution per middleware:** Each middleware is resolved via `Container::make()` — prevents state leakage.
- **Short-circuit prevention:** A middleware that returns without calling `$next` prevents all downstream middleware AND the controller from executing.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Pipeline pattern explained | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Global vs route pipeline documented | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
