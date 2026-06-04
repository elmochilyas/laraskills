# Anti-Patterns â€” Pagination With Complex Filters
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Pagination Strategies |
| Knowledge Unit | Pagination With Complex Filters |
| Difficulty | Intermediate |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| Filtering After Pagination | High | Medium | Filters applied after paginate(), returning fewer items than per_page |
| Pagination-Unaware Filter Count | Medium | Medium | COUNT(*) includes filtered-out records, total is misleading |
| Cursor Pagination with Unstable Filters | Medium | Low | Cursor pagination where filter criteria change between requests |
| Filter Logic Duplicated Across Methods | Medium | High | Same filter condition repeated for offset and cursor pagination |
| Ignoring Filter Impact on Cursor Index | High | Low | Filter+sort query missing composite index, causing full table scans |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Inconsistent Filter Application Order | Some filters applied before pagination, others after | Unpredictable results, correctness bugs |
| No Filter Pagination Performance Testing | Filter+paginate queries not tested at production scale | Slow queries in production, timeouts |

## Anti-Pattern Details

### AP-PCF-01: Filtering After Pagination
**Description**: Filters applied after paginate() executes, so fewer items than per_page are returned. Pagination metadata is based on unfiltered data.
**Root Cause**: Developer builds query then adds collection-based filters.
**Impact**: Pages return fewer items than expected. Empty pages appear. Infinite scroll stops early.
**Detection**: Code review shows filter() called on paginated collection.
**Solution**: Apply all filters to query builder before calling paginate().

### AP-PCF-02: Pagination-Unaware Filter Count
**Description**: The total count from paginate() doesn't account for complex filter conditions (HAVING, raw expressions).
**Root Cause**: Developer assumes COUNT automatically accounts for all filters.
**Impact**: Inflated total counts. Page selectors show pages with no visible data.
**Detection**: Complex joins or HAVING clauses in paginated queries.
**Solution**: Use simplePaginate() for complex filters. Verify COUNT query includes filter conditions.

### AP-PCF-03: Cursor Pagination with Unstable Filters
**Description**: Cursor pagination on queries where filter criteria change between requests (e.g., time-based windows that shift).
**Root Cause**: Cursor assumes stable ordering; volatile filters break the assumption.
**Impact**: Duplicate records, invalid cursors, inconsistent results.
**Detection**: Bug reports of duplicates. Volatile filter conditions with cursor.
**Solution**: Capture filter criteria in cursor state. Use fixed reference points.

### AP-PCF-04: Filter Logic Duplicated Across Pagination Methods
**Description**: Same filter logic repeated for offset and cursor branches in hybrid endpoints.
**Root Cause**: Separate code paths without extracting common query logic.
**Impact**: Filter inconsistencies between methods. Maintenance burden.
**Detection**: Duplicated WHERE clauses in offset and cursor branches.
**Solution**: Extract filter logic to shared query scope or builder method.

### AP-PCF-05: Ignoring Filter Impact on Cursor Index
**Description**: Cursor pagination with filters missing composite index on filter+sort columns.
**Root Cause**: Performance testing without filters; index needs change when filters added.
**Impact**: Full table scans. Performance degrades with certain filter combinations.
**Detection**: EXPLAIN shows table scan for cursor+filter queries.
**Solution**: Create composite indexes on (filter_column, sort_column, id).
