# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.25 Lazy loading detection & prevention in production
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

N+1 queries caused by lazy loading are the #1 performance issue in Laravel applications. In production, lazy loading can silently degrade response times. Detection requires query logging, middleware, or Laravel's built-in N+1 detection. Prevention requires strict discipline: always eager load, never rely on lazy loading in production contexts.

---

# Core Concepts

- **N+1 symptom**: Request loads 50 posts, then executes 50+1 queries (1 for posts, 50 for comments). Each lazy load fires a separate query.
- **Laravel strict mode**: `Model::preventLazyLoading(true)` in `AppServiceProvider::boot()`. Throws exception when lazy loading occurs.
- **Query counter**: Log total query count per request. Any request exceeding N queries per item is suspicious.

---

# Patterns

**Enable strict mode in development**: `Model::preventLazyLoading(! $this->app->isProduction())`. Catches N+1 in CI/testing.

**Query log middleware**: Middleware that logs query count for requests over a threshold.

**Telescope/Debugbar**: Built-in N+1 detection. Use in staging/development.

---

# Common Mistakes

**Disabling lazy loading prevention in production**: Without it, N+1 goes undetected. Use query log monitoring instead.

**Relying on `$with` on the model**: `protected $with = ['comments']` always eager loads, even when not needed. Prefer `->with()` per query.

---

# Related Knowledge Units

4.26 Query log analysis | 4.27 Profiling tools
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

