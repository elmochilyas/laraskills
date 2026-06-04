# Custom Middleware

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Custom Middleware
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Custom middleware allows application-specific cross-cutting concerns to be injected into the HTTP pipeline. Unlike controllers or services which handle business logic, custom middleware handles HTTP-level policies — authentication, authorization, request modification, response decoration, and short-circuit conditions that apply across multiple routes.

The engineering significance of custom middleware is that it provides the mechanism for encapsulating HTTP concerns without coupling them to routes or controllers. A `CheckRole` middleware centralizes role verification logic so that individual controllers do not need to check roles. A `LogRequest` middleware captures request data for audit independently of route handlers. The discipline of custom middleware design (single concern per middleware, clean handle/terminate separation, parameterization for reuse) directly affects the maintainability of the pipeline layer.

---

## Core Concepts

### The handle() Contract
Every middleware implements a `handle()` method with a fixed signature:

```php
public function handle(Request $request, Closure $next): Response
```

- `$request` is the current HTTP request (can be modified before passing).
- `$next` is a closure representing the next middleware in the pipeline (or the controller if this is the last).
- `Response` return type — any `Symfony\Component\HttpFoundation\Response` subclass.

### Three Execution Paths
A middleware `handle()` method has exactly three possible paths:

1. **Pass through**: Call `$next($request)` and return its response (with optional pre/post modification).
2. **Short-circuit**: Return a response directly without calling `$next` (guards, redirects, errors).
3. **Modify and pass**: Modify the request, call `$next($modifiedRequest)`, return the response.

### Constructor Injection
Custom middleware receives its dependencies through the constructor, resolved by the container:

```php
class LogRequestMiddleware
{
    public function __construct(
        private RequestLogger $logger,
    ) {}

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        $this->logger->log($request, $response);
        return $response;
    }
}
```

Constructor injection is available because middleware is resolved via `Container::make()` in the Pipeline.

---

## Mental Models

### Middleware as a Security Guard
A middleware is a guard at a checkpoint. The guard can:
- Let the visitor through (`$next($request)`)
- Redirect the visitor (return a redirect response)
- Refuse entry (return a 403 or 401 response)
- Request ID verification before entry (check a token, then let through)

Each guard checks ONE thing. A building does not have one guard who checks ID, checks bags, and collects parking fees — it has separate guards at separate checkpoints.

### Middleware as a Filter
A middleware is a filter that water (the request) passes through. Some filters remove impurities (input sanitization). Some add flavor (response headers). Some stop the flow entirely if the water is contaminated (validation). Each filter does one job and passes the water to the next filter.

### Single Concern per Middleware
A middleware named `CheckRole` checks roles. It does not log requests, throttle, or set headers. The name must communicate exactly one concern. If a middleware needs to do multiple things, extract each concern into its own middleware and compose them in the route definition.

---

## Internal Mechanics

### Container Resolution in Pipeline
When the pipeline encounters a middleware class string (e.g., `\App\Http\Middleware\CheckRole::class`), it resolves it via the container:

```php
$pipeInstance = Container::getInstance()->make($pipe);
$parameters = [$passable, $stack];
return $pipeInstance->handle(...$parameters);
```

The middleware is resolved FRESH each time the pipeline runs. This means:
- Constructor injection works.
- Dependencies from the container are injected.
- The middleware instance is NOT shared across requests (unless bound as singleton).

### Closure Middleware
Middleware can also be defined inline as a closure:

```php
Route::get('/admin', function () { ... })
    ->middleware(function (Request $request, Closure $next) {
        if (! $request->user()?->isAdmin()) {
            abort(403);
        }
        return $next($request);
    });
```

Closure middleware is NOT resolved from the container — it is called directly in the `carry()` function. Closure middleware cannot use constructor injection.

### The Route::controllerMiddleware() Three-Path Resolver
When controller middleware is registered via `HasMiddleware` interface, `#[Middleware]` attribute, or constructor `$this->middleware()`, the `Route::controllerMiddleware()` method resolves them through three paths:

1. **Attribute path**: Reads `#[Middleware]` and `#[MiddlewareAlias]` attributes from the controller class and methods.
2. **Static path**: Calls `HasMiddleware::middleware()` if the controller implements the interface.
3. **Trait path**: Uses `FiltersControllerMiddleware` trait on the controller (for Laravel 10- style).

