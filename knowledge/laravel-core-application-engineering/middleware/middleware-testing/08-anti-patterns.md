# Anti-Patterns: Middleware Testing

## Metadata
| Field | Value |
|-------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Middleware System |
| Knowledge Unit | Middleware Testing |
| Difficulty | Intermediate |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | All Middleware Tests as Feature Tests | Performance | High |
| 2 | Only Testing the Happy Path | Reliability | Critical |
| 3 | Testing Through the Controller Instead of Middleware | Architecture | High |
| 4 | Never Testing Terminable Middleware | Coverage | High |
| 5 | Overusing withoutMiddleware() | Reliability | High |

---

## Anti-Pattern 1: All Middleware Tests as Feature Tests

### Category
Performance

### Description
Writing every middleware test as an HTTP feature test instead of using direct unit tests. A feature test boots the framework, resolves routes, and dispatches controllers — even when the middleware's behavior can be verified in isolation with a direct `handle()` call.

### Why It Happens
Feature tests are the default testing pattern in Laravel. Developers learn `$this->get('/route')` → `$response->assertOk()` and apply it to middleware without considering the direct unit testing approach. The `handle()` signature is not immediately obvious for testing directly.

### Warning Signs
- Middleware tests take 20-100ms per test (feature test) instead of <1ms per test (direct unit)
- A suite of 50 middleware tests takes 5+ seconds instead of <100ms
- Tests boot the framework and route through a controller to test middleware logic
- The middleware's short-circuit path is tested by asserting on a controller's response rather than the middleware's own return
- CI pipeline for middleware tests takes significantly longer than other unit tests

### Why Harmful
Every middleware test that uses HTTP wastes resources on framework boot, routing, and controller dispatch. A middleware with 10 condition branches requires 10 HTTP requests totaling 200-500ms instead of 10 direct calls totaling 5ms. Slow test suites discourage running tests frequently, leading to longer debug cycles. The extra CI time scales with team size and commit frequency.

### Real-World Consequences
- Team adds a 6-condition auth middleware; writes 12 HTTP feature tests (6 pass-through, 6 short-circuit)
- Test suite grows by 12 × ~50ms = ~600ms
- CI pipeline crosses 5-minute threshold; developers start skipping local tests
- A bug is introduced in the 5th condition; developer pushes without running middleware tests
- Bug reaches staging; deployment rollback required
- Direct unit tests would have run in ~6ms total and been run before commit

### Preferred Alternative
Use direct unit tests for the majority of middleware logic coverage (60%+). Reserve feature tests for pipeline integration — parameter parsing, priority ordering, alias resolution.

```php
// Direct unit test: fast, isolated
public function test_blocks_requests_without_api_token(): void
{
    $middleware = new EnsureTokenIsValid();
    $request = Request::create('/api/data', 'GET');
    $response = $middleware->handle($request, fn ($req) => response('OK'));
    $this->assertEquals(401, $response->getStatusCode());
}

// Feature test: for pipeline integration only
public function test_middleware_priority_in_full_pipeline(): void
{
    $response = $this->get('/api/data');
    $response->assertStatus(401);
}
```

### Refactoring Strategy
1. Identify all middleware tests written as HTTP feature tests
2. Extract middleware-specific assertions into direct unit tests
3. Use `Request::create()` for request instantiation, `fn ($req) => response('OK')` for `$next`
4. Keep a small number of feature tests for pipeline integration coverage
5. Add architecture tests (Pest) for structural conventions (separate from behavior tests)

### Detection Checklist
- [ ] Middleware logic tests are direct unit tests (not HTTP feature tests)
- [ ] Feature tests are only used for pipeline integration (parsing, priority, aliases)
- [ ] Suite of 50 middleware tests runs in <200ms
- [ ] No middleware test boots the framework unnecessarily
- [ ] Composition ratio: ~70% direct unit, ~20% feature, ~10% architecture

### Related Rules/Skills/Trees
- Rule: Prefer direct unit tests for middleware logic coverage
- Rule: Use feature tests only for pipeline integration
- Related KU: Middleware Fundamentals, Feature Testing

---

## Anti-Pattern 2: Only Testing the Happy Path

### Category
Reliability

