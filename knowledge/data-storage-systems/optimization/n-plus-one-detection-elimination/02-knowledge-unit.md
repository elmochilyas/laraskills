# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.13 N+1 detection and elimination strategies
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

N+1 is the most common performance problem in Eloquent applications. It occurs when a relationship is lazy-loaded inside a loop, generating N+1 queries (1 for the parent, N for each child). Detection: look for repeated query patterns with different WHERE values. Elimination: eager loading with `with()`, `load()`, or `loadMissing()`.

---

# Core Concepts

- **Pattern**: 1 query + N queries (where N = number of parent rows).
- **Eager loading**: `Post::with('comments')` — 2 queries total (1 for posts, 1 for comments).
- **Hidden N+1**: In Blade views, API resources, accessors, policies — any place where relationship access happens outside the controller.

---

# Patterns

**Enable preventLazyLoading**: Throw exceptions for lazy loading in non-production environments.

**Query count middleware**: Log warnings when a request exceeds a query threshold.

**Test assertions**: `DB::enableQueryLog(); $response = $this->get('/posts'); $this->assertLessThan(10, count(DB::getQueryLog()))`.

**Use withCount for aggregates**: Never load a full collection to get a count. `Post::withCount('comments')`.

---

# Common Mistakes

**N+1 in API resources/accessors**: A resource accesses `$this->author->name` without eager loading. The N+1 is invisible from the controller.

**Blind eager loading**: `Post::with('comments', 'tags', 'author')` everywhere, even when the view only needs the author.

---

# Related Knowledge Units

2.3 Eager loading | 2.4 Lazy loading prevention | 2.7 Relationship counting | 2.28 N+1 detection via Telescope
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