All three feed into the same middleware array that gets merged with route and group middleware.

---

## Patterns

### Guard Middleware Pattern
Middleware that checks a condition and short-circuits if not met:

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

- **Purpose**: Gate access to routes based on user state.
- **Benefits**: Centralized gating logic; controllers do not check subscription status.
- **Tradeoffs**: The middleware must be added to every protected route.

### Logging Middleware Pattern
Middleware that records request/response data without affecting the flow:

```php
class RequestAuditMiddleware
{
    public function __construct(private AuditLogger $logger) {}

    public function handle(Request $request, Closure $next): Response
    {
        $start = microtime(true);
        $response = $next($request);
        
        $this->logger->record([
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'status' => $response->getStatusCode(),
            'duration' => (microtime(true) - $start) * 1000,
        ]);
        
        return $response;
    }
}
```

- **Purpose**: Capture request data for observability.
- **Benefits**: No controllers need logging logic.
- **Tradeoffs**: Logging runs on every request — must be fast or async.

### Request Enrichment Pattern
Middleware that adds data to the request before passing it downstream:

```php
class ResolveTenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::findByDomain($request->getHost());
        $request->attributes->set('tenant', $tenant);
        app()->instance(Tenant::class, $tenant);
        return $next($request);
    }
}
```

- **Purpose**: Enrich the request with resolved data for downstream use.
- **Benefits**: Controllers and services receive resolved data without repeating resolution logic.
- **Tradeoffs**: The middleware runs on every request — caching the resolution is essential.

### Short-Circuit Middleware Pattern
Middleware that terminates the request before calling `$next`:

- **Purpose**: Block requests that do not meet preconditions.
- **Benefits**: Downstream middleware and controller never execute — saves resources.
- **Tradeoffs**: Short-circuit responses must be fully formed (headers, cookies) since downstream response middleware will not run.

---

## Architectural Decisions

### When to Create Custom Middleware vs Logic in Controller
Create custom middleware when the concern:
1. Applies to multiple routes (cross-cutting).
2. Is HTTP-specific (redirects, status codes, headers).
3. Can short-circuit the request independently.
4. Does not require domain data beyond what the request carries.

Keep logic in the controller/service when the concern:
1. Applies to a single route or action.
2. Is domain-specific (business rules, calculations).
3. Requires domain model state beyond request data.
4. Produces domain-specific responses (not just HTTP status codes).

### Single Middleware vs Middleware Chain
If a middleware class has multiple responsibilities (e.g., `AuthAndRoleMiddleware`), split it into separate middleware classes (`Authenticate`, `CheckRole`). A middleware chain with focused middleware is more flexible, testable, and reusable than a single middleware with multiple concerns.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized cross-cutting logic | Middleware adds latency to every route it protects | Keep middleware fast; use caching for resolution logic |
| Constructor injection for dependencies | Middleware must be resolved per request | Resolved via container — standard Laravel DI |
| Single-concern middleware is reusable | More middleware classes = more file management | Organize by concern, not by route |
| Short-circuit prevents unnecessary work | Short-circuited responses skip downstream middleware | Ensure short-circuit responses include all necessary headers |
| Closure middleware is inline and local | Closure middleware cannot use container DI | Use class middleware for most cases; closure only for trivial checks |

---

## Performance Considerations

### Resolution Overhead
Each custom middleware is resolved via `Container::make()`. For middleware with no constructor dependencies, resolution is ~0.01ms. For middleware with 5+ deep dependencies, resolution adds ~0.1ms. This overhead applies to every request using that middleware.

### Caching Middleware Results
Middleware that resolves data from the database (e.g., tenant resolution, feature flags) should cache results to avoid per-request database queries. Use Laravel's cache facade or the request's attributes to avoid redundant resolution.

### Short-Circuit Performance Benefit
A middleware that short-circuits early (e.g., unauthenticated redirect) prevents all downstream middleware from executing. This is a net performance gain — the cost of the guard middleware is offset by the savings from skipped middleware and controller dispatch.

---

## Production Considerations

### Naming Convention
Custom middleware should be named by the concern it handles, not the controller or route it protects:
- Good: `CheckRole`, `TrimStrings`, `ForceJson`, `LogRequest`
- Bad: `UserMiddleware`, `AdminMiddleware`, `DashboardMiddleware`

