# Anti-Patterns: Cross-Cutting Concerns

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Cross-Cutting Concerns |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Middleware as Business Logic Layer | Architecture | Critical |
| 2 | One Middleware for Multiple Concerns | Architecture | High |
| 3 | Authentication in Controllers | Architecture | Medium |
| 4 | Cross-Cutting Concern Skipped by Route | Security | Critical |
| 5 | Concern Not Applied to Error Responses | Security | Medium |

---

## Anti-Pattern 1: Middleware as Business Logic Layer

### Category
Architecture

### Description
Placing business rules and domain logic in middleware because "it runs before the controller," coupling business logic to the HTTP pipeline.

### Why It Happens
Middleware is convenient — it sits between the request and the controller, making it the easiest place to add checks. Developers incrementally add business decision-making to middleware without recognizing the architectural violation.

### Warning Signs
- Middleware checks discount eligibility, calculates order totals, or applies business rules
- Middleware has dependencies on repositories, domain services, or models
- Middleware makes decisions based on business state (not just HTTP state)
- Removing a middleware breaks business functionality, not just HTTP flow
- Middleware unit tests require domain object factories

### Why Harmful
Business logic in middleware is tied to the HTTP request/response cycle. It cannot be reused in console commands, queues, or tests without creating an HTTP request. It couples business rules to HTTP infrastructure, making the system harder to maintain, test, and evolve.

### Real-World Consequences
- A discount eligibility check in middleware works for web routes but is missing for queued order processing
- Business rule changes require modifying middleware and all associated tests
- Console command skips middleware entirely; discounts are never applied
- Testing business rules requires HTTP integration tests instead of fast unit tests
- New developer assumes middleware is the place for business logic; pattern spreads

### Preferred Alternative
Keep HTTP concerns in middleware and business concerns in services/actions. The boundary question: "Does this operate on HTTP primitives?" (middleware) vs "Does this operate on domain primitives?" (service/action).

```php
// Middleware: HTTP concern
class CheckSubscription {
    public function handle(Request $request, Closure $next): Response {
        if (!$request->user()?->subscribed()) {
            return redirect()->route('subscription.required');
        }
        return $next($request);
    }
}

// Service/Action: business concern
class CalculateDiscountAction {
    public function execute(Order $order): DiscountResult {
        // Business logic: eligibility, calculations, rules
    }
}
```

### Refactoring Strategy
1. Identify all middleware containing business logic (model references, repository calls, business calculations)
2. Extract business logic into service or action classes
3. Replace middleware business logic with calls to controller or service layer
4. Re-route: controllers call services, middleware handles only HTTP concerns
5. Add tests for extracted services (unit tests, no HTTP context needed)

### Detection Checklist
- [ ] Middleware does not reference domain models or repositories
- [ ] Middleware operates only on HTTP primitives (headers, request, status codes)
- [ ] Business logic is extracted to services/actions
- [ ] Removing middleware does not break business functionality
- [ ] Tests for business logic do not require HTTP context

### Related Rules/Skills/Trees
- Rule: Do NOT put business logic in middleware
- Rule: Split the concern: HTTP part in middleware, domain part in service/action
- Related KU: Service Layer Pattern, Actions Pattern

---

## Anti-Pattern 2: One Middleware for Multiple Concerns

### Category
Architecture

### Description
Creating a single middleware class that handles multiple unrelated cross-cutting concerns (auth, profile loading, subscription, locale, logging) instead of separate middleware per concern.

### Why It Happens
It feels efficient to combine related operations into one middleware. A `UserSetupMiddleware` that checks auth, loads profile, verifies subscription, and sets locale runs once instead of four times.

### Warning Signs
- Middleware named by usage location (`UserMiddleware`, `AdminMiddleware`) rather than concern
- Middleware `handle()` method has distinct sections or comments demarcating different concerns
- Removing one concern from the middleware requires modifying a shared class
- Routes cannot selectively apply only auth without also getting locale-setting
- Tests for one concern require setting up data for all other concerns

### Why Harmful
Combined middleware cannot be composed selectively. Routes that need auth but not locale-setting must still run the locale code. Middleware order cannot be optimized per concern. Testing one concern requires mocking all dependencies.

### Real-World Consequences
- `UserSetupMiddleware` runs on all authenticated routes; one part fails, the entire middleware fails
- A bug in locale-setting blocks auth from working on public routes
- API routes that need auth also profile-load and locale-set (unnecessary overhead)
- Test suite for auth requires subscription data and locale configuration
- Splitting it later requires touching every route definition

