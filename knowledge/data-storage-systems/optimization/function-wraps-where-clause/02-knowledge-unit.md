# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.10 function wraps in WHERE clause (LOWER, CAST: index bypass)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Any function that wraps an indexed column in a WHERE clause breaks sargability. Common culprits: `LOWER(col)`, `UPPER(col)`, `CAST(col AS type)`, `YEAR(col)`, `DATE(col)`, `TRIM(col)`. PostgreSQL functional indexes can mitigate some cases. MySQL functional indexes (8.0+) also support expression-based indexing.

---

# Core Concepts

- **Rule**: If the column is wrapped in a function, the B-Tree index on the raw column cannot be used.
- **Functional index solution**: Index the expression. `CREATE INDEX ON users (LOWER(email))`. Query must use the exact same expression.
- **Cast sargability**: `CAST(id AS CHAR) = '123'` — casting the column breaks the index. Cast the input instead.

---

# Patterns

**Functional index in PostgreSQL**: `DB::statement('CREATE INDEX ON users (LOWER(email))')` — then query `WHERE LOWER(email) = ?`.

**Cast input, not column**: `WHERE id = ?` with the value explicitly cast to integer in PHP before binding.

---

# Common Mistakes

**orderByRaw with function**: `orderByRaw('LOWER(name)')` causes filesort. Use functional index or case-insensitive collation.

---

# Related Knowledge Units

3.28 Sargability rule | 3.12 Functional/expression indexes | 4.7 Sargable vs non-sargable
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

