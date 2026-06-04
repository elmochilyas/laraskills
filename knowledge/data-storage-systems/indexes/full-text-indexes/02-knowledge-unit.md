# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.13 Full-text indexes (MySQL FULLTEXT, PostgreSQL GIN tsvector)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Full-text indexes enable efficient natural language search within text columns. MySQL uses `FULLTEXT` indexes with `MATCH...AGAINST`. PostgreSQL uses GIN indexes on `tsvector` columns with `@@` operator. Both handle word stemming, stop words, and ranking.

---

# Core Concepts

- **MySQL FULLTEXT**: Inverted word index. Supports `IN BOOLEAN MODE` (operators +, -, *, ""), `WITH QUERY EXPANSION`, and relevance ranking.
- **PostgreSQL tsvector**: Converts text to lexeme list. `to_tsvector('english', body)` creates search vector. GIN index on tsvector enables fast `@@` queries.
- **Ranking**: MySQL uses relevance score from `MATCH...AGAINST`. PostgreSQL uses `ts_rank()` and `ts_rank_cd()`.

---

# Patterns

**MySQL**: Add FULLTEXT index, query with `MATCH(title, body) AGAINST('search terms' IN BOOLEAN MODE)`.

**PostgreSQL**: Add generated tsvector column, GIN index, query with `to_tsquery('english', 'search & terms')`.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Natural language search without external service | Higher storage for index | Full-text index is larger than B-Tree
Ranked results by relevance | Language-specific configuration | Must configure per-language settings

---

# Related Knowledge Units

12.6 Full-text search tsvector/tsquery | 12.11 GIN index on tsvector | 13.13 Full-text search MATCH...AGAINST
## Ecosystem Usage

Laravel's schema builder supports index creation through migration blueprints. Managed database providers support all major index types. Packages like tpetry/laravel-postgresql-enhanced expose PostgreSQL-specific index types.

## Failure Modes

Query planner ignores indexes when column types mismatch query parameter types. Implicit type conversion prevents index usage. Index bloat from heavy UPDATE/DELETE workloads degrades performance. Missing indexes on FK columns cause full table scans on JOIN queries.

## Performance Considerations

B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index adds write amplification. BRIN indexes are efficient for large ordered datasets.

## Production Considerations

Monitor index usage via pg_stat_user_indexes or performance_schema. Add indexes concurrently on production tables. Schedule index rebuilds during low-traffic periods. Drop unused indexes in a separate deployment.

## Research Notes

Covering indexes with INCLUDE columns reduce query latency by eliminating heap lookups. BRIN indexes are effective for ordered data with high correlation. GiST/GIN indexes support full-text search and JSONB operations.

## Internal Mechanics

B-Tree indexes store sorted key values in leaf pages. InnoDB clustered index stores entire rows in the PK leaf. PostgreSQL uses heap storage with index entries pointing to TIDs. GIN indexes build inverted lists for composite value lookups.

## Architectural Decisions

Index types: B-Tree for equality/range/sort. GIN for JSONB and full-text. GiST for geospatial and ranges. BRIN for large ordered tables. Hash for equality-only in PostgreSQL.

## Mental Models

An index is a sorted copy of indexed data. Finding data in a B-Tree takes as many steps as tree depth (3-4 levels for millions of rows). The query planner chooses an index when the index scan is cheaper than a full table scan.

## Common Mistakes

- **Indexing every column**: Adding indexes on every column "just in case" increases write amplification (every INSERT/UPDATE/DELETE must update each index), bloats storage, and confuses the query planner. Only index columns used in WHERE, JOIN, ORDER BY, or GROUP BY clauses.
- **Ignoring composite index column order**: The leftmost prefix rule means column order in a composite index matters dramatically. Place high-selectivity columns first and range-filtered columns last. A wrong column order can render the index useless for common queries.
- **Not monitoring unused indexes**: Indexes that are never used by the query planner still incur write overhead and storage costs. Use pg_stat_user_indexes or performance_schema to identify and drop unused indexes.
- **Over-indexing foreign keys**: While FK columns benefit from indexing, adding separate indexes when a composite index already covers the FK leads to redundancy. Check existing indexes before adding FK-specific ones.
- **Indexing without query analysis**: Adding indexes based on column names rather than actual query patterns leads to wasted effort. Use slow query logs, EXPLAIN plans, and query profiling to identify the exact queries that need optimization.
- **Neglecting maintenance**: B-Tree indexes can bloat over time from UPDATE/DELETE activity. Schedule regular REINDEX (PostgreSQL) or OPTIMIZE TABLE (MySQL) during maintenance windows to reclaim space and improve performance.
