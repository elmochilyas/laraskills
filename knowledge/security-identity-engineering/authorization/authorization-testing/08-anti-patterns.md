# Anti-Patterns: Authorization Testing

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Authorization Testing |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|---------------|
| AP-AT-01 | Positive-Only Authorization Tests | Critical | High | Medium |
| AP-AT-02 | Missing Model-Scoping Tests | Critical | High | Low |
| AP-AT-03 | Skipping Unauthenticated Access Tests | High | Medium | Low |
| AP-AT-04 | Ignoring Super-Admin Bypass Testing | High | Medium | Low |
| AP-AT-05 | Hardcoded IDs and Manual Test Matrix | Medium | High | Medium |

---

## Repository-Wide Anti-Patterns

- **Blade Directive Testing Over Server-Side**: Testing Blade `@can` directives instead of the server-side authorization boundary
- **No Tenant Isolation Tests**: Missing cross-tenant access tests in multi-tenant applications
- **No Permission Cache Test**: Not testing that permission changes take effect after cache invalidation

---

## 1. Positive-Only Authorization Tests

### Category
Testing · Security

### Description
Writing tests that only verify authorized access succeeds without testing that unauthorized access is denied, giving false confidence in the authorization system.

### Why It Happens
Developers focus on the happy path — testing that the authorized user can access the resource. Writing a second test for the negative case feels like duplication. The assumption is that "if the authorized test passes, authorization must be working." This is dangerously incorrect.

### Warning Signs
- Every authorization test method only checks `assertStatus(200)` or `assertTrue($can)`
- No test methods that assert `assertStatus(403)` or `assertFalse($can)`
- Pull request adding a Policy only includes tests for allowed users
- Code coverage shows 100% for Policy classes, but only positive cases tested
- A policy that returns `true` unconditionally would pass all tests

### Why Harmful
A policy method that always returns `true` passes every positive test. The negative test is the only thing that proves the authorization logic actually restricts access. Without negative tests, a bug that removes all authorization checks is undetectable. The test suite provides false confidence — it reports green while authorization is completely broken.

### Real-World Consequences
- Policy always returns `true` due to a logic error — all tests pass because only positive cases are tested
- Production bug: users can delete any post because `delete` policy always permits
- Regression introduced in refactoring: authorization logic returns `true` for every check
- Security incident: unauthorized data access goes undetected by CI because negative tests are missing
- False sense of security: "We have 100% authorization test coverage" (but only positive cases)

### Preferred Alternative
Write both a positive test (authorized user gets 200) and a negative test (unauthorized user gets 403) for every Gate/Policy method.

### Refactoring Strategy
1. Audit all existing authorization tests — count positive vs negative test methods
2. For every unauthorized scenario, add the corresponding negative test
3. Use a data provider to reduce boilerplate when adding both cases
4. Verify that a policy returning `true` unconditionally would fail the negative test
5. Add a CI check that enforces positive+negative pair coverage

### Detection Checklist
- [ ] For each Policy method, is there both a positive and negative test?
- [ ] Would a policy that always returns `true` pass all tests?
- [ ] Are there test methods that assert `assertStatus(403)` or `assertFalse()`?
- [ ] Are unauthorized scenarios tested for every authorization check?
- [ ] Is the positive-to-negative test ratio balanced?

### Related Rules/Skills/Trees
- Test Both Positive and Negative Authorization Cases (05-rules.md)
- Test Authorization Policies, Gates, and Permissions (06-skills.md)
- Positive vs Negative Test Coverage Scope decision tree (07-decision-trees.md)

---

## 2. Missing Model-Scoping Tests

### Category
Security · Critical

### Description
Testing authorization only with generic user models and resources, missing the horizontal privilege escalation scenario where User A can access User B's resources.

### Why It Happens
The simplest authorization test creates a user and a resource owned by that same user — the test passes because the owner relationship is correct. Developers don't add a second test with cross-ownership because it requires creating an additional user and resource. The "own resource" scenario seems comprehensive enough.

### Warning Signs
- Test resources are always created with `factory()->for($user)` (same user as actor)
- No test creates resources owned by a different user
- `can('update', $post)` is only tested with `$post` belonging to the actor
- No test verifies that User A cannot update User B's resource
- Policies with ownership checks have no test for the non-owner case

