# pagination-metadata-design Rules

## Rule 1: Match Paginator Type to Use Case
---
## Category
Architecture
---
## Rule
Always choose the paginator type based on client needs: `LengthAwarePaginator` for numbered-page UIs, `CursorPaginator` for infinite scroll, `SimplePaginator` when only prev/next is needed.
---
## Reason
`LengthAwarePaginator` executes an expensive `COUNT(*)` query. Using it for infinite-scroll UIs that never show page numbers wastes database resources. Cursor pagination has constant query cost but no page-number navigation.
---
## Bad Example
```php
// Admin panel — needs page numbers, correct
$users = User::paginate(15);

// Infinite scroll mobile feed — also uses LengthAwarePaginator
$feed = FeedItem::paginate(20); // COUNT(*) on huge table every request
```
---
## Good Example
```php
// Admin panel — page numbers needed
$users = User::paginate(15);

// Infinite scroll feed — no page numbers needed
$feed = FeedItem::cursorPaginate(20);
```
---
## Exceptions
Endpoints where total count is cheap (small tables under 10K rows) and the client may need it regardless of pagination style.
---
## Consequences Of Violation
Expensive `COUNT(*)` queries on every infinite-scroll request. Database CPU saturation on large tables. Slow page loads for feeds that never display page numbers.

## Rule 2: Always Enforce a Maximum `per_page`
---
## Category
Security
---
## Rule
Always enforce a hard upper limit on the `per_page` parameter to prevent clients from requesting arbitrarily large page sizes.
---
## Reason
Unbounded `per_page` is a denial-of-service vector. A client requesting `per_page=100000` loads a massive result set into memory, potentially exhausting PHP memory or database resources.
---
## Bad Example
```php
$perPage = $request->integer('per_page', 15);
$users = User::paginate($perPage); // no cap — client requests 100000
```
---
## Good Example
```php
$perPage = min(100, $request->integer('per_page', 15));
$users = User::paginate($perPage);
```
---
## Exceptions
Admin-only endpoints with access controls and explicit large-page-size use cases (exports, batch processing).
---
## Consequences Of Violation
Memory exhaustion on large datasets. Database query takes seconds to return. Application becomes unresponsive under moderate load.

## Rule 3: Never Expose Raw Paginator Output Directly
---
## Category
Design
---
## Rule
Always return paginated data through `Resource::collection($paginator)`, never via `$paginator->toArray()` or `$paginator->items()`.
---
## Reason
Raw paginator output uses Laravel's internal array keys (`current_page`, `per_page`, `total`, `last_page`, `from`, `to`). Exposing these couples the API contract to Laravel internals, which may change between versions.
---
## Bad Example
```php
return $users->toArray();
// Exposes Laravel's internal pagination keys directly
```
---
## Good Example
```php
return UserResource::collection($users);
// Resource serialization controls the output shape
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Laravel upgrade changes paginator output keys, breaking the API contract. Clients parse internal Laravel keys that were never intended to be part of the public API.

## Rule 4: Always Include Standardized Pagination Fields in `meta`
---
## Category
Design
---
## Rule
Always include `current_page`, `per_page`, and `total` (for LengthAwarePaginator) or `has_more`, `next_cursor`, `prev_cursor` (for CursorPaginator) in the `meta` object of paginated responses.
---
## Reason
Missing pagination fields leave clients unable to navigate, display page information, or know when data ends. Standard fields are expected by generic HTTP clients and API tooling.
---
## Bad Example
```php
'meta' => [
    'total' => 150, // missing current_page, per_page, last_page
]
```
---
## Good Example
```php
'meta' => [
    'current_page' => 1,
    'per_page' => 15,
    'total' => 150,
    'last_page' => 10,
    'from' => 1,
    'to' => 15,
]
```
---
## Exceptions
Bare-body APIs where pagination metadata is communicated entirely through HTTP headers.
---
## Consequences Of Violation
Clients cannot determine which page they are on. UI pagination controls show no context. Clients cannot estimate remaining results.

## Rule 5: Standardize Pagination Field Names Across All Endpoints
---
## Category
Maintainability
---
## Rule
Always use exactly the same pagination metadata field names on every paginated endpoint within the same API.
---
## Reason
Clients parse pagination metadata generically. Different field names per endpoint force clients to conditional-parse or maintain endpoint-specific pagination handlers.
---
## Bad Example
```php
// /api/users
'meta' => ['current_page' => 1, 'total' => 50]

// /api/posts
'meta' => ['page' => 1, 'totalRecords' => 100] // different names
```
---
## Good Example
```php
// Both endpoints use identical field names
'meta' => ['current_page' => 1, 'per_page' => 15, 'total' => 50]
```
---
## Exceptions
API versioning where field names intentionally change between versions.
---
## Consequences Of Violation
Client pagination code must handle different field names per endpoint. Integration tests must assert different shapes for different endpoints.

## Rule 6: Document Whether `total` Is Available
---
## Category
Maintainability
---
## Rule
Always document whether `total` is included in paginated responses — it is absent when using `SimplePaginator` or `CursorPaginator`.
---
## Reason
Clients need to know whether they can display total counts, progress bars, or "Page X of Y" UI. An absent `total` that clients expect causes silent UI bugs or crashes.
---
## Bad Example
```php
// OpenAPI spec doesn't specify total presence
// Client assumes total always exists — UI crashes when using cursor pagination
```
---
## Good Example
```php
// OpenAPI spec:
// properties:
//   total:
//     type: integer
//     nullable: true
//     description: "Total record count. Null when using cursor pagination."
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Mobile app crashes when `total` is null/absent. UI shows "undefined of undefined" instead of "Page 1 of 5." Client-side error rates spike.

## Rule 7: Include Navigation Links in Paginated Responses
---
## Category
Reliability
---
## Rule
Always include `links` with `first`, `prev`, `next`, `last` navigation URLs in every paginated response (where applicable to the paginator type).
---
## Reason
Navigation links enable clients to fetch other pages without constructing URLs manually. Hardcoded URL construction by clients breaks when the API path changes or query parameters evolve.
---
## Bad Example
```php
'meta' => ['current_page' => 1, 'total' => 50]
// No links — client must construct URLs manually
```
---
## Good Example
```php
'data' => [...],
'meta' => ['current_page' => 1, 'per_page' => 15, 'total' => 50],
'links' => [
    'first' => '/api/users?page=1',
    'prev' => null,
    'next' => '/api/users?page=2',
    'last' => '/api/users?page=4',
]
```
---
## Exceptions
Bare-body APIs that use `Link` HTTP headers instead of body-level navigation.
---
## Consequences Of Violation
Clients hardcode URL construction logic that breaks on path changes, query parameter additions, or when moving between environments.
