# pagination

## Metadata

- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Serialization
- **Last Updated:** 2026-06-02

## Executive Summary

Paginated resource responses in Laravel combine API Resources with Laravel's paginator classes (`LengthAwarePaginator`, `CursorPaginator`) to produce structured JSON responses with data items and pagination metadata. When a paginator is passed to `Resource::collection()`, the framework automatically detects it and includes `links` and `meta` keys alongside the `data` array. The `paginationInformation()` method on resource collections allows customization of this metadata. Understanding pagination in the context of serialization is critical for building performant, spec-compliant API listing endpoints.

## Core Concepts

- **`LengthAwarePaginator`** — Standard paginator with total count, last page, and page numbers. Requires counting total rows.
- **`CursorPaginator`** — Cursor-based paginator using a "seek" method. No total count, no page numbers. More performant for large datasets.
- **`Resource::collection($paginator)`** — Detects paginator type and includes appropriate metadata.
- **`paginationInformation($request)`** — Override in `ResourceCollection` to customize `links` and `meta` structure.
- **`Paginator` vs `CursorPaginator`** — The base collection detects which type and adds type-specific metadata.
- **`links` key** — Contains `first`, `last`, `prev`, `next` URLs (length-aware) or only `prev`, `next` (cursor).
- **`meta` key** — Contains `current_page`, `last_page`, `per_page`, `total` (length-aware) or `per_page`, `next_cursor`, `prev_cursor` (cursor).
- **`withoutPagination()`** — Custom method to strip pagination metadata from a collection response.
- **Simple pagination** — `paginate()` vs `simplePaginate()` — first counts, second doesn't.

## Mental Models

1. **Auto-detection transport layer** — Passing a paginator to a resource collection is like putting items in a labeled box — the box automatically includes shipping labels (links/meta).
2. **Length-aware vs cursor** — Length-aware is a phone book (knows total pages, can jump to page 5). Cursor is a scroll (only knows next/prev, no total).
3. **Resource collection as envelope** — The paginator is the envelope; items are the letter inside the `data` key; metadata is the postmark.

## Internal Mechanics

```php
// Inside ResourceCollection resolution
public function resolve($request = null): array
{
    $data = $this->collection->map->toArray($request)->values()->all();
    
    if ($this->resource instanceof Paginator) {
        $paginationData = $this->paginationInformation($request);
        
        return array_merge(
            ['data' => $data],
            $paginationData
        );
    }
    
    return ['data' => $data];
}

protected function paginationInformation($request): array
{
    $paginator = $this->resource;
    $paginated = $paginator->toArray();
    
    return [
        'links' => $this->paginationLinks($paginated),
        'meta' => $this->meta($paginated),
    ];
}
```

`resolve()` checks `instanceof Paginator`. If true, it extracts the paginated array from the paginator (`$paginator->toArray()`), builds `links` and `meta`, and merges them with the `data` array. This happens automatically — the developer only needs to return `Resource::collection($paginator)` from the controller.

## Patterns

- **Custom pagination metadata** — Override `paginationInformation()` to add custom keys like `version` or `timestamp`.
- **Cursor pagination for large datasets** — Use `CursorPaginator` for tables with millions of rows where count queries are expensive.
- **Nested resource in pagination** — Each paginated item uses its resource class for transformation — e.g., `PostResource::collection(Post::cursorPaginate(20))`.
- **Preserve default pagination structure** — Override `paginationInformation()` with `parent::paginationInformation()` as base, then merge custom data.
- **API version pagination** — Create separate `ResourceCollection` subclasses per API version with different pagination formats.
- **Simple paginate for infinite scroll** — Use `simplePaginate()` for mobile APIs where total count is unnecessary.

## Architectural Decisions

