# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | HTTP Test Helpers |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel routing, Middleware pipeline, Eloquent basics |
| Related KUs | JSON API testing, Authentication testing, Validation testing, View/Blade testing |
| Source | domain-analysis.md K003 |

# Overview

Laravel's HTTP test helpers simulate full HTTP requests (GET, POST, PUT, PATCH, DELETE, OPTIONS) through the application's routing, middleware, and controller layers. They are the primary tool for feature tests, which constitute ~70% of a standard Laravel test suite. The helpers boot the framework, dispatch a request through the Kernel pipeline, and return a `TestResponse` with ~50 fluent assertion methods. Understanding this lifecycle is essential for writing tests that catch real user-facing regressions.

# Core Concepts

- **Request simulation**: `$this->get('/url')`, `$this->post('/url', $data)`, `$this->put()`, `$this->patch()`, `$this->delete()`, `$this->options()`.
- **Kernel dispatch**: Boots the application, creates a Request, dispatches through HTTP Kernel (global + route middlewares), captures Response.
- **`TestResponse` object**: Returned by all HTTP helpers. Provides fluent assertion methods: `assertStatus()`, `assertOk()`, `assertCreated()`, `assertRedirect()`.
- **Session state**: `$this->withSession(['key' => 'value'])` pre-populates the session.
- **Authentication state**: `actingAs($user)` logs in a user for the test's request lifecycle.

# When To Use

- For ~70% of your test suite (feature tests)
- When testing the full request-response cycle through middleware and controllers
- For CRUD operations on resources
- For validation, authentication, and authorization testing
- As the primary CI quality gate

# When NOT To Use

- For testing business logic in isolation (use unit tests)
- For testing JavaScript behavior (use Dusk or Playwright)
- For testing view rendering details (use view tests)
- When you need to verify database state (combine with database assertions)

# Best Practices (WHY)

- **Use named routes, not hardcoded URLs**: `route('users.show', $user)` survives URL structure changes. Hardcoded `/users/1` breaks when route definitions change.
- **Test both success and error responses**: Every endpoint should have tests for: happy path, validation errors, auth failures, not-found scenarios, and authorization boundaries. Error handling code is the most likely to have untested bugs.
- **Don't use `withoutMiddleware()` in feature tests**: It bypasses auth, CSRF, throttle, and other important middleware. Tests should verify the full middleware pipeline. Use `withoutMiddleware()` only for isolated controller unit tests.
- **Use `actingAs()` for authenticated tests**: It's the simplest way to test authenticated endpoints. Don't manually set session cookies or headers.
- **Follow Arrange-Act-Assert**: (1) Create data/factories, (2) Set auth state, (3) Make request, (4) Assert response. This structure makes tests readable and maintainable.

# Architecture Guidelines

- **`get()` vs `getJson()`**: Use `getJson()` for API routes (JSON responses). Use `get()` for web routes (HTML/Blade responses).
- **`post()` vs `postJson()`**: `post()` uses `application/x-www-form-urlencoded`. `postJson()` uses `application/json`.
- **Organize by feature, not by type**: `tests/Feature/Users/`, `tests/Feature/Orders/` — makes discovery and CI filtering natural.
- **Parallel execution**: HTTP tests benefit significantly from parallel execution (I/O-bound: database, view rendering).

# Performance Considerations

- Application boot overhead: ~30ms per HTTP test. 100 tests = ~3 seconds booting.
- Database operations with RefreshDatabase: <1ms transaction overhead per test.
- Middleware impact: Heavy middleware adds overhead. Disable non-essential middleware in testing environment.
- Response parsing: `assertSee()` and HTML parsing are slower than JSON assertions.

# Security Considerations

- HTTP tests simulate requests — they don't actually make network calls.
- CSRF protection is active by default. Use `$this->withoutCSRF()` to disable for testing, or include CSRF token in requests.
- Rate limiting is active in tests. Use `$this->withoutMiddleware(ThrottleRequests::class)` if rate limiting interferes with test scenarios.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using withoutMiddleware() in feature tests | Simpler test setup, no auth | Tests don't verify CSRF, rate limiting, or auth middleware | Test with middleware active; disable only for specific controller unit testing |
| Not testing error responses | Focus on happy path | Error handling untested; production errors may leak stack traces | Test at least one error response per endpoint |
| Hardcoded URLs instead of named routes | Easier to write | URL structure changes break tests | Always use route('users.show', $user) |
| Not using actingAs() for auth | Manual session setup | Auth state may not match real flow | Use actingAs($user) for authenticated tests |
| Testing everything with HTTP tests | Confusing HTTP with unit tests | Slower test suite than necessary | Use unit tests for pure business logic |

# Anti-Patterns

- **Single test covers everything**: One test method that asserts status, structure, values, database state, and session. Instead, split into focused test methods per assertion concern.
- **Unvalidated data in requests**: Using `$this->call()` with raw server variables instead of the clean helper methods. Instead, use the appropriate `get()`/`post()`/`put()`/`delete()` helpers.
- **No Arrange-Act-Assert structure**: Tests that mix setup and assertions without clear structure. Instead, follow AAA with clear section separation.
- **Ignoring response content**: Only asserting status code without verifying response content. Instead, at minimum assert see/seeJson for the expected outcome.

# Examples

```php
public function test_authenticated_user_can_view_dashboard()
{
    // Arrange
    $user = User::factory()->create();

    // Act
    $response = $this->actingAs($user)
        ->get(route('dashboard'));

    // Assert
    $response->assertOk()
        ->assertSee('Dashboard')
        ->assertSee($user->name);
}

public function test_unauthenticated_user_is_redirected()
{
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
}

public function test_create_post_with_valid_data()
{
    $user = User::factory()->create();
    $postData = Post::factory()->make()->toArray();

    $this->actingAs($user)
        ->post(route('posts.store'), $postData)
        ->assertCreated()
        ->assertJson(['title' => $postData['title']]);

    $this->assertDatabaseHas('posts', ['title' => $postData['title']]);
}
```

# Related Topics

- **Prerequisites**: Laravel routing, Middleware pipeline, Eloquent basics
- **Related**: JSON API testing, Authentication testing, Validation testing, View/Blade testing
- **Advanced**: Custom assertion macros, TestResponse macros, Middleware testing patterns

# AI Agent Notes

- HTTP tests are the backbone of Laravel testing. Aim for ~70% of the test suite to be HTTP/feature tests. They catch real user-facing regressions and give the best confidence-per-test ratio.
- When writing HTTP tests, always use named routes. This makes tests resistant to URL structure changes.
- For new features, write the HTTP test before writing the implementation. This ensures the feature is testable from the outside.

# Verification

- [ ] Feature tests use named routes, not hardcoded URLs
- [ ] Error responses (404, 403, 422, 500) are tested per endpoint
- [ ] actingAs() is used for authenticated endpoints
- [ ] withoutMiddleware() is not used in feature tests (only for isolated controller tests)
- [ ] Tests follow Arrange-Act-Assert structure
- [ ] Tests are organized by feature, not by type
- [ ] getJson()/postJson() are used for API routes
- [ ] HTTP tests are the primary CI quality gate
