# Response Status Code Testing — Rules

## Assert Status First In Every Test Chain
---
## Category
Testing
---
## Rule
Always assert the HTTP status code as the first assertion in any API test chain.
---
## Reason
Status codes are the fastest assertion (integer comparison) and the most fundamental contract point. If the status is wrong, all subsequent assertions (shape, content, headers) are meaningless and produce confusing failure messages. Asserting status first short-circuits further assertions in a clear way.
---
## Bad Example
```php
$response->assertJsonFragment(['title' => 'Hello']); // Fails confusingly if status is 422
$response->assertOk();                                // Never reached
```
---
## Good Example
```php
$response->assertOk();
$response->assertJsonFragment(['title' => 'Hello']);
```
---
## Exceptions
When an endpoint returns multiple status codes for the same test scenario (e.g., partial-success bulk operations).
---
## Consequences Of Violation
Confusing failure cascade where a status error is reported as a missing key or value error, wasting debugging time.
---

## Use Canonical CRUD Status Codes
---
## Category
Architecture
---
## Rule
Always use canonical HTTP status codes for CRUD operations: GET -> 200, POST -> 201, PUT/PATCH -> 200, DELETE -> 204.
---
## Reason
API consumers rely on canonical status codes to determine the outcome of operations without parsing the response body. Returning 200 for a resource creation (instead of 201) forces clients to check location headers or response bodies, increasing client-side complexity and opening room for bugs.
---
## Bad Example
```php
// Store endpoint returning 200 instead of 201
$response = $this->postJson('/api/posts', $data);
$response->assertStatus(200); // Wrong — should be 201
```
---
## Good Example
```php
$response = $this->postJson('/api/posts', $data);
$response->assertCreated(); // 201

$response = $this->deleteJson("/api/posts/{$post->id}");
$response->assertNoContent(); // 204
```
---
## Exceptions
Async operations (202 Accepted for queued jobs) and idempotent retries (200 for repeat requests with same Idempotency-Key) may deviate.
---
## Consequences Of Violation
Client SDKs misbehave; consumers treat non-canonical codes as failures; integration contracts break.
---

## Don't Confuse 401 With 403
---
## Category
Testing
---
## Rule
Always distinguish 401 (Unauthenticated — not logged in) from 403 (Forbidden — logged in but not authorized).
---
## Reason
Mixing 401 and 403 indicates a fundamental misunderstanding of the error. 401 means the server doesn't know who you are; 403 means the server knows who you are but you lack permission. Returning the wrong code breaks client retry logic (retrying after 403 won't help).
---
## Bad Example
```php
// Authorization failure test returning 401
it('forbids user without permission', function () {
    $this->actingAs($user)->postJson('/api/admin/posts', $data)->assertStatus(401);
    // Should be 403 — user is authenticated but not authorized
});
```
---
## Good Example
```php
it('rejects unauthenticated', fn () => $this->getJson('/api/posts')->assertUnauthorized());

it('forbids unauthorized access', fn () => $this->actingAs($user)->postJson('/api/admin/posts', $data)->assertForbidden());
```
---
## Exceptions
Some authentication systems (e.g., token expired mid-session) may return 401 even for authenticated requests; document and test this behavior explicitly.
---
## Consequences Of Violation
Client retry logic loops forever on 403 (retrying authentication won't help); security logs misclassify unauthorized access attempts.
---

## Map Every Condition To Expected Status
---
## Category
Testing
---
## Rule
Document and test the status code for every possible endpoint outcome (success, validation failure, auth failure, not found, server error).
---
## Reason
Each condition must return a distinct, documented status code. A validation error returning 500 (uncaught ValidationException) or 200 (improper error handling) breaks client expectations. Mapping every condition to its status ensures comprehensive coverage.
---
## Bad Example
```php
it('validates input', function () {
    $response = $this->postJson('/api/posts', []);
    $response->assertOk(); // Validation error should be 422, not 200
});
```
---
## Good Example
```php
it('rejects invalid input with 422', fn () => $this->postJson('/api/posts', [])->assertStatus(422));
it('returns 404 for missing resource', fn () => $this->getJson('/api/posts/999999')->assertNotFound());
it('returns 201 for successful creation', fn () => $this->postJson('/api/posts', $validData)->assertCreated());
```
---
## Exceptions
Error paths that share a common handler (e.g., global 500 fallback) may not need per-endpoint status tests if handler-level tests exist.
---
## Consequences Of Violation
Production returns unexpected status codes; client error-handling code never executes; silent failures in downstream systems.
---

## Assert 204 For Delete
---
## Category
Testing
---
## Rule
Always assert `assertNoContent()` (204) on destroy endpoints.
---
## Reason
204 No Content is the most frequently misimplemented CRUD status code. Many controllers return 200 with an empty JSON body or 201 by accident. A 204 with empty body is the correct RESTful response — anything else indicates the controller may be doing extra work (serializing the deleted model, triggering unnecessary events).
---
## Bad Example
```php
it('deletes a post', function () {
    $response = $this->deleteJson("/api/posts/{$post->id}");
    $response->assertStatus(200); // Wrong — should be 204
    $response->assertJson([]);    // Extra work serializing deleted model
});
```
---
## Good Example
```php
it('deletes a post', function () {
    $response = $this->deleteJson("/api/posts/{$post->id}");
    $response->assertNoContent(); // 204
    $this->assertDatabaseMissing('posts', ['id' => $post->id]);
});
```
---
## Exceptions
Soft-delete endpoints that return the trashed resource or custom messages may return 200 with body.
---
## Consequences Of Violation
Unnecessary response processing; clients expecting empty body receive JSON; extra DB queries serializing deleted model for response.
---
