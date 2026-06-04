# Rules: Authorization Testing

## Test Both Positive and Negative Authorization Cases
---
## Category
Testing
---
## Rule
Write at least one positive test (authorized user gets 200) and one negative test (unauthorized user gets 403/401) for every Gate/Policy method.
---
## Reason
Testing only the positive case gives false confidence — the authorization code may always return `true`. The negative test proves the authorization actually restricts access. Both cases are necessary to verify the authorization logic works correctly.
---
## Bad Example
```php
public function test_admin_can_view_dashboard(): void {
    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertStatus(200);
    // Missing: test that non-admin gets 403
}
```
---
## Good Example
```php
public function test_admin_can_view_dashboard(): void {
    $response = $this->actingAs($admin)->get('/dashboard');
    $response->assertStatus(200);
}
public function test_non_admin_cannot_view_dashboard(): void {
    $response = $this->actingAs($user)->get('/dashboard');
    $response->assertStatus(403);
}
```
---
## Exceptions
No common exceptions — both cases are always required.
---
## Consequences Of Violation
Authorization bugs undetected, unauthorized access in production.
---

## Test Model-Specific Scoping
---
## Category
Testing
---
## Rule
Test that User A cannot access, modify, or delete User B's resources. Use factory-created resources owned by specific users.
---
## Reason
Authorization often works for generic cases but breaks at the model level — a user may be able to "update post" but should not be able to update another user's post. Testing with generic users misses this horizontal privilege escalation vector.
---
## Bad Example
```php
// Only tests with user's own resource — misses cross-user access
$post = Post::factory()->for($user)->create();
$this->actingAs($user)->put("/posts/{$post->id}")->assertStatus(200);
```
---
## Good Example
```php
$post = Post::factory()->for($otherUser)->create();
$this->actingAs($user)->put("/posts/{$post->id}")->assertStatus(403);
```
---
## Exceptions
Resources that are inherently global with no owner concept.
---
## Consequences Of Violation
Horizontal privilege escalation, users can modify others' data.
---

## Test Unauthenticated Access Returns 401 or 403
---
## Category
Testing
---
## Rule
Test that guest (unauthenticated) requests to protected routes return 401 (unauthenticated) or 403 (forbidden).
---
## Reason
Routes intended to require authentication may be accidentally accessible to guests due to missing middleware. A guest request returning 200 is an authentication bypass vulnerability. Testing unauthenticated access catches missing auth middleware.
---
## Bad Example
```php
// Only testing authenticated scenarios
$this->actingAs($user)->get('/admin/dashboard')->assertStatus(200);
// Guest access not tested — may be accessible without auth
```
---
## Good Example
```php
// Guest access explicitly tested
$this->get('/admin/dashboard')->assertStatus(401);
```
---
## Exceptions
Routes that intentionally allow limited guest access (e.g., public read-only endpoints).
---
## Consequences Of Violation
Authentication bypass, unauthorized access to protected routes.
---

## Test Super-Admin Bypass Behavior
---
## Category
Testing
---
## Rule
Test that super-admins can access resources they do not own, AND that non-super-admins are still correctly denied.
---
## Reason
`Gate::before()` super-admin bypass must work correctly — super-admins should have unrestricted access. But the bypass should not accidentally grant super-admin-like access to other users. Testing both sides ensures the bypass logic is correctly scoped.
---
## Bad Example
```php
// No super-admin bypass testing
```
---
## Good Example
```php
public function test_super_admin_can_access_any_resource(): void {
    $post = Post::factory()->for($otherUser)->create();
    $this->actingAs($superAdmin)->put("/posts/{$post->id}")->assertStatus(200);
}
public function test_regular_user_cannot_access_others_resource(): void {
    $post = Post::factory()->for($otherUser)->create();
    $this->actingAs($user)->put("/posts/{$post->id}")->assertStatus(403);
}
```
---
## Exceptions
Applications without super-admin bypass.
---
## Consequences Of Violation
Super-admin bypass not working, or regular users accidentally bypassing auth.
---

## Use Data Providers for Permission Matrix Coverage
---
## Category
Testing
---
## Rule
Define a permission matrix as a PHPUnit data provider enumerating all user types × actions × expected results to reduce test boilerplate and ensure comprehensive coverage.
---
## Reason
Manually writing individual test methods for every combination of user type, action, and resource leads to test duplication and likely gaps. A data provider generates all combinations from a single matrix, making coverage exhaustive and adding new cases trivial.
---
## Bad Example
```php
// 10+ repetitive test methods — easy to miss combinations
public function test_guest_cannot_create_post() { ... }
public function test_editor_can_create_post() { ... }
public function test_editor_cannot_delete_post() { ... }
```
---
## Good Example
```php
public static function authorizationMatrix(): array {
    return [
        'guest create post' => ['guest', 'create', 'post', false],
        'editor create post' => ['editor', 'create', 'post', true],
        'editor delete post' => ['editor', 'delete', 'own_post', true],
        'editor delete others post' => ['editor', 'delete', 'others_post', false],
    ];
}
/** @dataProvider authorizationMatrix */
public function test_authorization($role, $action, $resource, $expected): void { ... }
```
---
## Exceptions
Applications with very few authorization rules (1-2 user types, 1-2 actions).
---
## Consequences Of Violation
Incomplete test coverage, authorization gaps undetected.
---

## Test Tenant Isolation (If Multi-Tenant)
---
## Category
Security
---
## Rule
Write tests that verify cross-tenant access is denied: User from Tenant A cannot access resources belonging to Tenant B.
---
## Reason
Tenant isolation is the most critical security property in multi-tenant applications. A missing `tenant_id` scope in a query can expose all tenants' data. Dedicated cross-tenant tests catch scoping bugs before production.
---
## Bad Example
```php
// Only tests within-tenant access — misses cross-tenant leaks
```
---
## Good Example
```php
public function test_cannot_access_other_tenant_data(): void {
    $tenantA = Tenant::factory()->create();
    $tenantB = Tenant::factory()->create();
    $tenancy->initialize($tenantA);
    
    $postB = Post::factory()->for($tenantB)->create();
    $this->actingAs($userA)->get("/posts/{$postB->id}")->assertStatus(403);
}
```
---
## Exceptions
Single-tenant applications.
---
## Consequences Of Violation
Cross-tenant data leakage, privacy violation.
---

## Test Soft-Delete Resource Authorization
---
## Category
Testing
---
## Rule
Test authorization for soft-deleted resources: verify that appropriate users can restore and force-delete, and unauthorized users cannot.
---
## Reason
Soft-deletable models add `restore` and `forceDelete` actions that may have different authorization rules than standard CRUD. Missing policy methods for these actions cause 403 errors when users try to restore or permanently delete.
---
## Bad Example
```php
// Only tests standard CRUD — no soft-delete testing
```
---
## Good Example
```php
public function test_admin_can_restore_deleted_post(): void {
    $post->delete();
    $this->actingAs($admin)->put("/posts/{$post->id}/restore")->assertStatus(200);
}
public function test_editor_cannot_restore_deleted_post(): void {
    $post->delete();
    $this->actingAs($editor)->put("/posts/{$post->id}/restore")->assertStatus(403);
}
```
---
## Exceptions
Models without soft deletes.
---
## Consequences Of Violation
403 errors on restore/force-delete, or unauthorized permanent deletion.
