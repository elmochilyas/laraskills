# ECC Standardized Knowledge — Middleware Testing

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Middleware System |
| **Knowledge Unit** | Middleware Testing |
| **Difficulty** | Intermediate |
| **Category** | HTTP Pipeline — Testing |
| **Last Updated** | 2026-06-02 |

---

## Overview

Middleware testing verifies that HTTP pipeline logic — gating, transformation, logging, and short-circuiting — behaves correctly without requiring integration tests for the entire application. Middleware can be tested at multiple levels: as pure unit tests (instantiating the middleware and calling `handle()` directly), as feature tests (exercising the middleware through HTTP), or as architecture tests (verifying middleware conventions are followed).

The engineering significance of middleware testing is that middleware is the first line of defense for security and request integrity. An incorrectly configured auth middleware exposes protected routes. A missing CSRF check opens the application to cross-site request forgery. Testing middleware independently ensures these critical pipeline components function correctly before they are composed into routes.

---

## Core Concepts

### Three Testing Levels

**Direct unit testing**: Instantiate the middleware, create a request, call `handle()` with a `$next` closure, assert on the response or request modifications. **Feature testing via HTTP**: Make HTTP requests to routes protected by the middleware, assert on response status, headers, redirects, and session state. **Architecture testing**: Verify middleware conventions — every middleware class has a `handle()` method, terminable middleware is registered as a singleton, middleware follows naming conventions.

### What to Test in Middleware

Every middleware has three testable paths: (1) The pass-through path — when conditions are met, the middleware calls `$next` and returns the response. (2) The short-circuit path — when conditions are not met, the middleware returns a response without calling `$next`. (3) The modification path — the middleware modifies the request (inbound) or response (outbound) and the modification is visible downstream.

### What NOT to Test in Middleware

Do not test the behavior of dependency classes (mock those). Do not test the Pipeline's closure construction (tested by the framework). Do not test the controller logic that runs after middleware.

### Direct handle() Invocation

A middleware's `handle()` method can be called directly with a stub `$next` closure: `$middleware->handle($request, fn ($req) => response('OK'))`. The `$next` closure simulates the next middleware in the pipeline.

---

## When To Use

- **Direct unit tests** for middleware logic coverage — fast, isolated, no framework boot. Prefer this for 60%+ of middleware tests.
- **Feature tests** for pipeline integration — parameter parsing, priority sorting, alias resolution, session handling.
- **Terminable middleware tests** (direct `terminate()` call) to verify termination logic without a real HTTP response cycle.
- **Parameterized middleware tests** (direct `handle()` with extra arguments) to test middleware with different parameter configurations.
- **Architecture tests** (Pest) to enforce middleware conventions across the codebase.

---

## When NOT To Use

- Do NOT test middleware only through HTTP feature tests — direct unit tests are faster and more isolated. A middleware with 10 condition branches should not require 10 HTTP requests.
- Do NOT test only the pass-through path — gating middleware is defined by its blocking behavior. Test both pass-through and short-circuit paths.
- Do NOT use `withoutMiddleware()` excessively for controller testing — it hides middleware-controller interaction issues.
- Do NOT test the Pipeline's closure construction in unit tests — the Pipeline is framework code tested by the framework.

---

## Best Practices (WHY)

- **Test both pass-through and short-circuit paths.** Every middleware has at least two paths. Testing only the pass-through path misses the defensive behavior. The short-circuit path is often the more important one for security middleware.
- **Use direct unit tests for the majority of middleware tests.** Direct unit tests run in ~0.5ms vs ~30ms for feature tests. A suite of 50 middleware unit tests runs in ~25ms vs ~1-5 seconds for feature tests.
- **Test terminable middleware directly.** Feature tests do not exercise `terminate()`. Call `$middleware->terminate($request, $response)` directly in tests and assert on side effects.
- **Test parameterized middleware with each parameter variant.** If a middleware has 5 parameter configurations, all 5 should be tested with different parameter values passed as additional arguments to `handle()`.
- **Mock expensive dependencies, not the request.** Mock database queries, API calls, and loggers. Create and configure requests directly with `Request::create()`.

---

## Architecture Guidelines

- **Direct unit test pattern:** Instantiate middleware → create `Request::create()` → call `$middleware->handle($request, fn ($req) => response('OK'))` → assert on response or request modifications.
- **Feature test pattern:** Make HTTP request to route → assert on response status, headers, redirects. Tests full pipeline including registration, priority, alias resolution.
- **Terminable middleware test:** Call `$middleware->terminate($request, $response)` directly. Assert on side effects (log writes, cleanup actions, metric sends).
- **Parameterized middleware test:** Pass parameters as additional arguments to `handle()`: `$middleware->handle($request, $next, 'admin', 'editor')`.
- **Architecture test (Pest):** `expect('App\Http\Middleware')->toHaveMethod('handle')`.
- **`withoutMiddleware()` in tests:** Disables specific or all middleware. Use sparingly — only for testing controllers in isolation.
- **Security middleware coverage:** Auth, CSRF, rate limiting, CORS should have 100% branch coverage. Every condition must be tested.

---

