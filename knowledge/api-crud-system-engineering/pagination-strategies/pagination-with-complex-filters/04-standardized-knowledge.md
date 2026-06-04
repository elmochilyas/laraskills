| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Pagination with Complex Filters |
| **Metadata** | Difficulty | Advanced |
| **Metadata** | Dependencies | Offset Pagination Design, Cursor Pagination Design, Multi-Column Cursor Pagination |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Combining pagination with complex filters (multiple WHERE conditions, search queries, JOINs, and aggregations) creates unique challenges. Filter conditions affect both the pagination cursor/offset and the total count query. Performance degrades when filters are applied to unindexed columns. Cursor pagination becomes more complex because the filter columns must be considered in the cursor's WHERE clause construction. The key insight: filters that change between requests invalidate cursor positions and may produce inconsistent pagination results.

## Core Concepts

- **Filter+Cursor Interaction**: Cursor position is scoped to the current filter set; changing filters invalidates the cursor.
- **Filter-Scoped Sessions**: Each filter combination acts as a unique pagination session with its own cursor position.
- **Composite Index for Filter+Sort**: Include equality filter columns as the leading columns in the composite index, followed by sort columns.
- **Search vs Pagination**: Full-text search with `LIKE '%term%'` is incompatible with index usage; use dedicated search engines or prefix search.
- **Filter Invalidation**: When filters change, the cursor from the previous filter set is meaningless — pagination must reset.

## When To Use

- Any API endpoint that combines search/filter parameters with pagination.
- Data grids with sortable columns and filterable fields.
- APIs with dynamic query parameters (status, category, date range, search term).
- Admin panels with complex filter combinations and paginated result sets.
- E-commerce product listing pages with faceted filters and pagination.

## When NOT To Use

- When filters are applied on the client side after pagination — this defeats the purpose and produces incomplete pages.
- When search is the primary filter and requires full-text relevance scoring — use a dedicated search engine.
- When the number of filter combinations is extremely high and cannot be indexed — consider limiting filter options.
- When filters change on every request and pagination state cannot be maintained — consider stateless pagination with large page sizes.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Apply all filters in the database before pagination | Filtering after pagination produces incomplete pages (fewer results than limit) |
| Index equality filter columns as leading index columns | Equality-first narrows the range scan and enables index range scans |
| Reset pagination when filters change | Cursor/offset from a different filter set is meaningless in the new context |
| Validate filters before executing pagination | Invalid filters should return 400 before any query runs |
| Limit the number of simultaneous filters (e.g., max 5) | Prevents abuse and complex unindexable query combinations |
| Avoid `LIKE '%term%'` in paginated queries | Forces full table scan; use full-text index or prefix search |

## Architecture Guidelines

- Keep filter logic in query scopes or repository methods — pagination should be a separate concern layered on top.
- Use a filter session hash to allow clients to maintain cursor context across requests with the same filters.
- For cursor pagination with filters, the composite index must include filter columns as the leading columns.
- Monitor common filter combinations and guide composite index creation based on actual usage patterns.
- Consider a dedicated search engine (Meilisearch, Algolia, Elasticsearch) for complex search + pagination scenarios.

## Performance Considerations

- The worst-case filter combination (least selective, unindexed columns) must be tested for pagination performance.
- COUNT(*) with complex filters and unindexed columns can take seconds — consider simplePaginate() or approximate counts.
- `LIKE '%term%'` forces a full table scan and cannot be indexed; use `LIKE 'term%'` (prefix match) or full-text indexes.
- Boolean column filters (`WHERE is_published = true`) have low selectivity and rarely justify inclusion in a composite index.
- For high-selectivity filters (e.g., `user_id`), include them as the leading index column for optimal performance.

## Security Considerations

- Always validate filter values server-side before using them in queries — prevents injection and type confusion.
- Filter parameters should be validated against an allowlist of permitted operators and values.
- Changing filters mid-pagination could be used to probe data across different filter contexts — ensure cursor is scoped to filter session.
- If the search term is included in pagination URLs, it may expose search patterns in logs and analytics.
- Prevent clients from applying too many filters simultaneously (DoS vector through complex query generation).

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not indexing filter columns | Indexing only sort columns | Filter on unindexed column forces full table scan | Include equality-filter columns as leading index columns |
| Changing filters mid-pagination | Client applies new filters while holding old cursor | Cursor position is meaningless; results are incorrect or empty | Reset pagination when filters change; use filter session hash |
| Applying filters after pagination | Fetching paginated results then filtering in code | Page is incomplete (fewer results than limit) | Apply all filters in database query before pagination |
| Using LIKE '%term%' in paginated queries | Simple search implementation | Forces full table scan; kills pagination performance | Use full-text index or dedicated search engine |

## Anti-Patterns

- **Applying filters in application code after pagination**: Produces incomplete pages and defeats pagination's purpose.
- **No index on frequently filtered columns**: Every paginated request with that filter does a full table scan.
- **Allowing unlimited filter combinations**: Impossible to index all combinations; performance is unpredictable.
- **Reusing cursors across different filter sessions**: Produces incorrect results without clear error.
- **Using cursor pagination with full-text search relevance sort**: Scores change as data is indexed; cursor positions become invalid.

## Examples

- **Filtered cursor query**: `$query->where('status', $status)->where('category_id', $cat)->orderBy('created_at', 'desc')->cursorPaginate(15)`
- **Composite index for filter+sort**: `CREATE INDEX idx_posts_status_category_created ON posts(status, category_id, created_at DESC, id DESC)`
- **Filter session hash**: `$filterHash = md5(json_encode($request->only(['status', 'category_id'])))` — include in response for client to echo back.
- **Deferred filter validation**: Validate filters with `$request->validate([...])` before any query execution.
- **Prefix search alternative**: Use `WHERE title LIKE 'term%'` instead of `'%term%'` for indexable search.

## Related Topics

- Multi-Column Cursor Pagination — Composite indexes for filter+sort
- Total Count Performance — Count with complex WHERE clauses
- SQL Indexing for Filtering — Index strategies for filtered queries
- Query Filtering and Searching — Filter parameter design
- Full-Text Search Integration — Search + pagination patterns

## AI Agent Notes

- When generating filter+pagination code, always create the composite index migration that includes filter columns.
- Include filter parameters in pagination link generation to preserve context across pages.
- Add validation that rejects requests with both a cursor and changed filter parameters.
- For full-text search endpoints, use offset pagination or a dedicated search engine — not cursor pagination.
- Monitor slow pagination queries with complex filters using DB::listen().

## Verification

- [ ] Composite index includes frequently-used equality filter columns as leading columns
- [ ] Filters are applied in the database query (before pagination), not in application code
- [ ] Cursor is invalidated/ignored when filter parameters change
- [ ] Filter session hash mechanism is implemented for cursor+filter consistency
- [ ] Number of simultaneous filters is limited (max 5)
- [ ] Filter values are validated before query execution (400 for invalid values)
- [ ] Search queries avoid `LIKE '%term%'` — use full-text index or prefix search
- [ ] Pagination links preserve all filter parameters
- [ ] Performance tested with worst-case filter combination