- Pagination detection is implicit — the collection checks `instanceof Paginator` rather than requiring explicit pagination declaration.
- `LengthAwarePaginator` and `CursorPaginator` produce different metadata shapes, reflecting their different capabilities.
- Pagination metadata is placed at the same level as `data` (not nested inside it), following common API conventions.
- The paginator's `toArray()` method is called internally, meaning custom paginator serialization is respected.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Auto-detection — no manual pagination setup | Implicit behavior can surprise if you accidentally pass a non-paginator collection | Always type-hint paginator in controller returns |
| Length-aware pagination gives total count | Count query on every listing doubles query time for large tables | Switch to cursor pagination for large tables |
| Cursor pagination is O(1) per page | No total count, no page jumping — UX implications for clients | Use for infinite scroll only; length-aware for numbered pagination |
| `paginationInformation()` is overridable | The override signature and expected return structure is framework-defined | Extend rather than replace paginationInformation() |

## Performance Considerations

- `LengthAwarePaginator` performs a `COUNT(*)` query on every paginated request — for tables with millions of rows, this is expensive even with query optimizations.
- `CursorPaginator` avoids the count query entirely, using a WHERE clause on the cursor column.
- Each paginated page serializes a subset of models — collection resource overhead scales with page size, not total rows.
- Cursor pagination works best with indexed, unique, ordered columns (typically `id`).
- `simplePaginate()` avoids count query but still uses offset-based LIMIT/OFFSET — offset drift on large datasets.

## Production Considerations

- Always cap `per_page` with a maximum value (e.g., `min(request('per_page', 15), 100)`) to prevent abuse.
- Use cursor pagination for any endpoint where the underlying table is expected to grow beyond 100k rows.
- Document pagination strategy in API docs — clients need to know whether to use page numbers or cursors.
- Handle edge cases: page 0, negative page, page out of range, cursor malformed.
- Set consistent `per_page` defaults across the application, with configurable override per endpoint.
- Test paginated responses for correct `links`, `meta`, `data` structure.

## Common Mistakes

- Using `paginate()` on a query that will always have a small number of results — the count query overhead is unnecessary.
- Returning `Resource::collection(collect([...]))` instead of `new LengthAwarePaginator([...])` — loses pagination metadata.
- Expecting cursor pagination `last_page` — cursor pagination has no total count, so `last_page` is not returned.
- Modifying the paginator after passing to `Resource::collection()` — paginator resolves immediately, but the item transformation runs later.
- Forgetting to pass `per_page` from request to paginator — all users get default page size.

## Failure Modes

- **Count query timeout** — `LengthAwarePaginator` on a 50M-row table times out the database connection.
- **Offset overflow** — Paginating with large offset (page 100,000+) scans many rows before returning results.
- **Cursor invalidation** — If the cursor column value is deleted between requests, the cursor may point to a non-existent record.
- **Inconsistent ordering** — Pagination without a stable `orderBy` (e.g., ordering by `updated_at` with duplicates) produces inconsistent pages.
- **Request parameter injection** — Malicious `per_page=100000` causes memory exhaustion.

## Ecosystem Usage

- **Laravel API Resources** — Paginated responses via `Resource::collection($paginator)` are the standard pattern.
- **Laravel Nova** — Uses its own pagination system for resource tables, but built on the same paginator classes.
- **spatie/laravel-query-builder** — Integrates with `LengthAwarePaginator` and `CursorPaginator` for filtered/sorted listings.
- **Laravel Forge API** — Uses paginated resource responses for listing servers, sites, etc.
- **JSON:API spec** — Many Laravel JSON:API packages map Laravel pagination to JSON:API `links` and `meta` format.

## Related Knowledge Units

### Prerequisites

- **resource-collection** — The container class that implements pagination metadata.
- **json-resource** — The item-level resource used within paginated collections.

### Related Topics

- **resource-wrapping** — How the `data` key wrapping interacts with pagination.

### Advanced Follow-up Topics

None specific — these topics cover the complete pagination system.

## Research Notes

- `CursorPaginator` was introduced in Laravel 8.x as a first-class pagination strategy.
- The pagination detection in `ResourceCollection` uses `instanceof Paginator` — `SimplePaginator` and `CursorPaginator` both implement this contract.
- `LengthAwarePaginator`'s count query can be optimized with `DB::raw('...')` or database estimates for very large tables.
- Community discussions continue about adding JSON:API-compliant pagination as a first-party option.
