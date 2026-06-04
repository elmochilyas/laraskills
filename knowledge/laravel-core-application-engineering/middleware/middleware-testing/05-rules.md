# Phase 5: Rules — Middleware Testing

---

## Rule Name

Prefer Direct Unit Tests Over HTTP Feature Tests for Middleware Logic

---

## Category

Testing

---

## Rule

Test middleware logic primarily through direct unit tests (instantiating the middleware and calling `handle()` with a stub `$next` closure). Use HTTP feature tests only for pipeline integration — parameter parsing, priority sorting, alias resolution, and session handling. Aim for at least 60% of middleware tests as direct unit tests.

---

## Reason

A single middleware direct unit test runs in ~0.5ms versus ~30ms for a feature test (framework boot, routing, controller dispatch). A suite of 50 middleware tests takes ~25ms as direct tests versus ~1-5 seconds as feature tests. Direct tests are also more focused — they test the middleware's logic in isolation without the noise of the pipeline, session, or controller behavior. Faster tests encourage more comprehensive coverage.

---

## Bad Example

```php
// All middleware tests as HTTP feature tests — slow and broad
public function test_guest_is_redirected_to_login(): void
{
    $response = $this->get('/dashboard');
    $response->assertRedirect('/login');
}

public function test_authenticated_user_can_access_dashboard(): void
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertOk();
}
```

---

## Good Example

```php
// Direct unit test — fast and focused
public function test_blocks_requests_without_api_token(): void
{
    $middleware = new EnsureTokenIsValid();
    $request = Request::create('/api/data', 'GET');

    $response = $middleware->handle($request, fn ($req) => response('OK'));

    $this->assertEquals(401, $response->getStatusCode());
}

// Feature test for pipeline integration only
public function test_middleware_is_registered_on_api_routes(): void
{
    $response = $this->getJson('/api/data');
    $response->assertStatus(401);
}
```

---

## Exceptions

Middleware that relies heavily on session state, authentication state, or framework services (e.g., CSRF, rate limiting) is more practically tested via feature tests where these services are already configured.

---

## Consequences Of Violation

Performance risks: test suite runs slowly (seconds instead of milliseconds), discouraging comprehensive tests. Coverage gaps: slow tests lead to fewer tests and less coverage. Feedback delay: slow CI feedback reduces development velocity.

---

---

## Rule Name

Test All Three Middleware Paths: Pass-Through, Short-Circuit, and Modification

---

## Category

Testing

---

## Rule

Every middleware test suite must cover the pass-through path (conditions met, `$next` called), each short-circuit path (every condition that returns a response without calling `$next`), and the modification path (request or response is changed and the change is visible downstream).

---

## Reason

A middleware is defined by what it blocks and what it modifies, not just what it allows. A guard middleware tested only with the correct role provides zero confidence that the blocking behavior works for incorrect roles. The short-circuit path is often the security-critical path — a bug there means unauthorized access. Testing all three paths ensures the complete behavioral contract is verified.

---

## Bad Example

```php
public function test_allows_admin_users(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
    // Missing: test for non-admin users, unauthenticated users
}
```

---

## Good Example

```php
public function test_pass_through_admin_user(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
}

public function test_short_circuit_non_admin_user(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(403, $response->getStatusCode());
}

public function test_short_circuit_unauthenticated(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(403, $response->getStatusCode());
}
```

---

## Exceptions

Middleware with a single pass-through path and no conditions (e.g., a middleware that only adds a request ID) needs only pass-through and modification assertions.

---

## Consequences Of Violation

Security risks: guard middleware with broken short-circuit logic passes tests. Reliability risks: middleware silently allows unauthorized access. False confidence: green test suite despite critical missing coverage.

---

---

## Rule Name

Test Terminable Middleware by Calling terminate() Directly

---

## Category

Testing

---

## Rule

Test terminable middleware by calling `$middleware->terminate($request, $response)` directly in unit tests. Never rely on HTTP feature tests to exercise terminable middleware — feature tests do not call `terminate()`.

---

## Reason

HTTP feature tests exercise the request lifecycle up to `$response->send()` but do not call `Kernel::terminate()`. A terminable middleware that logs requests, records metrics, or cleans up resources is never tested during feature tests. Developers who only write feature tests may believe their terminable middleware works when it has never actually executed in a test. Direct `terminate()` calls verify the termination logic in isolation.

---

## Bad Example

```php
// Feature test — terminate() is never called
public function test_request_is_logged(): void
{
    $response = $this->get('/api/data');
    $response->assertOk();
    // No assertion on the log — terminate() never ran
}
```

---

## Good Example