### Why Harmful
The most common authorization vulnerability is horizontal privilege escalation — User A accessing User B's data. If the Policy's ownership check is missing or buggy, all users can access all resources. Without a cross-ownership test, this vulnerability is invisible. A test that only uses the actor's own resources will pass even if the ownership check is completely missing.

### Real-World Consequences
- Policy missing `$user->id === $post->user_id` — any user can edit any post
- Data leak: User A reads User B's private documents
- Compliance violation: cross-organization data access undetected
- Security penetration test identifies "missing ownership check" as a finding
- Production incident: support team discovers users can modify each other's orders

### Preferred Alternative
Always test model-specific scoping: create resources owned by a different user and verify that access is denied.

### Refactoring Strategy
1. For each Policy method with ownership checks, identify the owner relationship
2. Add a test where the resource is owned by a different user
3. Verify the unauthorized user gets 403 or `false`
4. Ensure the test name clearly describes the cross-ownership scenario
5. Repeat for all model-specific authorization checks

### Detection Checklist
- [ ] Are resources created for a different user in authorization tests?
- [ ] Does the Policy test include a "User A cannot access User B's resource" scenario?
- [ ] Are there test methods with `$otherUser = User::factory()->create()`?
- [ ] Would a policy without ownership checks pass the existing tests?
- [ ] Are all ownership relationships covered by cross-ownership tests?

### Related Rules/Skills/Trees
- Test Model-Specific Scoping (05-rules.md)
- Test Authorization Policies, Gates, and Permissions (06-skills.md)

---

## 3. Skipping Unauthenticated Access Tests

### Category
Testing · Security

### Description
Not testing that guest (unauthenticated) requests to protected routes return 401 or 403, potentially allowing unauthenticated access to protected resources.

### Why It Happens
Testing authenticated scenarios is the obvious path — create a user, acting as that user, make a request. Testing unauthenticated access feels like testing Laravel's built-in `auth` middleware, which "should just work." The assumption is that if the `auth` middleware is in place, unauthenticated access is automatically blocked.

### Warning Signs
- No test calls routes without `$this->actingAs()`
- All route tests use authenticated users
- Protected routes have no guest access test
- Pull request adding new protected routes only tests authenticated access
- Missing route's `auth` middleware would not be caught by tests

### Why Harmful
If a developer forgets to add the `auth` middleware to a new route or controller, guest users can access protected functionality. Without a test that explicitly verifies guest access returns 401/403, this omission goes undetected. The missing middleware vulnerability can expose admin features, user data, or CRUD operations to anonymous users.

### Real-World Consequences
- New admin route added without `auth` middleware — anyone can access it
- Developer removes middleware from a controller group — all routes become public
- API endpoint missing `auth:sanctum` middleware — allows unauthenticated API calls
- Security scan reveals unauthenticated access to user data endpoints
- Guest user can create, modify, or delete data meant for authenticated users only

### Preferred Alternative
Test every protected route with an unauthenticated request. Verify the response is 401 or 403.

### Refactoring Strategy
1. Identify all protected routes (those with auth middleware)
2. Add a test for each: call without actingAs, assert 401 or 403
3. Add this to the test checklist for new route additions
4. If using controller-level middleware, test the controller without auth
5. Consider adding a global test that scans routes and verifies auth middleware

### Detection Checklist
- [ ] Are protected routes tested without authentication?
- [ ] Do any protected routes return 200 when called without actingAs?
- [ ] Is the auth middleware explicitly tested for each protected controller?
- [ ] Would removing auth middleware from a route break any test?
- [ ] Are API routes tested without Bearer tokens?

### Related Rules/Skills/Trees
- Test Unauthenticated Access Returns 401 or 403 (05-rules.md)
- Test Authorization Policies, Gates, and Permissions (06-skills.md)

---

## 4. Ignoring Super-Admin Bypass Testing

### Category
Testing · Security

### Description
Not writing tests that verify the super-admin authorization bypass works correctly — neither testing that super-admins can access all resources nor that regular users are correctly restricted.

### Why It Happens
The `Gate::before()` callback that grants super-admins unlimited access seems simple enough that it doesn't need tests. Developers assume "super-admin can access everything" is straightforward. The subtle bugs — the bypass accidentally matching non-super-admins, or the bypass not working for certain resources — are not obvious until production.

### Warning Signs
- No test that a super-admin can access another user's resources
- No test that a regular user cannot access another user's resources
- `Gate::before()` callback exists but has no corresponding test
- Super-admin is defined by a check that may have edge cases
- Adding a new Policy method assumes super-admin bypass works without verification

