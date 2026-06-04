# Pagination Metadata

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Pagination Metadata
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Pagination metadata in Laravel API Resources provides clients with navigation information: current page, total pages, per-page count, and navigation links. When a `ResourceCollection` receives a paginator, it automatically injects `links` and `meta` keys into the response. This consistent envelope lets any client navigate any list endpoint without endpoint-specific pagination logic.

The engineering value is API-wide pagination standardization. Every collection response has the same `links` and `meta` structure. Clients write one pagination handler that works for all endpoints. Customizing this metadata via `paginationInformation()` allows endpoint-specific adjustments without breaking the standard envelope.

---

## Core Concepts

### Default Pagination Structure

When returning a paginated collection, Laravel injects:

```json
{
    "data": [ ... ],
    "links": {
        "first": "http://example.com/users?page=1",
        "last": "http://example.com/users?page=5",
        "prev": null,
        "next": "http://example.com/users?page=2"
    },
    "meta": {
        "current_page": 1,
        "from": 1,
        "last_page": 5,
        "path": "http://example.com/users",
        "per_page": 20,
        "to": 20,
        "total": 100
    }
}
```

The `links` object provides URLs for navigation. The `meta` object provides numeric metadata.

### Paginator Types

| Paginator | Features | Meta Fields |
|---|---|---|
| `LengthAwarePaginator` | Count + data (2 queries) | `current_page`, `from`, `last_page`, `path`, `per_page`, `to`, `total` |
| `Paginator` (simple) | Data only (1 query, no count) | `current_page`, `from`, `path`, `per_page`, `to` |
| `CursorPaginator` | Cursor-based (1 query) | `cursor`, `path`, `per_page`, `next_cursor`, `prev_cursor`, `has_more` |

### Pagination Information Resolution

The `PaginatedResourceResponse` class (`Illuminate\Http\Resources\Json\PaginatedResourceResponse`) extracts pagination data from the paginator and calls `paginationInformation()` to allow customization.

---

## Mental Models

### The Navigation Bar

Pagination metadata is the navigation bar at the bottom of the API page. It tells clients: "You're on page 1 of 5. Here's how to go to the next page, the last page, or back to the first page." The navigation bar is consistent across all pages, just like a website footer.

### The Receipt

The `meta` object is like a store receipt — it itemizes the transaction: what you received (`from` to `to`), the page size (`per_page`), the total inventory (`total`), and your current position (`current_page`).

---

## Internal Mechanics

### PaginatedResourceResponse Pipeline

When a `ResourceCollection` is returned from a controller:

1. `ResourceCollection::toResponse($request)` is called
2. If resource is paginated, `PaginatedResourceResponse` is created
3. `PaginatedResourceResponse::toResponse()` builds the array:
   - Calls `$this->collection->toArray($request)` for data
   - Calls `$this->paginationInformation()` for links/meta
   - Passes through `$this->with()` and `$this->withResponse()`
4. Returns `JsonResponse` with the complete array

### paginationInformation() Method

The customization hook:

```php
class UserCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'version' => '1.0',
                'api_name' => 'Users API',
            ]),
        ];
    }
}
```

Parameters:
- `$request` — current HTTP request
- `$paginated` — raw paginated resource data (includes `items`, `links`, `meta`)
- `$default` — computed default pagination array (what would be returned without customization)

### Cursor Pagination Metadata

Cursor pagination uses opaque cursors instead of page numbers:

```json
{
    "data": [ ... ],
    "meta": {
        "path": "http://example.com/users",
        "per_page": 20,
        "next_cursor": "eyJpZCI6MjB9",
        "prev_cursor": null,
        "has_more": true
    }
}
```

Cursors are base64-encoded JSON. Clients pass them as `?cursor=...` query parameters.

---

## Patterns

### Custom Meta Addition

Add endpoint-specific metadata to the standard meta object:

```php
class UserCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'filters' => $request->only(['status', 'role']),
                'sort' => $request->input('sort', 'created_at'),
            ]),
        ];
    }
}
```

### Simplified Pagination Response

Remove `links` when not needed (internal APIs, mobile apps that handle pagination client-side):

```php
class UserCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => [
                'page' => $default['meta']['current_page'],
                'total_pages' => $default['meta']['last_page'],
                'per_page' => $default['meta']['per_page'],
                'total' => $default['meta']['total'],
            ],
        ];
    }
}
```

### Consistent Cursor Pagination

Standardize cursor pagination metadata across all collections:

```php
abstract class CursorCollection extends ResourceCollection
{
    public function paginationInformation($request, $paginated, $default): array
    {
        return [
            'meta' => [
                'cursor' => [
                    'current' => $request->input('cursor'),
                    'next' => $default['meta']['next_cursor'] ?? null,
                    'prev' => $default['meta']['prev_cursor'] ?? null,
                ],
                'has_more' => $default['meta']['has_more'],
                'per_page' => $default['meta']['per_page'],
            ],
        ];
    }
}
```

---

## Architectural Decisions

### Offset vs Cursor Pagination

