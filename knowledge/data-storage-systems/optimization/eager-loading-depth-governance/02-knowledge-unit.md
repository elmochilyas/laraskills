# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.14 Eager loading depth governance (max nesting, selective loading)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Deep eager loading chains (`with('a.b.c.d')`) generate complex multi-JOIN queries that can be slow and load excessive data. Governance: limit nesting depth, narrow columns per relationship, and distinguish list vs detail view loading.

---

# Core Concepts

- **Depth problem**: `with('user.profile.company.address')` generates up to 5 JOINs or separate WHERE IN queries. Risk of over-fetching.
- **Selective loading**: Not all relationships need all columns. `with('user:id,name')` limits columns.
- **List vs detail**: List views load minimal data. Detail views load full relationships. Use different resources or scopes.

---

# Patterns

**Max 2 levels for list endpoints**: Only load relationships directly visible in the list. Detail endpoints can load deeper.

**Narrow selects**: `with('comments:id,post_id,body')` — only load columns needed for display.

**Scope-based relationship loading**: `scopeWithListRelations($q)` and `scopeWithDetailRelations($q)`.

---

# Common Mistakes

**Blind `$model->load('allRelations')`**: Loading every relationship defined on the model regardless of what the endpoint needs.

**N+1 within eager loaded relationships**: `with('comments.likes')` loads both comments and likes in 2 queries. But `$post->comments->each(fn($c) => $c->likers->count())` triggers N+1 on the likes relationship.

---

# Related Knowledge Units

2.3 Eager loading | 2.5 Constrained eager loading | 4.21 Query shape discipline
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

