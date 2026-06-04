| Section | Field | Content |
|---|---|---|
| **Metadata** | Domain | API & CRUD System Engineering |
| **Metadata** | Subdomain | Pagination Strategies |
| **Metadata** | Knowledge Unit | Offset Pagination Performance |
| **Metadata** | Difficulty | Intermediate |
| **Metadata** | Dependencies | Offset Pagination Design, SQL Indexing Fundamentals |
| **Metadata** | Last Updated | 2026-06-02 |

## Overview

Offset pagination performance degrades as the offset increases because the database must scan and discard all preceding rows. The deep offset problem, combined with expensive COUNT(*) queries, makes offset pagination unsuitable for large datasets beyond a few thousand records. Understanding the database mechanics — index scan costs, sequential scan thresholds, and count query execution plans — is critical for deciding when to use offset pagination and when to migrate to alternatives.

## Core Concepts

- **Deep Offset Degradation**: `OFFSET N` has O(N) cost — the database must scan, traverse, and discard N rows before returning the LIMIT rows.
- **COUNT(*) Cost**: For large tables, the count query can be slower than the data query, especially with complex WHERE clauses.
- **Buffer Pool Effects**: Repeated deep-offset queries evict hot data from the buffer pool, degrading overall database performance.
- **No Query-Level Optimization**: The query planner cannot optimize away the skipped rows — OFFSET explicitly prevents index-based skipping.
- **Execution Plan**: Even with an index scan, the database traverses all rows up to the offset position — covering indexes help reduce table lookups but don't eliminate the traversal.

## When To Use

- For datasets under 5,000 records where the O(N) cost is negligible.
- When the maximum page depth is limited (UI never goes beyond page 100).
- For admin panels where total rows are small and exact counts are required.
- For append-only data with no deep navigation requirements.
- As a fallback when cursor/keyset pagination is not feasible (e.g., search results sorted by relevance score).

## When NOT To Use

- For datasets that grow unboundedly (user activity logs, events, notifications).
- When clients regularly access deep pages (page 100+).
- For high-traffic endpoints where consistent sub-10ms response times are required.
- When complex WHERE clauses on unindexed columns make even shallow pages slow.
- For real-time data where phantom reads are unacceptable.

## Best Practices (WHY)

| Practice | Rationale |
|---|---|
| Limit maximum offset to 10,000 rows | Prevents catastrophic deep-offset degradation and query timeouts |
| Monitor average offset depth in logs | Early warning for endpoints needing migration to cursor pagination |
| Use covering indexes for queried columns | Reduces table lookup overhead but does not fix the O(N) traversal |
| Set statement timeouts on pagination queries | Prevents runaway queries from exhausting database resources |
| Benchmark COUNT(*) separately from data query | The count query can be 10x slower than the data query on large tables |
| Use simplePaginate() when total is unnecessary | Eliminates the COUNT(*) query entirely |
| Create a small secondary index for COUNT(*) | A covering index for count queries eliminates expensive table scans |

## Architecture Guidelines

- Design a maximum offset guard that returns a clear error message suggesting cursor pagination for deeper access.
- Consider an automatic strategy switch: offset for shallow pages (page < 100), cursor for deeper pages.
- For large tables, cache the total count with a short TTL (60-300 seconds) instead of computing it on every request.
- Implement query timeouts (5000ms) to prevent deep-offset queries from consuming resources indefinitely.
- Use read replicas for COUNT(*) queries to reduce load on the primary database.

## Performance Considerations

- At 100K rows, offset 90000 is 10-100x slower than offset 0.
- At 10M rows, offset 9990000 will likely time out.
- Specific database differences:
  - MySQL InnoDB: No row count cache; must scan an index for COUNT(*).
  - PostgreSQL: MVCC visibility checks on every row make counts expensive.
  - SQLite: Stores approximate count in table header (fast but approximate).
  - MyISAM: Stores exact row count (instant, but deprecated engine).
- Indexes do NOT reduce the O(N) traversal cost of OFFSET — they only help with the ORDER BY sorting and the final row lookups.

## Security Considerations

- Malicious clients can set `offset=999999999` to trigger catastrophic database load (DoS vector).
- Monitor and rate-limit requests with extreme offset values.
- Set maximum offset limits to prevent resource exhaustion attacks.
- The deep-offset pattern can be used for data enumeration; cursor pagination is more resistant.
- Statement timeouts prevent runaway queries but may produce 500 errors that leak information if not handled gracefully.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Assuming indexes solve deep offset | Indexes speed up lookups, so developers expect them to help | Indexes don't reduce skipped row traversal; OFFSET still O(N) | Use keyset/cursor pagination for deep pages |
| Skipping COUNT(*) cost analysis | Benchmarking only the data query | On large tables, COUNT(*) doubles or triples response time | Benchmark both queries; use simplePaginate if total not needed |
| Not using covering indexes | Indexing only ORDER BY columns | Table lookups add overhead to each scanned row | Include selected columns in the index when possible |

## Anti-Patterns

- **No maximum offset guard**: Allows clients to paginate to page 1M, causing database degradation.
- **Using paginate() on every request for large tables**: Unnecessary COUNT(*) queries on every request.
- **Not monitoring offset depth**: Missing the early warning signs of deep-offset problems.
- **Assuming small datasets stay small**: 1000 records today may be 10M in a year; plan for growth.
- **Using offset pagination as the only strategy**: Consider hybrid approaches with strategy switching.

## Examples

- **Maximum offset guard**: `if ($offset > 10000) { abort(400, 'Use cursor pagination for deep pages.'); }`
- **Automatic strategy switch**: `if ($page > 100) { return $this->cursorPaginatedResponse($query); } else { return $this->offsetPaginatedResponse($query); }`
- **Covering index for count queries**: `CREATE INDEX idx_users_status_id ON users(status, id)` — enables index-only COUNT(*) scans.
- **Cached total**: `Cache::remember('users_total', 300, fn() => User::count())` — reduces COUNT(*) frequency.
- **Execution plan verification**: `EXPLAIN ANALYZE SELECT * FROM users ORDER BY id LIMIT 15 OFFSET 100000` — verify index scan.

## Related Topics

- Offset Pagination Design — The API surface enabled by this performance analysis
- Cursor Pagination Performance — Comparative performance characteristics
- Keyset Pagination Design — The performant deep-offset alternative
- Total Count Performance — Dedicated KU for count optimization
- Offset-to-Cursor Migration — When performance forces a strategy change

## AI Agent Notes

- When designing offset pagination, always include a maximum page/offset limit from day one.
- If the dataset is expected to grow beyond 10K records, plan the migration path to cursor pagination.
- For existing offset-paginated endpoints with deep-offset problems, implement a hybrid strategy first (offset for shallow, cursor for deep).
- Use EXPLAIN ANALYZE with production-scale data to benchmark offset query costs.
- Prefer simplePaginate() over paginate() when the UI does not require exact total counts.

## Verification

- [ ] Maximum offset/page limit is enforced (e.g., offset < 10000 or page < 100)
- [ ] Execution plan verified for offset queries at various depths
- [ ] COUNT(*) query benchmarked separately from data query
- [ ] simplePaginate() evaluated as an alternative
- [ ] Statement timeouts configured for pagination queries
- [ ] Monitoring in place for average offset depth per endpoint
- [ ] Cached or approximate count strategy evaluated for large tables
- [ ] Documented maximum acceptable offset for each paginated endpoint
