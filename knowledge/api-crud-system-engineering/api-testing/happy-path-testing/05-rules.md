# Happy Path Testing — Rules

## Assert Status Before Structure Before Content
---
## Category
Testing
---
## Rule
Always assert HTTP status code first, then response structure, then specific content values.
---
## Reason
Status code check is the cheapest assertion (single integer comparison). If the status is wrong (e.g., 500 instead of 200), structure and content assertions will fail with confusing messages. Ordering assertions by cost and specificity produces the clearest failure output.
---
## Bad Example
```php
$response = $this->postJson('/api/posts', $data);
$response->assertJson(['title' => 'Hello']); // Fails with confusing message if 422
$response->assertCreated();                   // Never reached
```
---
## Good Example
```php
$response = $this->postJson('/api/posts', $data);
$response->assertCreated();
$response->assertJsonStructure(['data' => ['id', 'title']]);
$response->assertJsonFragment(['title' => 'Hello']);
```
---
## Exceptions
When the status code is deliberately secondary to content validation (e.g., contract tests that care most about schema conformance).
---
## Consequences Of Violation
Confusing failure messages when status is wrong; wasted debugging time parsing irrelevant assertion errors.
---

## Verify Database Mutation On Store, Update, Destroy
---
## Category
Testing
---
## Rule
After every mutating endpoint (store, update, destroy), always assert the database state changed accordingly.
---
## Reason
A 201 Created response without a corresponding database record means the controller returned success without persisting data. Feature tests are the only layer that catches this gap between response and persistence.
---
## Bad Example
```php
it('creates a post', function () {
    $response = $this->postJson('/api/posts', ['title' => 'Hello']);

    $response->assertCreated();
    // No database assertion — post may not exist
});
```
---
## Good Example
```php
it('creates a post', function () {
    $response = $this->postJson('/api/posts', ['title' => 'Hello']);

    $response->assertCreated();
    $this->assertDatabaseHas('posts', ['title' => 'Hello']);
});
```
---
## Exceptions
Read-only endpoints (index, show) do not need database mutation assertions.
---
## Consequences Of Violation
False-positive test passes when endpoint returns success but fails to persist data; data corruption in production.
---

## Use Convenience Status Methods
---
## Category
Maintainability
---
## Rule
Prefer convenience status assertion methods (`assertOk`, `assertCreated`, `assertNoContent`, `assertNotFound`, `assertForbidden`, `assertUnauthorized`) over raw `assertStatus()`.
---
## Reason
Convenience methods are self-documenting: `assertCreated()` communicates intent more clearly than `assertStatus(201)`. They also provide better failure messages.
---
## Bad Example
```php
$response = $this->postJson('/api/posts', $data);
$response->assertStatus(201);
$this->deleteJson("/api/posts/{$post->id}");
$response->assertStatus(204);
```
---
## Good Example
```php
$response = $this->postJson('/api/posts', $data);
$response->assertCreated();
$this->deleteJson("/api/posts/{$post->id}");
$response->assertNoContent();
```
---
## Exceptions
Non-standard status codes (e.g., 206 Partial Content, 304 Not Modified) require `assertStatus()`.
---
## Consequences Of Violation
Reduced readability; less meaningful failure messages; inconsistency across the test suite.
---

## Use AssertJsonFragment Over AssertExactJson
---
## Category
Maintainability
---
## Rule
Prefer `assertJsonFragment` for partial verification and `assertJsonStructure` for shape verification. Use `assertExactJson` only when the entire response must be verified byte-for-byte.
---
## Reason
`assertExactJson` creates brittle tests that break when unrelated fields are added or order changes. `assertJsonFragment` verifies the subset of data the test cares about, surviving harmless additions to the response.
---
## Bad Example
```php
$response = $this->getJson("/api/posts/{$post->id}");
$response->assertExactJson([
    'id' => 1,
    'title' => 'Hello',
    'body' => 'World',
    'created_at' => now()->toISOString(),
    'updated_at' => now()->toISOString(),
    // Breaks when any new field, including timestamps, changes
]);
```
---
## Good Example
```php
$response = $this->getJson("/api/posts/{$post->id}");
$response->assertJsonStructure(['data' => ['id', 'title', 'body']]);
$response->assertJsonFragment(['title' => 'Hello']);
```
---
## Exceptions
When the API contract explicitly requires an exact response shape (e.g., signed responses, hashed payloads).
---
## Consequences Of Violation
Brittle tests that fail on unrelated changes; high maintenance costs for timestamp or random-value fields.
---

## Test Index Pagination Structure
---
## Category
Testing
---
## Rule
Always assert the pagination structure (data, meta, links) on collection/index endpoints.
---
## Reason
Collection endpoints are the most commonly consumed API responses. A broken pagination structure (missing `meta.total`, wrong `links.next` format) breaks every client that parses it. Pagination structure is part of the API contract.
---
## Bad Example
```php
it('lists posts', function () {
    Post::factory()->count(3)->create();

    $response = $this->getJson('/api/posts');

    $response->assertOk();
    // No pagination structure assertion
    $response->assertJsonCount(3, 'data');
});
```
---
## Good Example
```php
it('lists posts with pagination', function () {
    Post::factory()->count(3)->create();

    $response = $this->getJson('/api/posts');

    $response->assertOk();
    $response->assertJsonStructure([
        'data' => ['*' => ['id', 'title']],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        'links' => ['first', 'last', 'prev', 'next'],
    ]);
});
```
---
## Exceptions
Non-paginated collection endpoints (returning all records) may omit pagination meta/links assertions.
---
## Consequences Of Violation
Consumers receive broken pagination; UI list views break silently; debugging requires manual API inspection.
---

## One Test Per Endpoint Per Outcome
---
## Category
Testing
---
## Rule
Write exactly one test method per endpoint per expected outcome variant.
---
## Reason
Clear mapping between test methods and endpoint outcomes makes the test suite a living specification. A developer can look at the test list to understand what each endpoint does under what conditions.
---
## Bad Example
```php
it('works with posts', function () {
    $response = $this->postJson('/api/posts', ['title' => 'Valid']);
    $response->assertCreated();

    $response = $this->postJson('/api/posts', ['title' => '']);
    $response->assertStatus(422);
    // Two outcomes in one test — second outcome is never tested independently
});
```
---
## Good Example
```php
it('creates a post with valid data', fn () => ...->assertCreated());
it('rejects empty title', fn () => ...->assertStatus(422));
it('rejects duplicate title', fn () => ...->assertStatus(422));
```
---
## Exceptions
Data-driven tests using PestPHP `with()` datasets logically represent one test with multiple input variants.
---
## Consequences Of Violation
Incomplete outcome coverage; unclear test purpose; regression detection is ambiguous.
---