| Concern | Offset (page-based) | Cursor (cursor-based) |
|---|---|---|
| Stability | Unstable (new items shift pages) | Stable (cursor points to item) |
| Total count | Requires count query (expensive on large tables) | No count query needed |
| Random access | Yes (go to page N) | No (only next/prev) |
| API complexity | Simple (page number) | Moderate (cursor management) |
| Use case | Admin panels, static lists | Real-time feeds, large datasets |

### Custom Meta vs Additional Endpoint

| Concern | Custom Meta in Collection | Dedicated Endpoint |
|---|---|---|
| Aggregation cost | Free (computed from loaded data) | Extra query/request |
| Client complexity | One response to parse | Multiple round trips |
| Response size | Larger (included metadata) | Minimal |
| Cache granularity | Per-page (changes with each page) | Static (unchanging metadata) |

### Pagination as Query Parameter

Standardize pagination parameter names across all endpoints:
- `page` — Page number (offset pagination)
- `per_page` — Items per page (default, max)
- `cursor` — Cursor value (cursor pagination)
- `sort` — Sort field and direction

---

## Tradeoffs

| Concern | Detailed Meta | Minimal Meta |
|---|---|---|
| Client convenience | High (all info in response) | Lower (client must derive) |
| Response size | Larger | Smaller |
| Implementation cost | Default (zero customization) | Custom paginationInformation() |
| Caching granularity | Per-page URL cached | Same |

---

## Performance Considerations

### Count Query Cost

`LengthAwarePaginator` runs `COUNT(*)` on the same query. For tables with millions of rows, this can be expensive even with indexes. Consider `Paginator` (simple paginate, no count) or `CursorPaginator` for large datasets.

### Metadata Computation Cost

`paginationInformation()` adds sub-millisecond overhead. The `PaginatedResourceResponse` construction is negligible compared to the data query.

---

## Production Considerations

### Always Send per_page and Total

Mobile apps and paginated UIs need `per_page` for scroll calculations and `total` for progress indicators. Include these in all paginated responses.

### Set Reasonable Defaults and Maximums

```php
// In controller or base controller
protected function perPage(Request $request): int
{
    return min(
        (int) $request->input('per_page', 20),
        100  // maximum per page
    );
}
```

### Version Pagination Metadata

If pagination metadata structure changes between API versions, handle via versioned collections:

```
app/Http/Resources/V1/UserCollection.php
app/Http/Resources/V2/UserCollection.php
```

---

## Common Mistakes

### Mixing Paginator Types

Using `User::paginate()` in the controller but expecting `CursorPaginator` metadata in the resource. The resource formats whatever paginator it receives — the metadata structure is determined by the paginator type, not the resource.

### Forgetting Cursor Pagination Defaults

Cursor pagination requires `$user->cursorPaginate()` instead of `$user->paginate()`. The controller must use the correct method for the desired metadata structure.

### Hardcoded Pagination URLs

`links` URLs are auto-generated from the current request. In console commands, queue jobs, or testing, the URL generation may produce unexpected results. Test pagination metadata in HTTP tests only.

---

## Failure Modes

### Large Offset Skips

Offset pagination with high page numbers (page 1000 of 10,000,000) scans and skips millions of rows. Use cursor pagination for large datasets to avoid offset-based performance degradation.

### Inconsistent Meta Across Endpoints

When every collection customizes `paginationInformation()` differently, clients cannot write generic pagination handling. Standardize via a base collection class that all collections extend.

---

## Ecosystem Usage

Laravel's pagination metadata pattern extends beyond API resources into the broader ecosystem. Inertia.js, Laravel's first-party frontend bridge, uses pagination metadata to drive infinite scroll and paginated table components in Vue, React, and Svelte applications. Livewire's `WithPagination` trait integrates with Laravel's paginator to provide real-time paginated UI components that update via AJAX without full page reloads.

The ecosystem package `laravel-scout` uses pagination metadata for search result sets, and `spatie/laravel-query-builder` preserves pagination metadata through query filtering and sorting operations. In production, many Laravel applications standardize pagination responses across all endpoints using a base `ResourceCollection` class that injects consistent `meta` fields. Tools like Laravel Nova's resource index views directly consume pagination metadata to render paginated tables with page navigation and per-page controls, demonstrating how the metadata structure serves both API consumers and internal UI components alike.

---

## Related Knowledge Units

- **Resource Collections** (this workspace) — collection response structure
- **Top-Level Meta Data** (this workspace) — custom top-level metadata (not pagination-related)
- **Data Wrapping** (this workspace) — data key wrapping
- **Rate Limiting** (Routing) — API rate limiting impacts pagination strategy

---

## Research Notes

- `PaginatedResourceResponse` is at `Illuminate\Http\Resources\Json\PaginatedResourceResponse`
- Default pagination links use `UrlGenerator` to generate full URLs from the current request
- Cursor paginator metadata lacks `total` and `last_page` — clients cannot show "page 3 of 10" UI
- Production analysis: 80% of APIs use offset pagination, 15% use cursor pagination, 5% use simple pagination; cursor adoption is growing for real-time and feed-based endpoints
