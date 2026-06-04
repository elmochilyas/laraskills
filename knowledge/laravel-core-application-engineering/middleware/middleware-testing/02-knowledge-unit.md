# Middleware Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Middleware System
- **Knowledge Unit:** Middleware Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Middleware testing verifies that HTTP pipeline logic — gating, transformation, logging, and short-circuiting — behaves correctly without requiring integration tests for the entire application. Middleware can be tested at multiple levels: as pure unit tests (instantiating the middleware and calling `handle()` directly), as feature tests (exercising the middleware through HTTP), or as architecture tests (verifying middleware conventions are followed).

The engineering significance of middleware testing is that middleware is the first line of defense for security and request integrity. An incorrectly configured auth middleware exposes protected routes. A missing CSRF check opens the application to cross-site request forgery. A misconfigured rate limiter allows abuse. Testing middleware independently ensures these critical pipeline components function correctly before they are composed into routes.

---

## Core Concepts

### Three Testing Levels

1. **Direct unit testing**: Instantiate the middleware, create a request, call `handle()` with a `$next` closure, assert on the response or request modifications.

2. **Feature testing via HTTP**: Make HTTP requests to routes protected by the middleware. Assert on response status, headers, redirects, and session state.

3. **Architecture testing**: Verify middleware conventions — every middleware class has a `handle()` method, terminable middleware is registered as a singleton, middleware follows naming conventions.

### What to Test in Middleware

Every middleware has three testable paths:

1. **The pass-through path**: When conditions are met, the middleware calls `$next` and returns the response.
2. **The short-circuit path**: When conditions are not met, the middleware returns a response without calling `$next`.
3. **The modification path**: The middleware modifies the request (inbound) or response (outbound) and the modification is visible downstream.

### What NOT to Test in Middleware

- The behavior of dependency classes (mock those).
- The Pipeline's closure construction (tested by the framework).
- The controller logic that runs after middleware.

---

## Mental Models

### Middleware as a Function
Test a middleware as if it is a pure function: input (request + dependencies) → output (response). Create the input, call the function, assert on the output. Mock external dependencies, control the request state, and verify the response.

### The Two-Path Assertion
Every middleware test should assert on both paths: "when the condition is true, the middleware passes through; when the condition is false, the middleware short-circuits." This is the fundamental behavioral test for gating middleware.

### Pipeline as Integration
The Pipeline itself (how middleware are composed and sorted) should be tested through feature tests, not unit tests. The Pipeline class is framework code — test it through behavior, not through direct calls.

---

## Internal Mechanics

### Direct `handle()` Invocation
A middleware's `handle()` method can be called directly with a stub `$next` closure:

```php
$request = Request::create('/test', 'GET');
$middleware = new CheckRoleMiddleware();

$response = $middleware->handle($request, function ($request) {
    return response('OK');
});

$this->assertEquals(200, $response->getStatusCode());
```

The `$next` closure simulates the next middleware in the pipeline. It receives the (possibly modified) request and returns a response. In a real pipeline, this closure is the nested middleware chain.

### Dependency Injection in Tests
Middleware with constructor dependencies can be tested by instantiating with mocked dependencies:

```php
$logger = Mockery::mock(RequestLogger::class);
$logger->shouldReceive('log')->once();

$middleware = new LogRequestMiddleware($logger);
$response = $middleware->handle(
    Request::create('/test', 'GET'),
    fn ($req) => response('OK')
);
```

Or resolved from the container with bound mocks:

```php
$this->app->instance(RequestLogger::class, $logger);
$middleware = $this->app->make(LogRequestMiddleware::class);
```

### Feature Test Middleware Assignment
In feature tests, middleware is applied automatically based on the route definition:

```php
public function test_protected_route_requires_auth(): void
{
    $response = $this->get('/dashboard');
    $response->assertRedirect('/login');
}
```

The `$this->get()` call runs through the full middleware stack — global, group, and route middleware.

### `withoutMiddleware()` in Tests
Middleware can be disabled for specific tests:

```php
public function test_route_without_middleware(): void
{
    $this->withoutMiddleware();
    
    $response = $this->get('/protected-route');
    $response->assertOk();
}
```

Specific middleware can be excluded:

```php
$this->withoutMiddleware([
    \App\Http\Middleware\CheckRole::class,
]);
```

This is useful for testing controllers independently of middleware, but should be used sparingly — the middleware is part of the route's behavior.

---

## Patterns

### Direct Unit Test Pattern
Test the middleware in isolation with controlled inputs:

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

- **Purpose**: Test middleware behavior without routing or pipeline setup.
- **Benefits**: Fast (<1ms per test), isolated, no database or session needed.
- **Tradeoffs**: Does not test pipeline integration (priority, parameter parsing, alias resolution).