## Performance

A direct unit middleware test runs in ~0.1-0.5ms. A feature middleware test runs in ~20-100ms (framework boot, routing, controller dispatch). A suite of 50 middleware unit tests: ~25ms. A suite of 50 feature tests: ~1-5 seconds. Middleware unit tests are parallel-safe — each test creates its own middleware instance and request. Feature tests using `RefreshDatabase` add ~200-500ms per test class — use `DatabaseTransactions` instead when possible.

---

## Security

Middleware is the first line of defense — auth, CSRF, rate limiting, CORS middleware must have comprehensive test coverage. A missing test branch in security middleware is a potential vulnerability. Test every condition: what happens when the user is authenticated vs unauthenticated, when the token is valid vs invalid, when the rate limit is exceeded vs not. Architecture tests can enforce that security middleware exists and is registered correctly.

---

## Common Mistakes

- **Testing through HTTP only.** Only testing middleware through HTTP feature tests. A middleware with 10 condition branches requires 10 HTTP requests (~200-500ms) instead of 10 direct calls (~5ms).
- **Not testing short-circuit paths.** Only testing the pass-through path. Gating middleware is defined by its blocking behavior — testing the allow path alone is insufficient.
- **Forgetting to test terminable middleware.** Terminable middleware is often untested because feature tests do not exercise `terminate()`. Developers assume it works but `terminate()` never ran.
- **Overusing withoutMiddleware().** Disabling middleware to simplify controller testing creates a blind spot for middleware-controller interaction issues.
- **Not testing middleware parameters.** A parameterized middleware tested without passing parameters, or with only one parameter value. All parameter variants should be tested.

---

## Anti-Patterns

- **All middleware tests as feature tests.** 50 middleware tests each requiring framework boot, HTTP routing, and controller dispatch. Test suite takes 5+ seconds instead of <100ms.
- **Only testing the happy path.** A `CheckRoleMiddleware` is only tested with the correct role. The short-circuit path (wrong role → 403) is never verified. A change that breaks the guard logic passes the test suite.
- **Testing middleware through the controller.** Writing tests that go through the controller and assert on the controller's output rather than the middleware's behavior masks middleware-specific bugs.
- **Mocking the Request object.** Creating complex mock setups for the Request object instead of using `Request::create()`. The `Request::create()` factory method is simpler and more accurate.

---

## Examples

### Direct Unit Test Pattern
```php
public function test_blocks_requests_without_api_token(): void
{
    $middleware = new EnsureTokenIsValid();
    $request = Request::create('/api/data', 'GET');

    $response = $middleware->handle($request, fn ($req) => response('OK'));

    $this->assertEquals(401, $response->getStatusCode());
}

public function test_allows_requests_with_valid_token(): void
{
    $middleware = new EnsureTokenIsValid();
    $request = Request::create('/api/data', 'GET', ['api_token' => 'valid-token']);

    $response = $middleware->handle($request, fn ($req) => response('OK'));

    $this->assertEquals(200, $response->getStatusCode());
}
```

### Feature Test Pattern
```php
public function test_guest_is_redirected_to_login(): void
{
    $response = $this->get('/dashboard');
    $response->assertRedirect('/login');
}

public function test_authenticated_user_can_access(): void
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertOk();
}
```

### Parameterized Middleware Test Pattern
```php
public function test_blocks_users_without_required_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));

    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');

    $this->assertEquals(403, $response->getStatusCode());
}
```

### Terminable Middleware Test Pattern
```php
public function test_logs_request_information(): void
{
    Log::shouldReceive('info')->once();

    $middleware = $this->app->make(RequestLogMiddleware::class);
    $request = Request::create('/test', 'GET');
    $response = response('OK');

    $middleware->terminate($request, $response);
}
```

---

## Related Topics

- **Custom Middleware** (prerequisite) — understanding middleware structure is prerequisite to testing it.
- **Middleware Lifecycle** (prerequisite) — understanding where middleware runs in the pipeline.
- **PHPUnit/Pest Basics** (prerequisite) — the testing framework used for middleware tests.
- **Action Testing** — testing patterns for action classes (similar isolation approach).
- **Parameterized Middleware** — testing middleware with different parameter values.
- **Terminable Middleware** — testing termination logic directly.
- **Feature Testing** — testing the full HTTP pipeline including middleware.
- **Architecture Testing** — enforcing middleware conventions with Pest.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Middleware Fundamentals, PHPUnit/Pest (prerequisites). Builds on custom-middleware and parameterized-middleware.
- **Direct unit testing is underutilized.** Most developers test middleware only through HTTP feature tests. Direct unit tests are faster and more isolated.
- **Three testing levels:** Direct unit (fast, isolated), Feature (full pipeline), Architecture (conventions).
- **Test all three paths:** Pass-through, short-circuit, modification.
- **Security middleware:** 100% branch coverage required. Every condition is a potential vulnerability.
- **Terminable middleware:** Feature tests do not test `terminate()`. Must test directly.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Three testing levels documented | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Direct unit vs feature tradeoffs clear | ✓ |
| Performance analysis | ✓ |
| Security implications documented | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