### Description
Testing only the pass-through path of gating middleware (e.g., "user with correct role passes") without testing the short-circuit path (e.g., "user with wrong role is blocked"). The middleware's defensive behavior — the part that actually protects the application — goes untested.

### Why It Happens
The happy path is obvious: create a valid request, assert it passes. Writing the short-circuit test requires extra setup — creating an unauthenticated request, configuring a denied scenario, asserting on the error response. Developers focus on "does it work?" rather than "does it fail correctly?"

### Warning Signs
- Auth middleware tests only verify authenticated users reach the controller
- Rate limiter tests never verify the 429 response
- Role middleware tests only test the "admin can access admin routes" case
- CSRF middleware tests only verify that tokens pass, not that missing tokens are rejected
- Test coverage reports show middleware branch coverage below 80%

### Why Harmful
The short-circuit path is the primary reason gating middleware exists. If the guard breaks (wrong role allowed through), the application is unprotected. Testing only the happy path creates a false sense of security — the tests pass, but the protection may be broken. A regression in the guard logic goes undetected because no test exercises it.

### Real-World Consequences
- `CheckRoleMiddleware` is tested only with admin role → passes
- A refactor introduces `return $next($request)` before the role check
- Tests still pass because they use admin role (no short-circuit test)
- A user with "editor" role accesses admin routes
- Sensitive feature exposed; escalation required; fix pushed as emergency

### Preferred Alternative
Test every middleware condition branch. For each gating middleware, write one test per pass-through path and one test per short-circuit path.

```php
// Pass-through: test the happy path
public function test_allows_admin_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'admin']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(200, $response->getStatusCode());
}

// Short-circuit: test the guard
public function test_blocks_non_admin_role(): void
{
    $middleware = new CheckRoleMiddleware();
    $request = Request::create('/admin', 'GET');
    $request->setUserResolver(fn () => User::factory()->make(['role' => 'user']));
    $response = $middleware->handle($request, fn ($req) => response('OK'), 'admin');
    $this->assertEquals(403, $response->getStatusCode());
}
```

### Refactoring Strategy
1. Audit middleware test coverage: identify missing short-circuit tests
2. For each gating middleware condition (auth, role, permission, throttle, CSRF), add the corresponding short-circuit test
3. Use branch coverage analysis to verify all conditions are tested
4. Add to CI check: middleware branch coverage must be 100%
5. Code review gate: middleware PR without short-circuit test is rejected

### Detection Checklist
- [ ] Every gating middleware has short-circuit tests for all conditions
- [ ] Branch coverage for security middleware is 100%
- [ ] Auth middleware tested with both authenticated and unauthenticated states
- [ ] Role/permission middleware tested with both allowed and denied roles
- [ ] Rate limiter tested with both within-limit and exceeded-limit scenarios

### Related Rules/Skills/Trees
- Rule: Test both pass-through and short-circuit paths for every middleware
- Rule: Gating middleware is defined by its blocking behavior — test it
- Related KU: Custom Middleware, Middleware Lifecycle

---

## Anti-Pattern 3: Testing Through the Controller Instead of Middleware

### Category
Architecture

### Description
Writing tests that go through the full controller layer and assert on controller output to indirectly verify middleware behavior, rather than testing the middleware directly. This couples the middleware test to controller implementation and masks middleware-specific bugs.

### Why It Happens
Feature tests are the natural pattern in Laravel testing. Developers create a route, a controller, and assert on the controller's response. When a bug appears in middleware behavior, the test that "covers" the middleware actually covers the controller — the middleware bug may not be isolated by the test.

### Warning Signs
- Middleware tests assert on controller data (e.g., post list content) rather than middleware behavior (status code, header, short-circuit)
- Middleware test requires a controller to run
- Refactoring the controller breaks middleware tests
- Middleware behavior cannot be verified without creating database records through the controller
- Test names reference controller behavior, not middleware behavior

### Why Harmful
Testing through the controller masks the middleware's actual behavior. If the middleware short-circuits, the test may fail with a controller error rather than a clear middleware failure. If the controller changes its response format, the middleware test breaks even though the middleware is unchanged. This creates brittle tests that do not clearly indicate where the bug is.