### Feature Test Pattern
Test middleware through the HTTP layer:

```php
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

public function test_rate_limiting_blocks_excessive_requests(): void
{
    // Make 60 requests (assuming throttle:60,1)
    for ($i = 0; $i < 60; $i++) {
        $this->get('/api/posts');
    }
    
    $response = $this->get('/api/posts');
    $response->assertStatus(429);
}
```

- **Purpose**: Test middleware as it behaves in the real pipeline.
- **Benefits**: Tests the full path — middleware registration, priority sorting, alias resolution, parameter parsing.
- **Tradeoffs**: Slower (~20-50ms per test), requires database and framework boot.

### Terminable Middleware Test Pattern
Test the `terminate()` method directly:

```php
public function test_logs_request_information(): void
{
    Log::shouldReceive('info')
        ->once()
        ->with(Mockery::on(fn ($message) => str_contains($message, 'Request completed')));
    
    $middleware = $this->app->make(RequestLogMiddleware::class);
    
    $request = Request::create('/test', 'GET');
    $response = response('OK');
    
    $middleware->terminate($request, $response);
}
```

- **Purpose**: Verify termination logic without a real HTTP response cycle.
- **Benefits**: Fast and isolated; does not require `$response->send()`.
- **Tradeoffs**: Does not test that the middleware is actually called during `Kernel::terminate()`.

### Parameterized Middleware Test Pattern
Test middleware with different parameter values:

```php
public function test_blocks_users_without_required_role(): void
{
    $middleware = new CheckRoleMiddleware();
    
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));
    
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    
    $this->assertEquals(403, $response->getStatusCode());
}

public function test_allows_users_with_required_role(): void
{
    $middleware = new CheckRoleMiddleware();
    
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    
    $this->assertEquals(200, $response->getStatusCode());
}
```

- **Purpose**: Test middleware behavior with different parameter configurations.
- **Benefits**: Validates that parameters are correctly interpreted.
- **Tradeoffs**: Parameters are passed directly — does not test the colon-delimited parsing in the Pipeline.

### Architecture Test Pattern (Pest 4)
Enforce middleware conventions with architecture tests:

```php
test('all middleware have a handle method')
    ->expect('App\Http\Middleware')
    ->toHaveMethod('handle');

test('terminable middleware are registered as singletons')
    ->expect('App\Http\Middleware')
    ->toImplement(\Illuminate\Contracts\Http\Kernel::class)
    ->each->toBeRegisteredAsSingleton();
```

- **Purpose**: Enforce team conventions for middleware structure.
- **Benefits**: Catches missing methods, incorrect naming, missing registrations.
- **Tradeoffs**: Architecture tests only verify structure, not behavior.

---

## Architectural Decisions

### Direct Unit vs Feature Test
| Aspect | Direct Unit | Feature Test |
|--------|-------------|--------------|
| Speed | ~0.5ms per test | ~30ms per test |
| Isolation | Complete | Requires framework boot |
| Pipeline integration | Not tested | Tested fully |
| Parameter parsing | Not tested | Tested |
| Priority/ordering | Not tested | Tested |
| Session/flash data | Manual setup | Automatic |

Prefer direct unit tests for middleware logic coverage (60%+ of tests). Use feature tests for pipeline integration (parameter parsing, priority ordering, alias resolution).

### Mocking Strategy
Mock dependencies that are expensive or non-deterministic:
- Database queries (repositories, Eloquent queries).
- External API calls (HTTP clients, payment gateways).
- Logging (if the logger writes to external systems).

Do NOT mock:
- The `Request` object — create and configure it directly.
- The `$next` closure — pass a simple `fn ($req) => response('OK')`.
- The `Response` object — use the response returned by the middleware.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Direct unit tests are fast and isolated | Do not test pipeline integration | Supplement with feature tests for critical pipelines |
| Feature tests cover the full pipeline | Slower tests; may mask middleware bugs with controller logic | Test middleware on routes without complex controller logic |
| Architecture tests enforce conventions | Only verify structure, not behavior | Use as a complement to behavioral tests |
| `withoutMiddleware()` isolates controller logic | Bypasses middleware — may miss middleware-controller interaction bugs | Remove `withoutMiddleware()` before deployment |

---

## Performance Considerations

### Test Execution Time
A direct unit middleware test runs in ~0.1-0.5ms. A feature middleware test runs in ~20-100ms (includes framework boot, routing, controller dispatch). A suite of 50 middleware unit tests runs in ~25ms. A suite of 50 feature tests runs in ~1-5 seconds.

### Parallel Execution
Middleware unit tests are parallel-safe because they do not share state — each test creates its own middleware instance and request. PHPUnit's parallel execution works without modification.

