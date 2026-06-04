# Phase 5: Rules — Cross-Cutting Concerns

---

## Rule Name

Apply the Cross-Cutting Boundary Test Before Writing Middleware

---

## Category

Architecture

---

## Rule

Before creating any middleware, apply the two-question boundary test: "Does this operate on HTTP primitives (headers, request, response, status codes, cookies, sessions)?" If yes, it belongs in middleware. "Does this operate on domain primitives (models, entities, repositories, business rules)?" If yes, it belongs in a service or action. If both answers are yes, split the concern — HTTP part in middleware, domain part in a service.

---

## Reason

This test prevents the two most common middleware errors: placing business logic in middleware (coupling domain rules to HTTP) and placing HTTP concerns in controllers (coupling business logic to protocol details). The split-concern pattern keeps both layers independently testable and maintainable.

---

## Bad Example

```php
class DiscountEligibilityMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $order = Order::find($request->route('order'));
        if ($order->total < 100 || $order->user->loyaltyTier === 'bronze') {
            abort(403, 'Not eligible for discount');
        }
        return $next($request);
    }
}
```

---

## Good Example

```php
// Middleware: HTTP concern only
class Authenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            throw new AuthenticationException;
        }
        return $next($request);
    }
}

// Service: domain concern only
class DiscountEligibilityService
{
    public function isEligible(Order $order): bool
    {
        return $order->total >= 100 && $order->user->loyaltyTier !== 'bronze';
    }
}
```

---

## Exceptions

Middleware that operates on HTTP primitives may call a service for trivial lookups (e.g., finding a tenant by domain). The service call must be the only non-HTTP operation.

---

## Consequences Of Violation

Maintenance risks: business logic scattered across middleware and controllers. Security risks: business rules can be bypassed if middleware order changes. Scalability risks: heavy business logic in global middleware adds latency to every request.

---

---

## Rule Name

One Middleware Class Per Cross-Cutting Concern

---

## Category

Code Organization

---

## Rule

Never create a middleware class that handles multiple unrelated concerns. Each middleware class must address exactly one cross-cutting concern. Name the class by the concern it handles, not by the routes it protects.

---

## Reason

A middleware with multiple responsibilities cannot be composed selectively — it must be applied or skipped as a unit. Separate middleware classes can be independently enabled, disabled, reordered, tested, and documented. Single-responsibility middleware is the foundation of a maintainable pipeline.

---

## Bad Example

```php
class UserSetupMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) { return redirect('login'); }
        if (! $request->user()->subscribed) { return redirect('subscribe'); }
        App::setLocale($request->user()->locale);
        Log::info('Request started', ['user' => $request->user()->id]);
        return $next($request);
    }
}
```

---

## Good Example

```php
class Authenticate { /* checks auth */ }
class EnsureSubscribed { /* checks subscription */ }
class SetLocale { /* sets locale */ }
class LogRequest { /* logs request */ }
```

---

## Exceptions

Middleware that both modifies the request (inbound) and the response (outbound) for the same concern is acceptable — it is still one concern (e.g., `HandleCors` handles OPTIONS preflight on inbound and adds CORS headers on outbound).

---

## Consequences Of Violation

Maintenance risks: cannot modify or reorder individual concerns. Testing risks: forced to test multiple concerns in a single test. Flexibility risks: cannot apply concerns to different route groups.

---

---

## Rule Name

Use Pull, Don't Push, for Middleware-to-Controller Communication

---

## Category

Architecture

---

## Rule

Middleware must set resolved data on `$request->attributes->set('key', $value)`. Controllers must pull the data via `$request->attributes->get('key')`. Never use `$request->merge()` for data that did not come from the client. Never set data on static properties, facades, or singleton services.

---

## Reason

Using `$request->merge()` pollutes user input — controllers calling `$request->all()` or `$request->validated()` receive middleware-added data as if the client sent it. Static properties and singleton state break in Octane (leak across requests). The attributes bag is serialization-safe, request-scoped, and the framework's designated channel for HTTP pipeline enrichment.

---

## Bad Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->merge(['tenant' => Tenant::findByDomain($request->getHost())]);
        return $next($request);
    }
}

class DashboardController
{
    public function show(Request $request): View
    {
        // $request->all() or $request->validated() now contains 'tenant'
        $tenant = $request->input('tenant');
    }
}
```

---

## Good Example

```php
class TenantMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->attributes->set('tenant', Tenant::findByDomain($request->getHost()));
        return $next($request);
    }
}

