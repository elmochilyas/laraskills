# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.27 Laravel profiling tools: Telescope, Debugbar, Clockwork
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Three primary Laravel profiling tools serve different needs: Telescope (production monitoring with team debugging), Debugbar (development-only browser overlay), Clockwork (browser devtools integration). All capture query count, duration, N+1 detection, and request timeline.

---

# Core Concepts

- **Laravel Telescope**: Full request dump (queries, model actions, mail, notifications, jobs, logs). Stores to database. Built-in gate for authorization. Cleans old records via `telescope:prune`.
- **Debugbar**: In-browser toolbar showing queries, memory, load time, routes. Development-only. Zero-config for local dev.
- **Clockwork**: Chrome/Firefox devtools panel. Lightweight alternative to Debugbar. Works via custom panel in browser.

---

# Patterns

**Telescope for staging/limited production**: Enable Telescope on staging or production with `TELESCOPE_ENABLED=true`. Whitelist specific users via gate. Monitor slow endpoints.

**Debugbar for local development**: Install via composer `--dev`. Shows query count per page, duplicate queries, N+1 warnings.

**Clockwork for lightweight profiling**: Lower overhead than Debugbar. Use when Debugbar conflicts with other packages.

---

# Common Mistakes

**Telescope in production without pruning**: Telescope stores every request. Without `telescope:prune`, storage fills up. Schedule the prune command.

**Debugbar in production**: Debugbar exposes query data, environment config, and route parameters. Only install as dev dependency.

---

# Related Knowledge Units

4.25 Lazy loading detection | 4.26 Query log analysis
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