### Real-World Consequences
- `EnsureTokenIsValid` middleware is tested via `GET /api/posts` → asserts posts are returned
- A developer adds pagination to `PostController@index` → changes response format
- Middleware test fails: "Expected posts array, got paginated object"
- Developer spends 30 minutes debugging middleware before realizing the controller changed
- Fix: update controller test, not middleware test — but the wasted debugging time is gone
- Direct middleware test would not have broken

### Preferred Alternative
Test middleware behavior directly — assert on the response the middleware returns, not on what the controller produces after the middleware passes. Use a stub `$next` closure for pass-through assertions and direct return for short-circuit assertions.

```php
// Wrong: goes through controller
public function test_token_middleware_allows_valid_token(): void
{
    $response = $this->withHeaders(['X-API-Token' => 'valid'])->get('/api/posts');
    $response->assertJson(['posts' => [...]]); // Tests controller, not middleware
}

// Correct: tests middleware directly
public function test_token_middleware_passes_with_valid_token(): void
{
    $middleware = new EnsureTokenIsValid();
    $request = Request::create('/api/posts', 'GET');
    $request->headers->set('X-API-Token', 'valid');
    $response = $middleware->handle($request, fn ($req) => response('OK'));
    $this->assertEquals(200, $response->getStatusCode()); // Tests middleware behavior
}
```

### Refactoring Strategy
1. Identify middleware tests that assert on controller output
2. Create direct unit tests for each middleware that assert on middleware behavior (status code, header, pass-through/short-circuit)
3. Convert controller-dependent assertions to middleware-specific assertions
4. Keep a minimal set of integration tests that verify middleware+controller interaction
5. Rename test methods to describe middleware behavior, not controller behavior

### Detection Checklist
- [ ] Middleware tests do not depend on controller implementation
- [ ] Middleware behavior is verified by direct assertions on middleware return
- [ ] Controller refactoring does not break middleware tests
- [ ] Middleware tests use `Request::create()` and stub `$next`
- [ ] Stub `$next` returns a simple response, not controller-produced data

### Related Rules/Skills/Trees
- Rule: Test middleware behavior directly, not through the controller
- Rule: Direct unit tests isolate middleware from controller changes
- Related KU: Action Testing, Feature Testing

---

## Anti-Pattern 4: Never Testing Terminable Middleware

### Category
Coverage

### Description
Writing feature tests that pass through terminable middleware but never asserting on the `terminate()` method's behavior. Feature tests do not exercise `terminate()` — it runs after the test assertion completes or does not run at all in the test environment. The termination logic (logging, metrics, cleanup) is never verified.

### Why It Happens
`terminate()` runs after the response is sent — invisible to HTTP feature tests. Developers write `$this->get('/route')` → `$response->assertOk()`, see the green test, and assume the middleware works. The `handle()` path works, but `terminate()` may not. Without a direct test, the bug goes unnoticed.

### Warning Signs
- Terminable middleware exists in the codebase with no test for its `terminate()` method
- Test coverage reports show `terminate()` at 0% coverage in green suites
- Bug reports show missing log entries, incomplete metrics, or uncleaned temp files
- A typo in `terminate()` logic is shipped because feature tests pass
- Developers say "I know terminate() works because the feature test passes"

### Why Harmful
Terminable middleware is the only mechanism for post-response processing in Laravel. If `terminate()` breaks, logging is lost, metrics are incomplete, cleanup tasks are skipped, and audit trails have gaps. The application appears to work (responses are sent correctly), but the supporting infrastructure silently fails.

### Real-World Consequences
- `RequestLogMiddleware` has a typo in `terminate()`: `Log::info(Requesr...)` — syntax error
- Feature tests pass because they never call `terminate()`
- Production logs show no request entries; team assumes logging system is down
- Three days of debugging the log aggregator before someone notices the middleware typo
- Fix: correct spelling in terminate() → logging works immediately

### Preferred Alternative
Test terminable middleware by calling `terminate()` directly on the resolved instance and asserting on side effects (log writes, metric sends, file deletions).

