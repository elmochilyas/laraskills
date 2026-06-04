# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Authentication & Authorization Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Authentication testing verifies login, registration, password reset, and session management flows. Authorization testing verifies that authenticated users can/cannot access specific resources based on roles, permissions, or ownership. Laravel provides `actingAs()` for authenticating users in tests, `assertAuthenticated()`/`assertGuest()` for session state assertions, and Gate/Policy integration with HTTP tests. Authorization testing is security-critical—gaps here mean unauthorized data access in production.

# Core Concepts
- **`actingAs($user, $guard = null)`**: Authenticates the given user for the test request. Bypasses login form; directly sets the user in the session.
- **`assertAuthenticated($guard = null)`**: Asserts the user is logged in after a request. Used for login/register endpoint tests.
- **`assertGuest($guard = null)`**: Asserts no user is logged in. Used for logout tests and for unauthorized endpoint access.
- **`assertAuthenticatedAs($user, $guard = null)`**: Asserts a specific user is authenticated.
- **Policy testing**: Test `Gate` policies via `$this->assertTrue($user->can('view', $post))` or HTTP tests with varying user roles.
- **`$this->actingAsSanctum($user)`**: Sanctum-specific authentication for API token-based auth.
- **Role/permission testing**: Use roles/permissions packages (Spatie Laravel Permission) to test access control for different user types.

# Mental Models
- **Auth boundary as security perimeter**: Every authenticated endpoint has a boundary: guests are rejected, wrong-role users are rejected, only the right users pass. Test each side of every boundary.
- **`actingAs()` as trust boundary**: `actingAs()` sets the user, but doesn't test the login mechanism itself. Login flows need separate tests.
- **Authorization matrix**: For each resource, test: guest access (401/403), wrong role (403), correct role (200), ownership (where applicable).
- **Guard isolation**: Testing with multiple guards (web, api, sanctum) requires explicit guard specification in assertions.

# Internal Mechanics
- **`actingAs()` implementation**: Calls `$this->app['auth']->guard($guard)->login($user)`. Sets the authenticated user in the session for the test's request cycle.
- **`assertAuthenticated()`**: Checks `$this->app['auth']->check()` returns true. Verifies user session exists without checking which user.
- **Policy resolution route**: In an HTTP request: middleware → `Gate::authorize()` or `$this->authorize()` → policy class → `view/create/update/delete` method → boolean.
- **Sanctum actingAs**: `actingAsSanctum($user)` creates a Sanctum token for the user and sets the `Authorization: Bearer` header for the test request.
- **Session persistence**: Authentication state persists for the single test request. Each test must set up its own auth state via `actingAs()`.

# Patterns
- **Pattern: Guest access rejection**
  - Purpose: Verify unauthenticated users cannot access protected endpoints
  - Benefits: Prevents information disclosure and unauthorized actions
  - Tradeoffs: Must be tested per-endpoint; easy to miss
  - Implementation: `$this->get('/dashboard')->assertRedirect('/login')` or `assertStatus(401)` for API

- **Pattern: Role-based access matrix**
  - Purpose: Test each user role against each endpoint with expected status
  - Benefits: Comprehensive authorization coverage
  - Tradeoffs: Many test combinations for applications with 5+ roles
  - Implementation: Dataset with [role, endpoint, expected_status] tuples; iterate and assert

- **Pattern: Ownership boundary testing**
  - Purpose: Verify users can only access their own resources
  - Benefits: Prevents horizontal privilege escalation
  - Tradeoffs: Requires creating multiple users and resources
  - Implementation: User A creates Post 1. User B tries GET /posts/1 → 403. User A tries GET /posts/1 → 200.

- **Pattern: Login flow via HTTP (not actingAs)**
  - Purpose: Test the actual login mechanism, not just auth state
  - Benefits: Catches login form issues, CSRF problems, throttle behavior
  - Tradeoffs: Slower than `actingAs()`; more setup
  - Implementation: `post('/login', ['email' => $user->email, 'password' => 'password'])->assertRedirect('/dashboard')`

