# Anti-Patterns: Authorization Failure Testing

## AP-1: Missing Policy Tests
**Category**: Security

**Description**: Endpoints use `authorize()` calls but no policy is registered, or the policy method doesn't exist. Laravel's Gate defaults to allowing access when no policy is found, meaning authorization checks silently pass.

**Warning Signs**:
- Controller calls `$this->authorize('update', $post)` but no test verifies denial
- Policy files exist but not all methods are defined
- `Gate::allows()` is called without corresponding policy registration
- New model created without corresponding policy
- No failing authorization test — all tests pass with permission
- Authorization errors happen only in production

**Harms**:
- Unauthorized users access restricted resources
- Gate allows by default when policy is missing
- Authorization bug undetected by tests
- Security incident — unauthorized data access
- No regression detection for authorization gaps

**Real-World Consequence**: A `PostPolicy` is registered but the `delete` method is not defined. The controller calls `authorize('delete', $post)`. Since the policy method doesn't exist, Gate returns `null` (deny for policies, but allow for Gates without policies). Wait — actually, if a policy doesn't define the method, Gate denies (returns false) by default. Let me reconsider... In Laravel, if a policy method doesn't exist, the Gate checks `before()` methods, but with no `before()` returning non-null, it denies. However, if there's NO policy registered at all, `Gate::inspect` checks `Gate::before` and if found, returns that, otherwise denies. So missing policy for a model typically denies. But the danger is in missing controller `authorize()` calls or wrong policy method names.

Actually the real danger is: A controller has no `authorize()` call at all. Tests use `actingAs($user)` and pass. The endpoint has no authorization. An authenticated user can modify any resource regardless of ownership. This is the most common authZ bug.

**Preferred Alternative**: Every endpoint with authorization logic must have at least one denial test. Use the two-user positive-negative pattern to prove the gate correctly allows and denies.

**Refactoring Strategy**: Add `authorize()` calls to controllers missing them, verify policy registration for all models, write denial tests for every policy method, test with non-admin users only for denial tests.

**Detection Checklist**:
- `[ ]` Does every authorization-gated endpoint have a denial test?
- `[ ]` Are all policy methods (view, create, update, delete) tested for denial?
- `[ ]` Is a policy registered for every model with authorization logic?
- `[ ]` Would removing an `authorize()` call cause any test to fail?

**Related**: 05-rules.md (Test Every Policy Method Individually), 04-standardized-knowledge.md, 06-skills.md

---

## AP-2: Same User for Success and Denial Tests
**Category**: Testing

**Description**: Using the same user for both the success assertion and the denial assertion in authorization tests. If the user has permission, both pass. If the user doesn't have permission, both fail. The test cannot distinguish working authorization from broken authorization.

**Warning Signs**:
- AuthZ test creates one user and uses it for both allowed and denied assertions
- Both `assertOk()` and `assertForbidden()` use the same `actingAs()` user
- Test doesn't create two users with different permissions
- Positive and negative cases use identical setup
- Test passes when authorization is completely removed

**Harms**:
- False-positive authorization tests
- Cannot detect when Gate allows-by-default
- Authorization removal passes tests
- Security bugs undetected
- Test gives false confidence in authZ coverage

**Real-World Consequence**: An authorization test creates user A, asserts they can delete their own post (assertOk), then tries asserting user A cannot delete their own post (assertForbidden). The second assertion fails because user A owns the post. The developer changes the test to only test the positive case. The negative case is never tested. Three months later, all users can delete all posts because the policy was accidentally removed. The test still passes because it only tests the positive case.

**Preferred Alternative**: Use the two-user positive-negative pattern: create one user with permission (should succeed) and one without (should 403).

**Refactoring Strategy**: Create two users with different roles/permissions in each authZ test, assert success for the permitted user, assert denial for the unpermitted user, verify database state unchanged on denial.

**Detection Checklist**:
- `[ ]` Do authZ tests use two different users for allow and deny?
- `[ ]` Would removing authorization logic cause both assertions to pass?
- `[ ]` Is there a negative assertion (assertForbidden) for every positive assertion?
- `[ ]` Are the two users meaningfully different in permissions?

**Related**: 05-rules.md (Use Two-User Positive-Negative Pattern), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md

---

## AP-3: Admin Users in Denial Tests (Gate::before Bypass)
**Category**: Testing

**Description**: Using admin users (who bypass all policies via `Gate::before`) in authorization denial tests. Admin users never trigger `authorize()` denial, so the test expects 403 but receives 200, masking authorization bugs.

**Warning Signs**:
- AuthZ denial tests use `User::factory()->admin()->create()`
- Admin user creation includes `Gate::before` bypass logic
- Tests that should assert 403 are passing with 200
- Developers wonder why "forbidden" tests keep failing
- Admin factories are reused from happy path tests

**Harms**:
- Authorization tests pass even when policies are broken
- Gate::before bypass masks missing authorization logic
- False confidence in authZ coverage
- Non-admin users bypass authorization in production
- Security bugs undetected for non-privileged users

**Real-World Consequence**: All authZ denial tests use an admin user factory that includes `Gate::before(fn ($user) => true)`. Every authorization check returns `true` for admin users. A new endpoint missing `authorize()` is tested using admin users — the test passes because admin users are allowed everything. In production, regular users access the endpoint without authorization. PII data leaked for 2 months.

**Preferred Alternative**: Use regular (non-admin) users for all authorization denial tests. Reserve admin users for positive permission tests.

**Refactoring Strategy**: Audit all authZ denial tests, replace admin users with regular users, ensure `Gate::before` bypass is not masking missing authorization, create a separate "regular user" factory for denial tests.

