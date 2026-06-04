# ECC Standardized Knowledge — Custom Middleware

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Custom Middleware |
| **Difficulty** | Intermediate |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Custom middleware allows application-specific cross-cutting concerns to be injected into the HTTP pipeline. Unlike controllers or services which handle business logic, custom middleware handles HTTP-level policies — authentication, authorization, request modification, response decoration, and short-circuit conditions that apply across multiple routes.

The engineering significance of custom middleware is that it provides the mechanism for encapsulating HTTP concerns without coupling them to routes or controllers. A `CheckRole` middleware centralizes role verification logic so that individual controllers do not need to check roles. A `LogRequest` middleware captures request data for audit independently of route handlers. The discipline of custom middleware design (single concern per middleware, clean handle/terminate separation, parameterization for reuse) directly affects the maintainability of the pipeline layer.

---

## Core Concepts

### The handle() Contract

Every middleware implements a `handle()` method with a fixed signature: `public function handle(Request $request, Closure $next): Response`. `$request` is the current HTTP request (can be modified before passing). `$next` is a closure representing the next middleware in the pipeline. The return type is any `Symfony\Component\HttpFoundation\Response` subclass.

### Three Execution Paths

A middleware `handle()` method has exactly three possible paths: (1) Pass through — call `$next($request)` and return its response with optional pre/post modification. (2) Short-circuit — return a response directly without calling `$next` (guards, redirects, errors). (3) Modify and pass — modify the request, call `$next($modifiedRequest)`, return the response.

### Constructor Injection

Custom middleware receives its dependencies through the constructor, resolved by the container. Constructor injection is available because middleware is resolved via `Container::make()` in the Pipeline.

### Closure Middleware

Middleware can also be defined inline as a closure on the route definition. Closure middleware is NOT resolved from the container — it is called directly. Closure middleware cannot use constructor injection.

---

## When To Use

- **Guard middleware** when a condition must be checked and the request short-circuited if not met (auth, subscription status, feature flag).
- **Logging middleware** when request/response data must be captured for observability without affecting the flow.
- **Request enrichment middleware** when the request must be augmented with resolved data (tenant, locale, request ID) for downstream use.
- **Short-circuit middleware** when requests that do not meet preconditions must be rejected before reaching business logic.
- **Middleware that modifies response** when HTTP headers or response format must be standardized across routes.

---

## When NOT To Use

- Do NOT create middleware for concerns that apply to a single route — add the check in the controller or as an inline closure middleware.
- Do NOT create middleware with multiple unrelated responsibilities — each concern should be its own middleware class.
- Do NOT place business logic in middleware — middleware is for HTTP-level cross-cutting concerns, not domain rules.
- Do NOT use closure middleware if constructor injection is needed — use class middleware for dependency injection.

---

## Best Practices (WHY)

- **One concern per middleware class.** A middleware named `CheckRole` checks roles. It does not log requests, throttle, or set headers. The name must communicate exactly one concern. Splitting concerns makes middleware independently testable, composable, and maintainable.
- **Use `$request->attributes->set()` for middleware-to-controller communication.** This avoids polluting user input with resolved data. Controllers access the data via `$request->attributes->get('key')`. This is the recommended pattern — it avoids coupling middleware to controllers through shared services or static state.
- **Name middleware by what it does, not where it is used.** Good: `CheckRole`, `TrimStrings`, `ForceJson`, `LogRequest`. Bad: `UserMiddleware`, `AdminMiddleware`, `DashboardMiddleware`. The name must communicate the concern, not the route.
- **Test each code path.** Every middleware has at least three testable paths: the condition that passes through, each condition that short-circuits, and any modification made to the request or response.
- **Cache expensive middleware resolutions.** Middleware that resolves data from databases (tenant, feature flags) should cache results. A global middleware querying the database on every 404 adds unnecessary load.

---

## Architecture Guidelines

