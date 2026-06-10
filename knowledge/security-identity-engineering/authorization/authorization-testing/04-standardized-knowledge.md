# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Authorization |
| Knowledge Unit | Authorization Testing |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Authorization testing in Laravel verifies that Gates, Policies, and permission checks correctly allow authorized users and deny unauthorized users. Laravel provides testing helpers: `$this->actingAs($user)`, `$this->assertResponseStatus()`, and Gate/Policy unit tests. Key testing scenarios: authenticated user has access, unauthenticated user is rejected, user without permission is rejected, model-specific policies correctly scope access, and edge cases (guest access, soft-deleted resources, super-admin bypass).

---

## Core Concepts

- **`actingAs($user, $guard)`**: Authenticate a specific user for HTTP tests.
- **Gate/Policy Unit Tests**: Test individual authorization methods directly: `$this->assertTrue($user->can('update', $post))`.
- **Authorization Assertions**: Test that authorized users get 200, unauthorized users get 403, and unauthenticated users get 401.
- **401 vs 403 Distinction**: 401 (Unauthenticated) means the request has no valid authentication — test by sending the request without `actingAs()`. 403 (Forbidden) means the user is authenticated but lacks permission — test by using `actingAs()` with a user who lacks the required permission. Never write tests that treat these as interchangeable.
- **Permission Matrix**: Test all combinations of user types (guest, basic user, editor, admin, super-admin) for each action.
- **Edge Cases**: Deleted/soft-deleted resources, deactivated users, users from other tenants.

---

## When To Use

- Every project — authorization bugs are security vulnerabilities
- After adding or modifying Gates, Policies, or permissions
- During RBAC/Spitage permission setup to verify the permission matrix
- Regression testing after authorization changes

## When NOT To Use

- Business logic tests unrelated to access control
- UI rendering tests (Blade directive testing is optional — server-side is the security boundary)

---

## Best Practices

- **Test Positive and Negative Cases**: Authorized user gets 200; unauthorized user gets 403; unauthenticated user gets 401.
- **Distinguish 401 from 403**: 401 means "not authenticated" (no valid session/token). 403 means "authenticated but not authorized" (lacks permission). Test unauthenticated access separately from unauthorized access — they are different security failures.
- **Test All User Types**: Guest, basic user, editor, admin, super-admin — each with appropriate expectations.
- **Test Model-Specific Scoping**: User A cannot update User B's resource.
- **Test Edge Cases**: Soft-deleted resources, deactivated users, resources belonging to other tenants.
- **Use Data Providers**: Define a permission matrix as a data provider to reduce test boilerplate.
- **Test Both HTTP and Direct Gate/Policy Calls**: HTTP tests validate middleware and controller flow; direct tests validate authorization logic.

---

## Architecture Guidelines

- HTTP tests: `$this->actingAs($user)->get('/posts/1/edit')->assertStatus(200)`
- Gate/Policy tests: `$this->assertTrue(Gate::allows('update', $post))`
- Permission matrix: define an array of `[user_type, action, resource, expected_result]`
- Test the super-admin bypass: verify that super-admin can access resources they don't own
- Test unauthenticated access: guest users should get 401/403 for protected routes

---

## Performance Considerations

- Authorization tests are fast — typically <50ms per test case
- Data providers reduce test duplication without performance cost
- Refresh database between test classes (not between every test) for faster runs

---

## Security Considerations

- **100% Test Coverage of Authorization**: Every Gate/Policy method should have at least one positive and one negative test.
- **CSRF Protection**: Authenticated tests bypass CSRF by default. If testing API with Bearer tokens, CSRF is not applicable.
- **Super-Admin Tests**: Verify that super-admins can access all resources, including those they don't own.
- **Tenant Isolation Tests**: Cross-tenant access should always be denied.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing positive cases | Assuming authorization works | Authorization bugs go undetected until production | Test both allow and deny cases for every action |
| Not testing model-specific scoping | Testing with generic users | User A can modify User B's resource | Use factory-created resources owned by specific users |
| Skipping unauthenticated tests | Assuming auth middleware | Guest access routes not documented | Test unauthenticated requests return 401/403 or appropriate guest response |
| Not testing super-admin bypass | Assuming super-admin works | Super-admin cannot access all resources (or bypass is too broad) | Test both that super-admin CAN access and that basic user CANNOT |

