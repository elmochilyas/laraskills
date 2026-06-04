# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.22 Eloquent anti-patterns: nested whereHas chains, broad orWhereHas, sorting by related columns, polymorphic filters, repeated aggregate subqueries
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Common Eloquent anti-patterns that degrade query performance: deeply nested `whereHas` chains, broad `orWhereHas` without proper indexing, sorting by related columns (requires JOIN or subquery), polymorphic filters on large tables, and repeated aggregate subqueries in paginated queries.

---

# Core Concepts

- **Nested whereHas**: `whereHas('a.b.c.d')` generates deeply nested EXISTS subqueries. Consider JOIN or denormalization.
- **Poly filters**: `where('type', 'Post')->orWhere('type', 'Video')` on polymorphic columns — the two-type query can't use a simple index.
- **Repeated aggregates**: `Post::withCount('comments')->withCount('likes')->withCount('shares')` — three separate subqueries in SELECT.

---

# Patterns

**Replace deep whereHas with JOIN**: Convert nested EXISTS to JOIN for better performance on large tables.

**Index polymorphic columns**: Composite index on `(morphable_type, morphable_id)` for polymorphic queries.

**Consolidate aggregates**: Use `addSelect` with subqueries instead of multiple `withCount` calls.

---

# Common Mistakes

**Sorting by related column**: `Post::orderBy('author.name')` — requires JOIN or subquery. Add a denormalized column if this is a hot query.

---

# Related Knowledge Units

2.6 Relationship existence filtering | 2.8 Subquery selects
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

