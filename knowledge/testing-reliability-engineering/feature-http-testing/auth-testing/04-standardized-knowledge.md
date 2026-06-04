# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Authentication & Authorization Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, Laravel authentication system (guards, providers, sessions) |
| Related KUs | JSON API testing, Validation testing, Middleware testing, Gate/Policy definition |
| Source | domain-analysis.md K020 |

# Overview

Authentication testing verifies login, registration, password reset, and session management flows. Authorization testing verifies that authenticated users can/cannot access specific resources based on roles, permissions, or ownership. Laravel provides `actingAs()` for authenticating users in tests, `assertAuthenticated()`/`assertGuest()` for session state assertions, and Gate/Policy integration with HTTP tests. Authorization testing is security-critical — gaps here mean unauthorized data access in production.

# Core Concepts

- **`actingAs($user, $guard = null)`**: Authenticates a user for the test request. Bypasses login form.
- **`assertAuthenticated($guard = null)`**: Asserts the user is logged in after a request.
- **`assertGuest($guard = null)`**: Asserts no user is logged in.
- **`assertAuthenticatedAs($user, $guard = null)`**: Asserts a specific user is authenticated.
- **Policy testing**: `$this->assertTrue($user->can('view', $post))` or HTTP tests with varying user roles.
- **`$this->actingAsSanctum($user)`**: Sanctum-specific authentication for API token-based auth.

# When To Use

- For every authenticated endpoint (test guest access returns 401/403/redirect)
- For every authorization boundary (test each role can/cannot access)
- For ownership-based resources (test User A cannot access User B's data)
- For login/registration/password reset flows
- For role/permission matrix testing

# When NOT To Use

- For testing the authentication mechanism itself in every test (use `actingAs()` for most tests; test login flow separately)
- For testing features that don't have authentication or authorization requirements
- When using `actingAs()` to test login functionality (login flow needs actual HTTP POST)
- For testing third-party auth providers (test integration separately)

# Best Practices (WHY)

- **Test every side of every auth boundary**: For each protected endpoint, test: guest (401/redirect), wrong role (403), correct role (200), ownership boundary (if applicable). Missing any side is a security gap.
- **Use `actingAs()` for authorization tests, actual login flow for auth tests**: `actingAs()` is fast and focused. Use actual HTTP login for testing the authentication mechanism (wrong password, lockout, CSRF).
- **Test all HTTP verbs for authorization**: A resource may allow GET for all authenticated users but restrict DELETE to admins. Test authorization for each verb.
- **Use `actingAsSanctum()` for API token tests**: Sanctum routes use token authentication, not session. The wrong guard means the user appears unauthenticated.
- **Test ownership boundaries**: The most common authorization bug is missing ownership checks. User A should not access User B's resources.

# Architecture Guidelines

- **`actingAs()` vs full login flow**: `actingAs()` for authorization tests (fast, focused). Full login flow for authentication tests (thorough, slow).
- **Sanctum vs session auth**: Sanctum uses `actingAsSanctum()` and token assertions. Session uses `actingAs()` and redirect assertions.
- **Policy unit tests vs HTTP tests**: Unit-test policies for logic correctness. HTTP-test policies for middleware integration.
- **Multi-tenant auth**: Test that users from Tenant A cannot access Tenant B's data.

# Performance Considerations

- `actingAs()` overhead: <1ms. Sets user in session without DB query.
- Full login flow: ~10-15ms per test (password verification, session creation, CSRF).
- Policy resolution: ~1-2ms per check. Cached by Laravel.
- Role/permission checks: Spatie Permission caches roles/permissions per request.

# Security Considerations

- Authorization testing is security-critical. Gaps here mean unauthorized data access in production.
- Test that error responses don't reveal whether a resource exists (use 404 for both "not found" and "not authorized" in some contexts).
- Test rate limiting on auth endpoints (login, register, password reset).
- Test brute force protection (account lockout after N failed attempts).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing authenticated access (not guest) | Focus on "what the app does" | Guest access to admin endpoints may go untested | For every protected endpoint, test guest gets 401/403/redirect |
| Using actingAs() for login flow testing | Convenience | Login-specific behavior (wrong password, lockout, CSRF) not tested | Use actingAs() for auth tests; use actual POST for login tests |
| Not testing authorization for all HTTP verbs | Testing GET but not POST/PUT/DELETE | Auth may work for reads but not writes | Test authorization for every HTTP verb on every resource |
| Guard mismatch | Using actingAs() for Sanctum route | User appears unauthenticated | Use actingAsSanctum() for Sanctum-guarded routes |
| Not testing ownership boundaries | Assuming authorization is role-only | User A can access User B's private data | Test that users can only access their own resources |

# Anti-Patterns

- **`actingAs()` for everything**: Using `actingAs()` even for login flow tests. Instead, use actual POST requests for testing login mechanism and `actingAs()` for authorization.
- **Testing only one role**: Only testing admin access but not regular user or guest access. Instead, test all roles in the authorization matrix.
- **Hardcoded policy user IDs**: Using `$user->id === 1` in policies. Instead, use `$user->id === $post->user_id`.
- **No guest access test for protected routes**: Assuming middleware will catch all unauthorized access. Instead, explicitly test that guests receive 401/403/redirect.

# Examples

```php
// Guest access rejection
public function test_guest_cannot_view_dashboard()
{
    $this->get(route('dashboard'))
        ->assertRedirect(route('login'));
}

// Authenticated access
public function test_authenticated_user_can_view_dashboard()
{
    $this->actingAs(User::factory()->create())
        ->get(route('dashboard'))
        ->assertOk();
}

// Ownership boundary
public function test_user_cannot_update_another_users_post()
{
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    $post = Post::factory()->for($user1)->create();

    $this->actingAs($user2)
        ->put(route('posts.update', $post), ['title' => 'Hacked'])
        ->assertForbidden();
}

// Role-based access
public function test_admin_can_delete_any_post()
{
    $admin = User::factory()->admin()->create();
    $post = Post::factory()->create();

    $this->actingAs($admin)
        ->delete(route('posts.destroy', $post))
        ->assertOk();
}

// Actual login flow test
public function test_login_with_valid_credentials()
{
    $user = User::factory()->create(['password' => bcrypt('password')]);

    $this->post(route('login'), [
        'email' => $user->email,
        'password' => 'password',
    ])->assertRedirect(route('dashboard'));

    $this->assertAuthenticated();
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, Laravel authentication system (guards, providers, sessions)
- **Related**: JSON API testing, Validation testing, Middleware testing, Gate/Policy definition
- **Advanced**: Multi-tenant authorization testing, OAuth/Socialite testing, JWT/API token testing

# AI Agent Notes

- The most common authorization testing gap is missing guest access tests. For every protected endpoint, always add a test that an unauthenticated user gets 401/403/redirect.
- For ownership-based resources, create two users and two resources. Test that each user can only access their own resource and gets 403 for the other.
- When testing authorization with Spatie Permission, clear permission cache in `setUp()`: `app()->make(\Spatie\Permission\PermissionRegistrar::class)->forgetCachedPermissions()`.

# Verification

- [ ] Every protected endpoint tests guest access rejection (401/403/redirect)
- [ ] Authorization is tested for all HTTP verbs (GET, POST, PUT, DELETE)
- [ ] Ownership boundaries are tested (User A cannot access User B's resources)
- [ ] Role-based access matrix is tested for all roles
- [ ] actingAs() is used for authorization tests; actual POST for login flow
- [ ] Guard is specified correctly (actingAsSanctum for API routes)
- [ ] Policies are tested at both unit level and HTTP integration level
- [ ] Rate limiting on auth endpoints is tested
