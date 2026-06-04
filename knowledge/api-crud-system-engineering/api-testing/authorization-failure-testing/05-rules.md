# Authorization Failure Testing — Rules

## Use Two-User Positive-Negative Pattern
---
## Category
Testing
---
## Rule
Always test authorization by creating two users — one with permission (should succeed) and one without (should 403).
---
## Reason
A test that only asserts 403 does not prove the authorization check works correctly — it could be an unrelated bug (e.g., a 500 error caught by exception handler). The positive/negative pair proves the gate correctly allows and denies.
---
## Bad Example
```php
it('forbids without permission', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->deleteJson("/api/posts/1")->assertForbidden();
    // No positive test — test could pass for wrong reason (e.g., 500 handled as 403)
});
```
---
## Good Example
```php
it('enforces delete permission', function () {
    $admin = User::factory()->admin()->create();
    $user  = User::factory()->create();
    $post  = Post::factory()->create();

    $this->actingAs($admin)->deleteJson("/api/posts/{$post->id}")->assertNoContent();
    $this->actingAs($user)->deleteJson("/api/posts/{$post->id}")->assertForbidden();
});
```
---
## Exceptions
When permission is universally denied to all roles (e.g., a disabled feature), the positive test may be omitted.
---
## Consequences Of Violation
False-positive authorization tests; policy bugs go undetected; unauthorized users access restricted resources.
---

## Test Every Policy Method Individually
---
## Category
Testing
---
## Rule
Write a separate 403 test for each policy method (view, create, update, delete, restore, forceDelete).
---
## Reason
A controller that calls `authorize('update', $post)` may 403 correctly, but a controller that calls `authorize('delete', $post)` may have no corresponding policy method — and the Gate defaults to allow. Each policy method must be proven to deny unauthorized users.
---
## Bad Example
```php
it('forbids post modifications', function () {
    // Only tests update — delete, restore, forceDelete untested
    $this->actingAs($user)->putJson("/api/posts/{$post->id}", [])->assertForbidden();
});
```
---
## Good Example
```php
it('forbids viewing post', fn () => $this->actingAs($user)->getJson("/api/posts/{$post->id}")->assertForbidden());
it('forbids updating post', fn () => $this->actingAs($user)->putJson("/api/posts/{$post->id}", [])->assertForbidden());
it('forbids deleting post', fn () => $this->actingAs($user)->deleteJson("/api/posts/{$post->id}")->assertForbidden());
it('forbids restoring deleted post', fn () => $this->actingAs($user)->postJson("/api/posts/{$post->id}/restore")->assertForbidden());
```
---
## Exceptions
When a single policy method is used for all actions (e.g., `viewAny` from a shared controller), one denial test may suffice.
---
## Consequences Of Violation
Default-allow Gate behavior on untested policy methods; unauthorized access through untested controller actions.
---

## Assert Database State Unchanged On Denied Mutations
---
## Category
Testing
---
## Rule
After a denied update, restore, or delete, assert the database resource is unchanged.
---
## Reason
A 403 response does not guarantee the database was untouched — the controller may have partially processed the request before the authorization check. Asserting resource state confirms no side effects occurred.
---
## Bad Example
```php
it('forbids updating other user post', function () {
    $this->actingAs($otherUser)->putJson("/api/posts/{$post->id}", ['title' => 'Hacked'])->assertForbidden();
    // No database assertion — post may have been updated before authorization
});
```
---
## Good Example
```php
it('forbids updating other user post', function () {
    $originalTitle = $post->title;

    $this->actingAs($otherUser)->putJson("/api/posts/{$post->id}", ['title' => 'Hacked'])->assertForbidden();

    $this->assertDatabaseHas('posts', ['id' => $post->id, 'title' => $originalTitle]);
});
```
---
## Exceptions
Read-only endpoints (show, index) do not need database state assertions.
---
## Consequences Of Violation
Partial writes on denied authorization; data corruption without detection; security incidents pass tests.
---

## Test With Non-Admin Users Only
---
## Category
Testing
---
## Rule
Never use admin users (who bypass policies via `Gate::before`) to test authorization denials.
---
## Reason
`Gate::before` checks allow admin users to bypass all policy methods. Tests using admin users never trigger denial, masking authorization bugs. Always use a regular user for 403 tests.
---
## Bad Example
```php
it('forbids deletion', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->deleteJson("/api/posts/{$post->id}")->assertForbidden();
    // Admin bypasses all gates — test will fail (returns 204, not 403)
});
```
---
## Good Example
```php
it('forbids deletion for regular users', function () {
    $user = User::factory()->create();
    $this->actingAs($user)->deleteJson("/api/posts/{$post->id}")->assertForbidden();
});

it('allows deletion for admins', function () {
    $admin = User::factory()->admin()->create();
    $this->actingAs($admin)->deleteJson("/api/posts/{$post->id}")->assertNoContent();
});
```
---
## Exceptions
When testing that admins can access a feature (positive test), use admin users intentionally.
---
## Consequences Of Violation
Authorization tests pass with admin users even when policies are broken; production users without admin access bypass security.
---

## Test Ownership Explicitly
---
## Category
Testing
---
## Rule
Always test that User A cannot modify User B's resource.
---
## Reason
Ownership-based authorization is the most common multi-tenant pattern. A policy may correctly distinguish between admin and user roles but fail to enforce per-record ownership. Testing ownership explicitly catches this gap.
---
## Bad Example
```php
it('allows user to update own post', function () {
    $this->actingAs($post->user)->putJson("/api/posts/{$post->id}", ['title' => 'Updated'])->assertOk();
    // No test that another user cannot update the same post
});
```
---
## Good Example
```php
it('allows user to update own post', function () {
    $this->actingAs($post->user)->putJson("/api/posts/{$post->id}", ['title' => 'Updated'])->assertOk();
});

it('forbids other user from updating post', function () {
    $otherUser = User::factory()->create();
    $this->actingAs($otherUser)->putJson("/api/posts/{$post->id}", ['title' => 'Hacked'])->assertForbidden();
});
```
---
## Exceptions
Single-user or team-based applications where ownership is meaningless may omit ownership tests.
---
## Consequences Of Violation
User A can modify User B's data; multi-tenant data leakage; severe privacy and compliance failures.
---
