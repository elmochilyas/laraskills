# ECC Standardized Knowledge — Cross-Cutting Concerns

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Cross-Cutting Concerns |
| **Difficulty** | Expert |
| **Category** | HTTP Pipeline — Middleware |
| **Last Updated** | 2026-06-02 |

---

## Overview

Cross-cutting concerns are aspects of an application that affect multiple layers and cannot be cleanly delegated to a single architectural layer. Authentication, authorization, logging, rate limiting, CORS, session management, and security headers are all concerns that cross the boundaries of controllers, services, and domain logic. Middleware is Laravel's mechanism for capturing these concerns — placing them in the HTTP pipeline where they can be applied uniformly without polluting business code.

The engineering significance of cross-cutting concerns is that they represent the architectural boundary between HTTP infrastructure and application logic. Misplacing a cross-cutting concern into a controller or service couples business logic to HTTP protocol details. Misplacing application logic into middleware couples the pipeline to business rules. The cross-cutting concern framework provides the decision criteria for determining which side of the boundary each concern belongs to.

---

## Core Concepts

### The Cross-Cutting Definition

A concern is cross-cutting when it: (1) Applies to multiple routes or controllers (not a single operation). (2) Operates at the HTTP protocol level (headers, status codes, session, cookies). (3) Has no business logic dependencies (no domain models, no repositories). (4) Can short-circuit the request independently of the business outcome. (5) Concerns are consistent across the application.

### Middleware vs Business Logic Boundary

Two questions define the boundary: "Does this concern operate on HTTP primitives?" (headers, request, response, status codes, cookies, sessions) → Middleware. "Does this concern operate on domain primitives?" (models, entities, repositories, domain events, business rules) → Service/Action. If the answer to both is yes, split the concern: the HTTP part goes in middleware, the domain part goes in a service/action.

### The Three Categories

- **Infrastructure concerns**: Trusted proxies, CORS, maintenance mode, input sanitization, request ID tracing. Handle how the request is interpreted by the framework.
- **Security concerns**: Authentication, authorization, CSRF protection, rate limiting, security headers, session management. Protect the application from malicious or unauthorized access.
- **Observability concerns**: Request logging, performance metrics, audit trails, error tracking. Capture data about the request without affecting its outcome.

---

## When To Use

- **Middleware for** authentication, authorization (role-level), CSRF protection, rate limiting, CORS, security headers, session management, input sanitization, request logging, locale detection, tenant resolution, audit logging.
- **Split concern pattern** when a concern has both HTTP and domain aspects — HTTP part in middleware, domain part in service (e.g., auth middleware checks session, login service verifies credentials).
- **Dedicated middleware per concern** — one middleware class per cross-cutting concern. Each concern can be independently enabled/disabled, reordered, and tested.
- **Concern composition in route groups** — bundle related concerns into named groups (e.g., 'admin' group with auth, verified, and permission middleware).

---

## When NOT To Use

- Do NOT put business logic in middleware — discount eligibility, order total calculations, or business-side effects belong in Services/Actions.
- Do NOT create middleware for concerns that apply to a single route — add the check in the controller or as an inline closure middleware.
- Do NOT put fine-grained authorization in middleware — resource-level authorization belongs in Policies, called from middleware.
- Do NOT put authentication logic in controllers — rely on middleware for auth; remove manual `Auth::check()` from controllers.
- Do NOT create one middleware for multiple concerns — a `UserSetupMiddleware` that checks auth, loads profile, queries subscription, sets locale violates single responsibility.

---

## Best Practices (WHY)

- **Use dedicated middleware per concern.** A `UserSetupMiddleware` that checks auth, loads profile, checks subscription, and sets locale cannot be composed selectively. Each concern should be a separate middleware. This makes middleware independently testable, configurable, and maintainable.
- **Split concerns that have both HTTP and domain aspects.** Authentication has an HTTP aspect (check session/header) and a domain aspect (verify credentials). The middleware handles the HTTP part; the service handles the domain part. The boundary keeps both layers clean.
- **Use "pull, don't push" for middleware-to-controller communication.** Middleware resolves data and sets it on `$request->attributes`. Controllers pull what they need via `$request->attributes->get('key')`. This avoids coupling middleware to specific controllers.
- **Maintain a documented middleware inventory.** List each custom middleware, its concern, registration tier, priority position, and per-request cost. This prevents middleware bloat and aids onboarding.
- **Audit security middleware regularly.** Is every protected route actually protected? Are there routes that should be protected but are not? Does the middleware order protect against intended threats?

---

## Architecture Guidelines

- **What belongs in middleware:** Authentication, authorization (role-level), CSRF, rate limiting, CORS, security headers, session management, input sanitization, request logging, locale detection, tenant resolution, audit logging.
- **What does NOT belong in middleware:** Business rules, complex data loading, business-side effects, fine-grained authorization (use Policies).
- **Split concern pattern:** Middleware handles HTTP aspect. Service handles domain aspect. Middleware does not call the service — the controller does.
- **Dedicated middleware per concern:** One class per cross-cutting concern. Named by concern, not by usage location.
- **Concern composition in groups:** Bundle related concerns into named groups for route assignment.
- **Pull, don't push:** Middleware sets request attributes. Controllers pull what they need.
- **Middleware bloat prevention:** Every middleware addition requires justification that the concern is cross-cutting and cannot be handled in a service.

