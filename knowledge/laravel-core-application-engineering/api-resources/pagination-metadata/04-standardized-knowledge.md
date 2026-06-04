# Pagination Metadata

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Pagination Metadata
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Pagination metadata in Laravel API Resources provides clients with navigation information: current page, total pages, per-page count, and navigation links. When a `ResourceCollection` receives a paginator, it automatically injects `links` and `meta` keys into the response. This consistent envelope lets any client navigate any list endpoint without endpoint-specific pagination logic.

The engineering value is API-wide pagination standardization. Every collection response has the same `links` and `meta` structure. Clients write one pagination handler that works for all endpoints.

## Core Concepts
- **Default structure:** Paginated responses include `data` (items), `links` (first, last, prev, next URLs), and `meta` (current_page, from, last_page, path, per_page, to, total).
- **Paginator types:** `LengthAwarePaginator` (full metadata, 2 queries), `Paginator` (simple, no total/last_page), `CursorPaginator` (cursor-based, 1 query, no page numbers).
- **`paginationInformation()` hook:** Override in `ResourceCollection` to customize `links` and `meta` shape.
- **`PaginatedResourceResponse`:** Internal class that extracts pagination data and calls `paginationInformation()`.
- **Cursor pagination:** Uses opaque base64-encoded cursors instead of page numbers. Clients pass `?cursor=...`.

## When To Use
- Any list endpoint that may return more than 50 items.
- Public APIs where clients need navigation (page forward/back, go to page N).
- Internal APIs where pagination state must be tracked (admin panels, dashboards).
- When response consistency across all list endpoints is required.

## When NOT To Use
- Sub-resource responses where all items belong to a single parent (e.g., order items).
- Export endpoints that deliver the full dataset.
- Real-time feeds where cursor pagination is more appropriate than offset-based.
- When the client has no pagination UI (internal scripts that process all data).

## Best Practices (WHY)
- **Always include `per_page` and `total` in paginated responses.** Mobile apps need `per_page` for scroll physics and `total` for progress indicators.
- **Set reasonable defaults and maximums for `per_page`.** Use `min($request->input('per_page', 20), 100)` to prevent abuse.
- **Standardize pagination parameter names:** `page` (offset), `per_page` (limit), `cursor` (cursor-based), `sort` (ordering).
- **Use a base collection class to enforce consistent pagination metadata structure** across all endpoints.
- **Version pagination metadata** if the structure changes between API versions (V1/UserCollection vs V2/UserCollection).

## Architecture Guidelines
- Controller decides pagination type and size; collection only formats.
- Offset pagination (`LengthAwarePaginator`) requires a `COUNT(*)` query — expensive on large tables. Prefer `CursorPaginator` for datasets >1M rows.
- Cursor pagination does not support random page access (no "go to page 5"). Use offset pagination when random access is required.
- Pagination metadata is auto-generated based on the current request URL. In console commands or tests, URLs may be unexpected — test via HTTP integration tests.
- Keep `paginationInformation()` customization minimal and consistent. Every collection using a different metadata shape prevents clients from writing generic pagination code.

## Performance
- `LengthAwarePaginator` runs `COUNT(*)` on the same query. For tables with millions of rows, this is expensive even with indexes. Profile and consider `Paginator` or `CursorPaginator`.
- `CursorPaginator` uses WHERE clauses instead of OFFSET — no count query, stable performance at any depth.
- `paginationInformation()` adds sub-millisecond overhead. The cost is negligible compared to the data query.
- Large offset pagination (page 1000 of 10M) scans and skips millions of rows. Always use cursor pagination for deep pagination.

## Security
- Pagination links expose the API base URL structure. Ensure URL generation does not leak internal hostnames or ports.
- `per_page` values should be capped to prevent client-requested oversized responses (DoS vector).
- Cursor values are base64-encoded JSON. They can be decoded by clients — do not put sensitive data in cursor values.
- Rate limiting should apply to paginated endpoints to prevent exhaustive data scraping.

## Common Mistakes

### Mixing Paginator Types (desc)
Expecting cursor metadata from `LengthAwarePaginator` or vice versa.
- **Cause:** The controller uses one paginator type but the client expects metadata from another.
- **Consequence:** Missing keys (`total`, `last_page`, `cursor`) in the response.
- **Better:** Document the paginator type per endpoint and ensure controller matches expected type.

### Hardcoded Pagination URLs in Tests (desc)
Testing pagination `links` values against hardcoded URLs.
- **Cause:** Copying expected link values from a browser request.
- **Consequence:** Tests fail in different environments (localhost vs production URL).
- **Better:** Test pagination structure (keys present) rather than exact URL values, or use `withoutMiddleware` for URL-sensitive tests.

### Inconsistent Meta Across Endpoints (desc)
Every collection customizing `paginationInformation()` differently.
- **Cause:** Decentralized collection design without a base class.
- **Consequence:** Clients cannot write generic pagination handling; each endpoint needs custom parsing.
- **Better:** Define a base `ApiCollection` that standardizes the metadata shape; extend from it.

## Anti-Patterns
- **Page-as-identifier:** Using page numbers as identifiers for resources. Pages shift when new items are added. Use cursors or stable sort orders.
- **Unlimited per_page:** Allowing clients to request `per_page=999999` without a cap. This bypasses pagination entirely and risks memory exhaustion.
- **Metadata as data:** Including business data (lists, counts of filtered items) inside pagination metadata instead of in the `data` or separate top-level keys.

## Examples

### Custom Meta Addition
```php
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class;

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

### Simplified Pagination (Mobile-Optimized)
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

### Base Collection for Consistent Metadata
```php
abstract class BaseCollection extends ResourceCollection
{
    public function toArray($request): array
    {
        return [
            'data' => $this->collection,
            'links' => $this->paginationLinks() ?? [],
            'meta' => $this->paginationMeta() ?? [],
        ];
    }
}
```

## Related Topics
- Resource Collections — collection response structure and envelope
- Top-Level Meta Data — non-pagination metadata via `with()` method
- Data Wrapping — `data` key wrapping in paginated responses
- Rate Limiting (Routing) — API rate limiting impacts pagination strategy

## AI Agent Notes
- **Generate:** Use `php artisan make:resource UserCollection --collection` for collection classes with pagination support.
- **Key constraint:** The paginator type determines metadata structure — match controller to expected client behavior.
- **Validation:** Paginated responses should always include `data`, `links`, and `meta` (for `LengthAwarePaginator`).
- **Common fix:** If `links` or `meta` are missing, check that the controller passes a paginator instance, not a plain Collection.
- **Testing pattern:** `$response->assertJsonStructure(['data', 'links' => [...], 'meta' => [...]])`.

## Verification
- [ ] All list endpoints returning >50 items are paginated.
- [ ] Paginated responses include consistent `links` and `meta` keys.
- [ ] `per_page` is capped (max 100) to prevent oversized responses.
- [ ] Pagination metadata structure is consistent across all endpoints (via base class).
- [ ] Cursor pagination is used for datasets >1M rows or deep page access.
- [ ] No sensitive data in pagination metadata.
