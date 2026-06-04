| Metadata | |
|---|---|
| KU ID | K012 |
| Subdomain | scout-querying |
| Topic | Scout Paginate |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout's `paginate()` method returns search results as a Laravel `LengthAwarePaginator` instance, providing familiar pagination for search results. Unlike `take()` + `get()`, `paginate()` executes a separate search engine call per page, ensuring accurate total counts and page navigation.

## Core Concepts

- **paginate()**: Returns a `LengthAwarePaginator` with `items`, `total`, `perPage`, `currentPage`.
- **Cursor Pagination**: `simplePaginate()` returns only next/previous cursor for efficient large-set pagination.
- **Separate API Call per Page**: Each page request triggers a new search engine query.
- **Total Count**: `getTotalCount()` on the engine determines total results for page calculation.

## When To Use

- Standard search results pages with page navigation (1, 2, 3, ...)
- API endpoints returning paginated search results
- UI components that need total count and page links
- Any search requiring traditional pagination controls

## When NOT To Use

- Infinite scroll or "load more" patterns (use cursor pagination or `take()` + chunk)
- Real-time search-as-you-type results (limit with `take()` instead)
- Very deep pagination (page >100) — search engines may limit depth
- When total count is unnecessary (use `simplePaginate()` for efficiency)

## Best Practices

1. **Prefer `simplePaginate()` for performance**: Avoids total count query on large indexes.
2. **Limit pagination depth**: Many search engines cap page depth (e.g., Algolia max 1000 results).
3. **Use reasonable page sizes**: 10-25 results per page for typical UI, 50-100 for APIs.
4. **Cache paginated results**: Identical page requests benefit from query caching.
5. **Handle empty total gracefully**: When engine can't compute total, paginate shows only current page.

## Architecture Guidelines

- Use `Product::search($q)->paginate($perPage)` for standard paginated search endpoints.
- For API responses, consider `simplePaginate()` to avoid total count overhead.
- Transform paginator in API resources: `ProductResource::collection($paginator)`.
- Default per-page is typically set in controller or request validation.

## Performance Considerations

- Each page request is a new search engine API call — more pages = more cost.
- `paginate()` calls `getTotalCount()` which may be expensive on some engines.
- `simplePaginate()` avoids total count — significantly faster for large indexes.
- Caching frequently accessed pages (especially page 1) reduces engine load.

## Examples

```php
// Standard pagination
$products = Product::search($request->q)
    ->paginate($request->perPage ?? 15);

// Simple pagination (cursor-based)
$products = Product::search($request->q)
    ->simplePaginate($request->perPage ?? 15);

// In a controller
return view('search.results', [
    'products' => Product::search($request->q)
        ->paginate(20)
        ->appends($request->only('q', 'category')),
]);
```

## Related Topics

- K011 (Scout where clauses)
- K063 (Search query caching)
- K001 (Searchable trait)

## AI Agent Notes

- `paginate()` is familiar Laravel pagination for search results.
- Prefer `simplePaginate()` when total count isn't needed (infinite scroll, APIs).
- For agents: use `paginate()` for standard page navigation, `simplePaginate()` for performance-sensitive endpoints.

## Verification

- [ ] paginate() returns correct total and page counts
- [ ] Pagination depth limitations understood for your engine
- [ ] Caching in place for high-traffic pages
- [ ] simplePaginate() used where total count unnecessary
