# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.26 Correlation between row count and query response time
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

## Executive Summary

Query response time does not scale linearly with row count. The relationship is governed by index access patterns, buffer pool hit rates, network latency, and the database's ability to short-circuit. Understanding when response time degrades from O(log N) to O(N) — and why — is the foundation of query performance prediction. A query returning 10 rows in 2ms may take 2 seconds returning 10,000 rows, but a well-indexed aggregation on 10M rows can finish in 50ms.

---

## Core Concepts

- **O(log N) via index**: B-Tree index lookup touches ~4-5 pages per row regardless of table size (for typical cardinalities). Response time stays flat as the table grows.
- **O(N) via full scan**: Sequential scan reads all pages. Response time grows proportionally to table size.
- **Buffer pool effect**: If the working set fits in memory, response time is dominated by CPU and latch contention. If it spills to disk, I/O latency dominates.
- **Network transfer time**: Returning 10,000 rows at 1ms per round trip (depending on row width and network) adds 100ms+ before client processing.
- **Short-circuit optimizations**: LIMIT with correct index, EXISTS, and MIN/MAX on indexed columns can return instantly regardless of total row count.

```
Response Time Factors (100k row table):
  - PK lookup (unique):          0.5-2ms     ~ O(1)
  - Index range (100 rows):      2-10ms      ~ O(log N + range)
  - Covering index (100 rows):   1-5ms       ~ O(log N + range, no heap fetch)
  - Full scan (all rows):        100-500ms   ~ O(N)
  - Full scan + filesort:        500-2000ms  ~ O(N log N)
```

---

## Mental Models

Think of row count like package delivery. Index lookup is a direct address (apartment 4B) — the building size doesn't matter. Full scan is checking every mailbox in a 100-story building. Response time is the total trip time: finding the data (index depth) + walking to each unit (row retrieval) + carrying packages back (data transfer). The building getting taller (more rows) barely affects the first component but crushes the second.

---

## Internal Mechanics

InnoDB B-Tree depth grows logarithmically: a 3-level B-Tree supports ~100M rows (assuming 16KB pages, ~500 entries per internal node). Querying by primary key on a 100-row table and a 100M-row table both traverse 3-4 index levels, so response time is nearly identical (assuming buffer pool has the relevant pages).

When a query cannot use an index, the storage engine reads all data pages from disk. At 10GB/s sequential read speed (modern NVMe), scanning 1GB takes ~100ms. Scanning 100GB takes ~10 seconds. This is why a missing index on a growing table causes predictable response time cliffs.

```
Table Size  | PK Lookup | Index Range (100 rows) | Full Scan
1M rows     | ~1ms      | ~5ms                   | ~50ms
10M rows    | ~1ms      | ~6ms                   | ~500ms
100M rows   | ~1-2ms    | ~8ms                   | ~5s
```

---

## Patterns

**LIMIT with correct order/index**: Always ensure the ORDER BY column is indexed in the same direction as the LIMIT query. MySQL can then stop scanning after finding N rows.

```php
// Efficient: index on (created_at DESC) — scans only 20 rows
$recent = Post::orderByDesc('created_at')->limit(20)->get();

// Inefficient: no matching index — must scan all rows before sorting
$sorted = Post::orderByDesc('created_at')->get()->take(20);
```

**Chunked processing awareness**: When using `chunkById`, recognize that each chunk's response time is O(log N + rows_per_chunk). Total time across all chunks is O(rows / chunk_size * (log N + chunk_size)).

```php
// Each chunk query is fast (index scan, small row count)
// Total time = (N / 1000) * (log N + 1000 retrieval time)
Post::chunkById(1000, fn($posts) => processPosts($posts));
```

**COUNT optimization**: COUNT(*) on InnoDB without WHERE clause requires a full scan (no metadata counter). For approximate counts, use `EXPLAIN` rows estimate or maintain a counter table.

```php
// Full table scan for large tables — response time grows with row count
$count = Post::count();

// Index-only scan if a covering index exists
$count = Post::whereNotNull('id')->count(); // uses primary key index

// For real-time dashboards: cached count with periodic refresh
$count = Cache::remember('post_count', 300, fn() => Post::count());
```

