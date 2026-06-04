# Pagination Response Testing — Rules

## Seed Data For Multi-Page Scenarios
---
## Category
Testing
---
## Rule
Always seed at least `per_page + 1` records when testing paginated collection endpoints.
---
## Reason
A single-page collection (fewer records than `per_page`) only exercises the first page scenario. The most common pagination bugs — incorrect `last_page`, broken `next` links, missing `prev` links — only appear when multiple pages exist. Seeding `per_page + 1` ensures at least two pages are exercised.
---
## Bad Example
```php
it('paginates posts', function () {
    Post::factory()->count(3)->create(); // Default per_page = 15 — only one page

    $response = $this->getJson('/api/posts');

    expect($response->json('meta.last_page'))->toBe(1); // Never tests multi-page logic
});
```
---
## Good Example
```php
it('paginates posts across multiple pages', function () {
    Post::factory()->count(16)->create(); // per_page=15, 16 records = 2 pages

    $response = $this->getJson('/api/posts?page=1');

    expect($response->json('meta.current_page'))->toBe(1);
    expect($response->json('meta.last_page'))->toBe(2);
    expect($response->json('links.next'))->not->toBeNull();
});
```
---
## Exceptions
When testing cursor pagination (which does not have `last_page`), seed enough for at least two cursors.
---
## Consequences Of Violation
Multi-page navigation bugs reach production; `next` link returns same page; `prev` link is missing.
---

## Assert Full Pagination Shape
---
## Category
Testing
---
## Rule
Assert the complete pagination structure including `data`, `meta`, and `links` keys using `assertJsonStructure`.
---
## Reason
The paginated response shape (`data`, `meta.current_page`, `meta.last_page`, `meta.per_page`, `meta.total`, `links.first`, `links.last`, `links.prev`, `links.next`) is the most frequently parsed structure by API clients. Any missing or renamed key breaks every list-view implementation. Full shape assertion catches all structure changes.
---
## Bad Example
```php
it('paginates posts', function () {
    Post::factory()->count(16)->create();

    $this->getJson('/api/posts')->assertJsonCount(15, 'data');
    // No assertion on meta or links structure
});
```
---
## Good Example
```php
it('paginates posts with correct structure', function () {
    Post::factory()->count(16)->create();

    $this->getJson('/api/posts')->assertJsonStructure([
        'data' => ['*' => ['id', 'title']],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
        'links' => ['first', 'last', 'prev', 'next'],
    ]);
});
```
---
## Exceptions
When using `SimplePaginator` (which omits `last_page` and `total` from meta), assert the simpler shape.
---
## Consequences Of Violation
Broken pagination structure breaks all clients; UI list views fail silently; consumers parse null/invalid pagination metadata.
---

## Test Boundary Pages
---
## Category
Testing
---
## Rule
Test page 1, the last page, and a page beyond the last page.
---
## Reason
Page 1 is the default and most commonly hit. The last page tests boundary conditions (fewer items, no `next` link). A page beyond the last tests that the API returns an empty dataset with proper pagination structure, not a 404 error.
---
## Bad Example
```php
it('paginates posts', function () {
    Post::factory()->count(16)->create();

    $this->getJson('/api/posts')->assertOk(); // Only tests page 1
});
```
---
## Good Example
```php
it('returns page 1 with items', function () {
    Post::factory()->count(16)->create();
    $this->getJson('/api/posts?page=1')->assertJsonCount(15, 'data');
});

it('returns remaining items on last page', function () {
    Post::factory()->count(16)->create();
    $this->getJson('/api/posts?page=2')->assertJsonCount(1, 'data');
});

it('returns empty data for page beyond last', function () {
    Post::factory()->count(16)->create();
    $this->getJson('/api/posts?page=3')
        ->assertJsonCount(0, 'data')
        ->assertJsonFragment(['total' => 16]);
});
```
---
## Exceptions
Cursor-paginated endpoints do not have page numbers — test first cursor, next cursor, and null cursor (end).
---
## Consequences Of Violation
Page beyond last returns 404 instead of empty dataset; last page shows wrong item count; client pagination loops forever.
---

