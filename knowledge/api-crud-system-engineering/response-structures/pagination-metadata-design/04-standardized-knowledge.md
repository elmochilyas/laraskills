# pagination-metadata-design

## Metadata
- Domain: API & CRUD System Engineering
- Subdomain: response-structures
- Knowledge Unit: pagination-metadata-design
- Phase: 4-synthesis
- Last Updated: 2026-06-02

## Overview
Pagination metadata design governs the structure of pagination information in API responses. Standard fields (`current_page`, `last_page`, `per_page`, `total`, `from`, `to`) communicate the current position within a result set, enabling UI controls and data awareness. The primary design decision is which paginator type to use, as each provides different metadata with different performance characteristics.

`LengthAwarePaginator` provides full metadata but requires an expensive `COUNT(*)` query. `Paginator` (simple) avoids the count but loses `total` and `last_page`. `CursorPaginator` provides cursor-based navigation with no count query but no total or page numbers.

## Core Concepts
- **Page-Based Fields**: `current_page`, `last_page`, `per_page`, `total`, `from`, `to`.
- **Count Query Cost**: `total` and `last_page` require `SELECT COUNT(*)` — expensive on large tables.
- **Window Information**: `from` and `to` indicate which records are in the current page.
- **Path Field**: Base URL for constructing page links.
- **Metadata Location**: Typically in `meta` object within the envelope.
- **`LengthAwarePaginator`**: Full metadata, requires count query.
- **`Paginator` (Simple)**: No `total` or `last_page`, no count query.
- **`CursorPaginator`**: Cursor-based, `has_more` instead of totals, no count query.

## When To Use
- **Page-based (LengthAwarePaginator)**: Admin panels, search results, any UI needing page numbers and total counts.
- **Simple paginator**: When total count is not needed and datasets are manageable.
- **Cursor pagination**: Large datasets, infinite scroll UIs, feeds, any scenario where page numbers aren't needed.

## When NOT To Use
- Never use `LengthAwarePaginator` on tables with millions of rows — the count query dominates response time.
- Avoid page-based pagination when the dataset churns frequently — inserts/deletions shift page boundaries.
- Don't use cursor pagination for admin UIs that need direct page-number navigation.
- Don't expose raw paginator output as the API response — customize field names and structure.

## Best Practices (WHY)
- **Match paginator type to use case**: `LengthAwarePaginator` for numbered pages, `CursorPaginator` for infinite scroll. Don't default to the most expensive option.
- **Standardize field names across endpoints**: Clients should parse the same field names from every paginated response.
- **Document the presence/absence of `total`**: Clients need to know whether `total` is available for UI planning.
- **Set maximum `per_page`**: Prevent clients from requesting page sizes that load massive result sets into memory.
- **Include metadata in `meta` object**: Keeps the envelope structure consistent — `data` for resources, `meta` for pagination.

## Architecture Guidelines
- Use `paginationInformation()` to customize field names if the default keys don't match the API's naming convention.
- For very large tables (>1M rows), prefer cursor pagination or omit `total` to skip the count query.
- `from` and `to` fields are cheap to compute but add bytes — consider omitting for machine-to-machine APIs.
- Cap `page` parameter to `last_page` to prevent extreme database load from out-of-range page numbers.
- When filters change between pages, `total` fluctuates — document this behavior for clients.

## Performance
- `COUNT(*)` on large InnoDB tables requires a full index scan — the dominant cost in paginated responses.
- Cursor pagination has constant query cost regardless of position — no deep-page slowdown.
- `from`/`to` are derived from the page's sliced collection — no separate query cost.
- Pagination metadata is typically <200 bytes — transport cost is negligible compared to compute cost.

## Security
- `total` exposes the size of the filtered dataset — may be sensitive for some queries.
- Unbounded `per_page` can be used for denial-of-service — always enforce a maximum.
- Page numbers can be used to enumerate resources — ensure authorization filters apply before pagination.
- Cursor values should be opaque — never expose raw database IDs as cursors.

## Common Mistakes
| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Always using `LengthAwarePaginator` | Count query on every endpoint regardless of size | Default habit | Slow responses on large tables | Use SimplePaginator or CursorPaginator when total isn't needed |
| Inconsistent meta structure | Pagination fields in different locations per endpoint | No standardized response shape | Clients must know endpoint-specific parsing | Standardize `meta` object location |
| Exposing raw paginator output | Returning `$paginator->toArray()` directly | Convenience | Internal field names leak to API contract | Customize via `paginationInformation()` |
| Forgetting `path` field | Omitting the base URL for page links | Overlooking navigation construction | Clients cannot build page URLs | Always include `path` |
| No per_page cap | Clients can request `per_page=100000` | Missing validation | Massive memory and performance impact | Set and enforce a maximum per_page |

## Anti-Patterns
- **No Pagination Metadata**: Returning paginated data without any metadata — clients can't navigate.
- **Total on Every Request**: Computing `total` even when clients don't need it.
- **Inconsistent Pagination Types**: Some endpoints use offset, others use cursor — clients handle both.
- **Exposing Paginator Internals**: Returning Laravel's internal paginator keys without transformation.
- **Page Number Without Total**: Clients can navigate by page number but cannot determine the last page.

## Examples
```php
// LengthAwarePaginator — full metadata
$users = User::paginate(perPage: 15, page: $request->input('page', 1));
return UserResource::collection($users);
// meta: { current_page: 1, last_page: 10, per_page: 15, total: 150, from: 1, to: 15 }

// SimplePaginator — no total
$users = User::simplePaginate(15);
return UserResource::collection($users);
// meta: { current_page: 1, per_page: 15, from: 1, to: 15, has_more: true }

// CursorPaginator — cursor-based
$users = User::cursorPaginate(15);
return UserResource::collection($users);
// meta: { per_page: 15, has_more: true, next_cursor: "eyJpZCI6MTZ9", prev_cursor: null }
```

## Related Topics
- **Prerequisites**: envelope-response-design
- **Related**: cursor-pagination-metadata, pagination-information-customization
- **Advanced**: top-level-meta-and-links

## AI Agent Notes
- Default to `LengthAwarePaginator` for admin/search UIs, `CursorPaginator` for infinite scroll.
- Always enforce a maximum `per_page` — use `min(50, $request->integer('per_page', 15))`.
- Never expose raw paginator output — always use `Resource::collection($paginator)`.
- For collection endpoints with filters, check if `total` is actually needed by clients.
- Use `paginationInformation()` to rename fields if the API uses camelCase instead of snake_case.

## Verification
- Paginated responses include `meta` with pagination fields and `links` with navigation URLs.
- `total` is present only when `LengthAwarePaginator` is used.
- `per_page` is capped at the configured maximum.
- `page` parameter is capped to `last_page` to prevent out-of-range queries.
- Integration tests verify pagination metadata shape and navigation links correctness.
