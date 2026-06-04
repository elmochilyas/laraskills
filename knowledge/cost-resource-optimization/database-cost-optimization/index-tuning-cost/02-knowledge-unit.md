# KU-02-INDEX-TUNING-COST: Index Tuning Cost

## Metadata
- **ID**: KU-02-INDEX-TUNING-COST
- **Subdomain**: Database Cost Optimization
- **Topic**: Index Tuning Cost
- **Source**: Database Cost Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Database indexes speed up read queries at the cost of write performance and storage space. For Laravel applications, proper indexing can reduce query time from seconds to milliseconds, directly reducing database CPU and enabling smaller instance sizes. However, over-indexing slows writes and consumes storage. The goal is to index for actual query patterns while avoiding unused or duplicate indexes.

## Core Concepts
- **B-Tree index**: Default index type; balances read speed vs write overhead; good for equality and range queries
- **Composite index**: Multi-column index; column order matters (leftmost prefix rule)
- **Covering index**: Index containing all columns a query needs; eliminates table access entirely
- **Index cardinality**: Uniqueness of values in indexed column; high cardinality = more selective = better index
- **Write overhead**: Each index adds INSERT/UPDATE/DELETE overhead (more indexes = slower writes)
- **Storage cost**: Index storage on disk and in memory; larger indexes increase buffer pool usage
- **Index scan vs table scan**: Index scan reads only relevant rows; table scan reads all rows

## Mental Models
- Default: index all foreign keys and WHERE clauses
- Default: add composite indexes for multi-column filters
- Check for unused indexes as first optimization step
- Prefer covering indexes for high-traffic queries

## Internal Mechanics
- Index lookup (B-Tree depth 3): 3-4 disk reads for billion-row table; <1ms cached, 5-10ms from disk
- Full table scan: 100ms-10s for million-row tables (depends on row size and buffer pool)
- Write overhead: Each index adds 10-30% write time per row (5 indexes = 50-150% slower writes)
- Storage overhead: Index storage is typically 20-50% of table size; can exceed 100% for heavily indexed tables
- Buffer pool pressure: Active indexes consume buffer pool memory; only hot indexes should be in memory

## Patterns
- Add indexes on all foreign keys
- Create composite indexes for common queries
- Monitor unused indexes
- Use partial indexes in PostgreSQL
- Prefer covering indexes for hot queries
- Use Laravel migration friendly index naming

## Architectural Decisions
- Add indexes in the same migration that creates the table (or as subsequent migration)
- Use `EXPLAIN` to verify index usage for all production queries
- Set up `pt-query-digest` or similar to identify queries needing indexes
- Review schema changes with index impact analysis (add/remove indexes as part of PR)
- Archive old data to keep active table sizes manageable (smaller tables need fewer indexes)

## Tradeoffs
**When To Use:**
- Index on WHERE columns: Every query's WHERE clause column should be indexed
- Index on JOIN columns: Foreign keys used in JOINs need indexes
- Index on ORDER BY columns: Columns used in ORDER BY benefit from index (avoids filesort)
- Composite indexes: Queries filtering on multiple columns (e.g., `WHERE status = 'active' AND created_at > '2024-01-01'`)
- Partial indexes: PostgreSQL; index only relevant subset of rows (e.g., `WHERE status = 'active'`)
- Index monitoring: Any production database with queries taking >100ms

**When NOT To Use:**
- Index on low-cardinality columns: Boolean or enum columns with few values (index rarely used)
- Index on never-queried columns: Indexes on columns never in WHERE/JOIN/ORDER BY are pure overhead
- Index on write-heavy tables: Tables with high INSERT/UPDATE/DELETE volume (logs, events)
- Over-indexing small tables: Tables < 1000 rows; full table scan is faster than index + table access
- Duplicate indexes: Same column indexed multiple times (check with `pt-duplicate-key-checker`)

## Performance Considerations
- Index lookup (B-Tree depth 3): 3-4 disk reads for billion-row table; <1ms cached, 5-10ms from disk
- Full table scan: 100ms-10s for million-row tables (depends on row size and buffer pool)
- Write overhead: Each index adds 10-30% write time per row (5 indexes = 50-150% slower writes)
- Storage overhead: Index storage is typically 20-50% of table size; can exceed 100% for heavily indexed tables
- Buffer pool pressure: Active indexes consume buffer pool memory; only hot indexes should be in memory

## Production Considerations
- Index logs may reveal query patterns; mask sensitive data in monitoring tools
- Slow queries due to missing indexes can be exploited for DoS (attacker triggers expensive queries)
- Index-only scans can bypass row-level security in some configurations (verify with PostgreSQL RLS)
- Backup/restore time increases with index count (more indexes = slower restore)

## Common Mistakes
- **No indexes on foreign key columns**: Eloquent relationships without FK indexes (Cause: generated migration doesn't add index; Consequence: every JOIN on the column does full table scan; Better: always add `->index()` after `foreignId()` in migrations)
- **Too many composite indexes**: 10+ composite indexes on same table covering different column combinations (Cause: indexing every possible query pattern; Consequence: write overhead kills INSERT/UPDATE performance, storage doubles; Better: index the top 5 most-common query patterns; let the rest use existing indexes or full scan)
- **Indexing low-cardinality columns**: Index on `status` column with 3 values (`active`, `inactive`, `deleted`) (Cause: "columns used in WHERE need indexes" dogma; Consequence: index has 3 distinct values, each bucket contains 33% of rows; optimizer ignores it; Better: only index if combined with high-cardinality column in composite index)

## Failure Modes
- **Index-every-column approach**: Adding index on every column; write performance destroyed
- **No monitoring of index usage**: Creating indexes and never checking if they're used
- **Indexing cascade in migrations**: Running index changes in large production tables without downtime strategy
- **Duplicate indexes**: Primary key + unique constraint + regular index on same column (MySQL creates 3 indexes)

## Ecosystem Usage
- **Before**: `SELECT * FROM posts WHERE status = 'published' AND created_at > '2024-01-01'` (no composite index -> scanning 1M rows)
- **After**: `INDEX idx_status_created (status, created_at)` (index scan -> 100K rows; query time 500ms -> 5ms)
- **Unused index**: `INDEX on status` alone (3 values, optimizer scans 33% of table, prefers full scan)
- **Covering index**: `INDEX idx_published_select (status, created_at) INCLUDE (title, excerpt)` (PostgreSQL covering index, no table access)

## Related Knowledge Units
- Query Optimization Cost (ku-01)
- Data Archival (ku-03)
- Storage Tier Selection (ku-04)

## Research Notes
Derived from Database Cost Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.