---

## Anti-Patterns

- **Testing Blade directives instead of server-side authorization**: Server-side is the security boundary — test that
- **Not refreshing database between tests**: Authorization tests depend on seeded permissions — stale data causes false failures
- **Hardcoded IDs in authorization tests**: Use factories and relationships

---

## Examples

**HTTP authorization test:**
```php
public function test_editor_can_update_their_post(): void
{
    $user = User::factory()->create()->assignRole('editor');
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)->put("/posts/{$post->id}", [
        'title' => 'Updated Title',
    ]);

    $response->assertStatus(200);
}

public function test_editor_cannot_update_others_post(): void
{
    $user = User::factory()->create()->assignRole('editor');
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($otherUser)->create();

    $response = $this->actingAs($user)->put("/posts/{$post->id}", [
        'title' => 'Hacked Title',
    ]);

    $response->assertStatus(403);
}
```

**Gate/Policy unit test:**
```php
public function test_user_cannot_update_others_post(): void
{
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $post = Post::factory()->for($otherUser)->create();

    $this->assertFalse($user->can('update', $post));
}
```

**401 vs 403 test examples:**
```php
public function test_unauthenticated_user_gets_401(): void
{
    // No actingAs() — request has no authentication
    $response = $this->getJson('/api/posts');
    $response->assertStatus(401);
}

public function test_authenticated_user_without_permission_gets_403(): void
{
    $user = User::factory()->create(); // basic user, no special roles
    $post = Post::factory()->for(User::factory()->create())->create();

    $response = $this->actingAs($user)->putJson("/api/posts/{$post->id}", [
        'title' => 'Hacked Title',
    ]);

    $response->assertStatus(403); // authenticated but not authorized
}

public function test_authenticated_user_with_permission_gets_200(): void
{
    $user = User::factory()->create();
    $post = Post::factory()->for($user)->create();

    $response = $this->actingAs($user)->putJson("/api/posts/{$post->id}", [
        'title' => 'Updated Title',
    ]);

    $response->assertStatus(200); // authenticated AND authorized
}
```

**Data provider for permission matrix:**
```php
public static function authorizationMatrix(): array
{
    return [
        'guest can view published post' => [null, 'view', 'published_post', true],
        'guest cannot view draft post' => [null, 'view', 'draft_post', false],
        'author can edit own post' => ['author', 'update', 'own_post', true],
        'author cannot edit others post' => ['author', 'update', 'others_post', false],
    ];
}

/** @dataProvider authorizationMatrix */
public function test_authorization($userType, $action, $resourceType, $expected): void
{
    // Arrange based on data
    // ...
    $this->assertSame($expected, $user->can($action, $resource));
}
```

---

## Related Topics

- Gates (closure-based authorization)
- Policies (model-centric authorization)
- Spatie laravel-permission (permission testing)
- Super-admin bypass testing
- Multi-tenancy security testing

---

## AI Agent Notes

- Authorization tests are the most critical security tests. If absent, recommend adding them for every Gate/Policy.
- The permission matrix data provider pattern is the most maintainable approach for comprehensive coverage.
- Common gap: tests verify authorized access but not denied access. Both are equally important.

---

## Verification

- [ ] Every Gate/Policy method has at least one positive and one negative test
- [ ] Unauthenticated access returns 401 (not 403)
- [ ] Unauthorized (authenticated but lacking permission) returns 403 (not 401)
- [ ] Model-specific scoping tested (User A cannot access User B's resource)
- [ ] Super-admin bypass tested (super-admin CAN access all)
- [ ] Soft-delete resources tested (can/cannot access deleted resource)
- [ ] Permission matrix covers all user types (guest, basic, editor, admin, super-admin)
- [ ] HTTP tests and Gate/Policy unit tests both present
- [ ] Tests refresh database state between test classes
- [ ] Tenant isolation tested (if multi-tenant)
