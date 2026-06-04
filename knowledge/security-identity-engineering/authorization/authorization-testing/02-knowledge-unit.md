# Metadata

Domain: Security & Identity Engineering
Subdomain: Authorization
Knowledge Unit: Authorization Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Authorization testing verifies that Gates, Policies, and permission checks correctly allow authorized users and deny unauthorized users. Laravel provides `$this->actingAs($user)`, Gate/Policy unit tests, and HTTP assertion helpers. The essential principle: every Gate/Policy method must have at least one positive test (authorized user succeeds) and one negative test (unauthorized user gets 403). The permission matrix pattern — a data provider enumerating all user-type, action, resource, and expected-result combinations — is the most maintainable approach for comprehensive coverage. Authorization bugs are security vulnerabilities, making these tests the most critical security tests in any Laravel application.

---

# Core Concepts

- **actingAs($user, $guard)**: Authenticate a specific user for HTTP tests. Bypasses the login flow.
- **HTTP Authorization Tests**: `$this->actingAs($user)->get('/posts')->assertStatus(200)` for allowed, `assertStatus(403)` for denied.
- **Gate/Policy Unit Tests**: Test authorization logic directly: `$this->assertTrue($user->can('update', $post))`, `$this->assertFalse(Gate::allows('create', Post::class))`.
- **Permission Matrix**: A data provider defining arrays of `[user_type, action, resource, expected_result]` — eliminates test duplication.
- **Positive + Negative Testing**: Every authorization path must be tested for both allow and deny outcomes.
- **Model-Specific Scoping**: User A cannot update User B's resource. Tests must create resources owned by specific users via factories.
- **Super-Admin Bypass**: Verify super-admin CAN access all resources and that basic user CANNOT.
- **Unauthenticated Access**: Guest users should receive 401/403 for protected routes.

---

# Mental Models

- **Authorization as a Matrix**: Think of authorization as a grid — user types on one axis, actions/resources on the other. Each cell is either allow or deny. Tests should cover every meaningful cell.
- **Positive + Negative = Complete**: A single Gate/Policy method is only tested when you have both a case where it returns true and a case where it returns false. Missing either side is a blind spot.

---

# Internal Mechanics

- Laravel's `actingAs()` calls `Auth::guard($guard)->login($user)` on the test's underlying application instance. The user is persisted in the session for the duration of the test request.
- `$user->can('update', $post)` resolves the PostPolicy via Gate auto-discovery, calls the `update()` method with ($user, $post), and returns a boolean.
- HTTP tests flow through the full middleware stack, including the `auth` middleware and authorization checks in controllers (`$this->authorize()`).
- The `assertStatus(403)` assertion validates the HTTP response status code. For API routes returning JSON, `assertForbidden()` is equivalent.
- Permission matrix data providers are PHPUnit data providers — static methods returning arrays of arrays. Each sub-array is unpacked as method arguments.

---

# Patterns

## Permission Matrix Data Provider
- **Purpose**: Reduce test boilerplate for comprehensive coverage.
- **Implementation**: Define all user types and expected outcomes in a single data provider.
- **Benefits**: One test method covers many scenarios; adding a new user type requires one row.
- **Tradeoffs**: Test output is less descriptive; use meaningful array keys for debugging.

## Factory-Based Resource Ownership
- **Purpose**: Ensure model-specific scoping is actually tested.
- **Implementation**: `$post = Post::factory()->for($user)->create()` for owned resources; `Post::factory()->for($otherUser)->create()` for unowned.
- **Benefits**: Realistic test data; avoids hardcoded IDs.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| HTTP test vs Gate/Policy unit test | Need to validate middleware + controller flow vs just authorization logic | Both — HTTP tests for integration; Gate/Policy tests for pure logic |
| Data provider vs individual test methods | Many user-type × action combinations | Data provider for comprehensive matrix; individual methods for complex scenario setup |
| RefreshDatabase vs DatabaseTransactions | Test isolation vs speed | DatabaseTransactions between tests; RefreshDatabase between test classes |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Comprehensive test coverage catches auth bugs | Permission matrix grows with each new role/action | Maintain the matrix — a missing test row is a potential vulnerability |
| Data providers reduce duplication | Debugging a failing data provider row is harder than a named test | Use string keys in data provider for readable output |
| HTTP tests validate full middleware stack | Slower than direct Gate/Policy tests | Use both — HTTP for integration, direct for authorization logic |

---

# Performance Considerations

- Authorization tests are fast: <50ms per test case.
- Data providers add zero runtime cost — they are resolved once per test suite.
- Use `DatabaseTransactions` trait for speed (`RefreshDatabase` is slower).
- Refresh database state between test classes, not between individual tests.

---

# Production Considerations

- **CI Enforcement**: Run authorization tests in CI. A failing authorization test can mean a security vulnerability.
- **Coverage Gate**: Consider a minimum authorization test coverage threshold (e.g., 100% of Gates/Policies must have tests).
- **Parallel Testing**: Laravel's `--parallel` option works well for authorization tests since they are typically independent per test class.
- **Seed Permissions**: Ensure authorization tests seed roles and permissions before running. Use `DatabaseMigrations` + `Seeders` in the base test class.

---

# Common Mistakes

- **Only testing positive cases**: Tests verify authorized access but not denied access. A user without permission might still get 200 and no one notices.
- **Not testing model-specific scoping**: Testing with generic users skips the actual security boundary. User A needs a resource that belongs to User B to verify scoping.
- **Skipping unauthenticated tests**: Routes behind `auth` middleware still need explicit tests for guest access.
- **Hardcoded IDs**: `User::find(1)` breaks when database is reset. Use factories for all test data.
- **Not refreshing database**: Authorization tests depend on seeded permissions. Stale data from previous tests causes false failures or false passes.