class DashboardController
{
    public function show(Request $request): View
    {
        $tenant = $request->attributes->get('tenant');
    }
}
```

---

## Exceptions

`$request->merge()` is acceptable only for input sanitization — trimming strings, casting types, or normalizing formats. Never use it to add new data.

---

## Consequences Of Violation

Security risks: middleware-added data accepted as user input bypasses validation. Reliability risks: Octane requests see stale data from previous requests. Maintenance risks: controllers have no way to distinguish client data from middleware data.

---

---

## Rule Name

Maintain a Documented Middleware Inventory

---

## Category

Maintainability

---

## Rule

Every application with custom middleware must maintain a living document listing each middleware class, its cross-cutting concern, registration tier, priority position, and estimated per-request cost. Review and prune this inventory annually.

---

## Reason

Middleware accumulation is gradual and invisible — each addition seems justified in isolation. An inventory makes the total pipeline cost visible. Teams can identify redundant middleware, remove obsolete concerns, and understand the performance budget of each request. Without an inventory, middleware bloat degrades performance and obscures the pipeline's security posture.

---

## Bad Example

```php
// No inventory. New team members discover middleware by reading bootstrap/app.php
// and tracing each class. Nobody knows why SetLocale runs before Throttle.
->withMiddleware(function (Middleware $middleware) {
    $middleware->append(SetLocale::class);
    $middleware->append(ThrottleRequests::class);
    $middleware->append(AuditLog::class);
    $middleware->append(FeatureFlagCheck::class);
})
```

---

## Good Example

```markdown
| Middleware | Concern | Tier | Priority Position | Cost |
|---|---|---|---|---|
| RequestId | Observability | Global | First | ~0.01ms |
| SetLocale | Infra | Web group | After Session, before Auth | ~0.5ms (DB) |
| ThrottleRequests | Security | Api group | After Auth | ~2ms (Redis) |
| AuditLog | Observability | Admin group | Last | ~5ms (DB write, deferred) |
```

---

## Exceptions

Trivial applications with fewer than 5 custom middleware may not need a formal inventory. The rule becomes relevant at 5+ custom middleware.

---

## Consequences Of Violation

Maintenance risks: nobody knows what middleware runs or why. Performance risks: silent accumulation of expensive middleware on every route. Security risks: missing middleware goes unnoticed until an incident.

---

---

## Rule Name

Audit Security Middleware Coverage Quarterly

---

## Category

Security

---

## Rule

Every quarter, verify that every protected route has the required security middleware applied. Check for routes in groups that lack auth, CSRF, or rate limiting. Verify that newly added routes are not accidentally exposed without protection. Use architecture tests to automate this verification.

---

## Reason

Security middleware is the application's perimeter. A single route added to a group without auth, or a new group created without CSRF, exposes the application. Human review misses these gaps. Automated architecture tests that assert every route in a named group has specific middleware prevent accidental exposure.

---

## Bad Example

```php
// New route added to web group, but group doesn't include auth
Route::middleware('web')->group(function () {
    Route::get('/settings', [SettingsController::class, 'show']); // No auth!
});

// No architecture test verifies middleware coverage
```

---

## Good Example

```php
// Architecture test (Pest)
test('admin routes require auth')
    ->assertThat(fn () => Route::getRoutes()->getRoutes())
    ->each->fn (Route $route) => $route->action['middleware'] ?? []
    ->toContain('auth');

// Route group explicitly includes auth
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/settings', [SettingsController::class, 'show']);
});
```

---

## Exceptions

Public routes that intentionally bypass security middleware (login page, password reset, webhooks) must be explicitly documented and excluded from the audit.

---

## Consequences Of Violation

Security risks: unprotected routes expose the application to unauthorized access, CSRF attacks, and abuse. Compliance risks: missing auth on sensitive endpoints violates audit requirements.

---

---

## Rule Name

Register Cross-Cutting Concerns at the Most Restrictive Tier

---

## Category

Code Organization

---

## Rule

Register middleware at the most restrictive tier that covers all required routes. Global tier for concerns that must run on every request before routing (trusted proxies, CORS). Group tier for concerns shared by a route collection (session, CSRF, locale). Route tier for concerns specific to individual endpoints (guard selection, rate limits, authorization). Never register a concern at a broader tier than necessary.

---

## Reason

Global middleware runs on every request including health checks, static assets, and OPTIONS preflight. A globally registered concern that only applies to API routes adds unnecessary overhead to web routes. The most-restrictive-tier rule minimizes the performance surface of each middleware concern and makes the pipeline's scope explicit in route definitions.

---

## Bad Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Force JSON middleware registered globally — affects web routes too
    $middleware->append(ForceJsonMiddleware::class);
});
```

---

## Good Example

```php
->withMiddleware(function (Middleware $middleware) {
    // Global: runs on every request before routing
    $middleware->append(RequestIdMiddleware::class);

    // Group: only applied to API routes
    $middleware->api(append: [ForceJsonMiddleware::class]);
});
```

---

## Exceptions

Infrastructure concerns (trusted proxies, maintenance mode) must be global because they affect how the request is interpreted before routing. These have no restrictive-tier alternative.

---

## Consequences Of Violation

Performance risks: every request pays the cost of unnecessary middleware. Scalability risks: globally registered database-querying middleware adds load to every endpoint. Maintenance risks: broad registration obscures which middleware actually applies to a given route.

---

---

## Rule Name

Never Split a Single Concern Across Middleware and Controller Logic

---

## Category

Architecture

---

## Rule

When a cross-cutting concern has both HTTP and domain aspects, put the HTTP part in middleware and the domain part in a separate service. The middleware must not call the service. The controller must call the service independently. The middleware and service are separate layers, not a pipeline.

---

## Reason

If middleware calls a service, that service executes on every request the middleware protects, even when the controller does not need it. This couples middleware behavior to service execution order. The split-concern pattern keeps each invocation explicit — middleware handles protocol, controller handles domain, and each is independently testable.

---

## Bad Example

```php
class Authenticate
{
    public function __construct(private LoginService $loginService) {}

    public function handle(Request $request, Closure $next): Response
    {
        $this->loginService->trackLoginAttempt($request); // Domain logic in middleware
        if (! Auth::check()) {
            throw new AuthenticationException;
        }
        return $next($request);
    }
}
```

---

## Good Example

```php
class Authenticate
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! Auth::check()) {
            throw new AuthenticationException;
        }
        $request->attributes->set('auth_context', Auth::guard()->getName());
        return $next($request);
    }
}

class LoginService
{
    public function trackLoginAttempt(Request $request): void
    {
        // Domain logic: log attempt, check velocity, notify
    }
}
```

---

## Exceptions

Middleware that performs a lightweight, idempotent service lookup (e.g., resolving a tenant from the request domain) is acceptable. The service call must be read-only and non-side-effecting.

---

## Consequences Of Violation

Maintenance risks: domain logic hidden in middleware is invisible to developers modifying business rules. Testing risks: middleware tests must mock domain services. Performance risks: domain services execute even for short-circuited requests.
