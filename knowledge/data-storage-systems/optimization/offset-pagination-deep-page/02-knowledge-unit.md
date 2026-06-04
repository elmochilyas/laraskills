# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.16 Offset pagination deep-page problems (scanning discarded rows)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`LIMIT 20 OFFSET 100000` reads 100,020 rows from the table, then discards the first 100,000. As offset increases, pagination gets progressively slower. The database scans all discarded rows on every page. Deep offset pagination is the most common pagination performance issue in Laravel.

---

# Core Concepts

- **OFFSET cost**: Each OFFSET skips N rows by reading them. Page 5000 of 20 items reads 100,000 rows.
- **Cursor pagination fix**: `WHERE created_at < ? ORDER BY created_at DESC LIMIT 20` — no offset, always reads 20 rows.
- **Keyset pagination**: Like cursor but using a stable sort key.

---

# Patterns

**Replace offset with cursor for large datasets**: Use `where('created_at', '<', $lastCreatedAt)->orderBy('created_at', 'desc')->limit(20)`.

**Keep offset for small datasets**: If total rows < 10K, offset is acceptable. The performance penalty is negligible.

**Use paginate() for admin panels**: Admin panels typically have small result sets. Offset pagination is simpler to implement.

---

# Common Mistakes

**Using offset for API cursor pagination**: Mobile apps scrolling through thousands of items with offset. Each new page degrades. Use cursor pagination.

**Forgetting to ORDER BY**: Offset pagination without ORDER BY returns unpredictable results and may have inconsistent pagination.

---

# Related Knowledge Units

4.17 Cursor pagination | 4.18 Keyset pagination | 4.19 chunk method tradeoffs
## Ecosystem Usage

Tools like Laravel Telescope, Debugbar, and Pulse provide framework-level visibility. MySQL slow query log and PostgreSQL auto_explain offer database-level profiling. RDS Performance Insights adds cloud-native monitoring.

## Failure Modes

Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Performance Considerations

EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Production Considerations

Enable slow query logging with 200ms thresholds for OLTP. Set up automated EXPLAIN ANALYZE for slow queries. Establish query performance budgets in CI. Profile endpoint-level query counts.

## Research Notes

MySQL 8.4+ improves optimizer statistics with histogram collection. PostgreSQL 17 enhances parallel query execution. AI-assisted optimization automates index recommendations.

## Internal Mechanics

The query optimizer evaluates multiple access paths choosing the lowest-cost plan. MySQL uses a cost-based optimizer with table statistics. PostgreSQL uses more detailed statistics including most-common-values.

## Architectural Decisions

Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Tradeoffs

Benefit: Fast reads via indexes. Cost: Slower writes. Benefit: Query cache hits. Cost: Cache invalidation overhead. Benefit: Read replica distribution. Cost: Replica lag.

## Mental Models

The query planner is a chess engine evaluating moves. It estimates cost of each access path. Bad statistics lead to bad plans. Statistics need regular updates via ANALYZE.

