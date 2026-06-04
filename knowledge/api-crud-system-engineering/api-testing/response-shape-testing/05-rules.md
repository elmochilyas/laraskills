# Response Shape Testing — Rules

## Assert Shape Before Content
---
## Category
Testing
---
## Rule
Always assert response structure (`assertJsonStructure`) before asserting specific values (`assertJson`, `assertJsonFragment`).
---
## Reason
A shape test first validates that the JSON skeleton (keys, nesting, types) is correct. If the shape is wrong, value assertions fail with confusing messages about missing keys. Shape-first ordering produces clear failures: "expected key 'title' in structure" instead of "expected 'Hello' but got null."
---
## Bad Example
```php
$response->assertJsonFragment(['title' => 'Hello']); // Fails confusingly if 'title' key is missing
$response->assertJsonStructure(['data' => ['id', 'title']]);
```
---
## Good Example
```php
$response->assertJsonStructure(['data' => ['id', 'title']]);
$response->assertJsonFragment(['title' => 'Hello']);
```
---
## Exceptions
When the value assertion inherently validates structure (e.g., `assertExactJson` validates both shape and values).
---
## Consequences Of Violation
Confusing failure messages; developers waste time debugging shape issues misdiagnosed as value issues.
---

## Use `*` Wildcard For Collection Endpoints
---
## Category
Testing
---
## Rule
Always use the `*` wildcard in `assertJsonStructure` when asserting the shape of collection response items.
---
## Reason
`assertJsonStructure` without `*` validates only the first element of an array. An empty collection would pass validation with no `*` wildcard. The wildcard ensures every element in the array matches the expected structure, including the edge case of zero elements.
---
## Bad Example
```php
$response->assertJsonStructure(['data' => ['id', 'title']]);
// Only validates first element — empty array would pass
```
---
## Good Example
```php
$response->assertJsonStructure(['data' => ['*' => ['id', 'title']]]);
// Validates every element matches the structure — empty array also passes
```
---
## Exceptions
Single-resource endpoints (show, store) that return a non-collection `data` key do not need `*`.
---
## Consequences Of Violation
Empty collections pass shape validation; partial collections with wrong key structure on non-first elements go undetected.
---

## Define Per-Resource-Type Structure Helpers
---
## Category
Maintainability
---
## Rule
Define reusable structure assertion methods for each resource type (e.g., `assertPostStructure()`, `assertUserStructure()`).
---
## Reason
The same resource type appears in index, show, store, and update responses. Copying shape arrays across tests creates maintenance burden — adding a field requires editing every test. A central helper keeps shape definitions in one place.
---
## Bad Example
```php
it('shows a post', function () {
    $response->assertJsonStructure(['data' => ['id', 'title', 'body', 'created_at', 'updated_at']]);
});

it('lists posts', function () {
    $response->assertJsonStructure(['data' => ['*' => ['id', 'title', 'body', 'created_at', 'updated_at']]]);
});
// Duplicated shape definition — adding 'author' requires editing both
```
---
## Good Example
```php
function assertPostStructure(TestResponse $response, bool $collection = false): void
{
    $structure = $collection
        ? ['data' => ['*' => ['id', 'title', 'body', 'created_at', 'updated_at']]]
        : ['data' => ['id', 'title', 'body', 'created_at', 'updated_at']];

    $response->assertJsonStructure($structure);
}

it('shows a post', fn () => assertPostStructure($response));
it('lists posts', fn () => assertPostStructure($response, collection: true));
```
---
## Exceptions
When only one endpoint returns a given resource type, a helper may be unnecessary overhead.
---
## Consequences Of Violation
Shape updates require touching dozens of test files; inconsistent shape definitions across tests; increased maintenance cost.
---

## Test Deep Nesting Explicitly
---
## Category
Testing
---
## Rule
Assert nested resource structures (relations, pagination wrappers) explicitly rather than assuming flat shape coverage is sufficient.
---
## Reason
Nested structures — like related author objects inside post data, or pagination meta inside a wrapper — represent the deepest contract surface. A flat shape test passes even if nested structures are missing keys.
---
## Bad Example
```php
$response->assertJsonStructure(['data' => ['*' => ['id', 'title', 'author']]]);
// 'author' may be null or an object with wrong keys — test passes either way
```
---
## Good Example
```php
$response->assertJsonStructure([
    'data' => ['*' => [
        'id',
        'title',
        'author' => ['id', 'name', 'email'], // Explicit nested structure
    ]],
]);
```
---
## Exceptions
When nested relations are conditionally loaded (loaded relation vs. null), use optional structure assertions or separate tests.
---
## Consequences Of Violation
Nested relation response shapes break without detection; client code fails parsing familiar top-level keys with unfamiliar nested content.
---

## Version Shape Expectations Per API Version
---
## Category
Architecture
---
## Rule
Maintain separate shape structure definitions per API version.
---
## Reason
V1 and V2 of the same resource may have different response shapes (renamed fields, different nesting). A single shape definition shared across versions will fail for one version. Version-specific helpers ensure each version's contract is independently verified.
---
## Bad Example
```php
// Shared structure used by both V1 and V2 tests
function assertPostShape(TestResponse $response): void {
    $response->assertJsonStructure(['data' => ['id', 'title', 'author_name']]);
}
// V2 replaced 'author_name' with nested 'author' object — shape test breaks
```
---
## Good Example
```php
function assertV1PostShape(TestResponse $response): void {
    $response->assertJsonStructure(['data' => ['id', 'title', 'author_name']]);
}

function assertV2PostShape(TestResponse $response): void {
    $response->assertJsonStructure(['data' => ['id', 'title', 'author' => ['id', 'name']]]);
}
```
---
## Exceptions
When the API version only adds fields without changing existing structure, the same base shape may be extended.
---
## Consequences Of Violation
Cross-version shape contamination; V2 shape changes incorrectly validated against V1 expectations; false-positive or false-negative contract tests.
---

## Verify No Unexpected Keys Exposed
---
## Category
Security
---
## Rule
Use shape assertions to verify that no unexpected keys (internal fields, sensitive data) appear in API responses.
---
## Reason
Shape tests catch accidental exposure of internal fields like `password`, `remember_token`, pivot data, or serialized model attributes. A missing `$hidden` or `$appends` configuration can leak sensitive data through API resources.
---
## Bad Example
```php
$response->assertJsonStructure(['data' => ['id', 'title']]);
// Test passes even if response includes 'password', 'is_admin', or pivot data
```
---
## Good Example
```php
$response->assertJsonStructure(['data' => ['id', 'title', 'body']]);
$response->assertJsonMissing(['password', 'remember_token', 'pivot']);
```
---
## Exceptions
Internal APIs where all consumers are trusted may relax unexpected-key assertions.
---
## Consequences Of Violation
Sensitive data exposure via API responses; compliance violations; security incidents blamed on "passing tests."
---