```php
// Direct unit test — calls terminate explicitly
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

## Exceptions

Terminable middleware that is a no-op and has no side effects requires no terminate-specific tests.

---

## Consequences Of Violation

Operational risks: logging, metrics, and cleanup silently stop working in production. Testing blind spot: terminable middleware is never exercised in the test suite. Debugging difficulty: discovering that terminate logic is broken requires production log inspection.

---

---

## Rule Name

Test Parameterized Middleware with Each Parameter Variant

---

## Category

Testing

---

## Rule

When middleware accepts parameters, write a test for each distinct parameter configuration the middleware supports. Test the default behavior (no parameters provided) and every documented parameter variant.

---

## Reason

Parameters change the middleware's behavior — different guard names, rate limits, or roles produce different outcomes. A parameterized middleware tested only with the first parameter configuration may fail with the second. Default value paths (when no parameter is provided) are especially likely to be untested because developers always provide parameters during development. Testing all variants ensures every supported configuration works correctly.

---

## Bad Example

```php
public function test_allows_admin_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    // Only tests with one parameter variant
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
}
```

---

## Good Example

```php
public function test_allows_admin_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
}

public function test_allows_super_admin_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/super-admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'super-admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin', 'super-admin');
    $this->assertEquals(200, $response->getStatusCode());
}

public function test_default_blocks_without_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));
    $response = $middleware->handle($request, fn ($req) => response('OK')); // No params
    $this->assertEquals(403, $response->getStatusCode());
}
```

---

## Exceptions

Parameterized middleware that uses named limiters or external resolvers (not direct parameter values) should test the named configuration, not every possible underlying value.

---

## Consequences Of Violation

Reliability risks: middleware fails with undocumented parameter configurations. Maintenance risks: adding a new parameter variant without test coverage leads to undetected breakage.

---

---

## Rule Name

Require 100% Branch Coverage for Security Middleware

---

## Category

Security

---

## Rule

Security middleware — auth, CSRF, rate limiting, CORS, role checking, input sanitization — must have 100% branch coverage. Every `if`, `else`, `switch` case, and exception path must have a corresponding test.

---

## Reason

Security middleware is the application's first defense. A bug in the short-circuit path of auth middleware (e.g., a logic error that allows access when the condition is false) is a security vulnerability. Standard code coverage metrics do not distinguish between pass-through and short-circuit branches. Branch coverage ensures every condition is exercised, including the failure paths that attackers exploit.

---

## Bad Example

```php
class CheckRoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (! $request->user()) {
            abort(403, 'Unauthenticated');
        }

        if (in_array('admin', $roles) && $request->user()->isSuperAdmin()) {
            return $next($request); // Special case: super admin bypass
        }

        if (! in_array($request->user()->role, $roles)) {
            abort(403);
        }

        return $next($request);
    }
}

// Test covers: user with correct role
// Missing: unauthenticated user, super admin bypass, user with wrong role
```

---

## Good Example

```php
// Every branch covered:
// - no user → 403
// - admin role + super admin → 200 (bypass)
// - user with matching role → 200
// - user with non-matching role → 403
// - empty roles parameter → 403 (default)
```

---

## Exceptions

No common exceptions. Security middleware must have exhaustive branch coverage.

---

## Consequences Of Violation

Security risks: an untested branch in security middleware is a potential vulnerability. Compliance risks: security audits require evidence of comprehensive testing. Operational risks: production bugs in security middleware cause either data exposure (false positive) or blocked access (false negative).

---

---

## Rule Name

Do Not Use withoutMiddleware() Excessively in Controller Tests

---

## Category

Testing

---

## Rule

Use `withoutMiddleware()` in tests only when the controller is specifically being tested in isolation and the middleware behavior is verified by separate middleware tests. Never disable middleware silently — always document why middleware is excluded and ensure middleware tests exist for the disabled middleware.

---

## Reason

Disabling middleware in controller tests creates a blind spot for middleware-controller interaction issues. A controller that depends on data resolved by middleware (e.g., a tenant set on `$request->attributes`) will fail when middleware is disabled, but the test may not catch this if the data is manually provided in the test setup. Overusing `withoutMiddleware()` produces a false sense of coverage — tests pass but the application fails because middleware does not run.

---

## Bad Example

```php
// Middleware is disabled — test passes but application may fail
public function test_controller_returns_orders(): void
{
    $this->withoutMiddleware();

    $response = $this->getJson('/api/orders');

    $response->assertOk();
    // Middleware that sets tenant, checks auth, and throttles is all skipped
}
```

---

## Good Example

```php
// Middleware tested separately
public function test_middleware_blocks_unauthenticated(): void
{
    $response = $this->getJson('/api/orders');
    $response->assertStatus(401);
}

// Controller test with middleware — verifies interaction
public function test_controller_returns_orders_for_authenticated_user(): void
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->getJson('/api/orders');
    $response->assertOk();
}
```

---

## Exceptions

Use `withoutMiddleware()` temporarily during development or when testing a specific interaction where middleware setup is prohibitively expensive (e.g., complex session state). Document the exclusion with a comment explaining why.

---

## Consequences Of Violation

Testing risks: middleware-controller interaction bugs are not detected. False confidence: test suite passes but application fails in production. Debugging difficulty: developers spend hours reproducing issues that only occur when middleware runs.
