# Pagination Metadata — Engineering Rules

---

## Rule: Always Include per_page and total in Paginated Responses

---

## Category

Design

---

## Rule

Every paginated response must include both `per_page` and `total` values in the pagination metadata.

---

## Reason

Mobile applications need `per_page` for scroll physics calculation and `total` for progress indicators and infinite scroll termination logic. Without these values, clients cannot determine when to stop paginating or how to size UI elements.

---

## Bad Example

```php
// Custom paginationInformation removes total (e.g., privacy concerns)
public function paginationInformation($request, $paginated, $default): array
{
    return [
        'meta' => [
            'current_page' => $default['meta']['current_page'],
            'per_page' => $default['meta']['per_page'],
            // total intentionally omitted
        ],
    ];
}
// Client cannot calculate progress or know when to stop requesting
```

---

## Good Example

```php
public function paginationInformation($request, $paginated, $default): array
{
    return [
        'meta' => [
            'current_page' => $default['meta']['current_page'],
            'per_page' => $default['meta']['per_page'],
            'total' => $default['meta']['total'],
        ],
    ];
}
```

---

## Exceptions

Cursor-based pagination where total count is unknown without an expensive `COUNT(*)` query. In that case, document that total is omitted and provide an alternative mechanism.

---

## Consequences Of Violation

Client usability issues from missing scroll/ceiling information; mobile app crashes from infinite pagination; accessibility limitations for users navigating paginated content.

---

## Rule: Cap per_page to Prevent Oversized Responses

---

## Category

Security

---

## Rule

Always enforce a maximum `per_page` value (recommended: 100) in the controller. Reject or silently clamp values exceeding the maximum.

---

## Reason

Unbounded `per_page` allows clients to request arbitrarily large responses (e.g., `per_page=999999`), bypassing pagination entirely. This is a denial-of-service vector that risks memory exhaustion on the server and excessive bandwidth consumption.

---

## Bad Example

```php
// Controller — no cap on per_page
public function index(Request $request): UserCollection
{
    $perPage = $request->input('per_page', 20);
    return new UserCollection(User::paginate($perPage));
    // Client can request per_page=1000000
}
```

---

## Good Example

```php
// Controller — cap applied
public function index(Request $request): UserCollection
{
    $perPage = min((int) $request->input('per_page', 20), 100);
    return new UserCollection(User::paginate($perPage));
}
```

---

## Exceptions

Internal admin endpoints where the consumer is trusted and the use case genuinely requires large page sizes (e.g., data export via pagination).

---

## Consequences Of Violation

Security risks from denial-of-service via oversized responses; performance risks from memory exhaustion; scalability risks from unbounded response sizes.

---

## Rule: Use a Base Collection Class for Consistent Pagination Metadata

---

## Category

Code Organization

---

## Rule

Define a shared base collection class that all resource collections extend, ensuring consistent pagination metadata structure across every endpoint.

---

## Reason

When each collection customizes `paginationInformation()` independently, clients cannot write generic pagination handling. Every endpoint may return a different metadata shape. A base class enforces a single source of truth for pagination structure, enabling clients to use one pagination handler for all endpoints.

---

## Bad Example

```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => ['page' => $default['meta']['current_page']],
        ];
    }
}

class PostCollection extends ResourceCollection
{
    public $collects = PostResource::class;

    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => [
                'current_page' => $default['meta']['current_page'],
                'last_page' => $default['meta']['last_page'],
            ],
        ];
    }
}
// Different structures — clients need per-endpoint parsing
```

---

## Good Example

```php
abstract class BaseCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => [
                'current_page' => $default['meta']['current_page'],
                'last_page' => $default['meta']['last_page'],
                'per_page' => $default['meta']['per_page'],
                'total' => $default['meta']['total'],
            ],
        ];
    }
}

class UserCollection extends BaseCollection
{
    public $collects = UserResource::class;
}

class PostCollection extends BaseCollection
{
    public $collects = PostResource::class;
}
// Same structure — one client handler works for all
```

---

## Exceptions

APIs with fewer than 3 collection endpoints where the duplication of maintaining a base class outweighs the consistency benefit.

---

## Consequences Of Violation

Maintenance risks from per-endpoint client parsing code; scalability risks as each new endpoint requires custom client handling; onboarding friction for third-party API consumers.

---

## Rule: Prefer CursorPaginator for Datasets Over 1M Rows

---

## Category

Performance

---

## Rule

Use `CursorPaginator` instead of `LengthAwarePaginator` for tables with more than 1 million rows or when deep page access (page > 100) is expected.

---

## Reason

`LengthAwarePaginator` executes a `COUNT(*)` query on every request, which is expensive on large tables even with indexes. Additionally, offset-based pagination scans and skips all previous rows for deep pages (page 1000 of 10M rows scans 10M rows). `CursorPaginator` uses WHERE clauses with no count query and stable performance at any depth.

---

## Bad Example

```php
// LengthAwarePaginator on a 10M-row table
public function index(): UserCollection
{
    return new UserCollection(User::paginate(20, page: 1000));
    // COUNT(*) scans 10M rows + OFFSET skips 20K rows every request
}
```

---

## Good Example

```php
// CursorPaginator for large datasets
public function index(Request $request): UserCollection
{
    return new UserCollection(User::cursorPaginate(20));
    // No COUNT query, no OFFSET, stable performance
}
```

---

## Exceptions

When random page access is required ("go to page 5"), which cursor pagination does not support. In that case, combine offset pagination with caching for the `COUNT(*)` query.

---

## Consequences Of Violation

Performance risks from expensive `COUNT(*)` queries on large tables; scalability risks from degrading performance at deep page numbers; increased database load proportional to dataset size.

