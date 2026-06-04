# Metadata

Domain: Data & Storage Systems
Subdomain: Query Optimization & Profiling
Knowledge Unit: 4.9 LIKE with leading wildcard sargability breakage
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

`LIKE '%value'` or `LIKE '%value%'` cannot use B-Tree indexes because the starting character is unknown. `LIKE 'value%'` (trailing wildcard only) IS sargable — it's a range scan over values starting with "value".

---

# Core Concepts

- **Trailing wildcard only**: `LIKE 'prefix%'` — sargable. Uses B-Tree range scan `WHERE col >= 'prefix' AND col < 'prefiy'`.
- **Leading wildcard**: `LIKE '%suffix'` or `LIKE '%middle%'` — full table scan. No B-Tree index can help.
- **Alternatives**: Full-text index (FULLTEXT, GIN tsvector), pg_trgm (GIN trigram index), external search (Meilisearch, Algolia).

---

# Patterns

**Use full-text search for text columns**: MySQL FULLTEXT index + `MATCH...AGAINST`. PostgreSQL GIN index on tsvector + `@@`.

**Use pg_trgm for PostgreSQL**: `CREATE INDEX ON table USING GIN (col gin_trgm_ops)` — enables `ILIKE '%search%'` with index support.

**Use Scout for advanced search**: Laravel Scout with Meilisearch, Algolia, or Typesense for any non-trivial search feature.

---

# Common Mistakes

**LIKE on large text column without alternatives**: Full-text search is always better for natural language search.

---

# Related Knowledge Units

3.13 Full-text indexes | 4.7 Sargable vs non-sargable
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