---

## Architectural Decisions

| Decision | Rationale | Caveat |
|----------|-----------|--------|
| Cursor pagination | Response time per page is constant regardless of total rows | Requires stable sort, composite index |
| Offset pagination | Simple, works for small datasets | Response time degrades with page depth |
| Materialized view | Pre-computed aggregation with O(1) read | Stale data, refresh cost |
| Covering index | Avoids heap fetches, keeps response flat | Wider index, write amplification |

---

## Tradeoffs

| Benefit | Cost |
|---------|------|
| Index-range queries keep response time flat as table grows | Index maintenance overhead on writes |
| LIMIT short-circuits scan | Requires correct index ordering |
| Covering index avoids heap fetches | Index bloat from included columns |
| Pre-aggregated counters are O(1) | Stale data, cache invalidation complexity |

---

## Performance Considerations

- **The inflection point**: Response time stays flat until the working set exceeds the buffer pool, then degrades rapidly (the "buffer pool cliff"). Monitor `innodb_buffer_pool_reads` (reads from disk) vs `innodb_buffer_pool_read_requests` (total reads).
- **Elasticache / buffer pool sizing**: For read-heavy workloads, set `innodb_buffer_pool_size` to 70-80% of available RAM. This keeps the hot set in memory and maintains flat response times.
- **PgBouncer transaction pooling**: In transaction mode, connections are recycled between transactions. If a query returns many rows, the connection is held longer, reducing throughput.
- **Response time is not just row count**: A 10-row query with a complex ORDER BY on unindexed columns can be slower than a 10,000-row index range scan.

---

## Production Considerations

- Set up response time percentile monitoring (p50, p95, p99) per query shape. A p99 spike on a normally flat query indicates the working set exceeded the buffer pool.
- Track `rows_examined` vs `rows_sent` in slow query log. High ratio = scanning many rows to return few = index problem.
- Use `performance_schema` (MySQL) or `pg_stat_statements` (PostgreSQL) to track mean and max response time per normalized query.
- Scale read replicas to keep per-query response time flat as read traffic grows. A single replica handles the same row count workload — the issue is query concurrency, not per-query speed.

---

## Common Mistakes

**Assuming row count is the only factor**: A query returning 5 rows with a filesort on an unindexed 1M-row column may take 500ms, while an aggregation on the same table takes 50ms. Row count returned ≠ row count examined.

**Ignoring the buffer pool cliff**: A query that runs in 10ms on a warm cache on a dev machine may take 2s in production if the data doesn't fit in memory. Always test with production-sized datasets.

**Using offset pagination on growing tables**: Offset skips rows by scanning them. As the table grows, page 1000 takes longer because the database scans 10,000+ rows to skip 9990.

---

## Failure Modes

- **Buffer pool overflow**: Daily batch job scans a large table, evicts the hot working set, then all subsequent queries slow down until the hot set is re-cached. Solution: batch throttling, separate buffer pool instance, or `innodb_old_blocks_time`.
- **Unbounded query without LIMIT**: An admin panel query that returns all rows. Works fine at 1k rows (50ms). At 100k rows (5s). At 1M rows (timeout). Always set default LIMITs on list endpoints.
- **COUNT(*) on large InnoDB tables**: Without WHERE, InnoDB scans the primary key index. A 500M row table takes 5-20 seconds per COUNT query. Use approximation or counter tables.

---

## Ecosystem Usage

Laravel Horizon's monitoring dashboard shows job processing times. Combine with database monitoring (Laravel Pulse, Percona Monitoring and Management, pg_stat_statements) to correlate job processing time with query response time. Telescope provides per-request query timing with row counts.

---

## Related Knowledge Units

4.1 EXPLAIN output interpretation | 4.16 Offset pagination deep-page problems | 4.19 Chunk method tradeoffs | 4.27 Profiling tools | 3.10 Covering indexes

---

## Research Notes

Modern databases (MySQL 8.4+, PostgreSQL 17+) are improving optimizer statistics to better predict row counts, which improves join order and access path selection. The underlying physics — B-Tree depth, buffer pool miss costs, sequential vs random I/O — remain fundamental and will not change with database versions.