**Detection Checklist**:
- `[ ]` Are denial tests using regular users or admin users?
- `[ ]` Is `Gate::before` logic documented and accounted for in tests?
- `[ ]` Would a missing `authorize()` call be caught by denial tests?
- `[ ]` Are admin user factories used correctly (positive tests only)?

**Related**: 05-rules.md (Test With Non-Admin Users Only), 04-standardized-knowledge.md, 06-skills.md

---

## AP-4: No Ownership Tests
**Category**: Security

**Description**: Testing role-based authorization (admin vs user) but not testing ownership-based authorization (User A cannot modify User B's resource). The most common multi-tenant data leakage bug goes undetected.

**Warning Signs**:
- AuthZ tests test only role-based scenarios (admin can, user cannot)
- No test creates two users and attempts cross-user resource access
- Ownership is assumed but never explicitly proven
- Policy uses `$user->id === $post->user_id` but no test verifies it
- Multi-tenant API without tenant isolation tests

**Harms**:
- User A can modify User B's data
- Multi-tenant data leakage
- Severe privacy and compliance failures
- Most common multi-tenant bug — untested
- GDPR/regulatory violation

**Real-World Consequence**: A blog API has role-based policies: admin can manage all posts, user can manage own posts. The policy correctly checks `$user->id === $post->user_id`. But the `update` controller method loads the post by ID without scoping to the authenticated user. A test proves admin can delete and user cannot — but no test proves User A cannot delete User B's post. In production, User A discovers they can edit User B's posts by guessing the post ID. 500 user records are exposed.

**Preferred Alternative**: Always test that User A cannot modify User B's resource. Create two users with the same role — one owning the resource, one not — and verify denial for the non-owner.

**Refactoring Strategy**: Add cross-user tests for every ownership-sensitive endpoint, create two users with same role but different ownership, assert non-owner gets 403, assert database unchanged for denied mutations.

**Detection Checklist**:
- `[ ]` Are there tests verifying User A cannot modify User B's resource?
- `[ ]` Do ownership tests use two users with the same role?
- `[ ]` Would removing ownership check from policy be caught by tests?
- `[ ]` Is there a test for the most common multi-tenant bug (cross-user access)?

**Related**: 05-rules.md (Test Ownership Explicitly), 04-standardized-knowledge.md, 06-skills.md

---

## AP-5: No Database Assertion on Denied Mutations
**Category**: Testing

**Description**: Asserting only `assertForbidden()` without verifying the database state is unchanged. A 403 response doesn't guarantee the controller didn't partially process the request before the authorization check.

**Warning Signs**:
- Denied update/delete tests only assert `assertForbidden()`
- No `assertDatabaseHas` or `assertDatabaseMissing` after denial
- Controller may partially process before authorization check
- Test passes even when authorization is after the database write
- Race condition between write and authZ check

**Harms**:
- Partial writes on denied authorization
- Data corruption without detection
- Security incidents pass tests
- Controller that writes before authorizing goes undetected
- False confidence in data integrity

**Real-World Consequence**: A controller's `update` method loads the post, updates the title, THEN calls `authorize('update', $post)`. The policy denies the update and returns 403 — but the title was already written to the database. The test only asserts `assertForbidden()` and passes. In production, unauthorized users can write data even when they get 403 responses. The database contains records written by unauthorized users.

**Preferred Alternative**: After a denied update, restore, or delete, assert the database resource is unchanged.

**Refactoring Strategy**: Capture original resource state before the denied request, assert `assertDatabaseHas` with original values after the denied request, verify no side effects occurred.

**Detection Checklist**:
- `[ ]` Do denied mutation tests assert database state unchanged?
- `[ ]` Is the original resource state captured before the request?
- `[ ]` Would a controller writing before authorization be caught?
- `[ ]` Are there any side effects from denied requests?

**Related**: 05-rules.md (Assert Database State Unchanged On Denied Mutations), 04-standardized-knowledge.md, 06-skills.md

---

## AP-6: Not Testing All Policy Methods
**Category**: Security

**Description**: Testing only one policy method (e.g., `update`) while other methods (view, create, delete, restore, forceDelete) remain untested. Each method can have different authorization logic or be entirely missing from the policy.

**Warning Signs**:
- Only `update` or `delete` policy method tested for denial
- `view`, `create`, `restore`, `forceDelete` never tested
- Policy class defines some methods, tests only cover a subset
- Controller uses `authorize('forceDelete', $post)` but no test exists
- Policy method not defined (defaults) goes undetected

**Harms**:
- Untested policy methods may default to allow
- Unauthorized access through untested controller actions
- Missing policy method on restore/forceDelete goes undetected
- Some actions have authorization, others don't
- Security gaps in non-standard actions

**Real-World Consequence**: A `PostPolicy` defines `view`, `create`, `update`, `delete` — tests cover all four. A new `restore` method is added to the controller but not to the policy. The controller calls `authorize('restore', $post)` — since the policy method doesn't exist, Gate denies (returns false). But the controller also has a fallback that catches `AuthorizationException` and allows the action. No test covers restore denial. Soft-deleted posts can be restored by any user.

**Preferred Alternative**: Write a separate denial test for each policy method (view, create, update, delete, restore, forceDelete).

**Refactoring Strategy**: List all policy methods defined, add corresponding denial tests for each method not yet covered, verify each method has both positive (allowed) and negative (denied) tests, add architecture test enforcing policy method coverage.

**Detection Checklist**:
- `[ ]` Are all policy methods tested for denial?
- `[ ]` Is there a test for view, create, update, delete, restore, forceDelete?
- `[ ]` Are non-standard policy methods tested?
- `[ ]` Would a missing policy method be caught by tests?

**Related**: 05-rules.md (Test Every Policy Method Individually), 04-standardized-knowledge.md, 06-skills.md, 07-decision-trees.md