### Why Harmful
The super-admin bypass is the most powerful authorization feature — it grants unrestricted access. If it's too broad (matches non-super-admins), every user becomes a super-admin. If it's too narrow (doesn't check all policies), super-admins get unexpected 403 errors. Without tests, neither scenario is caught until it affects real users.

### Real-World Consequences
- `Gate::before()` checks `$user->is_admin` but the column is nullable — null users (bug) get super-admin access
- Super-admin bypass only applies to `view` methods but not `update` or `delete`
- Regular user accidentally has `is_admin` flag set to true in staging — no test catches it
- Production incident: super-admin cannot access newly added resource type
- Security incident: non-admin users can access all resources due to a bug in the bypass condition

### Preferred Alternative
Write tests that verify the super-admin CAN access all resources AND that regular users CANNOT.

### Refactoring Strategy
1. Create a super-admin user and a regular user for tests
2. Verify super-admin can access resources they don't own for every action type
3. Verify regular user cannot access resources they don't own
4. Test the `Gate::before()` callback directly with edge cases
5. Add a test for each new Policy method that verifies super-admin bypass works

### Detection Checklist
- [ ] Is there a test that super-admin can access another user's resource?
- [ ] Is there a test that regular user cannot access another user's resource?
- [ ] Does the test suite verify super-admin bypass for every action type (view, update, delete)?
- [ ] Are edge cases tested (disabled super-admin, null role)?
- [ ] Would a broken `Gate::before()` callback be detected by existing tests?

### Related Rules/Skills/Trees
- Test Super-Admin Bypass Behavior (05-rules.md)
- Test Authorization Policies, Gates, and Permissions (06-skills.md)

---

## 5. Hardcoded IDs and Manual Test Matrix

### Category
Testing · Maintainability

### Description
Using hardcoded user IDs, resource IDs, and manual individual test methods instead of factories and data providers, leading to brittle, repetitive, and incomplete authorization tests.

### Why It Happens
The first authorization test is easy — just create a user and check a route. As more user types, resources, and actions are added, individual test methods multiply. Factories seem like overhead when a single `User::find(1)` works. Data providers require thinking about test structure upfront. The result is a sprawling test class with duplicated setup code.

### Warning Signs
- `User::find(1)` or `Post::find(1)` used instead of factories
- Tests are individual methods for every authorization combination
- Adding a new user type requires duplicating 5-10 test methods
- Test class has 20+ very similar methods with slightly different setup
- Setup code is duplicated across test methods instead of using `setUp()` or factories

### Why Harmful
Hardcoded IDs break when database is reseeded. Individual test methods for every combination create maintenance burden — adding a new role requires adding 10+ new methods. The test class becomes unmanageable, and gaps in coverage are hard to identify. The permission matrix is implicit (scattered across methods) rather than explicit (single data provider), making it impossible to audit which combinations are tested.

### Real-World Consequences
- Tests fail after database refresh because hardcoded IDs don't match
- Adding "viewer" role requires writing 15 new test methods
- Developer misses a test combination — coverage gap goes unnoticed
- Test class has 2000+ lines of repetitive authorization tests
- Code review cannot easily verify which authorization scenarios are tested
- Developers stop adding authorization tests due to maintenance overhead

### Preferred Alternative
Use Eloquent factories for test data and PHPUnit data providers with an explicit permission matrix.

### Refactoring Strategy
1. Replace all hardcoded IDs with `User::factory()->create()` and related factories
2. Define a permission matrix as a data provider: `['user_type', 'action', 'resource_type', 'expected']`
3. Create helper methods that set up the test context based on the data provider inputs
4. Remove duplicate individual test methods
5. Add new authorization combinations as single rows in the data provider

### Detection Checklist
- [ ] Are Eloquent factories used instead of hardcoded IDs?
- [ ] Is there a permission matrix data provider?
- [ ] How many lines of test code per authorization combination?
- [ ] Would adding a new role require 1 line or 10+ test methods?
- [ ] Can the test coverage be audited from a single data structure?

### Related Rules/Skills/Trees
- Use Data Providers for Permission Matrix Coverage (05-rules.md)
- Test Authorization Policies, Gates, and Permissions (06-skills.md)
- Permission Matrix Organization decision tree (07-decision-trees.md)
