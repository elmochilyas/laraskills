# Pagination Skills

## Skill: Return paginated resource responses with metadata for listing endpoints

### Purpose
Use Laravel paginators (`paginate`, `cursorPaginate`, `simplePaginate`) with API Resources to produce structured JSON responses containing data items, pagination links, and metadata.

### When To Use
- Any API listing endpoint that returns multiple resources
- Length-aware pagination when clients need total count and page navigation
- Cursor pagination for large datasets (>100k rows) where count queries are expensive
- Custom pagination metadata when default structure doesn't match API spec
- Infinite scroll UIs where only next/prev navigation is needed

### When NOT To Use
- For endpoints that always return small, bounded datasets (lookups, dropdowns)
- Using `paginate()` on tables with millions of rows where count query is expensive
- Using `cursorPaginate()` when clients need page-number-based navigation or total counts
- For internal batch processing — use chunking or cursors instead

### Prerequisites
- Defined API Resource class
- Eloquent query builder or model

### Inputs
- Query builder with optional filters, ordering
- Request parameters: `per_page`, `page`/`cursor`

### Workflow
1. Determine dataset size to choose strategy: `paginate()` for <100k rows needing totals; `cursorPaginate()` for large datasets; `simplePaginate()` for medium datasets without totals
2. Read `per_page` from request: `min((int)$request->per_page ?: 15, 100)`
3. Add stable ordering: `->orderBy('id')` for `paginate()`
4. Pass paginator to `Resource::collection()`
5. For custom metadata, create a `ResourceCollection` subclass overriding `paginationInformation()`
6. Test both empty and populated paginated responses

### Validation Checklist
- [ ] Pagination strategy is chosen based on dataset size (cursor for >100k rows)
- [ ] `per_page` parameter is capped (e.g., `min($request->per_page, 100)`)
- [ ] Order-by column is stable (unique, indexed) for cursor pagination
- [ ] Paginated response structure is documented and tested
- [ ] Empty paginated response returns correct structure (`data: []`, `meta` with zeros)
- [ ] Count query performance is monitored for length-aware pagination
- [ ] Cursor parameter validation prevents injection of malformed cursor values

### Common Failures
- Using `paginate()` on a query that always returns small results — count query overhead is unnecessary
- Returning `Resource::collection(collect([...]))` instead of a paginator — loses pagination metadata
- Expecting cursor pagination to return `last_page` — cursor pagination has no total count
- Forgetting to pass `per_page` from request to paginator
- Inconsistent ordering — pagination without stable orderBy produces inconsistent pages

### Decision Points
- **paginate vs cursorPaginate vs simplePaginate?** — Use `paginate()` for moderate datasets needing totals; `cursorPaginate()` for large datasets; `simplePaginate()` for medium datasets without totals
- **Custom collection or anonymous?** — Use `Resource::collection()` for default metadata; create named `ResourceCollection` for custom metadata

### Performance Considerations
- `paginate()` performs a `COUNT(*)` on every request — expensive on large tables
- `cursorPaginate()` avoids count query using WHERE on cursor column
- Each page serializes a subset — resource overhead scales with page size, not total rows
- Cursor pagination works best with indexed, unique, ordered columns (typically `id`)
- `simplePaginate()` avoids count query but uses LIMIT/OFFSET — offset drift on large datasets

### Security Considerations
- Cap `per_page` to prevent abuse (e.g., `per_page=100000` causes memory exhaustion)
- Validate cursor parameters to prevent injection of malformed cursor values
- Paginated responses may reveal total counts used for data enumeration — consider cursor pagination when this is a concern
- Ensure pagination metadata does not leak sensitive info through URL query parameters

### Related Rules
- [Pagination-Cap-Per-Page](../pagination/05-rules.md)
- [Pagination-Cursor-For-Large-Tables](../pagination/05-rules.md)
- [Pagination-Stable-OrderBy](../pagination/05-rules.md)
- [Pagination-Cursor-For-Append-Heavy-Feeds](../pagination/05-rules.md)
- [Pagination-Pass-PerPage-From-Request](../pagination/05-rules.md)
- [Pagination-Test-Empty-And-Populated](../pagination/05-rules.md)
- [Pagination-No-Paginate-For-Small-Results](../pagination/05-rules.md)
- [Pagination-Validate-Cursor](../pagination/05-rules.md)
- [Pagination-Override-PaginationInformation](../pagination/05-rules.md)
- [Pagination-Choose-Strategy-Per-Endpoint](../pagination/05-rules.md)

### Related Skills
- Transform Eloquent models into structured JSON responses using API Resources
- Create custom collection classes with metadata

### Success Criteria
- Paginated response includes `data`, `links`, and `meta` keys with correct structure
- `per_page` is capped at maximum value
- Ordering is stable across pages
- Empty results return valid structure with empty data array and zeroed meta
- Cursor pagination produces correct next/prev cursors
- Cursor parameters are validated before use