### Preferred Alternative
Create one dedicated middleware class per cross-cutting concern. Compose them in route groups.

```php
// Separate middleware per concern
class Authenticate { /* auth only */ }
class EnsureEmailIsVerified { /* verification only */ }
class SetLocale { /* locale only */ }
class AddSecurityHeaders { /* headers only */ }

// Compose in groups
$middleware->group('authenticated-web', [
    Authenticate::class,
    EnsureEmailIsVerified::class,
    SetLocale::class,
]);
```

### Refactoring Strategy
1. Identify each distinct concern within the combined middleware
2. Extract each concern into its own middleware class
3. Replace the combined middleware with the chain of dedicated middleware in route groups
4. Remove the original combined middleware
5. Verify each route group has exactly the middleware it needs

### Detection Checklist
- [ ] Every middleware class handles exactly one concern
- [ ] Middleware is named by concern, not by usage location
- [ ] Middleware can be composed selectively in route groups
- [ ] Each concern is independently testable
- [ ] Removing one concern does not affect other concerns

### Related Rules/Skills/Trees
- Rule: Dedicated middleware per concern — one middleware class per cross-cutting concern
- Rule: Name middleware by what it does, not where it is used
- Related KU: Custom Middleware (single responsibility)

---

## Anti-Pattern 3: Authentication in Controllers

### Category
Architecture

### Description
Manually calling `Auth::check()` or `Auth::user()` at the start of controller methods instead of relying on the `auth` middleware applied via routes.

### Why It Happens
Legacy code, quick prototyping, or lack of trust in middleware. Developers add auth checks in controllers because they are visible and feel explicit.

### Warning Signs
- Controller methods begin with `if (!Auth::check()) { ... }` or `abort_if(!Auth::user(), 403)`
- Duplicate auth checks: middleware + controller both verify authentication
- Some routes have auth middleware but not all; controllers add "safety" checks
- Removing middleware breaks auth, but so does removing controller checks (maintenance burden)
- Inconsistent auth responses: middleware redirects to login, controller returns 403

### Why Harmful
Authentication checks in controllers duplicate what middleware provides, creating two sources of truth. If the auth logic changes, both middleware and controller must be updated. The controller check hides missing middleware — the route works but should have middleware protection.

### Real-World Consequences
- Auth middleware is missing from a route, but the controller has `Auth::check()`
- The route works but has no CSRF, no throttling, no SubstituteBindings
- Security audit: "Why does this route not have auth middleware?"
- Developer adds controller auth but forgets middleware; new team member removes controller auth thinking it's redundant
- Inconsistent: some routes redirect to login, others return 403 or JSON error

### Preferred Alternative
Apply the `auth` middleware to routes that require authentication. Remove manual `Auth::check()` from controllers. Trust the middleware pipeline.

```php
// Route definition (single source of truth)
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'show']);
    Route::post('/settings', [SettingsController::class, 'update']);
});

// Controller (no auth check — middleware handles it)
class DashboardController {
    public function show(Request $request): View {
        return view('dashboard', ['user' => $request->user()]);
    }
}
```

### Refactoring Strategy
1. Audit all controllers for manual `Auth::check()` calls
2. Ensure all protected routes have `auth` middleware applied
3. Remove manual auth checks from controllers (keep `$request->user()` for data access)
4. Add tests that verify protected routes without auth token return appropriate response
5. Add tests that verify protected routes with auth token succeed

### Detection Checklist
- [ ] No `Auth::check()` calls in controller methods
- [ ] All protected routes have `auth` middleware in route definition
- [ ] Removing auth middleware causes routes to fail (testable)
- [ ] Duplicate auth checks do not exist
- [ ] Auth responses are consistent (controlled by middleware, not controllers)

### Related Rules/Skills/Trees
- Rule: Do NOT put authentication logic in controllers — rely on middleware
- Rule: Rely on middleware for authentication; remove manual Auth::check() from controllers
- Related KU: Authentication middleware patterns

---

## Anti-Pattern 4: Cross-Cutting Concern Skipped by Route

### Category
Security

### Description
A route is added to a route group that does not include a critical middleware (auth, CSRF, rate limiting), or a custom group is defined without security middleware that should be present.

### Why It Happens
Route groups are defined once and reused. Adding a new route file with a new group definition can unintentionally omit security middleware that similar routes have.

### Warning Signs
- New route files registered without extending or using existing protected groups
- Admin routes use a custom group without auth middleware
- API routes bypass rate limiting because they use an unthrottled group
- Security audit reveals routes that should be protected but are not
- Inconsistent: most routes have auth, but some don't (not intentional public routes)