```php
// Direct test: verify terminate() behavior
public function test_logs_request_information_after_termination(): void
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

### Refactoring Strategy
1. Identify all terminable middleware classes in the codebase
2. For each, write a direct test that calls `terminate()` and asserts on side effects
3. Use `Log::shouldReceive()`, `Event::fake()`, or mock dependencies to verify behavior
4. Verify singleton registration if state is shared between `handle()` and `terminate()`
5. Add to CI: terminate() coverage must match handle() coverage

### Detection Checklist
- [ ] Every terminable middleware has a direct `terminate()` test
- [ ] Side effects (log, metrics, cleanup) are asserted in the test
- [ ] Feature tests do not claim coverage for `terminate()` behavior
- [ ] Singleton registration is tested (state shared between handle/terminate)
- [ ] Exception paths in `terminate()` are also tested

### Related Rules/Skills/Trees
- Rule: Feature tests do not exercise terminate() — test it directly
- Rule: Always test terminable middleware's terminate() method
- Related KU: Terminable Middleware, Middleware Lifecycle

---

## Anti-Pattern 5: Overusing withoutMiddleware()

### Category
Reliability

### Description
Routinely using `$this->withoutMiddleware()` in feature tests to bypass middleware when testing controllers, creating a blind spot where middleware-controller interaction bugs are never caught by the test suite.

### Why It Happens
Middleware can make controller testing cumbersome. Auth middleware requires creating authenticated users. Rate limiter middleware requires tracking request counts. Developers disable middleware to simplify test setup and speed up test writing, intending to add middleware tests later — but the tests are never added.

### Warning Signs
- `withoutMiddleware()` appears in multiple test classes
- No corresponding middleware test exists for the bypassed middleware
- Test setup includes comment: "TODO: add middleware test for this"
- Auth-dependent routes are tested without authentication (middleware disabled)
- The route is used by multiple test classes, and some disable middleware while others do not

### Why Harmful
Middleware and controllers interact in ways that are not visible when middleware is disabled. An auth middleware that sets the user on the request, a response transformation that modifies the controller's output, or a rate limiter that changes the response — these interactions are invisible to tests that bypass middleware. The application appears to work in testing but fails in production when the middleware is present.

### Real-World Consequences
- `ForceJsonMiddleware` sets `Accept: application/json` on API routes
- Controller test disables middleware to skip the header setup
- Controller returns HTML error page on validation failure instead of JSON
- Test passes (no middleware, no header manipulation)
- Production client receives HTML error and crashes
- Fix: test without `withoutMiddleware()` to catch the issue

### Preferred Alternative
Only use `withoutMiddleware()` when specifically testing controller isolation. Remove it for the final test pass. Create dedicated middleware tests for middleware behavior and keep feature tests as integration tests that exercise the full pipeline.

```php
// Wrong: routinely disabling middleware
public function test_store_post(): void
{
    $this->withoutMiddleware(); // Hides middleware interaction bugs
    $response = $this->post('/posts', ['title' => 'Test']);
    $response->assertCreated();
}

// Correct: test through the full pipeline
public function test_store_post_via_full_pipeline(): void
{
    $user = User::factory()->create();
    $response = $this->actingAs($user)->post('/posts', ['title' => 'Test']);
    $response->assertCreated();
}

// Isolated controller test (only when needed)
public function test_controller_handles_invalid_input(): void
{
    $this->withoutMiddleware();
    $response = $this->post('/posts', ['title' => '']);
    $response->assertSessionHasErrors(['title']);
}
```

### Refactoring Strategy
1. Audit all `withoutMiddleware()` calls in the test suite
2. For each, determine if it is masking a middleware interaction
3. Remove `withoutMiddleware()` and fix tests to work with the real pipeline
4. Keep only the minimal set where controller isolation is explicitly needed
5. Add CI lint rule flagging `withoutMiddleware()` usage for review

### Detection Checklist
- [ ] `withoutMiddleware()` is not used in standard feature tests
- [ ] Tests exercise the full middleware pipeline by default
- [ ] Middleware interaction bugs are caught by the test suite
- [ ] Controller-only tests are clearly documented as such
- [ ] When `withoutMiddleware()` is used, dedicated middleware tests exist

### Related Rules/Skills/Trees
- Rule: Do NOT use withoutMiddleware() in standard feature tests
- Rule: Test through the full pipeline unless controller isolation is explicitly needed
- Related KU: Custom Middleware, Feature Testing
