# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.15 SQL-side aggregation (withCount, raw aggregates) vs. collection-side
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

SQL-side aggregation (using `withCount`, `withSum`, `DB::raw(SUM(...))`) is always more efficient than loading full collections into PHP and aggregating in memory. The rule: if you only need a count, sum, avg, min, max, or boolean — use SQL.

---

# Core Concepts

- **SQL aggregation**: `Post::withCount('comments')` — one query, one integer per parent row.
- **Collection aggregation**: `Post::with('comments')->get()->each(fn($p) => $p->comments->count())` — loads ALL comments into memory, then counts in PHP.
- **Memory waste**: Loading 10,000 comments to count 5 per post is memory-inefficient.

---

# Patterns

**Always use withCount for counts**: Never `$post->comments->count()`. Use `$post->comments_count` (from `withCount`).

**DB::raw for complex aggregation**: `->selectRaw('COUNT(*) as total, SUM(amount) as revenue')` in the query builder.

**Mass assignment aggregation**: `User::select('plan_id')->selectRaw('COUNT(*) as count')->groupBy('plan_id')->get()`.

---

# Common Mistakes

**Collection count in a loop**: `foreach ($posts as $post) { $count = $post->comments->count(); }` — loads all comments for every post. Use `withCount('comments')` once.

**Loading relationships just for aggregation**: Loading full related models when only the aggregated value is needed.

---

# Related Knowledge Units

2.7 Relationship counting | 2.8 Subquery selects
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