The name must communicate what the middleware DOES, not WHERE it is used.

### Registration Documentation
Every custom middleware should document:
1. What concern it handles.
2. When it should be registered (global, group, route).
3. Any parameters it accepts.
4. Where it should appear in the middleware priority list.

### Testing Custom Middleware
Test each path through the middleware:
1. The condition that allows `$next($request)` to execute (happy path).
2. The condition that short-circuits (each guard condition).
3. The modification made to the request or response (assert on the modified object).

---

## Common Mistakes

### Middleware with Multiple Responsibilities
A middleware named `UserMiddleware` that checks auth, loads profile, checks subscription, and sets locale violates single responsibility. It cannot be composed selectively because all four actions always run together. Split into separate middleware classes.

### Heavy Database Queries in Global Middleware
A global middleware that queries the database to resolve the current tenant, check a feature flag, or verify a subscription status adds database load to EVERY request, including 404 responses. Cache aggressively or move to route-level registration if not all routes need the resolution.

### Not Returning $next($request)
Forgetting the `return` keyword before `$next($request)` causes the middleware to discard the response. The pipeline returns null, and Laravel converts null to an empty 200 response. The bug is silent — no error, just missing content.

### Closure Middleware with External Dependencies
Closure middleware cannot use constructor injection, so developers often use facades or `app()` helper inside the closure. This couples the closure middleware to the container and bypasses explicit dependency declaration. Use class middleware when dependencies are needed.

---

## Failure Modes

### Singleton Middleware State Leakage
If custom middleware is registered as a singleton in the container and stores per-request data on `$this`, that data leaks across requests in Octane. Example: `$this->startTime = microtime(true)` in one request is visible to the next request on the same middleware instance.

### Missing Response Return Type
A middleware that handles the happy path but returns void or null for the short-circuit path causes a type error when the pipeline expects a `Response`. Always ensure every code path returns a `Response`.

### Middleware Calling $next Twice
A bug where `$next($request)` is called, the response is stored, and then `$next($request)` is called again in the same middleware causes the pipeline to execute the remaining middleware twice. The first response is discarded. This can cause duplicate processing, double header additions, and resource leaks.

---

## Ecosystem Usage

### Spatie Laravel Permission
Provides `RoleMiddleware`, `PermissionMiddleware`, and `RoleOrPermissionMiddleware`. All are parameterized middleware accepting role/permission names as colon-delimited parameters. They short-circuit with 403 if the user lacks the required role.

### Laravel Sanctum
Sanctum provides `EnsureFrontendRequestsAreStateful` middleware. It checks if the request comes from a first-party SPA using cookie authentication and forwards the authentication to the session guard.

### Laravel Jetstream
Jetstream uses constructor middleware extensively on controllers. Team management controllers use `auth`, `verified`, and custom middleware with `only`/`except` filters for fine-grained per-method policy.

### Spatie CORS (legacy)
Before `HandleCors` was added to the framework, Spatie's `Cors` middleware was the standard for cross-origin support. It intercepts OPTIONS requests and adds CORS headers to responses.

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — the Pipeline pattern and handle() contract
- Middleware Lifecycle — how custom middleware fits into the request flow
- Service Container Basics — how dependencies are resolved for middleware

### Related Topics
- Parameterized Middleware — passing configuration to custom middleware
- Controller Middleware — registering middleware at the controller level
- Global, Route Group, and Route Middleware — where to register custom middleware

### Advanced Follow-up Topics
- Terminable Middleware — post-response execution for custom middleware
- Request Transformation — modifying the request in custom middleware
- Response Transformation — modifying the response in custom middleware

---

## Research Notes

- The three execution paths (pass through, short-circuit, modify and pass) cover every possible middleware behavior. No middleware deviates from these three patterns.
- Closure middleware was added in Laravel 5.3 and has remained unchanged. It is rarely used in production codebases — developers prefer class middleware for constructor injection and testability.
- The `$this->middleware()` constructor method was removed from the base Controller in Laravel 11. The replacement is the `HasMiddleware` interface. This is a significant migration concern for Laravel 10 -> 11 upgrades.
- Custom middleware that modifies `$request->attributes` for downstream use is the recommended pattern for middleware-to-controller communication. It avoids coupling middleware to controllers through shared services or static state.