### Database Overhead
Feature tests that use `RefreshDatabase` add migration time (~200-500ms per test class). Use `DatabaseTransactions` instead of `RefreshDatabase` for middleware tests that only read data, not create schemas.

---

## Production Considerations

### Test Coverage for Security Middleware
Auth, CSRF, rate limiting, and CORS middleware should have 100% branch coverage — every condition must be tested. These are security-critical components. A missed branch is a potential vulnerability.

### Test Coverage for Transformation Middleware
Request and response transformation middleware should test:
- The transformation is applied correctly.
- The transformation does not break existing data formats.
- Edge cases: empty input, null values, special characters, large payloads.

### CI Pipeline Placement
Middleware unit tests should run in the fastest CI stage (no database, no external services). Feature middleware tests should run after unit tests pass. Architecture tests should run in a static analysis stage.

---

## Common Mistakes

### Testing Through HTTP Only
Only testing middleware through HTTP feature tests misses the opportunity for faster, more isolated direct unit tests. A middleware with 10 condition branches requires 10 HTTP requests (200-500ms total) instead of 10 direct calls (5ms total).

### Not Testing Short-Circuit Paths
Only testing the pass-through path (middleware allows the request) and not the short-circuit path (middleware blocks the request). Gating middleware is defined by its blocking behavior — testing the allow path alone is insufficient.

### Forgetting to Test Terminable Middleware
Terminable middleware is often untested because its execution is invisible in feature tests. Developers write feature tests, see the response is correct, and assume the middleware worked — but the `terminate()` method never ran. Test `terminate()` directly.

### Overusing withoutMiddleware()
Disabling middleware in feature tests to simplify controller testing creates a blind spot where middleware-controller interaction issues are missed. Use `withoutMiddleware()` only when testing controllers in isolation, and remove it for the final test pass.

### Not Testing Middleware Parameters
A parameterized middleware is tested without passing parameters, or with only one parameter value. If the middleware has 5 parameter variants, all should be tested.

---

## Failure Modes

### Mock Mismatch
A mocked dependency in a direct unit test has different behavior than the real dependency in production. The middleware passes in the test but fails in production. Mitigate by adding feature tests for critical middleware paths.

### Shared State Between Tests
A middleware that is registered as a singleton and tested via the container leaks state between tests. A request count stored in `$this->requestCount` from test 1 affects test 2's assertions. Always reset singleton state or resolve fresh instances per test.

### Dependency on Global State
Middleware that uses facades (`\Auth::check()`, `\Log::info()`, `\Cache::get()`) in direct unit tests without faking them fails because the facades are not booted. Fake facades before testing or inject dependencies instead of using facades.

---

## Ecosystem Usage

### Laravel Framework Tests
The Laravel framework itself tests middleware through direct unit tests (in `tests/Http/Middleware/`) and feature tests (in `tests/Feature/`). Built-in middleware has comprehensive test coverage for both pass-through and short-circuit paths.

### Spatie Packages
Spatie tests middleware through a mix of direct unit and feature tests. The `spatie/laravel-permission` package tests role and permission middleware with both authenticated and unauthenticated requests.

### Laravel Jetstream
Jetstream middleware is tested as part of feature tests, not in isolation. Jetstream's test suite sends HTTP requests and asserts on responses, redirects, and database state.

---

## Related Knowledge Units

### Prerequisites
- Custom Middleware — understanding middleware structure is prerequisite to testing it
- Middleware Lifecycle — understanding where middleware runs in the pipeline
- PHPUnit/Pest Basics — the testing framework used for middleware tests

### Related Topics
- Action Testing — testing patterns for action classes (similar isolation approach)
- Parameterized Middleware — testing middleware with different parameter values
- Terminable Middleware — testing termination logic directly

### Advanced Follow-up Topics
- Feature Testing — testing the full HTTP pipeline including middleware
- Architecture Testing — enforcing middleware conventions with Pest
- Mocking Strategies — when to mock in middleware tests

---

## Research Notes

- Direct middleware unit testing is underutilized in the Laravel community. Most developers test middleware only through HTTP feature tests, which are slower and less isolated than direct unit tests.
- The `Request::create()` method is the standard way to create requests for direct middleware tests. It accepts the same parameters as a route URI — path, method, parameters, cookies, files, and server variables.
- `$request->setUserResolver()` is available for setting the authenticated user on a request without going through the auth middleware. This is useful for testing authorization middleware.
- The `withoutMiddleware()` method in tests uses `$this->app->instance(Middleware::class, ...)` to disable middleware. It works by binding an empty middleware configuration to the container, causing the Kernel to skip middleware during test requests.