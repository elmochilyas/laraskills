# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: HTTP Test Helpers
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Laravel's HTTP test helpers simulate full HTTP requests (GET, POST, PUT, PATCH, DELETE, OPTIONS) through the application's routing, middleware, and controller layers. They are the primary tool for feature tests, which constitute ~70% of a standard Laravel test suite. The helpers boot the framework, dispatch a request through the Kernel pipeline, and return a `TestResponse` with ~50 fluent assertion methods. Understanding this lifecycle is essential for writing tests that catch real user-facing regressions.

# Core Concepts
- **Request simulation**: `$this->get('/url')`, `$this->post('/url', $data)`, `$this->put()`, `$this->patch()`, `$this->delete()`, `$this->options()`.
- **Kernel dispatch**: Each HTTP test boots the application, creates a `Request` from parameters, dispatches it through the HTTP Kernel (global + route middlewares), and captures the `Response`.
- **`TestResponse` object**: Returned by all HTTP helpers. Provides fluent assertion methods: `assertStatus()`, `assertOk()`, `assertCreated()`, `assertRedirect()`, `assertSessionHasErrors()`, etc.
- **Request headers**: `$this->get('/url', ['X-Custom' => 'value'])` passes headers. For specific header types, use `withHeader()`, `withToken()`, `withBasicAuth()`.
- **Session state**: `$this->withSession(['key' => 'value'])` pre-populates the session. Used for testing flash data, session-bound authorization, and CSRF.
- **Cookie injection**: `$this->withCookie('name', 'value')` and `$this->withCookies(['name' => 'value'])` for cookie-specific testing.
- **Unvalidated requests**: `$this->call('POST', '/url', $data, [], [], $server)` bypasses request validation for raw request testing.

# Mental Models
- **Full-stack simulation**: HTTP tests exercise the same code path as a real HTTP request: middleware → controller → response. Nothing is skipped unless explicitly disabled.
- **TestResponse as assertion hub**: The `TestResponse` object collects everything about the response: status code, headers, content, view data, session. All assertions flow through this object.
- **Request/DOM independence**: HTTP tests assert on the HTTP response (headers, content, structure). They don't render the DOM or test JavaScript behavior.
- **Feature test as "request in, response out"**: You send a request with specific state (auth, session, cookies). You assert on the response. Internal middleware/controller state resets between tests.

# Internal Mechanics
- **Application reboot**: Each HTTP test boots a fresh application via `CreatesApplication`. Service providers are re-registered. Config is reloaded.
- **Kernel pipeline**: `Illuminate\Foundation\Http\Kernel::handle()` runs the request through global middleware stack → route matching → route middleware → controller → response.
- **Request creation**: `Request::create('/url', 'GET', $parameters, $cookies, $files, $server)` creates a Symfony Request object. Laravel converts it internally.
- **Response capture**: `$kernel->handle($request)` returns a `Response` object. Laravel wraps it in `TestResponse` for fluent assertions.
- **Session handling**: `StartSession` middleware runs as part of the pipeline. `withSession()` pre-fills the session store via `$this->app['session']->put()` before dispatch.
- **Authentication state**: `actingAs($user)` calls `$this->app['auth']->login($user)` which persists the user in the session for the test's request lifecycle.

# Patterns
- **Pattern: Arrange-Act-Assert for HTTP tests**
  - Purpose: Structured test flow for feature tests
  - Benefits: Readable, consistent, easy to debug
  - Tradeoffs: Can feel verbose for simple assertions
  - Implementation: (1) Create data/factories, (2) Set auth state, (3) Make request, (4) Assert response

- **Pattern: Authenticated request via `actingAs()`**
  - Purpose: Test endpoints that require authentication
  - Benefits: Simple, single-call auth setup
  - Tradeoffs: Bypasses actual login flow; doesn't test authentication logic
  - Implementation: `$this->actingAs($user)->get('/dashboard')->assertOk()`

- **Pattern: JSON-only vs web-only request separation**
  - Purpose: Test API and web routes with appropriate assertions
  - Benefits: Clear separation of concerns
  - Tradeoffs: Some routes work for both; duplicated test coverage
  - Implementation: API tests use `getJson()`/`postJson()`; web tests use `get()`/`post()`

