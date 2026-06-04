# Cross-Cutting Concerns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Cross-Cutting Concerns
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

Cross-cutting concerns are aspects of an application that affect multiple layers and cannot be cleanly delegated to a single architectural layer. Authentication, authorization, logging, rate limiting, CORS, session management, and security headers are all concerns that cross the boundaries of controllers, services, and domain logic. Middleware is Laravel's mechanism for capturing these concerns — placing them in the HTTP pipeline where they can be applied uniformly without polluting business code.

The engineering significance of cross-cutting concerns is that they represent the architectural boundary between HTTP infrastructure and application logic. Misplacing a cross-cutting concern into a controller or service couples business logic to HTTP protocol details. Misplacing application logic into middleware couples the pipeline to business rules. The cross-cutting concern framework provides the decision criteria for determining which side of the boundary each concern belongs to.

---

## Core Concepts

### The Cross-Cutting Definition
A concern is cross-cutting when it:
1. Applies to multiple routes or controllers (not a single operation).
2. Operates at the HTTP protocol level (headers, status codes, session, cookies).
3. Has no business logic dependencies (no domain models, no repositories).
4. Can short-circuit the request independently of the business outcome.
5. Concerns are consistent across the application (same auth logic for all protected routes).

### Middleware vs Business Logic Boundary
The boundary between middleware and business logic is defined by two questions:

1. **Does this concern operate on HTTP primitives?** (headers, request, response, status codes, cookies, sessions) → Middleware.
2. **Does this concern operate on domain primitives?** (models, entities, repositories, domain events, business rules) → Service/Action.

If the answer to both is yes, the concern is split: the HTTP part goes in middleware, the domain part goes in a service/action. Auth middleware checks the session; the login service verifies credentials.

### The Three Categories of Cross-Cutting Concerns

1. **Infrastructure concerns**: Trusted proxies, CORS, maintenance mode, input sanitization, request ID tracing. These handle how the request is interpreted by the framework.

2. **Security concerns**: Authentication, authorization, CSRF protection, rate limiting, security headers, session management. These protect the application from malicious or unauthorized access.

3. **Observability concerns**: Request logging, performance metrics, audit trails, error tracking. These capture data about the request without affecting its outcome.

---

## Mental Models

### The Firewall Analogy
Middleware is a firewall that surrounds the application. It inspects incoming packets (requests), decides whether to let them through, and inspects outgoing packets (responses) for proper labeling. The firewall does not care what the packets contain (business logic) — it only cares about protocol compliance and security.

### The Swiss Army Knife Anti-Pattern
Middleware is NOT a Swiss army knife that should accumulate every concern. A middleware that checks auth, loads the user's profile, queries their subscription status, and sets locale preferences is doing too much. Each cross-cutting concern deserves its own middleware class.

### The Cross-Cutting Triangle
```
        HTTP Pipeline
        (Middleware)
       /     |     \
      /      |      \
Security   Infra   Observability
     \       |       /
      \      |      /
        Application Logic
        (Services/Controllers)
```

Cross-cutting concerns sit at the top of the triangle, application logic sits at the bottom. Concerns at the top handle HTTP protocol; concerns at the bottom handle business rules.

---

## Internal Mechanics

### How Middleware Captures Cross-Cutting Concerns
The Pipeline pattern inherently supports cross-cutting because every request flows through every middleware. A concern registered as global middleware applies to every route automatically. A concern registered as group middleware applies to all routes in that group. The Pipeline's pass-through mechanism (calling `$next`) ensures the concern can execute both before and after the application logic — no special registration needed for cross-cutting behavior.

### Short-Circuit as Cross-Cutting Enforcement
The ability to short-circuit (return a response without calling `$next`) is what makes middleware effective for enforcing cross-cutting constraints. Auth middleware short-circuits with a login redirect. Rate limiting middleware short-circuits with a 429 response. CSRF middleware short-circuits with a 419 response. Each short-circuit prevents the request from reaching application logic, which is exactly what cross-cutting enforcement requires.

