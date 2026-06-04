# Offset Pagination Performance

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Pagination Strategies
- **Knowledge Unit:** Offset Pagination Performance
- **Last Updated:** 2026-06-02

---

## Executive Summary

Offset pagination performance degrades as the offset increases because the database must scan and discard all preceding rows. The deep offset problem, combined with expensive `COUNT(*)` queries, makes offset pagination unsuitable for large datasets beyond a few thousand records. Understanding the database mechanics — index scan costs, sequential scan thresholds, and count query execution plans — is critical for deciding when to use offset pagination and when to migrate to alternatives.

---

## Core Concepts

### Deep Offset Degradation
The cost of `OFFSET N` is O(N) because the database must:
1. Scan the index/table to find the starting point (N rows traversed)
2. Fetch the next `LIMIT` rows
3. Discard the first N rows

Query time increases linearly with offset, not with page number:
- Page 1 (OFFSET 0): ~2ms
- Page 100 (OFFSET 1500): ~15ms
- Page 10000 (OFFSET 150000): ~200ms
- Page 100000 (OFFSET 1500000): ~2s+

### COUNT(*) Cost
```sql
SELECT COUNT(*) FROM users WHERE active = 1;
```
- InnoDB: Requires scanning a secondary index (no row count cache)
- MyISAM: Instant (stores exact row count)
- PostgreSQL: Requires index or sequential scan based on WHERE clause
- Large tables (millions of rows): Can take 1–30+ seconds

### Execution Plan Analysis
```sql
EXPLAIN ANALYZE SELECT * FROM users ORDER BY id LIMIT 15 OFFSET 100000;
-- -> Limit (cost=... rows=15) (actual time=...)
--   -> Index Scan using users_pkey (cost=... rows=100015)
--      The index scan still traverses 100015 rows
```

---

## Mental Models

### The Toll Booth Model
Offset pagination is like a highway with toll booths every mile. To reach mile 100, you must wait at 100 toll booths, even though you only want the cars at mile 100. Each booth (row) adds time even though you're discarding it.

### The Library Shelf Model
To get books 101–115 from a shelf of sorted books, you start at book 1 and count through 100 books before you reach the ones you want. The counting gets slower as you go deeper, even though you skip each book.

### The Skip-and-Discard Model
SQL's `OFFSET` is an anti-pattern for large datasets because it forces the engine to do work (find+traverse rows) only to throw it away. The query planner cannot optimize away the skipped rows.

---

## Internal Mechanics

### B-Tree Index Traversal with OFFSET
```sql
SELECT * FROM users ORDER BY id LIMIT 15 OFFSET 10000;
```
The database walks the B-tree leaf nodes sequentially starting from the first entry, counting 10000 entries before beginning to return rows. Even with a covering index, this requires reading ~10000 index entries.

### Full Table Scan Trigger
```sql
SELECT * FROM users ORDER BY name LIMIT 15 OFFSET 10000;
```
If `name` has no index, or the query planner decides the index scan is too expensive, the database performs a full table scan and sort (filesort in MySQL), making deep offsets catastrophically slow.

### Buffer Pool Effects
Repeated deep offset queries evict hot data from the buffer pool. Pages that would benefit other queries are replaced by the scanned-and-discarded offset rows.

### Laravel/SQL Execution
```php
User::orderBy('created_at')->paginate(15, ['*'], 'page', 10001);
// Executes:
// SELECT COUNT(*) FROM users
// SELECT * FROM users ORDER BY created_at LIMIT 15 OFFSET 150000
```

---

## Patterns

### Maximum Offset Guard
```php
$maxOffset = 10000;
$offset = request('offset', 0);
if ($offset > $maxOffset) {
    abort(400, 'Offset exceeds maximum. Use cursor pagination for deep pages.');
}
```

### Automatic Strategy Switch
```php
$page = request('page', 1);
if ($page > 100) {
    // Switch to cursor-based pagination automatically
    return $this->cursorPaginatedResponse($query, $request);
}
return $this->offsetPaginatedResponse($query, $request);
```

### COUNT(*) Optimization with WHERE
```sql
-- Instead of:
SELECT COUNT(*) FROM users WHERE status = 'active';

-- Use a covering index:
-- CREATE INDEX idx_users_status_id ON users(status, id);
-- The count query can use the index only scan
```

### Cached Total Pattern
```php
$total = Cache::remember('users_total', 300, fn() => User::count());
```

---

## Architectural Decisions

### When to Accept Offset Pagination
- Dataset is small (< 5000 rows)
- Maximum page depth is limited (UI never goes beyond page 100)
- Append-only data with no deep navigation
- Admin panels where total rows are small

### When to Reject Offset Pagination
- Dataset grows unbounded (user activity logs, events)
- Clients access deep pages regularly
- Complex WHERE clauses on unindexed columns
- High write concurrency causing phantom reads

### COUNT(*) Strategy Decision
Use exact count when total is always small (< 100K) or when UI requires exact page numbers. Use approximate count or simplePaginate when total is large or exact page numbers are unnecessary.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Works well for small datasets | O(N) cost for deep offsets | Pages become slower as data grows |
| Exact total count available | COUNT(*) can be slower than the data query | Cache total or use approximations |
| Built-in Laravel support | No query-level optimization for offset skipping | Must implement workarounds manually |
| Predictable for small datasets | Not suitable for real-time/cursor-required scenarios | Need hybrid or migration strategy |