# Architectural Decisions
- **`get()` vs `getJson()`**: `get()` expects HTML responses; `getJson()` expects JSON. Use `getJson()` for API routes. Use `get()` for Inertia/Blade routes.
- **`post()` vs `postJson()`**: Same distinction as above. `post()` with form data uses `application/x-www-form-urlencoded`. `postJson()` uses `application/json`.
- **`withoutMiddleware()`**: Disables middleware for a test. Useful for testing controllers in isolation. Risky—removes auth, CSRF, and throttle protection. Use sparingly.
- **`session()` vs `withSession()`**: `session()` accesses current session. `withSession()` pre-populates session before request. Prefer `withSession()` for setup.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Full-stack testing catches real regressions | Slower than unit tests (~30-50ms per test) | Acceptable; confidence gain > speed loss |
| ~50 assertion methods cover most scenarios | Can be overwhelming for beginners | Focus on `assertStatus`, `assertJson`, `assertRedirect` |
| `actingAs()` makes auth testing effortless | Doesn't test actual login/logout flow | Separate auth-specific feature tests for login logic |
| Session/cookie pre-configuration | Hidden state can mask real middleware behavior | Document pre-configured state in test names |

# Performance Considerations
- **Application boot overhead**: Each HTTP test boots the Laravel application (~30ms). 100 HTTP tests = ~3 seconds just for booting. Use `#[UnitTest]` for non-HTTP tests.
- **Database operations**: Combined with `RefreshDatabase`, each test runs migrations within a transaction. MySQL transaction overhead is <1ms.
- **Middleware impact**: Heavy middleware (rate limiting, session, failed jobs) adds overhead. Disable non-essential middleware in testing environment.
- **Response parsing**: `assertSee()`, `assertSeeInOrder()`, and HTML parsing are slower than JSON assertions. For large responses, use JSON assertions where possible.

# Production Considerations
- **CI focus**: HTTP tests should be the primary CI gate. A failing HTTP test indicates a user-facing regression.
- **Parallel execution**: HTTP tests benefit significantly from parallel execution because they are I/O-bound (database, view rendering).
- **Filter strategy**: Organize HTTP tests by feature, not by type. `tests/Feature/Users/`, `tests/Feature/Orders/`. Makes test discovery and CI filtering natural.
- **Coverage scope**: HTTP tests should cover: success paths, validation failures, auth failures, not-found scenarios, and authorization boundaries.

# Common Mistakes
- **Mistake: Using `withoutMiddleware()` in feature tests**
  - Why: Simpler test setup, no auth to manage
  - Why harmful: Tests don't verify CSRF protection, rate limiting, or auth middleware behavior
  - Better: Test with middleware active; disable only for specific controller unit testing

- **Mistake: Not testing error responses**
  - Why: Focus on happy path only
  - Why harmful: Error handling (404, 403, 422, 500) untested; production errors may leak stack traces
  - Better: Test at least one error response per endpoint: `assertStatus(404)`, `assertStatus(403)`, `assertStatus(422)`

- **Mistake: Hardcoded URLs instead of named routes**
  - Why: Easier to write `/users/1` than `route('users.show', $user)`
  - Why harmful: URL structure changes break tests; named routes provide indirection
  - Better: Always use `route('users.show', $user)` in test requests

# Failure Modes
- **Session state leakage**: `withSession()` values persist for the single request only. No leakage between tests.
- **Authentication across tests**: `actingAs()` does NOT persist across tests. Each HTTP test must set up its own auth state.
- **CSRF token mismatch**: If CSRF middleware is active (not `withoutMiddleware`), POST/PUT/DELETE requests need a valid CSRF token. `withSession()` can insert `_token` or use `withoutMiddleware()`.
- **Route model binding failures**: Route-model binding requires the model to exist in the database. Ensure factory-created records exist before making requests.

# Ecosystem Usage
- **Laravel docs**: All Laravel documentation examples use HTTP test helpers as the primary testing approach.
- **Pest**: `$this->get()` works inside `test()` closures (which receive `$this`). `it()` blocks cannot use `$this` and require `test()` instead.
- **Laravel Nova**: Nova's test suite extensively uses HTTP helpers to test CRUD operations on resources.
- **Laravel Spark**: Spark uses HTTP tests to verify subscription flows, team management, and authentication.
- **Laravel Cashier**: Cashier's test suite uses HTTP helpers combined with Stripe fakes.

# Related Knowledge Units
- **Prerequisites**: Laravel routing, Middleware pipeline, Eloquent basics
- **Related Topics**: JSON API testing, Authentication testing, Validation testing, View/Blade testing
- **Advanced Follow-up**: Custom assertion macros, TestResponse macros, Middleware testing patterns

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server � requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