---

# Failure Modes

- **False Positive in Data Provider**: A permission matrix row shows `expected: true` but the user actually gets denied. The test passes if the implementation changes? No — the test fails, correctly. But if the matrix is wrong, the test passes while the auth is broken. Audit the matrix for correctness.
- **Factory States Out of Sync**: If a factory state (`author`, `editor`) changes its permission assignment, the test may incorrectly pass/fail. Keep factory states synchronized with permissions.
- **ActingAs with Wrong Guard**: `actingAs($user, 'web')` vs `actingAs($user, 'sanctum')` — tests pass with the wrong guard, leaving the other guard untested. Test all guards that the application uses.

---

# Related Knowledge Units

- Prerequisites: Gates (closure-based authorization), Policies (model-centric authorization), Middleware pipeline
- Related: Spatie laravel-permission (permission testing), Super-admin bypass testing, Multi-tenancy security testing
- Advanced Follow-up: Pest vs PHPUnit for authorization testing, Custom authorization assertion helpers, CI authorization coverage gates

## Ecosystem Usage
- **Laravel Gates**: Closure-based authorization registered via Gate::define(); integrates with controllers via $this->authorize() and Blade via @can() directives. Gates are the simplest authorization mechanism in Laravel.
- **Laravel Policies**: Class-based authorization organized per model; auto-discovered via convention or manually registered. Policies provide CRUD methods (viewAny, view, create, update, delete, restore, forceDelete).
- **Blade Authorization Directives**: @can, @cannot, @canany, @elsecan, @cannotany for template-level authorization checks. @can integrates with Gates and Policies transparently.
- **Spatie Laravel Permission**: Role and permission management package; uses Gate::before() for super-admin bypass and provides middleware (role:admin, permission:edit-articles) for route protection.
- **Super Admin bypass patterns**: Gate::before() callback returning true for admin users; this skips all other Gate/Policy checks, reducing authorization latency for admin operations.
- **Policy auto-discovery**: Laravel discovers policies by convention (Policy suffix, same directory structure as models); explicit Gate::policy() registration is required when conventions are broken.
- **ReBAC implementations**: External policy decision points like Permit.io, Auth0 FGA, Topaz provide ReBAC as a service; Laravel integration occurs via middleware or Gate extenders that call the external PDP.
- **ABAC implementations**: Attribute-based access control typically implemented via policy query modifications or custom Gate::before() callbacks that evaluate user, resource, and environment attributes.

## Research Notes
- Laravel 11 introduced the Gate::guessPolicyNamesUsing() callback, allowing custom policy naming conventions beyond the default ModelPolicy convention — this enables modular monolith and package-based policy organization.
- Policy auto-discovery was optimized in Laravel 12 with event caching (the event:cache command now caches discovered policies as well), improving production performance for applications with many policies.
- ReBAC (Relationship-Based Access Control) is gaining traction in the Laravel ecosystem, with external PDPs providing gRPC/REST APIs for relationship graph queries — Laravel integration requires custom Gate::before() or middleware wrappers.
- ABAC (Attribute-Based Access Control) evaluation in Laravel typically involves policy methods that evaluate user attributes, resource attributes, and environment conditions — this is more expressive than RBAC but requires careful performance optimization.
- Spatie Laravel Permission v6+ introduced team-based permissions (PermissionRegistrar::), allowing permission sets per team context within a single user account — this extends the package's multi-tenancy capabilities.
- The super-admin bypass pattern (Gate::before(fn() => $user->isAdmin() ? true : null)) must return null (not false) for non-admin users to allow other Gates/Policies to evaluate — returning false denies all other authorization checks.
- Policy method resolution uses reflection to match methods to authorization actions — custom actions beyond CRUD require explicit method naming convention or the policy() helper with callback.
- Blade authorization directives compile to raw PHP can() calls during view rendering — this means authorization checks in Blade execute every time the view renders, not pre-cached at compile time.

## Internal Mechanics
- **Gate Resolution Flow**: Gate::allows('update', $post) → Gate->inspect('update', $post) → calls Gate->raw('update', $post) which resolves the policy for the given class (via Gate->getPolicyFor()) → if no policy found, checks for named Gate definitions → calls the callback or policy method with ($user, $post) → returns \Illuminate\Auth\Access\Response with allowed() or deny().
- **Policy Auto-Discovery**: Laravel scans app/Policies directory via Gate::guessPolicyNamesUsing() with convention: model at app/Models/User.php → policy at app/Policies/UserPolicy.php. The PolicyFinder maps model classes to policy classes through naming convention only — no reflection or metadata file involved.
- **@can Blade Directive Compilation**: @can('update', $post) compiles to <?php if (app(\Illuminate\Contracts\Auth\Access\Gate::class)->check('update', $post)): ?> — the authorization check happens at render time, not compile time.
- **Gate::before Execution Order**: Gate::before() callbacks are executed first for every authorization check. If a before callback returns true, the check passes immediately; if false, it fails immediately; if null, the normal Gate/Policy method executes.
- **Spatie Permission Registration**: Spatie\Permission\PermissionRegistrar registers a Gate::before() callback that checks the user's role/permission cache. If the user has the required permission via a role, the callback returns true; otherwise null to allow standard Gates/Policies to evaluate.
- **Policy Method Resolution**: The authorize() method in controllers uses Gate::inspect() which resolves the policy method name by convention: view → view() method, create → create() method, update → update() method. Custom actions use the same method name as the ability name.
