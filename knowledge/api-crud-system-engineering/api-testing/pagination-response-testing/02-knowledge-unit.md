# Pagination Response Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Pagination Response Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Pagination response tests verify that collection endpoints return correctly structured paginated responses — `data`, `meta` (current_page, last_page, per_page, total), and `links` (first, last, prev, next). Tests cover default page size, requested page size (with max limits), page parameter boundaries, cursor pagination structure, and empty result sets. Laravel's `assertJsonStructure` validates pagination shape; `assertJsonCount` validates per-page item counts. Pagination contract consistency is critical — API consumers build their pagination UI against this structure.

---

## Core Concepts
Laravel's paginators (`LengthAwarePaginator`, `CursorPaginator`, `SimplePaginator`) return structured responses. `LengthAwarePaginator` (the default `paginate()`) returns `data`, `meta` (current_page, from, last_page, per_page, to, total), and `links` (first, last, prev, next). `CursorPaginator` (cursor-based) returns `data`, `meta` (path, per_page, next_cursor, prev_cursor, has_more), and `links`. `SimplePaginator` returns only `next`/`prev` without total. Test the specific paginator type your API uses — mixed pagination types between endpoints break client expectations. Assert `total` count, `per_page` matches the `?per_page=` parameter, `current_page` reflects the `?page=` parameter, and `data` has the correct count.

---

## Mental Models
Pagination testing is **measuring the slices of a loaf** — the loaf (full dataset) is sliced into pages, and each slice must have the correct number of pieces, the correct slice number, and the correct "next slice" pointer. The consumer only sees one slice at a time; the slice shape must be consistent.

---

## Internal Mechanics
`Model::paginate($perPage)` returns a `LengthAwarePaginator` instance. The `toArray()` method (called by `response()->json()`) converts it to a structured array with `data`, `links`, and `meta` keys. `CursorPaginator::paginate()` returns cursors (encoded strings) instead of page numbers — useful for infinite scroll. The `per_page` parameter is capped by the `maxPerPage()` configuration in the paginator (default 100). Laravel's `paginate()` reads `?page=` for offset-based and `?cursor=` for cursor-based. The response structure can be customized via API Resource collections.

---

## Patterns
- **Assert pagination shape**: `assertJsonStructure(['data' => ['*' => ['id', 'title']], 'meta' => ['current_page', 'last_page', 'per_page', 'total'], 'links' => ['first', 'last', 'prev', 'next']])`.
- **Assert item count per page**: Seed exactly `N` items, request with `per_page=N-1`, assert `assertJsonCount(N-1, 'data')`.
- **Test boundary pages**: Page 1 (always exists), last page (edge), page beyond last (empty `data`, same meta structure).
- **Test per_page boundary**: Request `per_page=0` (should default), `per_page=-1` (should default or reject), `per_page=max+1` (should cap).
- **Test cursor pagination separately**: Assert `meta.next_cursor` is null on last page, non-null otherwise.
- **Test empty collection**: No records exist — `index` returns 200 with `data: []` and pagination meta showing zero total.

---

## Architectural Decisions
Laravel's default pagination structure (data/links/meta) is the framework convention, but APIs may customize it (e.g., removing `links`, renaming `meta`). The decision to test the default structure or a custom structure should be explicit in the test suite. Testing the raw pagination structure (not wrapped by API Resource) validates the paginator output; testing the wrapped structure validates the resource transformation. Most teams should test both — paginator shape and resource formatting.

---

## Tradeoffs
| Tradeoff | Offset Pagination | Cursor Pagination |
|---|---|---|
| Stable ordering | No (inserts shift pages) | Yes (cursor is position) |
| Total count | Available (expensive on large tables) | Not available |
| Random page access | Yes (page 3, 4, 5) | No (only next/prev) |
| Skip to last page | Yes | No |
| Test complexity | Lower (predictable page numbers) | Higher (cursor encoding) |

---

## Performance Considerations
Pagination tests require seeded data — at minimum `per_page + 1` records to test multi-page scenarios. Use factories with `count(N)` to batch-create records. For cursor pagination tests, the test order doesn't matter since cursors are opaque. Avoid seeding thousands of records for pagination tests — `per_page + 2` is sufficient. Use `RefreshDatabase` to clean up between test runs.

---

## Production Considerations
The pagination response shape must be documented in your OpenAPI spec. Changes to the pagination structure (adding/removing meta fields) are breaking changes for most API clients (they parse `meta.current_page`, `meta.last_page`, etc.). The `total` field in meta can be a performance issue on large tables — consider cursor pagination for high-volume endpoints. Never expose raw database row counts in pagination meta beyond the `total` value.

---

## Common Mistakes
- Not seeding enough data to test multi-page scenarios — tests only exercise page 1.
- Asserting `last_page` matches a hardcoded number without controlling the seed data count.
- Using `SimplePaginator` and asserting `last_page` and `total` — they don't exist in simple pagination.
- Forgetting that `per_page` is capped — requesting `per_page=1000` returns at most the configured maximum.
- Not testing page=0 or negative page parameters — these may return unexpected results.

---

## Failure Modes
- **Wrong total count**: Pagination query has incorrect `where` conditions, returning wrong total.
- **Missing links**: `links.prev` is null on page 1 but some clients try to access it — test the null cases.
- **Inconsistent per_page**: First page returns `per_page=15`, second page returns `per_page=10` (query builder limit leak).
- **Cursor corruption**: An encoded cursor from a different query context returns wrong results or 500.

---

## Ecosystem Usage
Spatie's `laravel-json-api-paginate` provides a custom pagination structure — tests should validate that structure. Laravel Nova's API uses cursor pagination with a custom schema. Livewire's `WithPagination` trait uses offset pagination internally.

---

## Related Knowledge Units
### Prerequisites
- Laravel Pagination (LengthAwarePaginator, CursorPaginator, SimplePaginator)
- response-shape-testing (base shape assertion patterns)

### Related Topics
- response-status-code-testing (index returns 200, not 204)
- test-data-factory-design (seeding paginated data)

### Advanced Follow-up Topics
- Custom paginator classes for API-specific shapes
- Pagination with sparse fieldsets
- Infinite scroll cursor testing patterns

---

## Research Notes
### Source Analysis
`Illuminate\Pagination\LengthAwarePaginator::toArray()` outputs `data`, `links`, `meta`. `Illuminate\Pagination\CursorPaginator::toArray()` outputs `data`, `meta` (path, per_page, next_cursor, prev_cursor, has_more), `links`.
### Key Insight
The pagination response shape is the most frequently parsed structure by API clients — a broken pagination structure breaks every list view in the consuming application.
### Version-Specific Notes
Laravel 11 uses `Illuminate\Pagination\Paginator::queryStringResolver()` for custom query parameter handling. CursorPaginator was introduced in Laravel 8.x. The `toArray()` output structure has remained stable since Laravel 5.5.