## Test Per_Page Boundary
---
## Category
Testing
---
## Rule
Test `per_page` parameter at 0 (default), exceeding max (capped), and negative (rejected or defaulted).
---
## Reason
`per_page` limits set in the paginator configuration must be enforced. Without explicit boundary tests, a client can request 10,000 items per page, causing memory exhaustion or slow responses.
---
## Bad Example
```php
it('respects custom per_page', function () {
    Post::factory()->count(50)->create();

    $this->getJson('/api/posts?per_page=5')->assertJsonCount(5, 'data');
    // Does not test per_page cap (e.g., max 100) or per_page=-1
});
```
---
## Good Example
```php
it('defaults per_page when not provided', function () {
    Post::factory()->count(20)->create();
    $this->getJson('/api/posts')->assertJsonCount(15, 'data'); // Default 15
});

it('caps per_page at configured max', function () {
    Post::factory()->count(200)->create();
    $this->getJson('/api/posts?per_page=1000')->assertJsonCount(100, 'data'); // Capped
});

it('handles negative per_page', function () {
    Post::factory()->count(5)->create();
    $this->getJson('/api/posts?per_page=-1')->assertOk(); // Should use default
});
```
---
## Exceptions
When the API explicitly documents unlimited `per_page` for admin endpoints (with rate limiting).
---
## Consequences Of Violation
Memory exhaustion from large `per_page` requests; denial-of-service through pagination abuse; inconsistent behavior across pagination parameters.
---

## Test Empty Collection
---
## Category
Testing
---
## Rule
Always test that a collection endpoint with zero records returns 200 with `data: []` and correct pagination meta.
---
## Reason
An empty collection is an edge case that often breaks: some implementations return 404, or omit pagination meta/links, or return `data: null` instead of `data: []`. The contract must guarantee a consistent empty response because clients always handle it.
---
## Bad Example
```php
it('lists posts', function () {
    Post::factory()->count(3)->create();
    $this->getJson('/api/posts')->assertOk();
    // No empty collection test
});
```
---
## Good Example
```php
it('returns empty collection with pagination metadata', function () {
    $response = $this->getJson('/api/posts');

    $response->assertOk();
    expect($response->json('data'))->toBe([]);
    expect($response->json('meta.total'))->toBe(0);
    expect($response->json('meta.last_page'))->toBe(1);
    expect($response->json('links.next'))->toBeNull();
});
```
---
## Exceptions
Endpoints that guarantee at least one record (e.g., authenticated user's own profile) may omit empty-collection tests.
---
## Consequences Of Violation
Empty collection returns 404; client list views show error instead of "no results"; null checks required everywhere.
---

## Test Cursor Pagination Separately
---
## Category
Testing
---
## Rule
Write separate tests for cursor pagination responses — do not reuse length-aware paginator test patterns.
---
## Reason
Cursor pagination has a fundamentally different structure: no `last_page` or `total`, no random page access, only `next_cursor` and `prev_cursor`. Reusing length-aware paginator test patterns (asserting `last_page`, random page access) will fail or, worse, pass because the controller incorrectly returns a length-aware paginator when cursor was expected.
---
## Bad Example
```php
it('paginates posts', function () {
    Post::factory()->count(16)->create();
    $this->getJson('/api/posts')
        ->assertJsonStructure(['meta' => ['current_page', 'last_page', 'total']]);
    // Cursor pagination does not have 'last_page' or 'total'
});
```
---
## Good Example
```php
it('returns cursor pagination structure', function () {
    Post::factory()->count(16)->create();

    $response = $this->getJson('/api/posts');

    $response->assertJsonStructure([
        'data' => ['*' => ['id', 'title']],
        'meta' => ['path', 'per_page', 'next_cursor', 'prev_cursor', 'has_more'],
        'links' => ['first', 'last', 'prev', 'next'],
    ]);
    expect($response->json('meta.has_more'))->toBeTrue();
});
```
---
## Exceptions
When the API consistently uses only one paginator type, separate cursor tests may not be needed.
---
## Consequences Of Violation
Cursor paginator returns length-aware structure (or vice versa); clients parsing cursor shape encounter missing keys.
---