---

## Performance Considerations

### Benchmarking Offset Cost
Test with realistic dataset sizes:
- 100 rows: OFFSET 0 vs OFFSET 100 — negligible difference
- 100K rows: OFFSET 0 vs OFFSET 90000 — 10–100x slowdown
- 10M rows: OFFSET 9990000 — likely timeout

### Index Covering for Offset
```sql
-- Covering index for frequent pagination queries
CREATE INDEX idx_users_status_created ON users(status, created_at, id);
-- The index scan includes all columns needed for WHERE, ORDER BY, and SELECT
-- if selecting only indexed columns, eliminating table lookups
```

### Reducing COUNT(*) Cost
- Use `SHOW TABLE STATUS` (MySQL) for approximate row count
- Use `reltuples` (PostgreSQL) for approximate count
- Maintain a counter table updated via triggers/events
- Cache the total count with a short TTL (60–300 seconds)

### Query Tuning
```sql
-- MySQL: Force index for pagination
SELECT * FROM users FORCE INDEX (idx_users_status_created)
ORDER BY created_at LIMIT 15 OFFSET 10000;
```

---

## Production Considerations

### Monitoring Offset Depth
Track the `offset` value in application logs or metrics. Alert when average offset exceeds a threshold (e.g., 10000) to identify endpoints needing migration.

### Query Timeouts
Set statement timeouts to prevent runaway queries:
```php
DB::statement('SET statement_timeout = 5000'); -- PostgreSQL 5s
DB::statement('SET max_execution_time = 5000'); -- MySQL 5s
```

### Pagination Response Time SLAs
If paginated endpoints must respond within 200ms, offset pagination may not be viable for deep pages. Test and document the maximum offset that meets your SLA.

---

## Common Mistakes

### Assuming Indexes Solve Deep Offset
Why it happens: Indexes speed up lookups, so developers assume they help offset skipping. Why it's harmful: Indexes do not reduce the number of rows the database must traverse and discard. The `OFFSET` clause deliberately prevents the index from being used to skip directly to the target position. Better approach: Use keyset/cursor pagination where the `WHERE` clause targets a specific index position.

### Skipping COUNT(*) Cost Analysis
Why it happens: Developers benchmark only the data query. Why it's harmful: On large tables, `COUNT(*)` can be slower than the data query itself, doubling the response time. Better approach: Benchmark both queries separately; use `simplePaginate()` if the total isn't required.

### Not Using Covering Indexes
Why it happens: Developers index the `ORDER BY` column but not the selected columns. Why it's harmful: The database must perform expensive table lookups (bookmark lookup in MySQL/MariaDB) for each row in the result, after scanning the offset rows. Better approach: Create covering indexes that include all queried columns.

---

## Failure Modes

### Catastrophic Deep Offset
A client script iterates through all pages of a large dataset with an offset of 5M. Each request takes 30+ seconds. The database CPU spikes, connection pool exhausts, and all other API requests time out. Mitigate with maximum offset limits and connection-level timeouts.

### COUNT(*) Table Lock Contention
In MySQL with InnoDB, `SELECT COUNT(*)` with no WHERE clause can still cause contention on the primary key index if the buffer pool cannot accommodate the full range of index pages. Mitigate by using a dedicated small secondary index for counting.

### Unbounded User-Controlled Offset
A malicious user sets `offset=999999999` causing the database to attempt traversal of billions of virtual rows (or integer overflow depending on DB type). Mitigate with explicit offset maximum validation.

---

## Ecosystem Usage

### PostgreSQL
PostgreSQL's `OFFSET` has no special optimizations. The planner generates an index scan that traverses all rows up to the offset. PostgreSQL's MVCC means counts can be expensive due to visibility checks.

### MySQL / MariaDB
InnoDB executes `OFFSET` similarly — index scan and discard. `LIMIT` pushdown optimization can help in some versions but does not skip the offset rows. MariaDB 10.6+ has some group commit optimizations for counts.

### Laravel
No built-in deep-offset protection. Third-party packages like `laravel-query-builder` can add `maxPagination` guards.

---

## Related Knowledge Units

### Prerequisites
- Offset Pagination Design — The API surface enabled by this performance analysis
- SQL Indexing Fundamentals — B-tree traversal, covering indexes

### Related Topics
- Cursor Pagination Performance — Comparative performance characteristics
- Keyset Pagination Design — The performant deep-offset alternative
- Total Count Performance — Dedicated KU for count optimization

### Advanced Follow-up Topics
- Offset-to-Cursor Migration — When performance forces a strategy change
- Query Optimization and Tuning — Index strategies for pagination

---

## Research Notes

### Source Analysis
- Markus Winand's "Use the Index, Luke!" — Extensive analysis of `OFFSET` performance
- PostgreSQL documentation: `LIMIT` and `OFFSET` — Explicit warning about large offsets
- MySQL Performance Blog (Percona): Deep pagination case studies

### Key Insight
The maximum acceptable offset depends on your `ORDER BY` column's cardinality and index structure. An offset of 100000 on a monotonically increasing integer primary key is much faster than offset 100000 on a UUID or composite key, because the B-tree leaf nodes are more compact and cache-friendly for sequential integers.

### Version-Specific Notes
- MySQL 8.0+: No improvement for offset skipping
- PostgreSQL 14+: Some improvements in parallel query plans but offset still O(N)
- MariaDB 10.6+: No special offset optimization