### Request Attributes for Cross-Cutting Data
Middleware passes cross-cutting data to downstream layers through `$request->attributes`:

```php
// Auth middleware sets the user
$request->attributes->set('user', $authenticatedUser);

// Tenant middleware sets the tenant
$request->attributes->set('tenant', $resolvedTenant);

// Request ID middleware sets trace ID
$request->attributes->set('request_id', $generatedId);
```

This data flows through the pipeline without polluting user input or requiring shared services.

---

## Patterns

### Dedicated Middleware per Concern Pattern
One middleware class per cross-cutting concern:

```php
// One concern per file
class Authenticate { /* checks auth */ }
class EnsureEmailIsVerified { /* checks verification */ }
class SetLocale { /* sets locale */ }
class AddSecurityHeaders { /* adds headers */ }
class LogRequest { /* logs request */ }
```

- **Purpose**: Maintain single responsibility per middleware class.
- **Benefits**: Each concern can be independently enabled/disabled, reordered, and tested.
- **Tradeoffs**: More middleware classes — but the count is bounded by the number of cross-cutting concerns.

### Concern Composition in Route Groups
Compose cross-cutting concerns into named groups:

```php
$middleware->group('authenticated-web', [
    'auth',
    'verified',
    SetLocale::class,
]);

$middleware->group('admin', [
    'auth',
    'verified',
    'can:access-admin',
    AuditLog::class,
]);
```

- **Purpose**: Bundle related concerns into reusable groups for route assignment.
- **Benefits**: Routes declare intent ("this is an authenticated web route") rather than listing individual middleware.
- **Tradeoffs**: Group definitions must be maintained and documented.

### Split Concern Pattern
Split a concern that has both HTTP and domain aspects into two parts:

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

- **Purpose**: Keep HTTP concerns in middleware and domain concerns in services.
- **Benefits**: The login action is testable without HTTP; the auth middleware is focused on session checking.
- **Tradeoffs**: The split requires coordination — the middleware and service must agree on the authentication mechanism.

### Pull, Don't Push Pattern
Middleware resolves data and makes it available. Controllers pull what they need:

```php
// Middleware resolves tenant and sets attribute
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

- **Purpose**: Avoid coupling middleware to specific controllers.
- **Benefits**: Controllers are not forced to use resolved data — they extract what they need.
- **Tradeoffs**: The controller must know which attributes the middleware sets (a convention that must be documented).

---

## Architectural Decisions

### What Belongs in Middleware

| Concern | Middleware? | Rationale |
|---------|-----------|-----------|
| Authentication | Yes | HTTP-level session/token check; short-circuits with redirect/401 |
| Authorization (role-level) | Yes | Check user has role; applies across routes |
| Authorization (resource-level) | Policy (called from middleware) | Fine-grained checks need domain context |
| CSRF Protection | Yes | Cookie/token validation at HTTP level |
| Rate Limiting | Yes | Cache-based check; short-circuits with 429 |
| CORS | Yes | Header-based; global or per-group |
| Security Headers | Yes | Response decoration; no domain logic |
| Session Management | Yes | Cookie handling; state management |
| Input Sanitization | Yes | Global string/number normalization |
| Request Logging | Yes | Cross-cutting observability |
| Locale Detection | Yes | Header-based; no domain logic |
| Tenant Resolution | Yes | Request-based; sets context for downstream |
| User Preferences | Route group | Needs auth context; applied per group |
| Audit Logging | Yes | Cross-cutting; records request metadata |
| Business Rules | **No** | Belongs in Services/Actions |
| Complex Data Loading | **No** | Belongs in controllers or view composers |
| Business-Side Effects | **No** | Belongs in Services/Actions |
| Fine-Grained Authorization | **No** | Belongs in Policies (called from middleware) |

### When a Concern Spans Both Middleware and Services
Some concerns have both HTTP and domain aspects. The rule is: the HTTP aspect goes in middleware; the domain aspect goes in a service. The middleware calls the service or sets up context that the service uses.

Example: Authentication
- Middleware checks the session/header for credentials (HTTP).
- Login service verifies the credentials and creates the session (domain).
- The middleware does not call the login service — the controller does.

### When to Move a Concern Out of Middleware
A concern should move out of middleware when:
1. It needs access to domain models or business logic.
2. It must make decisions based on business state (not just HTTP state).
3. It produces responses that vary by domain logic (not just status codes).
4. It is applied to a single route, not cross-cutting.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Middleware captures all cross-cutting concerns in one layer | Middleware can grow unbounded as new concerns are added | Review and prune middleware annually |
| Dedicated middleware per concern is independently testable | More middleware classes per route = more pipeline entries | Use groups to organize; keep per-route middleware count manageable |
| Split concerns keep HTTP/domain boundaries clean | Coordination overhead between middleware and services | Document the boundary: what middleware provides, what services expect |
| Request attributes pass data without coupling | Attributes are weakly typed (string keys, mixed values) | Document attribute keys and types in the middleware |

---

## Performance Considerations

### Middleware Accumulation
Each cross-cutting middleware adds latency to every request it runs on. An API route with 12 middleware (global + api group + route-specific) adds ~0.5-2ms of middleware resolution and execution time. This is acceptable for most applications.

### Expensive Concerns
Certain concerns add disproportionate latency:
- Session middleware: ~5-20ms (session read/write).
- Rate limiting: ~1-2ms per cache check (Redis), ~5-10ms (file cache).
- Tenant resolution: 2-10ms per database query.

These concerns should be evaluated for caching or optimization.

### Observability Concerns in Production
Request logging and performance metrics middleware should be efficient. Writing to disk or sending metrics per request adds linear overhead. For high-traffic applications, sample requests (log 1 in 100) instead of logging every request.

---

## Production Considerations

### Middleware Inventory
Maintain a documented inventory of all custom middleware with:
- What concern it addresses.
- What tier it is registered at (global, group, route).
- Its position in the priority array.
- Its approximate per-request cost.

### Security Audit of Middleware
Security-critical middleware (auth, CSRF, rate limiting, CORS) should be audited:
- Is every protected route actually protected?
- Are there routes that should be protected but are not?
- Does the middleware order protect against the intended threats?
- Are there short-circuit paths that bypass security?

### Middleware Bloat Prevention
Over time, middleware accumulates. Every new feature adds "just one more middleware." Establish a review process: every middleware addition requires justification that the concern is cross-cutting and cannot be handled in a service.

---

## Common Mistakes

### Business Logic in Middleware
A middleware that checks "is this order eligible for discount" is applying business logic in the HTTP pipeline. Discount eligibility is a business rule — it belongs in a service. The middleware should only check HTTP-level conditions.

### Authentication in Controllers
A controller that manually checks `Auth::check()` at the start of each method duplicates what auth middleware already provides. Rely on middleware for authentication; remove manual checks from controllers.

### One Middleware for Multiple Concerns
A `UserSetupMiddleware` that checks auth, loads profile, checks subscription, sets locale, and logs activity violates single responsibility. Each concern should be a separate middleware that can be independently enabled, disabled, and reordered.

### Over-Middlewaring
Creating middleware for concerns that apply to a single route. If only one route needs a check, add the check in the controller or as an inline closure middleware, not as a global or group middleware.

### Forgetting to Register Middleware
A custom middleware is written, tested in isolation, but never registered in `bootstrap/app.php` (or `Kernel.php`). The middleware never runs. Always verify registration after adding custom middleware.

---

## Failure Modes

### Cross-Cutting Concern Skipped by Route
A new route is added to a group that does not include a critical middleware. The route is exposed without auth, rate limiting, or CSRF protection. Mitigation: use route groups with predefined middleware stacks rather than per-route middleware lists.

### Concern Not Applied to Error Responses
A global security headers middleware adds headers to normal responses, but the exception handler's error responses (404, 500) bypass the middleware pipeline. Error responses lack security headers. Mitigation: add headers in the exception handler or use kernel-level middleware.

### Concern Conflict Between Middleware
Two middleware set the same response header (e.g., two CORS middleware instances from different packages). The last one to run wins. The conflict is silent — no error, just potentially wrong behavior. Review the middleware stack for duplicate concerns.

### Circular Concern Dependency
Middleware A requires data that middleware B sets, but B runs after A due to priority ordering. The data is never set when A reads it. This is a priority ordering bug — the middleware that provides the data must run before the middleware that consumes it.

---

## Ecosystem Usage

### Laravel Framework
The framework handles several cross-cutting concerns through built-in middleware:
- `Authenticate` — session/token authentication.
- `Authorize` (can) — policy-based authorization.
- `VerifyCsrfToken` / `ValidateCsrfToken` — CSRF protection.
- `ThrottleRequests` — rate limiting.
- `HandleCors` — CORS handling.
- `TrustProxies` — reverse proxy configuration.
- `StartSession` — session management.
- `EncryptCookies` / `AddQueuedCookiesToResponse` — cookie security.
- `TrimStrings` / `ConvertEmptyStringsToNull` — input sanitization.
- `PreventRequestsDuringMaintenance` — maintenance mode.

Each of these is a single-concern middleware that addresses one cross-cutting need.

### Laravel Horizon
Horizon handles authentication and authorization through route-level middleware on its dashboard routes. Cross-cutting concerns are limited to the dashboard scope.

### Spatie Laravel Permission
Spatie's package addresses the authorization cross-cutting concern with parameterized middleware. It follows the "dedicated middleware per concern" pattern.

### Third-Party Packages
Common cross-cutting concern packages:
- `spatie/laravel-cookie-consent` — GDPR cookie consent.
- `mobiledetect/mobiledetect-laravel` — device detection.
- `pragmarx/google2fa-laravel` — two-factor authentication middleware.
- `spatie/laravel-activitylog` — audit logging (via events, not middleware).

---

## Related Knowledge Units

### Prerequisites
- Middleware Fundamentals — understanding the pipeline and middleware structure
- Custom Middleware — creating middleware for cross-cutting concerns

### Related Topics
- Global, Route Group, and Route Middleware — where to register cross-cutting concerns
- Middleware Ordering and Priority — how the order of cross-cutting concerns affects behavior
- Request Transformation — cross-cutting request modifications
- Response Transformation — cross-cutting response modifications

### Advanced Follow-up Topics
- Actions Pattern — how actions complement middleware for domain logic
- Service Layer Pattern — how services handle the domain side of split concerns
- Exception Handling — how cross-cutting concerns affect error responses

---

## Research Notes

- The domain-analysis research identifies "Middleware as Business Logic Layer" as a top-5 missing knowledge risk in the Laravel community. Developers commonly place business rules in middleware because "it runs before the controller" and is convenient. This is the single most common middleware anti-pattern.
- The split concern pattern (HTTP in middleware, domain in service) is the recommended approach but is rarely documented as a pattern. Most developers either put everything in middleware (mixing HTTP and domain) or everything in controllers (bypassing middleware for HTTP concerns).
- The "pull, don't push" pattern for request attributes is inferred from community best practices. Middleware should set attributes; controllers should pull them. Pushing data from middleware into controllers through bound services or static state creates hidden coupling.
- Audit logging as a cross-cutting concern is an emerging pattern in enterprise Laravel applications. It is typically implemented as middleware that records request data after the response. This pattern is common in financial, healthcare, and compliance-sensitive applications.