# Index-Aware Queries

## Metadata

| Attribute | Value |
|---|---|
| Domain | Laravel Eloquent & Domain Modeling |
| Subdomain | Performance & Data Integrity |
| Knowledge Unit | Index-Aware Queries |
| Classification | Advanced |
| Last Updated | 2026-06-02 |

## Overview

Index-aware query writing structures Eloquent queries so the database can efficiently leverage indexes. An index covering the query's WHERE, ORDER BY, and selected columns allows the database to answer the query entirely from the index without touching table rows. This transforms query optimization from reactive (add an index after it's slow) to proactive.

## Core Concepts

- **B-tree index structure**: Equality lookups (`WHERE id = ?`) are O(log n). Range lookups use the sorted structure but may scan more entries.
- **Composite index column order**: `INDEX(a, b)` efficiently filters by `a` alone, `a AND b`, or `a AND b AND c`. Cannot efficiently filter by `b` alone — the leftmost prefix rule applies.
- **Covering index**: Contains all columns in the query (SELECT, WHERE, ORDER BY, JOIN). The database reads only the index, not table rows.
- **`EXPLAIN`**: The primary tool for verifying index usage. `type: ref` or `type: range` with `Extra: Using index` indicates efficient usage. `type: ALL` indicates a full table scan.
- **Index cardinality**: High cardinality (many unique values) makes the index more selective. Low cardinality columns may not benefit from a standalone index.

## When To Use

- Any query on a table with more than 10k rows — proactively design indexes before performance issues arise
- Query-heavy API endpoints — index the most common filter, sort, and select patterns
- Report generation — design covering indexes for the specific columns queried
- `whereHas()` with correlated subqueries — index the subquery's WHERE columns

## When NOT To Use

- Small tables (< 1k rows) — full table scans are often faster than index lookups
- Write-heavy tables with low read volume — each index slows writes; minimize index count
- Rarely executed queries (monthly reports) — index overhead may not be justified
- Columns with very low cardinality (booleans) — standalone indexes on these rarely help

## Best Practices

- **Design indexes in parallel with query patterns**: Before creating a migration, identify the top 5 query patterns and design indexes for them. An index added reactively after a production incident means users already experienced slow queries. Proactive index design prevents the incident entirely.
- **Order composite index columns by selectivity**: For `INDEX(status, created_at)`, place the most selective (most unique values) column first. Queries filtering by `status` alone use the index; queries filtering by `created_at` alone do not (leftmost prefix rule). If `created_at` is more selective, consider `INDEX(created_at, status)` instead.
- **Use covering indexes for frequent queries**: If a query always selects `id`, `status`, and `created_at`, and filters by `status` with `ORDER BY created_at`, an index on `(status, created_at)` covering those columns avoids table access entirely. Verify with `Extra: Using index` in `EXPLAIN`.
- **Verify index usage with `EXPLAIN`**: Never assume an index is being used. Run `EXPLAIN` on the generated SQL. The query planner may choose a full table scan if the table is small, the index has low selectivity, or query conditions prevent index usage.

## Architecture Guidelines

- Index strategy is part of schema design, not an afterthought
- Prefer fewer, broader composite indexes over many single-column indexes
- For MySQL, composite indexes on polymorphic relationships: `INDEX(morph_id, morph_type)` if queries filter by ID more often than type
- Add CI validation: run `EXPLAIN` on critical queries and assert `type` is not `ALL`

## Performance Considerations

- A covering index can be 10-100x faster than a full table scan — reads only from the index (in memory, likely cached) rather than from disk pages
- Each index slows INSERT/UPDATE/DELETE — a table with 10 indexes updates 11 structures per INSERT
- Range conditions (`>`, `<`, `BETWEEN`) use the index only up to the first range column; subsequent index columns are not used for filtering
- `ORDER BY` with mixed ASC/DESC directions can prevent index usage — MySQL 8+ supports descending indexes

## Security Considerations

- No direct security implications — indexes are a performance structure, not a security control
- `EXPLAIN` output can reveal schema structure — restrict access in production

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Indexing every column individually | Assumption that single-column indexes combine | Combined filters (`WHERE a AND b`) do not use them efficiently | Create composite indexes for combined filter patterns |
| Ignoring ORDER BY index | Only index WHERE columns | Filesort on large datasets | Include ORDER BY column(s) in the index |
| Over-indexing write-heavy tables | Adding indexes reactively | Write throughput degradation | Design indexes; monitor index-to-table size ratio |
| Not verifying with EXPLAIN | Assuming index is used | Unexpected full table scans | Run EXPLAIN on every new query pattern |
| Data type mismatch in WHERE | Using string on integer column | Index usage prevented | Match column data types exactly in queries |

## Anti-Patterns

- **Index-every-column**: Adding a standalone index on every column. Composite queries (`WHERE a AND b`) need a composite index; individual indexes are not combined efficiently by most databases.
- **Reactive-indexing-only**: Never designing indexes upfront, only adding them after production incidents. Proactive index design prevents the incidents entirely.
- **Index-first, query-second**: Creating indexes without understanding the actual query patterns. Indexes designed without query analysis are as likely to be unused as helpful.

## Examples

```php
// Design a composite index for this query pattern
// Migration: $table->index(['status', 'created_at']);
Post::where('status', 'published')
    ->where('created_at', '>', now()->subDays(7))
    ->orderBy('created_at')
    ->get();

// Covering index — only select columns in the index
// Migration: $table->index(['status', 'created_at']);
// No table access needed if query only needs these columns
Post::select('id', 'status', 'created_at')
    ->where('status', 'published')
    ->orderBy('created_at')
    ->get();

// Index the subquery column for whereHas performance
// Ensure comments.user_id is indexed
User::whereHas('comments', fn($q) => $q->where('created_at', '>', $date));
```

## Related Topics

| Relationship | Knowledge Unit |
|---|---|
| Prerequisite | Database index fundamentals (B-tree, composite, covering) |
| Prerequisite | EXPLAIN query plan reading |
| Closely Related | select-constraints |
| Closely Related | subquery-optimization |
| Closely Related | database-constraints |

## AI Agent Notes

- Design composite indexes for combined WHERE + ORDER BY patterns when generating queries
- Add `EXPLAIN` verification assertions when generating critical query code
- Default to composite indexes over single-column indexes for query-heavy features
- Verify index columns match query WHERE clause column types exactly

## Verification

- [ ] Top 5 query patterns have designed indexes (not just individual columns)
- [ ] Composite index columns ordered by selectivity (most selective first)
- [ ] `EXPLAIN` confirms index usage (`type` is `ref`, `range`, or `const` — not `ALL`)
- [ ] Write-heavy tables have a reviewed, minimal index set
- [ ] CI pipeline includes `EXPLAIN` assertions for critical queries
