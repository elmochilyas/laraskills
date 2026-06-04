# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.12 Type mismatch implicit casts (string vs integer comparison)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Comparing a string column to an integer (or vice versa) triggers implicit type conversion that bypasses indexes. MySQL casts the column value, wrapping it in an implicit function. Non-numeric strings cast to 0, producing wrong results and full table scans.

---

# Core Concepts

- **String vs integer**: `WHERE varchar_status = 0` — MySQL casts every `varchar_status` value to integer. 'pending' becomes 0, 'active' becomes 0. Wrong results. Full scan.
- **Fix**: Compare with the correct type. `WHERE varchar_status = '0'` or cast the input.

---

# Patterns

**Cast in PHP before querying**: `where('status', (string) $request->status)` — ensure the bound parameter matches the column type.

**Use same types in FK relationships**: Foreign key and referenced PK must be the same type. `foreignId()` = `unsignedBigInteger`. The referenced PK must also be `unsignedBigInteger`.

---

# Common Mistakes

**Request parameter not cast**: `Model::where('uuid', $request->uuid)` — if `uuid` is a string column and `$request->uuid` is missing (null), MySQL compares `string_column = NULL` (always false) or `string_column = 0` (implicit cast).

---

# Related Knowledge Units

3.29 Implicit type conversion | 3.28 Sargability rule
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

