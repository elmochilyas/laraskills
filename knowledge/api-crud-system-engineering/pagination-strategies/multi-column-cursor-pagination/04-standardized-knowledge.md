| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Multi-Column Cursor Pagination |
| **Metadata** | Difficulty | Advanced |
| **Metadata** | Dependencies | Cursor Pagination Design, Cursor Encoding Strategies, SQL Indexing Fundamentals |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Multi-column cursor pagination extends the basic cursor pattern to sort by two or more columns. This is necessary when the primary sort column is not unique (e.g., `created_at` with multiple records sharing the same timestamp). The cursor encodes all sort columns plus a tiebreaker (typically the primary key). Multi-column cursors require carefully designed composite ORDER BY clauses and corresponding composite indexes to maintain O(1) performance.

## Core Concepts

- **Composite Sort**: `ORDER BY status ASC, created_at DESC, id DESC` — multiple columns define the sort order hierarchically.
- **Tiebreaker Requirement**: Always include the primary key as the final sort column to guarantee deterministic ordering.
- **Nested OR WHERE Clause**: Each additional sort column adds a level of nesting in the WHERE clause: `WHERE col1 > ? OR (col1 = ? AND col2 > ?) OR (col1 = ? AND col2 = ? AND col3 > ?)`.
- **Composite Index Requirement**: The index must match the ORDER BY columns and directions exactly for the query to use an index range scan.
- **Row Constructor Syntax**: PostgreSQL and MySQL 8+ support `(col1, col2, col3) > (val1, val2, val3)` for cleaner multi-column queries.

## When To Use

- When the primary sort column has duplicates (e.g., `created_at` with multiple records per second).
- When sorting by a category/status/type column followed by a timestamp.
- When clients need to sort by multiple dimensions (e.g., `status ASC, created_at DESC`).
- Any cursor-paginated endpoint where single-column sort would produce non-deterministic results.
- Data grids and admin interfaces with sortable columns.

## When NOT To Use

- When a single unique column (e.g., primary key) is sufficient for the sort order.
- When the composite index would have 5+ columns — complexity becomes unmanageable and index bloat excessive.
- When the sort columns change dynamically based on user preference — the index can only match one predetermined column order.
- When NULL handling in sort columns is ambiguous or inconsistent across database systems.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Always include the primary key as tiebreaker | Even if the primary sort column seems unique, tiebreaker guarantees determinism |
| Place equality-filter columns before range/sort columns in the index | Equality first narrows the range, then range scan operates on a smaller set |
| Keep cursors to 3-4 columns maximum | More columns bloat cursors, complicate WHERE chains, and increase index size |
| Use row constructor syntax when available | Cleaner, more readable, and optimized for composite index range scans |
| Handle NULLs explicitly with NULLS FIRST/LAST | NULL comparison behavior varies by database (NULLS FIRST in MySQL, NULLS LAST in PG) |
| Verify composite index usage with EXPLAIN | Without index range scan, multi-column cursor queries perform full table scans |

## Architecture Guidelines

- Laravel's `cursorPaginate()` handles multi-column ORDER BY automatically — prefer it over manual WHERE construction.
- For manual implementations, build a reusable `CursorBuilder` class that constructs the nested OR WHERE chain from a column list.
- The composite index leading column should be the most selective equality filter.
- When nullable columns are used in the sort, define explicit NULLS FIRST/LAST in the ORDER BY and handle accordingly in cursor construction.
- Monitor composite index size and query performance; rebuild indexes periodically to prevent bloat.

## Performance Considerations

- A composite index on 3-4 columns for 1M rows adds approximately 60-100MB disk space and 20-40MB buffer pool pressure.
- Each additional index column slows INSERT/UPDATE/DELETE due to index maintenance.
- B-tree depth increases slightly with more composite key bytes, but impact is negligible.
- Row constructor syntax is optimized for composite index range scans in PostgreSQL and MySQL 8.0.28+.
- Verify the execution plan shows Index Range Scan, not Seq Scan or Index Scan with filter.

## Security Considerations

- Multi-column cursors encode multiple sort column values; ensure none of the exposed columns contain sensitive data.
- The nested OR chain in the WHERE clause is complex; test thoroughly to ensure no SQL injection points.
- Cursor manipulation by clients increases with more columns — consider signing/encrypting multi-column cursors.
- Column type collisions (string vs datetime) in cursor comparisons can produce incorrect results; validate types.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Omitting the tiebreaker column | Primary sort column has high cardinality (UUID) | Even with UUIDs, collisions are theoretically possible; boundary is non-deterministic | Always include PK as final sort column |
| Incorrect OR chain construction | Wrong operator direction in nested conditions | Query returns wrong results — missing records or wrong page | Use row constructor syntax or Laravel's cursorPaginate() |
| Forgetting NULL handling | Not considering NULL values in sort columns | Records with NULLs sort to unexpected positions | Define NULLS FIRST/LAST explicitly |
| Index column order doesn't match ORDER BY | Creating index without checking query order | Database cannot use composite index for range scan | Ensure index column order and sort direction match query exactly |

## Anti-Patterns

- **5+ columns in cursor**: Creates exponential OR chain complexity, large cursors, and bloated indexes.
- **Dynamic client-specified sort**: Impossible to create indexes for all combinations; results in full table scans.
- **Ignoring NULL handling**: Nullable sort columns produce different results across databases.
- **Manual WHERE construction without testing**: The nested OR chain is error-prone; always test with edge cases.
- **Using multi-column cursor without composite index**: Guarantees full table scan on every paginated request.

## Examples

- **Laravel multi-column cursor**: `Post::orderBy('status', 'asc')->orderBy('created_at', 'desc')->orderBy('id', 'desc')->cursorPaginate(15)`
- **Composite index**: `CREATE INDEX idx_posts_status_created_id ON posts(status ASC, created_at DESC, id DESC)`
- **Nested OR WHERE clause**: `WHERE status > ? OR (status = ? AND created_at < ?) OR (status = ? AND created_at = ? AND id < ?)`
- **Row constructor syntax**: `WHERE (status, created_at, id) > ('published', '2026-06-01', 100)`
- **CursorBuilder pattern**: Build nested OR chain generically from an array of [column, direction] pairs.

## Related Topics

- Cursor Pagination Design — Basic cursor mechanics
- Cursor Encoding Strategies — Encoding composite cursor values
- Keyset Pagination Design — SQL-only equivalent of multi-column cursors
- Pagination with Complex Filters — Combining filters with multi-column sort
- Composite Index Design — Optimizing indexes for multi-column sort

## AI Agent Notes

- When generating multi-column cursor code, always start with Laravel's `cursorPaginate()` before considering manual implementation.
- If manual implementation is required, create a generic CursorBuilder that accepts column definitions as input.
- Ensure the migration for the composite index is included in the same changeset as the cursor pagination code.
- For nullable sort columns, specify NULLS FIRST/LAST and document the behavior.
- Verify with EXPLAIN ANALYZE that the composite index is being used for an Index Range Scan.

## Verification

- [ ] Composite index created matching ORDER BY columns and directions
- [ ] EXPLAIN shows Index Range Scan (not Seq Scan) for multi-column cursor queries
- [ ] Tiebreaker column (PK) is always the final ORDER BY column
- [ ] NULL handling is explicit (NULLS FIRST/LAST) for nullable sort columns
- [ ] Cursor contains 4 or fewer columns
- [ ] Row constructor syntax used where database supports it
- [ ] Manual OR chain construction (if used) is tested with edge cases
- [ ] Index size is monitored for excessive bloat from too many columns
