# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.20 Memory optimization for large result sets
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Hydrating large Eloquent collections consumes PHP memory proportional to the number of rows and columns loaded. Each hydrated model increases memory by ~1-2KB. Loading 100,000 models uses 100-200MB for just the collection. Mitigation: use `cursor()`, narrow columns, use query builder for reporting.

---

# Core Concepts

- **Memory per model**: ~1-2KB for a standard Eloquent model with relationships.
- **Hydration overhead**: Eloquent creates objects with metadata (original, changes, casts, relationships).
- **Query builder**: Results are plain arrays/stdClass, consuming ~10x less memory.

---

# Patterns

**Use query builder for reporting**: `DB::table('orders')->select('status', DB::raw('COUNT(*)'))->groupBy('status')->get()` — no Eloquent overhead.

**Narrow columns**: `->select('id', 'name')` — don't load large text fields that aren't displayed.

**cursor() for memory-safe streaming**: Process one row at a time, never loading all into memory.

---

# Common Mistakes

**Reporting through Eloquent**: `Order::all()->groupBy('status')->map->count()` — hydrates all orders, then groups/counts in PHP. Use query builder aggregation.

**Loading full models for API responses**: `User::all()` returns 50K users for an admin dropdown. Use `User::pluck('name', 'id')`.

---

# Related Knowledge Units

2.18 Model serialization | 2.23 chunk/cursor | 4.15 SQL-side aggregation
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

