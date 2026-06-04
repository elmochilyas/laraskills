| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Cursor Pagination Performance |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Cursor Pagination Design, SQL Indexing Fundamentals |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Cursor pagination delivers O(1) query performance regardless of dataset position because the database uses index range scans rather than scan-and-discard. A cursor-based query at position 1 and position 1 million both traverse approximately the same number of index pages. The key requirement is a well-designed composite index that matches the ORDER BY columns. When the index is correctly designed, cursor pagination outperforms offset pagination by orders of magnitude for deep pages.

## Core Concepts

- **Index Range Scan**: The database starts at the cursor position in the B-tree index and reads exactly the requested number of rows — no wasted traversal.
- **Index Dependency**: Cursor pagination is only as fast as the supporting index; without a matching composite index, the database performs a full table scan.
- **Covering Index**: An index that includes all selected columns eliminates bookmark lookups (table row fetches), providing the fastest possible execution.
- **LIMIT+1 Cost**: The extra row fetch adds one additional index leaf-page read (~0.01ms), negligible compared to the query overall.
- **Composite Index Column Order**: The leftmost column should be the primary sort column; equality filter columns should come before range/sort columns.

## When To Use

- Any cursor-paginated endpoint with datasets exceeding 10,000 records.
- High-traffic endpoints where consistent sub-10ms response times are required.
- Datasets with deep pagination needs (users regularly browse beyond page 50).
- Read-heavy workloads where the cost of maintaining the composite index is justified.
- Mobile and real-time APIs where response time variance must be minimized.

## When NOT To Use

- When the supporting composite index cannot be created (e.g., legacy database without DDL access).
- For datasets under 5,000 records where offset pagination is already sub-10ms.
- When the ORDER BY clause changes dynamically based on client sort preferences — the index can only match one sort order.
- When write performance is more critical than read performance — each additional index slows INSERT/UPDATE/DELETE.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Verify execution plan shows Index Range Scan | Without index range scan, cursor pagination is slower than offset |
| Match index column order to query column order | Composite indexes only work when the leading column matches the query |
| Use covering indexes for frequently-queried columns | Eliminates table lookups, doubling performance |
| Create index with explicit DESC/ASC direction | Some databases (MySQL) require explicit direction for optimal scans |
| Rebuild indexes periodically | Index bloat from dead tuples slows cursor range scans over time |
| Benchmark with production-scale data | Performance characteristics at 100 rows don't predict behavior at 10M rows |

## Architecture Guidelines

- Design the index before implementing cursor pagination — the index is the single critical success factor.
- For queries with WHERE filters, include the equality filter columns as the leading columns in the composite index.
- Keep composite indexes to 3-4 columns maximum to avoid excessive index size and write overhead.
- Monitor index usage via database statistics (`pg_stat_user_indexes` in PostgreSQL, `index_stats` in MySQL).
- Use dedicated staging environment with production-scale data for pagination performance testing.

## Performance Considerations

- At 1M rows, cursor pagination maintains ~4ms response time at any depth; offset pagination degrades to 2-10s at deep pages.
- A composite index on (created_at, id) for 1M rows adds approximately 40-50MB of disk space.
- Covering indexes increase index size (disk and buffer pool) but eliminate table lookups entirely.
- B-tree depth increases slightly with more composite index columns, but the impact is negligible.
- DESC vs ASC: B-tree indexes are inherently bidirectional, but MySQL may need explicit DESC in index creation.
- Read-ahead and buffer pool benefit cursor pagination because range scans access consecutive index pages.

## Security Considerations

- Performance patterns can leak information — consistent response times at all depths reveal that cursor pagination is used, while variable times reveal offset pagination.
- Index metadata (index names, sizes) should not be exposed in responses or error messages.
- Very fast pagination can enable rapid data scraping; combine with rate limiting.
- Monitoring cursor query timing can help detect denial-of-service attacks that attempt deep-pagination exhaustion.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Using cursor pagination without the correct index | Assuming cursor pagination always performs well | Full table scan + sort, worse performance than offset pagination | Always verify execution plan includes Index Range Scan |
| Creating index in wrong column order | Creating INDEX(created_at, id) but query uses WHERE (id, created_at) | Index unusable for composite WHERE; only leading column used | Ensure WHERE clause column order matches index column order |
| Overlooking covering index benefits | Creating minimal index, accepting table lookups | Each page request requires 15+ random I/O operations for table lookups | Include frequently selected columns in the index |
| Forgetting index maintenance | Never rebuilding indexes | Index bloat degrades cursor scan performance over time | Schedule periodic REINDEX or OPTIMIZE TABLE |

## Anti-Patterns

- **Creating indexes after deployment**: Cursor queries fail without indexes; create indexes before or in the same deployment.
- **Using cursor pagination with arbitrary client-specified sort**: The index can only match one ORDER BY; dynamic sorts break the index guarantee.
- **Adding too many columns to the composite index**: Indexes with 5+ columns bloat to 100MB+ and slow writes significantly.
- **Not testing with production-scale data**: 100-row test datasets never reveal deep-offset performance problems.

## Examples

- **Required composite index**: `CREATE INDEX idx_posts_created_at_id ON posts(created_at DESC, id DESC)`
- **Covering index for cursor pagination**: `CREATE INDEX idx_posts_covering ON posts(created_at DESC, id DESC, title, excerpt)`
- **Execution plan verification**: `EXPLAIN ANALYZE SELECT * FROM posts WHERE (created_at, id) < ('2026-06-01', 15) ORDER BY created_at DESC, id DESC LIMIT 16` — verify Index Scan, not Seq Scan
- **Performance monitoring**: Use `DB::listen()` to log cursor query timing and identify slow queries needing index optimization.

## Related Topics

- Cursor Pagination Design — Understanding cursor mechanics
- Offset Pagination Performance — Comparative baseline
- Keyset Pagination Design — SQL-only equivalent with similar performance
- Multi-Column Cursor Pagination — Composite index design for complex sorts
- Query Plan Analysis — EXPLAIN and execution plan interpretation

## AI Agent Notes

- When generating cursor pagination code, always generate the matching composite index migration as well.
- Verify the EXPLAIN plan shows Index Range Scan before approving cursor pagination code in review.
- For SELECT * queries, covering indexes are less effective; consider selecting only needed columns.
- When sorting by a non-unique column, ensure the composite index includes the tiebreaker (usually PK) as the final column.

## Verification

- [ ] Composite index exists and matches ORDER BY columns and directions exactly
- [ ] EXPLAIN ANALYZE shows Index Range Scan (not Seq Scan) for cursor queries
- [ ] Response time at position 1 and position 1M differs by less than 20%
- [ ] Covering index considered for queries selecting a subset of columns
- [ ] Index maintenance schedule established (REINDEX/OPTIMIZE TABLE)
- [ ] Performance benchmarks conducted with production-scale data
- [ ] Query timeout configured for pagination endpoints (e.g., 5 seconds)
- [ ] Index size monitored and budgeted for disk and buffer pool