- **Middleware file location:** `app/Http/Middleware/` (convention). Named by concern: `CheckRole.php`, `ForceJson.php`, `LogRequest.php`.
- **Middleware resolution:** Fresh via `Container::make()` per request. Constructor injection works. Instance is not shared across requests unless bound as singleton.
- **Closure middleware:** Defined inline on route: `->middleware(function (Request $req, Closure $next) { ... })`. No constructor injection. Use for trivial single-route checks only.
- **Three execution paths:** Pass through (`return $next($request)`), Short-circuit (`return response(...)` without calling `$next`), Modify and pass (`$request->attributes->set(...)`, then `return $next($request)`).
- **Registration tiers:** Global (every request), Group (route collections), Route (individual routes). Choose the most restrictive tier.
- **Registration methods (Laravel 11+):** `$middleware->append(...)`, `$middleware->alias(...)`, `$middleware->group(...)`, route definition `->middleware(...)`.
- **Registration methods (Laravel 10-):** `$middleware` array, `$routeMiddleware` array, `$middlewareGroups` array.
- **Octane safety:** Do not store per-request data on `$this` — use `$request->attributes->set()` instead. Singleton-bound middleware with mutable properties leaks data across requests.

---

## Performance

Each custom middleware is resolved via `Container::make()`. For middleware with no constructor dependencies, resolution is ~0.01ms. For middleware with 5+ deep dependencies, resolution adds ~0.1ms. Heavy middleware (database queries, API calls) adds real latency — cache wherever possible. Short-circuit middleware provides a net performance gain by preventing downstream middleware and controller execution.

---

## Security

Custom middleware is a security enforcement point. Guard middleware prevents unauthorized access. Input sanitization middleware prevents malformed input from reaching business logic. Logging middleware provides audit trails. Every custom middleware that makes security decisions must be carefully tested for both pass-through and short-circuit paths. Middleware that reads or modifies request data must not accidentally expose sensitive information through log output or error responses.

---

## Common Mistakes

- **Middleware with multiple responsibilities.** A `UserMiddleware` that checks auth, loads profile, checks subscription, and sets locale violates single responsibility. It cannot be composed selectively. Split into separate middleware classes.
- **Heavy database queries in global middleware.** A global middleware querying the database for tenant resolution, feature flags, or subscription status adds load to EVERY request, including 404s. Cache aggressively or move to route-level registration.
- **Not returning $next($request).** Forgetting the `return` keyword discards the response. The pipeline returns null, and Laravel converts null to an empty 200 response. The bug is silent.
- **Closure middleware with external dependencies.** Using facades or `app()` helper inside closure middleware bypasses explicit dependency declaration. Use class middleware when dependencies are needed.
- **Missing response return type on short-circuit.** Every code path must return a `Response`. A middleware that returns void or null for the short-circuit path causes a type error.

---

## Anti-Patterns

- **Middleware calling $next twice.** Calling `$next($request)`, storing the response, then calling `$next($request)` again causes the pipeline to execute remaining middleware twice. The first response is discarded. Causes duplicate processing and resource leaks.
- **Singleton middleware with mutable properties.** A middleware registered as singleton that stores per-request data on `$this->property` leaks that data across requests in Octane.
- **Middleware that modifies `$request->merge()` for non-sanitization data.** Adding tenant ID or request context via `$request->merge()` pollutes user input. Controllers using `$request->all()` receive data as if it came from the client.
- **Middleware as business logic layer.** Checking discount eligibility, calculating order totals, or applying business rules in middleware violates the cross-cutting concern boundary.

---

## Examples

### Guard Middleware (Short-Circuit)
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

### Logging Middleware (Post-Processing)
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

### Request Enrichment Middleware (Pre-Processing)
```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::findByDomain($request->getHost());
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — the Pipeline pattern and handle() contract.
- **Middleware Lifecycle** (prerequisite) — how custom middleware fits into the request flow.
- **Service Container Basics** (prerequisite) — how dependencies are resolved for middleware.
- **Parameterized Middleware** — passing configuration to custom middleware.
- **Controller Middleware** — registering middleware at the controller level.
- **Global, Route Group, and Route Middleware** — where to register custom middleware.
- **Terminable Middleware** — post-response execution for custom middleware.
- **Request Transformation** — modifying the request in custom middleware.
- **Response Transformation** — modifying the response in custom middleware.
- **Middleware Testing** — how to test custom middleware.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Middleware Fundamentals (prerequisite). Serves as prerequisite for parameterized-middleware, terminable-middleware, request-transformation, response-transformation, middleware-testing.
- **Three execution paths cover all middleware behavior:** pass through, short-circuit, modify and pass.
- **Use `$request->attributes->set()`** for middleware-to-controller communication. Never use `$request->merge()` for data that did not come from the client.
- **Name by concern, not by usage location.** `CheckRole`, not `AdminMiddleware`.
- **Closure middleware** cannot use constructor injection. Use class middleware when dependencies are needed.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| handle() contract documented | ✓ |
| Three execution paths explained | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Constructor injection explained | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