---

## Rule: Never Include Business Data Inside Pagination Metadata

---

## Category

Design

---

## Rule

Pagination metadata must only contain pagination state (page numbers, totals, links). Business data (aggregate counts, filtered totals, computed values) must be placed in the `data` array or dedicated top-level keys.

---

## Reason

Mixing business data with pagination metadata violates the separation of concerns between navigation state and business logic. Clients that parse `meta` for pagination and ignore unknown keys may silently miss important business context.

---

## Bad Example

```php
public function paginationInformation($request, $paginated, $default): array
{
    return [
        'meta' => array_merge($default['meta'], [
            'active_users_count' => User::whereActive()->count(), // Business data
            'total_revenue' => Order::sum('amount'), // Business data
        ]),
    ];
}
```

---

## Good Example

```php
class UserCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'meta' => [
                'summary' => [
                    'active_users' => $this->activeCount(),
                    'total_revenue' => $this->totalRevenue(),
                ],
            ],
        ];
    }
    // Pagination handled separately via default paginationInformation()
}
```

---

## Exceptions

When the business data is intrinsic to pagination context (e.g., "showing 10 of 25 filtered results") and documented as part of the pagination contract.

---

## Consequences Of Violation

Maintainability risks from mixed concerns in metadata; client confusion about metadata structure; performance risks from expensive queries computed inside pagination metadata.

---

## Rule: Test Pagination Structure, Not Exact URLs

---

## Category

Testing

---

## Rule

In pagination tests, assert the structure of `links` and `meta` rather than exact URL values. Use `assertJsonStructure` for key presence and type checking.

---

## Reason

Pagination URLs are generated based on the current request URL, which varies between environments (localhost, CI, staging, production). Tests asserting exact URL values fail in different environments even when the pagination logic is correct.

---

## Bad Example

```php
public function test_paginated_response(): void
{
    $response = $this->getJson('/api/users?page=2');

    $this->assertEquals(
        'http://localhost/api/users?page=1',
        $response['links']['first']
    );
    // Fails in CI where base URL differs
}
```

---

## Good Example

```php
public function test_paginated_response(): void
{
    $response = $this->getJson('/api/users?page=2');

    $response->assertJsonStructure([
        'data',
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);

    $this->assertEquals(2, $response['meta']['current_page']);
    $this->assertIsString($response['links']['first']);
}
```

---

## Exceptions

Tests specifically verifying URL generation behavior (e.g., custom URL transformations or query parameter passthrough).

---

## Consequences Of Violation

Reliability risks from environment-specific test failures; CI degradation from URL mismatches; reduced test confidence (developers ignore failing tests they consider "environment issues").

---

## Rule: Document the Paginator Type Per Endpoint

---

## Category

Maintainability

---

## Rule

Document which paginator type (`LengthAwarePaginator`, `Paginator`, `CursorPaginator`) each collection endpoint uses, including the availability of `total`, `last_page`, and cursor values.

---

## Reason

Different paginator types produce different metadata structures. A client expecting `total` and `last_page` (from `LengthAwarePaginator`) will find them missing when the endpoint uses `CursorPaginator`. Documentation prevents client integration errors and support requests.

---

## Bad Example

```php
// No documentation about paginator type
class PostController
{
    public function index(): PostCollection
    {
        return new PostCollection(Post::cursorPaginate(20));
        // Client expects 'total' and 'last_page' but gets cursor values
    }
}
```

---

## Good Example

```php
/**
 * @queryParam page integer (unused — uses cursor pagination)
 * @queryParam cursor string Cursor for pagination (returned in response)
 * 
 * Paginated response includes 'data', 'links', and 'meta' with 'cursor' and 'next_cursor'.
 * Does NOT include 'total' or 'last_page'.
 */
class PostController
{
    public function index(Request $request): PostCollection
    {
        return new PostCollection(Post::cursorPaginate(20));
    }
}
```

---

## Exceptions

Internal APIs with a single trusted consumer where the developer maintains both ends.

---

## Consequences Of Violation

Client integration errors from unexpected metadata structure; support overhead from pagination questions; confusion during API onboarding.

---

## Rule: Keep paginationInformation Customizations Minimal

---

## Category

Maintainability

---

## Rule

Limit `paginationInformation()` customizations to essential additions. Avoid removing, renaming, or restructuring default pagination fields unless the API contract explicitly requires a non-standard format.

---

## Reason

Every deviation from the default pagination structure creates a new response schema that clients must handle. Heavy customization prevents clients from writing generic pagination code and increases support burden for explaining the non-standard format.

---

## Bad Example

```php
public function paginationInformation($request, $paginated, $default): array
{
    return [
        'paging' => [ // Renamed from 'links'
            'previous' => $default['links']['prev'], // Renamed
            'next' => $default['links']['next'],
        ],
        'page_info' => [ // Renamed from 'meta'
            'page' => $default['meta']['current_page'],
            'size' => $default['meta']['per_page'],
            'count' => $default['meta']['total'],
        ],
    ];
}
// Entirely non-standard — clients must write custom parsing
```

---

## Good Example

```php
public function paginationInformation($request, $paginated, $default): array
{
    // Preserve default structure, add only what's needed
    return [
        'links' => $default['links'],
        'meta' => array_merge($default['meta'], [
            'applied_filters' => $request->only(['status', 'role']),
        ]),
    ];
}
```

---

## Exceptions

Mobile-optimized APIs where response size reduction is critical and the non-standard format is documented and consistent across all endpoints.

---

## Consequences Of Violation

Maintainability risks from per-endpoint client parsing code; client integration friction; scalability risks as each new customization increases client testing burden.