---

## Performance

Each cross-cutting middleware adds latency to every request it runs on. An API route with 12 middleware adds ~0.5-2ms. Expensive concerns: Session middleware ~5-20ms (session read/write). Rate limiting ~1-2ms per cache check (Redis), ~5-10ms (file cache). Tenant resolution 2-10ms per database query. For high-traffic applications, sample observability (log 1 in 100 requests) instead of logging every request.

---

## Security

Middleware is the security perimeter. Auth, CSRF, rate limiting, security headers, and session management middleware work together to protect the application. The additive-only constraint ensures security middleware cannot be accidentally removed from routes. The priority system ensures security middleware runs in the correct order — session before CSRF, throttle before auth, auth before SubstituteBindings. Missing middleware registration is a common security gap — verify that every protected route has the correct middleware applied.

---

## Common Mistakes

- **Business logic in middleware.** A middleware that checks "is this order eligible for discount" applies business logic in the HTTP pipeline. Discount eligibility is a business rule — it belongs in a service.
- **Authentication in controllers.** A controller manually checking `Auth::check()` at the start of each method duplicates auth middleware. Rely on middleware for authentication.
- **One middleware for multiple concerns.** A `UserSetupMiddleware` handling auth, profile loading, subscription, locale, and logging violates single responsibility. Split into separate middleware classes.
- **Over-middlewaring.** Creating middleware for concerns that apply to a single route. Add the check in the controller or as inline closure middleware.
- **Forgetting to register middleware.** A custom middleware is written and tested in isolation but never registered. The middleware never runs.

---

## Anti-Patterns

- **Middleware as business logic layer.** The most common middleware anti-pattern. Developers place business rules in middleware because "it runs before the controller." This couples business logic to the HTTP pipeline.
- **Cross-cutting concern skipped by route.** A new route is added to a group that does not include auth, CSRF, or rate limiting. The route is exposed without protection. Use route groups with predefined middleware stacks.
- **Concern not applied to error responses.** Security headers middleware adds headers to normal responses, but the exception handler's error responses (404, 500) bypass the pipeline. Error responses lack security headers.
- **Middleware inventory bloat.** Over time, middleware accumulates as every new feature adds "just one more middleware." Prune middleware annually.

---

## Examples

### Dedicated Middleware per Concern
```php
// One concern per file
class Authenticate { /* checks auth */ }
class EnsureEmailIsVerified { /* checks verification */ }
class SetLocale { /* sets locale */ }
class AddSecurityHeaders { /* adds headers */ }
class LogRequest { /* logs request */ }
```

### Concern Composition in Groups
```php
$middleware->group('authenticated-web', [
    'auth',
    'verified',
    \App\Http\Middleware\SetLocale::class,
]);

$middleware->group('admin', [
    'auth',
    'verified',
    'can:access-admin',
    \App\Http\Middleware\AuditLog::class,
]);
```

### Split Concern Pattern
```php
// Middleware (HTTP part)
class Authenticate
{
    public function handle(Request $request, Closure $next, string $guard = null): Response
    {
        if (! Auth::guard($guard)->check()) {
            throw new AuthenticationException;
        }
        return $next($request);
    }
}

// Service/Action (domain part)
class LoginAction
{
    public function execute(array $credentials): LoginResult
    {
        // Verify credentials, create token, log event
    }
}
```

### Pull, Don't Push
```php
// Middleware resolves tenant and makes it available
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $tenant = Tenant::findByDomain($request->getHost());
        $request->attributes->set('tenant', $tenant);
        return $next($request);
    }
}

// Controller pulls tenant data when needed
class DashboardController
{
    public function show(Request $request): View
    {
        $tenant = $request->attributes->get('tenant');
        return view('dashboard', ['tenant' => $tenant]);
    }
}
```

---

## Related Topics

- **Middleware Fundamentals** (prerequisite) — understanding the pipeline and middleware structure.
- **Custom Middleware** (prerequisite) — creating middleware for cross-cutting concerns.
- **Global, Route Group, and Route Middleware** — where to register cross-cutting concerns.
- **Middleware Ordering and Priority** — how the order of cross-cutting concerns affects behavior.
- **Request Transformation** — cross-cutting request modifications.
- **Response Transformation** — cross-cutting response modifications.
- **Actions Pattern** — how actions complement middleware for domain logic.
- **Service Layer Pattern** — how services handle the domain side of split concerns.
- **Exception Handling** — how cross-cutting concerns affect error responses.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** All middleware KUs (prerequisites). Capstone KU for the middleware subdomain.
- **Key boundary question:** "Does this concern operate on HTTP primitives?" → Middleware. "Does this concern operate on domain primitives?" → Service/Action.
- **Top-5 missing knowledge risk:** "Middleware as Business Logic Layer" — developers commonly place business rules in middleware.
- **Split concern pattern:** HTTP part in middleware, domain part in service. This is the recommended approach but rarely documented as a pattern.
- **Pull, don't push:** Middleware sets attributes. Controllers pull what they need. Avoids coupling.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Cross-cutting definition clear | ✓ |
| Middleware vs business logic boundary | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Three categories documented | ✓ |
| Performance analysis | ✓ |
| Security implications documented | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples | ✓ |
| Related topics mapped | ✓ |
