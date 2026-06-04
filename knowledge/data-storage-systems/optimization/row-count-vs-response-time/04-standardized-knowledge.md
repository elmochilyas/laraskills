# 4-26 Row Count Vs Response Time

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-26 |
| Knowledge Unit Title | Row Count Vs Response Time |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 4.1 EXPLAIN output interpretation | 4.16 Offset pagination deep-page problems | 4.19 Chunk method tradeoffs | 4.27 Profiling tools | 3.10 Covering indexes |
| Last Updated | 2026-06-02 |

## Overview

Query response time does not scale linearly with row count. The relationship is governed by index access patterns, buffer pool hit rates, network latency, and the database's ability to short-circuit. Understanding when response time degrades from O(log N) to O(N) — and why — is the foundation of query performance prediction. A query returning 10 rows in 2ms may take 2 seconds returning 10,000 rows, but a well-indexed aggregation on 10M rows can finish in 50ms.

---

## Core Concepts

- **O(log N) via index**: B-Tree index lookup touches ~4-5 pages per row regardless of table size (for typical cardinalities). Response time stays flat as the table grows.
- **O(N) via full scan**: Sequential scan reads all pages. Response time grows proportionally to table size.
- **Buffer pool effect**: If the working set fits in memory, response time is dominated by CPU and latch contention. If it spills to disk, I/O latency dominates.
- **Network transfer time**: Returning 10,000 rows at 1ms per round trip (depending on row width and network) adds 100ms+ before client processing.
- **Short-circuit optimizations**: LIMIT with correct index, EXISTS, and MIN/MAX on indexed columns can return instantly regardless of total row count.
- ```
- Response Time Factors (100k row table):
- PK lookup (unique):          0.5-2ms     ~ O(1)
- Index range (100 rows):      2-10ms      ~ O(log N + range)
- Covering index (100 rows):   1-5ms       ~ O(log N + range, no heap fetch)
- Full scan (all rows):        100-500ms   ~ O(N)
- Full scan + filesort:        500-2000ms  ~ O(N log N)
- ```


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **LIMIT with correct order/index**: Always ensure the ORDER BY column is indexed in the same direction as the LIMIT query. MySQL can then stop scanning after finding N rows.
- ```php
- // Efficient: index on (created_at DESC) — scans only 20 rows
- $recent = Post::orderByDesc('created_at')->limit(20)->get();
- // Inefficient: no matching index — must scan all rows before sorting
- $sorted = Post::orderByDesc('created_at')->get()->take(20);
- ```
- **Chunked processing awareness**: When using `chunkById`, recognize that each chunk's response time is O(log N + rows_per_chunk). Total time across all chunks is O(rows / chunk_size * (log N + chunk_size)).
- ```php
- // Each chunk query is fast (index scan, small row count)
- // Total time = (N / 1000) * (log N + 1000 retrieval time)
- Post::chunkById(1000, fn($posts) => processPosts($posts));
- ```
- **COUNT optimization**: COUNT(*) on InnoDB without WHERE clause requires a full scan (no metadata counter). For approximate counts, use `EXPLAIN` rows estimate or maintain a counter table.
- ```php
- // Full table scan for large tables — response time grows with row count
- $count = Post::count();
- // Index-only scan if a covering index exists
- $count = Post::whereNotNull('id')->count(); // uses primary key index
- // For real-time dashboards: cached count with periodic refresh
- $count = Cache::remember('post_count', 300, fn() => Post::count());
- ```


## Architecture Guidelines

- | Decision | Rationale | Caveat |
- |----------|-----------|--------|
- | Cursor pagination | Response time per page is constant regardless of total rows | Requires stable sort, composite index |
- | Offset pagination | Simple, works for small datasets | Response time degrades with page depth |
- | Materialized view | Pre-computed aggregation with O(1) read | Stale data, refresh cost |
- | Covering index | Avoids heap fetches, keeps response flat | Wider index, write amplification |


## Performance Considerations

- - **The inflection point**: Response time stays flat until the working set exceeds the buffer pool, then degrades rapidly (the "buffer pool cliff"). Monitor `innodb_buffer_pool_reads` (reads from disk) vs `innodb_buffer_pool_read_requests` (total reads).
- - **Elasticache / buffer pool sizing**: For read-heavy workloads, set `innodb_buffer_pool_size` to 70-80% of available RAM. This keeps the hot set in memory and maintains flat response times.
- - **PgBouncer transaction pooling**: In transaction mode, connections are recycled between transactions. If a query returns many rows, the connection is held longer, reducing throughput.
- - **Response time is not just row count**: A 10-row query with a complex ORDER BY on unindexed columns can be slower than a 10,000-row index range scan.


## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Assuming row count is the only factor**: A query returning 5 rows with a filesort on an unindexed 1M-row column may take 500ms, while an aggregation on the same table takes 50ms. Row count returned ≠ row count examined. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Ignoring the buffer pool cliff**: A query that runs in 10ms on a warm cache on a dev machine may take 2s in production if the data doesn't fit in memory. Always test with production-sized datasets. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Using offset pagination on growing tables**: Offset skips rows by scanning them. As the table grows, page 1000 takes longer because the database scans 10,000+ rows to skip 9990. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- - **Buffer pool overflow**: Daily batch job scans a large table, evicts the hot working set, then all subsequent queries slow down until the hot set is re-cached. Solution: batch throttling, separate buffer pool instance, or `innodb_old_blocks_time`.
- - **Unbounded query without LIMIT**: An admin panel query that returns all rows. Works fine at 1k rows (50ms). At 100k rows (5s). At 1M rows (timeout). Always set default LIMITs on list endpoints.
- - **COUNT(*) on large InnoDB tables**: Without WHERE, InnoDB scans the primary key index. A 500M row table takes 5-20 seconds per COUNT query. Use approximation or counter tables.


## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