# Architectural Decisions
- **`actingAs()` vs full login flow**: Use `actingAs()` for authorization testing (fast, focused). Use full login flow for authentication testing (thorough, slow).
- **Sanctum vs session auth testing**: Sanctum tests use `actingAsSanctum()` and JWT-like token assertions. Session tests use `actingAs()` and redirect assertions.
- **Policy unit tests vs HTTP authorization tests**: Unit-test policies for logic correctness. HTTP-test policies for middleware integration.
- **Role enumeration**: Spatie Laravel Permission roles should be tested as datasets. Test each role against gated endpoints.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| `actingAs()` is fast and simple | Bypasses actual login flow | Also test login flow separately |
| Policy unit tests are precise | May not catch middleware/gate integration issues | Layer HTTP tests for critical auth paths |
| Dataset-driven role matrix is comprehensive | Many test combinations | Focus on distinct roles vs minor permission variants |
| Ownership boundary tests catch real bugs | More test setup (multiple users + resources) | Worth the effort for data-scoped resources |

# Performance Considerations
- **`actingAs()` overhead**: Negligible (<1ms). Sets user in session without database query for credentials.
- **Full login flow**: Password hashing verification, session creation, CSRF check. ~10-15ms per test.
- **Policy resolution**: Each authorization check resolves the policy class and calls the method. Cached by Laravel. ~1-2ms per check.
- **Role/permission checks**: Spatie Permission caches roles/permissions per request. First request loads from DB; subsequent requests use cache.

# Production Considerations
- **Password reset testing**: Test the full reset flow (request → email → reset form → new password). Common point of failure.
- **Email verification**: Test that unverified users are blocked from protected endpoints (if `verified` middleware is applied).
- **Rate limiting on auth endpoints**: Login, register, password reset endpoints should be rate-limited. Test that limits apply.
- **Multi-tenant auth**: Tenant isolation requires testing that users from Tenant A cannot access Tenant B's data. Test with cross-tenant requests.
- **Brute force protection**: Login failure tracking, account lockout, and CAPTCHA triggers. Test unsuccessful login attempts.

# Common Mistakes
- **Mistake: Only testing authenticated access (not guest access)**
  - Why: Focus on "what the app does" not "what it prevents"
  - Why harmful: Guest access to admin endpoints may go untested
  - Better: For every protected endpoint, test guest gets 401/403/redirect

- **Mistake: Using `actingAs()` for login flow testing**
  - Why: `actingAs()` is convenient
  - Why harmful: Login-specific behavior (wrong password, account lockout, CSRF) is not tested
  - Better: Use `actingAs()` for authorization tests; use actual POST for authentication tests

- **Mistake: Not testing authorization for all HTTP verbs**
  - Why: Testing GET but not POST/PUT/DELETE
  - Why harmful: Authorization may work for reads but not writes
  - Better: Test authorization for every HTTP verb on every resource

- **Mistake: Hardcoding user IDs in policies**
  - Why: `$user->id === 1` in policy
  - Why harmful: Works in development with seeded user; fails in production
  - Better: Use `$user->id === $post->user_id` for ownership checks

# Failure Modes
- **Session fixation: `actingAs()` doesn't regenerate session ID**. Not a test concern (session ID regeneration happens in login flow), but the difference matters for login flow tests.
- **Guard mismatch**: Using `actingAs($user)` for a Sanctum-guarded route. User won't be authenticated. Use `actingAsSanctum($user)` or specify `sanctum` guard.
- **Policy not registered**: `Gate::policy()` not called in `AuthServiceProvider`. All authorization checks return false (403). Test that policies are registered.
- **Cached permissions stale**: Spatie Permission caches are not refreshed between tests. Use `app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions()` in `setUp()`.

# Ecosystem Usage
- **Laravel Breeze**: Breeze's test suite demonstrates auth flow testing for login, register, password reset, email verification, and logout.
- **Laravel Jetstream**: Jetstream adds team-based authorization. Tests cover team membership boundaries and ownership.
- **Laravel Sanctum**: Sanctum API token testing via `actingAsSanctum()` and token ability assertions.
- **Spatie Laravel Permission**: Role and permission gates are testable via `$user->assignRole('admin')` in test setup.
- **Laravel Fortify**: Fortify's authentication actions (LoginResponse, RegisterResponse) are individually testable.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, Laravel authentication system (guards, providers, sessions)
- **Related Topics**: JSON API testing, Validation testing, Middleware testing, Gate/Policy definition
- **Advanced Follow-up**: Multi-tenant authorization testing, OAuth/Socialite testing, JWT/API token testing

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server � requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
