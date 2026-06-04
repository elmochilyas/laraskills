# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.23 When to drop to query builder or raw SQL (reporting, complex aggregation)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Eloquent hydrates full model objects, which is unnecessary for reporting and aggregation. When the result doesn't need model methods, relationships, or events, use the query builder. Raw SQL is appropriate for database-specific features (window functions, recursive CTEs, JSON operators).

---

# Core Concepts

- **Query builder**: `DB::table('orders')->select(...)->get()` — returns stdClass objects, no hydration overhead.
- **Raw SQL**: `DB::select('SELECT ...')` — for complex queries the query builder can't express.
- **Decision rule**: Need model methods? Use Eloquent. Need just data? Use query builder. Need database-specific feature? Use raw SQL.

---

# Patterns

**Dashboard aggregation**: `DB::table('orders')->selectRaw('DATE(created_at) as date, COUNT(*) as count')->groupBy('date')->get()`.

**Reporting exports**: Query builder for large result sets, stream via cursor, write to CSV.

**Complex reporting**: Raw SQL with window functions, CTEs, or lateral joins.

---

# Common Mistakes

**Using Eloquent for everything**: `Order::all()->groupBy('status')->map(fn($g) => $g->sum('total'))` — hydrates all models, groups in PHP. Use query builder aggregation.

---

# Related Knowledge Units

2.10 Query builder methods | 4.15 SQL-side aggregation
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