### Why Harmful
A route without auth middleware is publicly accessible. A route without CSRF is vulnerable to cross-site requests. A route without rate limiting can be brute-forced. The additive-only middleware constraint (once registered, it always runs) is a safety feature — bypassing it by using an incorrect group is a security gap.

### Real-World Consequences
- New `routes/api/v2.php` registered with no middleware group; all v2 endpoints are public
- Admin dashboard route added to a group without `auth`; customer data exposed
- File upload endpoint missing rate limiting; attacker uploads 10,000 files in 5 minutes
- Password reset route missing throttle; brute-force attack on reset tokens succeeds

### Preferred Alternative
Use route groups with predefined middleware stacks. Never define ad-hoc middleware lists for groups that should have security middleware.

```php
// Predefined groups with security middleware
$middleware->group('admin', [
    'auth',
    'verified',
    'can:access-admin',
    'throttle:60,1',
    AuditLog::class,
]);

// New route file uses the predefined group
Route::middleware('admin')->group(function () {
    Route::get('/reports', [ReportController::class, 'index']);
});
```

### Refactoring Strategy
1. Audit all route groups for missing critical middleware
2. Define explicit middleware groups for each security tier (public, authenticated, admin, api)
3. Add verification test: every route in a protected group has the expected middleware
4. Document group contents so developers know what middleware applies
5. Add CI check that prevents routes with missing security middleware from deploying

### Detection Checklist
- [ ] All route groups with security requirements have explicit middleware stacks
- [ ] No route is unintentionally unprotected
- [ ] Security audit covers all route definitions
- [ ] CI checks verify middleware coverage on protected groups
- [ ] Group contents are documented

### Related Rules/Skills/Trees
- Rule: Use route groups with predefined middleware stacks rather than per-route lists
- Rule: Cross-cutting concern skipped by route
- Related KU: Global, Route Group, and Route Middleware

---

## Anti-Pattern 5: Concern Not Applied to Error Responses

### Category
Security

### Description
Security headers or other response-modifying middleware add headers to normal responses, but the exception handler's error responses (404, 500, 403) bypass the middleware pipeline and lack those headers.

### Why It Happens
Middleware adds headers to `$next($request)` responses (successful routes). Error responses from the exception handler are generated after the pipeline completes and do not pass through middleware.

### Warning Signs
- Security headers middleware adds headers in the `$next` response path but not in the exception handler
- 404 pages lack X-Frame-Options, Content-Security-Policy, or HSTS headers
- 500 error responses are plain text without security headers
- An error response page triggers a mixed-content warning because CSP header is missing
- Security scanner flags missing headers on error pages

### Why Harmful
If error responses lack security headers, they are vulnerable to framing, XSS, or content injection. An attacker can iframe a 404 page that lacks X-Frame-Options, or serve mixed content on a 500 error that lacks CSP.

### Real-World Consequences
- 404 page lacks X-Frame-Options header; attacker embeds it in a clickjacking attack
- 500 error page lacks Content-Security-Policy; inline scripts execute when they shouldn't
- Security scanner fails the site because 30% of responses (error pages) lack required headers
- Compliance audit flags missing security headers on non-200 responses

### Preferred Alternative
Apply security headers in the exception handler or use kernel-level middleware that wraps all responses.

```php
// In exception handler or as terminable middleware
class SecurityHeadersMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $response = $next($request);
        return $this->addHeaders($response);
    }
    
    public function addHeaders(Response $response): Response {
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('Content-Security-Policy', "default-src 'self'");
        return $response;
    }
}

// Or apply in the exception handler:
class Handler extends ExceptionHandler {
    public function render($request, Throwable $e): Response {
        $response = parent::render($request, $e);
        return app(SecurityHeadersMiddleware::class)->addHeaders($response);
    }
}
```

### Refactoring Strategy
1. Identify which security headers are added by middleware
2. Add the same headers in the exception handler's `render()` method
3. Extract header logic into a shared service used by both middleware and handler
4. Test error pages for required security headers
5. Add security scanner check for headers on all response types

### Detection Checklist
- [ ] Security headers are present on all response types (200, 404, 500, 403)
- [ ] Headers are applied in both middleware and exception handler
- [ ] Error responses pass the same security header checks as successful responses
- [ ] Security scanner does not flag missing headers on error pages
- [ ] Compliance audit covers all response types

### Related Rules/Skills/Trees
- Rule: Concern not applied to error responses
- Rule: Security headers on all responses, including error pages
- Related KU: Exception Handling (cross-cutting concerns in error responses)
