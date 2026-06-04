# ECC Standardized Knowledge — Pagination Response Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Pagination Response Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Pagination response tests verify that collection endpoints return correctly structured paginated responses — data, meta (current_page, last_page, per_page, total), and links (first, last, prev, next). Tests cover default page size, requested page size with max limits, page parameter boundaries, cursor pagination structure, and empty result sets. The pagination response shape is the most frequently parsed structure by API clients — a broken pagination structure breaks every list view.

## Core Concepts

- **LengthAwarePaginator**: Default `paginate()` — returns data, meta (current_page, from, last_page, per_page, to, total), links (first, last, prev, next).
- **CursorPaginator**: Returns data, meta (path, per_page, next_cursor, prev_cursor, has_more), links.
- **SimplePaginator**: Only next/prev without total/last_page.
- **per_page cap**: Max per_page value configured in paginator (default 100).
- **Key assertions**: `assertJsonStructure` for shape, `assertJsonCount` for per-page item counts.
- **Empty collection**: Returns 200 with `data: []` and pagination meta showing zero total.

## When To Use

- Every collection/index endpoint
- Endpoints using `paginate()`, `cursorPaginate()`, or `simplePaginate()`
- API consumers building pagination UI against the structure

## When NOT To Use

- Single-resource endpoints (show, store, update)
- Non-paginated collection endpoints (returning all records)
- General response shape testing (covered by response-shape-testing)

## Best Practices

- **Seed enough data for multi-page scenarios**: Minimum `per_page + 1` records.
- **Assert pagination shape**: `assertJsonStructure(['data' => ['*' => ['id']], 'meta' => ['current_page', 'last_page', 'per_page', 'total'], 'links' => ['first', 'last', 'prev', 'next']])`.
- **Assert item count per page**: Seed N items, request with per_page=N-1, assert count N-1.
- **Test boundary pages**: Page 1, last page, page beyond last (empty data, same meta structure).
- **Test per_page boundary**: per_page=0 (default), per_page=-1 (default/reject), per_page=max+1 (cap).
- **Test cursor pagination separately**: Assert next_cursor null on last page, non-null otherwise.
- **Test empty collection**: No records — 200 with `data: []` and zero total.

## Architecture Guidelines

- Pagination response shape must be documented in OpenAPI spec.
- Changes to pagination structure are breaking changes for most API clients.
- Test raw paginator output and API Resource wrapped output separately.
- For large tables, consider cursor pagination — total count is expensive.

## Performance Considerations

- Pagination tests require at minimum `per_page + 1` seeded records.
- Use factories with `count(N)` to batch-create records for pagination tests.
- Avoid seeding thousands of records — `per_page + 2` is sufficient.

## Security Considerations

- Never expose raw database row counts beyond the `total` value in meta.
- Ensure pagination doesn't allow scanning of all records via large per_page.

## Common Mistakes

- Not seeding enough data for multi-page scenarios — tests only exercise page 1.
- Asserting `last_page` hardcoded without controlling seed data count.
- Using `SimplePaginator` and asserting `last_page` and `total` (they don't exist).
- Forgetting `per_page` is capped — requesting 1000 returns at most configured max.
- Not testing page=0 or negative page parameters.

## Anti-Patterns

- **No pagination shape tests**: Consumers parse pagination structure; broken structure breaks UIs.
- **Hardcoded page numbers**: Tests that assume specific page values without controlling seed data.

## Examples

- Shape: `$response->assertJsonStructure(['data' => ['*' => ['id', 'title']], 'meta' => ['current_page', 'last_page', 'per_page', 'total'], 'links' => ['first', 'last', 'prev', 'next']])`.
- Count: `$response->assertJsonCount(15, 'data')`.
- Empty: Create no posts, `getJson('/api/posts')` -> assert `data: []`, `meta.total: 0`.

## Related Topics

- **Prerequisites**: Laravel Pagination, Response Shape Testing
- **Closely Related**: Response Status Code Testing, Test Data Factory Design
- **Advanced**: Custom paginator classes, Pagination with sparse fieldsets, Infinite scroll cursor testing patterns

## AI Agent Notes

When testing pagination: seed per_page+1 records for multi-page, assert shape (data/meta/links), assert per-page item count, test boundaries (page 1, last, beyond last, per_page limits), test empty collection, test cursor pagination separately, use factories with count(N) for seeding.

## Verification

Sources: `Illuminate\Pagination\LengthAwarePaginator::toArray()`, `Illuminate\Pagination\CursorPaginator::toArray()`, domain-analysis.md.
