| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Total Count Performance |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Offset Pagination Design, SQL Query Execution |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

The `COUNT(*)` query required for offset pagination's `total` metadata is often slower than the data query itself, especially on large tables with complex WHERE clauses. For tables with millions of rows, an exact count can take seconds, doubling (or more) the pagination response time. Mitigation strategies include approximate counts, cached counts, indexed counts, and eliminating the count requirement entirely by switching to cursor pagination.

## Core Concepts

- **COUNT(*) Mechanics Vary by Database**: MySQL InnoDB — no cached count, must scan index; PostgreSQL — MVCC visibility check on every row; SQLite — approximate count in table header; MyISAM — exact row count cached (deprecated).
- **Exact vs Approximate**: Exact count is accurate but potentially slow; approximate is fast but may be off; no count is fastest but clients lack total/page metadata.
- **Covering Index for Count**: A composite index covering the WHERE clause columns enables index-only count scans, significantly improving performance.
- **simplePaginate()**: Laravel's method that skips COUNT(*) entirely, returning only next/prev links.
- **cursorPaginate()**: Eliminates the count requirement entirely — no COUNT(*) query at all.

## When To Use

- **Exact COUNT(*)**: Tables under 100K rows, admin panels requiring accurate totals.
- **Approximate count**: Tables 100K-10M, user-facing lists where approximate accuracy is acceptable.
- **Cached count**: Tables with moderate write rates, where stale-up-to-5-minutes is acceptable.
- **simplePaginate()**: Infinite scroll, "load more" patterns, any UI that doesn't need total/page count.
- **Materialized count table**: High-read, moderate-write tables needing fast exact-like counts.
- **cursorPaginate()**: New endpoints where total is not a UX requirement.

## When NOT To Use

- Exact COUNT(*) on tables larger than 100K rows without a covering index — will be slow.
- Approximate count when clients need exact totals for financial reporting or auditing.
- Cached count for write-heavy tables where count changes every second — staleness is too high.
- simplePaginate() when the UI requires "Page 3 of 247" display or a page selector.
- Materialized count when the write overhead of maintaining the counter table exceeds the read benefit.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Benchmark COUNT(*) separately from the data query | The count query can be 10x slower than the data query on large tables |
| Create covering indexes for common count queries | Index-only count scans are dramatically faster than table scans |
| Use simplePaginate() or cursorPaginate() when total is not required | Eliminates the count query entirely, halving response time |
| Cache the total count with a short TTL | Reduces COUNT(*) frequency to once per TTL window instead of every request |
| Monitor COUNT(*) duration and alert on >500ms | Early detection of count performance degradation |
| Document that total may be approximate or cached | Clients should not rely on exact totals for critical workflows |

## Architecture Guidelines

- Default to `paginate()` for admin panels (need exact totals), `cursorPaginate()` for public endpoints (no totals needed).
- For tables > 100K rows, implement a count optimization strategy: covering index, cached count, or approximate count.
- Use `simplePaginate()` as a middle ground when next/prev navigation is sufficient but cursor pagination is not desired.
- For complex filtered counts, consider caching the count per filter combination with appropriate keys.
- Create a dedicated small secondary index (e.g., on a boolean column) for COUNT(*) without WHERE.

## Performance Considerations

- COUNT(*) without WHERE on a 10K table: <1ms; on 10M table: 100ms.
- COUNT(*) with WHERE (indexed) on 10K: 1ms; on 10M: 500ms.
- COUNT(*) with WHERE (no index) on 10K: 10ms; on 10M: 15s+.
- In MySQL InnoDB, COUNT(*) without WHERE uses the smallest secondary index (fastest).
- In PostgreSQL, COUNT(*) with WHERE must check MVCC visibility for every matching row.
- The count query duration scales with the number of matching rows, not the table size.

## Security Considerations

- The `total` count can leak business information (number of users, orders, revenue records).
- Cached or approximate counts may not reflect deleted records, potentially exposing deleted data counts.
- Rate limit COUNT(*) queries indirectly by limiting page request frequency.
- Ensure that count queries respect the same authorization scope as data queries.
- Monitor for unusual COUNT(*) frequency that may indicate data scraping.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Running COUNT(*) on every paginated request | Laravel's paginate() always calls count() internally | Wasted resources on rarely-changing data | Cache the total or use simplePaginate() |
| Assuming COUNT(*) is free | Benchmarking only the data query | Count query may be 10x slower than data query on large tables | Benchmark total response time including count query |
| Using COUNT(*) on frequently-written tables | Count seems necessary for UI pagination | Every insert/delete triggers expensive count on every request | Use approximate count or cursor pagination |
| No covering index for common count queries | Indexing only the data query columns | Count query does full table scan instead of index-only scan | Create covering index for the most common WHERE clauses |

## Anti-Patterns

- **Running COUNT(*) before every paginated response**: For large tables, this dominates response time.
- **Using paginate() instead of simplePaginate() when total isn't shown**: Wastes database resources.
- **No count optimization on tables > 1M rows**: Guarantees slow response times as data grows.
- **Relying on MyISAM's fast COUNT(*)**: MyISAM is deprecated and lacks transaction support.
- **Implementing materialized count without considering write overhead**: Every INSERT/UPDATE/DELETE must update the counter.

## Examples

- **Approximate count (PostgreSQL)**: `SELECT reltuples FROM pg_class WHERE relname = 'users'`
- **Approximate count (MySQL)**: `SELECT table_rows FROM information_schema.tables WHERE table_schema = 'db' AND table_name = 'users'`
- **Cached total**: `Cache::remember('users_total', 300, fn() => User::count())`
- **Covering index for count**: `CREATE INDEX idx_users_status_covering ON users(status, id)` — enables index-only count scan.
- **simplePaginate()**: `User::where('status', 'active')->simplePaginate(15)` — no COUNT(*) executed.
- **Materialized count table**: Schema with `resource_type` and `count` columns, updated after relevant mutations.

## Related Topics

- Offset Pagination Design — Where total count is used
- Pagination Strategy Selection — When to include/exclude total count
- Cursor Pagination Design — Eliminating the count requirement
- Database Index Optimization — Covering indexes for counts
- Materialized Views — Pre-computed counts for complex queries

## AI Agent Notes

- For new public endpoints, default to cursorPaginate() which eliminates the count requirement entirely.
- For existing offset-paginated endpoints with large tables, implement cached counts before switching strategies.
- Always benchmark the COUNT(*) query separately during performance testing.
- Use simplePaginate() for "load more" patterns where total count is not displayed.
- Document the count strategy (exact, approximate, cached) in the API reference.

## Verification

- [ ] COUNT(*) query duration is benchmarked with production-scale data
- [ ] Covering index exists for common count query WHERE clauses
- [ ] Cached or approximate count strategy is implemented for tables > 100K rows
- [ ] simplePaginate() or cursorPaginate() is used where total count is not required
- [ ] COUNT(*) duration is monitored; alert threshold configured (>500ms)
- [ ] The count strategy (exact/approximate/cached) is documented per endpoint
- [ ] Materialized count table (if used) is kept in sync with data mutations
- [ ] Total count values are labeled as estimates when using approximate/cached strategies
