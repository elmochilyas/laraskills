# Not Found Testing — Rules

## Test Every Member Route For 404
---
## Category
Testing
---
## Rule
Every resource-member route (show, update, destroy, restore) must have a test proving it returns 404 for a non-existent resource.
---
## Reason
Route model binding is configured at the route level, not the controller level. A missing route binding definition causes 500 errors instead of 404. Testing each member route's 404 response validates the binding configuration, the exception handler, and the error response format in one assertion.
---
## Bad Example
```php
it('shows a post', function () {
    $post = Post::factory()->create();
    $this->getJson("/api/posts/{$post->id}")->assertOk();
});
// No 404 test for show, update, destroy, or restore
```
---
## Good Example
```php
it('returns 404 for non-existent post on show', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
it('returns 404 for non-existent post on update', fn () => $this->putJson('/api/posts/999999', [])->assertNotFound());
it('returns 404 for non-existent post on destroy', fn () => $this->deleteJson('/api/posts/999999')->assertNotFound());
it('returns 404 for non-existent post on restore', fn () => $this->postJson('/api/posts/999999/restore')->assertNotFound());
```
---
## Exceptions
Endpoints without resource identifiers (collection index, login, register) cannot return 404 for a non-existent resource.
---
## Consequences Of Violation
Missing route binding returns 500 instead of 404; API clients treat 500 as server outage; debugging requires examining error logs.
---

## Assert Error Body On 404
---
## Category
Testing
---
## Rule
Always assert the 404 error body structure, not just the status code.
---
## Reason
A 404 status without a consistent error body means the endpoint may be returning HTML, a string, or an inconsistent JSON structure. API clients parse the error body programmatically — inconsistency breaks error handling.
---
## Bad Example
```php
it('returns 404 for missing post', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
// No body assertion — response may be HTML or wrong JSON shape
```
---
## Good Example
```php
it('returns 404 for missing post', function () {
    $this->getJson('/api/posts/999999')
        ->assertNotFound()
        ->assertJson(['message' => 'Not Found.']);
});
```
---
## Exceptions
When a dedicated error-shape test suite already validates the global 404 format.
---
## Consequences Of Violation
Inconsistent 404 shapes across endpoints; client error-handling code breaks without clear cause.
---

## Test Invalid ID Shapes
---
## Category
Testing
---
## Rule
Test 404 behavior with invalid ID shapes (string for integer binding, negative numbers, zero).
---
## Reason
Laravel's route model binding casts URL parameters to the model key type. A string UUID passed to an integer-keyed route throws `ModelNotFoundException` (good), but in some configurations may throw a `UnexpectedValueException` (500). Testing invalid ID shapes catches typing misconfigurations.
---
## Bad Example
```php
it('returns 404 for missing post', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
// Does not test with string ID — may throw 500 instead of 404
```
---
## Good Example
```php
it('returns 404 for non-integer ID', fn () => $this->getJson('/api/posts/invalid-id')->assertNotFound());
it('returns 404 for negative ID', fn () => $this->getJson('/api/posts/-1')->assertNotFound());
it('returns 404 for zero ID', fn () => $this->getJson('/api/posts/0')->assertNotFound());
```
---
## Exceptions
When route key type is explicitly cast to string and all inputs are validated upstream.
---
## Consequences Of Violation
Non-existent resource with invalid ID shape returns 500; API clients receive unhandled exceptions; production monitoring shows 5xx spikes.
---

## Test Soft-Deleted Resource Access
---
## Category
Testing
---
## Rule
Test that accessing a soft-deleted resource returns 404.
---
## Reason
Soft-deleted records exist in the database but are excluded by Eloquent's default query scope. Route model binding may resolve the ID (record exists) but the controller's query may return 404 (hidden by scope). This gap must be tested explicitly — it differs from simple "ID doesn't exist" behavior.
---
## Bad Example
```php
it('returns 404 for missing post', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
// Does not test soft-deleted record — may return 200 with soft-deleted data
```
---
## Good Example
```php
it('returns 404 for soft-deleted post', function () {
    $post = Post::factory()->create();
    $post->delete();

    $this->getJson("/api/posts/{$post->id}")->assertNotFound();
});
```
---
## Exceptions
Endpoints that explicitly include soft-deleted records (trashed listing, force-restore) should return the record, not 404.
---
## Consequences Of Violation
Soft-deleted data exposed via API; privacy data accessible after deletion; compliance violations (GDPR right-to-deletion bypass).
---

## Verify No DB Mutation On Non-Existent Resource Updates
---
## Category
Testing
---
## Rule
When testing 404 on update or destroy, assert that no records were mutated in the database.
---
## Reason
A 404 response does not guarantee the database was untouched. The controller may have updated some records before the binding check. Verifying no database mutation confirms the request was safely rejected.
---
## Bad Example
```php
it('returns 404 on updating non-existent post', function () {
    $this->putJson('/api/posts/999999', ['title' => 'Hacked'])->assertNotFound();
    // No database assertion — nothing guarantees no mutation
});
```
---
## Good Example
```php
it('returns 404 on updating non-existent post', function () {
    $originalCount = Post::count();

    $this->putJson('/api/posts/999999', ['title' => 'Hacked'])->assertNotFound();

    $this->assertEquals($originalCount, Post::count());
});
```
---
## Exceptions
When the endpoint is read-only (show) and cannot mutate database.
---
## Consequences Of Violation
Accidental record creation or mutation on non-existent resource requests; data inconsistencies that are hard to trace.
---
