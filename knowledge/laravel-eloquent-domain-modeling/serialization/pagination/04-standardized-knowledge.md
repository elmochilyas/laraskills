# Pagination — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Knowledge Unit:** Pagination
- **ECC Version:** 1.0

## Overview
Paginated resource responses combine API Resources with Laravel's paginator classes (`LengthAwarePaginator`, `CursorPaginator`) to produce structured JSON responses with data items and pagination metadata. When a paginator is passed to `Resource::collection()`, the framework auto-detects it and includes `links` and `meta` keys alongside the `data` array. The `paginationInformation()` method on resource collections allows customization of this metadata.

## Core Concepts
- `LengthAwarePaginator` — standard paginator with total count, last page, and page numbers; requires counting total rows
- `CursorPaginator` — cursor-based paginator using a "seek" method; no total count, no page numbers; more performant for large datasets
- `Resource::collection($paginator)` — detects paginator type and includes appropriate metadata
- `paginationInformation($request)` — override in `ResourceCollection` to customize `links`/`meta` structure
- `links` key — contains `first`, `last`, `prev`, `next` URLs (length-aware) or only `prev`, `next` (cursor)
- `meta` key — contains `current_page`, `last_page`, `per_page`, `total` (length-aware) or `per_page`, `next_cursor`, `prev_cursor` (cursor)
- `simplePaginate()` — offset-based pagination without total count; uses LIMIT/OFFSET

## When To Use
- Any API listing endpoint that returns multiple resources
- Length-aware pagination when clients need total count and page navigation controls
- Cursor pagination for large datasets (>100k rows) where count queries are expensive
- Custom pagination metadata when the default structure doesn't match your API specification
- Infinite scroll UIs where only next/prev navigation is needed

## When NOT To Use
- Do NOT use pagination for endpoints that always return small, bounded datasets (lookups, dropdowns)
- Do NOT use `LengthAwarePaginator` on tables with millions of rows where the count query is prohibitively expensive
- Do NOT use `CursorPaginator` when clients need page-number-based navigation or total counts
- Do NOT use pagination at all for internal batch processing — use chunking or cursors instead

## Best Practices (WHY)
- Always cap `per_page` with a maximum value (e.g., `min($request->per_page, 100)`) to prevent abuse
- Use cursor pagination for any endpoint where the underlying table exceeds 100k rows
- Set consistent `per_page` defaults across the application with configurable override per endpoint
- Document pagination strategy in API docs — clients need to know whether to use page numbers or cursors
- Test paginated responses for correct `links`, `meta`, `data` structure with both empty and populated results

## Architecture Guidelines
- Choose pagination strategy per-endpoint based on dataset size, not one-size-fits-all
- Use cursor pagination for feeds, activity logs, and other append-heavy datasets
- Use length-aware pagination for admin panels where total counts matter for UX
- Override `paginationInformation()` in a base `ResourceCollection` class for consistent metadata format
- Handle edge cases: page 0, negative page, page out of range, malformed cursor values

## Performance
- `LengthAwarePaginator` performs a `COUNT(*)` on every paginated request — expensive on large tables with complex WHERE clauses
- `CursorPaginator` avoids the count query entirely, using a WHERE clause on the cursor column
- Each paginated page serializes a subset of models — resource overhead scales with page size, not total rows
- Cursor pagination works best with indexed, unique, ordered columns (typically `id`)
- `simplePaginate()` avoids count query but still uses offset-based LIMIT/OFFSET — offset drift on large datasets

## Security
- Cap `per_page` to prevent abuse (e.g., `per_page=100000` causes memory exhaustion)
- Validate cursor parameters to prevent injection of malformed cursor values
- Paginated responses may reveal total counts that could be used for data enumeration — consider cursor pagination when this is a concern
- Ensure pagination metadata does not leak sensitive information through URL query parameters in links

## Common Mistakes
- Using `paginate()` on a query that always returns small results — the count query overhead is unnecessary
- Returning `Resource::collection(collect([...]))` instead of a paginator — loses pagination metadata entirely
- Expecting cursor pagination to return `last_page` — cursor pagination has no total count
- Forgetting to pass `per_page` from request to paginator — all users get the default page size
- Inconsistent ordering — pagination without a stable `orderBy` produces inconsistent pages

## Anti-Patterns
- **Length-aware pagination on huge tables**: using `paginate()` on a 50M-row table, causing count query timeouts
- **No `per_page` cap**: allowing clients to request arbitrarily large pages, causing memory exhaustion
- **Cursor pagination for numbered navigation**: using cursor pagination when the UI requires page-number controls
- **Inconsistent pagination strategy**: mixing length-aware and cursor pagination across endpoints without documentation
- **Pagination without stable ordering**: omitting `orderBy` or ordering by non-unique columns, causing duplicate/skewed results

## Examples
```php
// Length-aware pagination
return UserResource::collection(
    User::with('posts')->paginate(
        perPage: min($request->per_page, 100),
        pageName: 'page'
    )
);

// Cursor pagination for large datasets
return UserResource::collection(
    User::with('posts')->cursorPaginate(
        perPage: min($request->per_page, 100),
        cursorName: 'cursor'
    )
);

// Custom pagination metadata
class UserCollection extends ResourceCollection
{
    protected function paginationInformation(Request $request, Paginator $paginator, array $default): array
    {
        return [
            'links' => $default['links'],
            'meta' => array_merge($default['meta'], [
                'server_time' => now()->toIso8601String(),
            ]),
        ];
    }
}

// Scheduled cleanup of old records
$schedule->command('model:prune')->daily()->withoutOverlapping();
```

## Related Topics
- resource-collection — the container class that implements pagination metadata
- json-resource — the item-level resource used within paginated collections
- resource-wrapping — how the `data` key wrapping interacts with pagination
- cursor-pagination — deep dive into cursor-based pagination performance

## AI Agent Notes
- Pass the paginator directly to `Resource::collection()` — it auto-detects the paginator type
- Always cap `per_page` in the controller: `min($request->per_page, 100)`
- For large tables, prefer `cursorPaginate()` over `paginate()` to avoid expensive count queries
- Cursor pagination requires a stable, unique, ordered column — typically `id`
- Test both empty and populated paginated responses for structure correctness
- `simplePaginate()` uses offset-based pagination without count — good middle ground for medium datasets

## Verification
- [ ] Pagination strategy is chosen based on dataset size (cursor for >100k rows)
- [ ] `per_page` parameter is capped (e.g., `min($request->per_page, 100)`)
- [ ] Order-by column is stable (unique, indexed) for cursor pagination
- [ ] Paginated response structure is documented and tested
- [ ] Empty paginated response returns correct structure (`data: []`, `meta` with zeros)
- [ ] Count query performance is monitored for length-aware pagination
- [ ] Cursor parameter validation prevents injection of malformed cursor values
