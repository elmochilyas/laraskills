# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.12 Functional/expression indexes (index by expression result, PostgreSQL/MySQL)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Functional indexes index the result of an expression rather than a raw column value. Essential for making sargable queries that use functions in WHERE clauses. PostgreSQL and MySQL 8.0+ support them. Common use cases: case-insensitive search, date extraction, JSON path extraction.

---

# Core Concepts

- **Expression index**: `CREATE INDEX ON users (LOWER(email))`. The index stores `LOWER(email)` values.
- **Query matching**: The expression in WHERE must exactly match the index expression. `WHERE LOWER(email) = 'test@example.com'` uses the index. `WHERE LOWER(email) LIKE '%test%'` does not.
- **MySQL 8.0+**: Functional indexes on expressions. Pre-8.0 required generated columns.

---

# Mental Models

A functional index pre-computes the expression result and stores it in the index. The query doesn't need to compute the expression because the index already has the answer.

---

# Patterns

**Case-insensitive unique constraint**: `CREATE UNIQUE INDEX ON users (LOWER(email))` — enforce unique email regardless of case.

**Date-part indexing**: `CREATE INDEX ON orders (EXTRACT(YEAR FROM created_at))` — optimize queries that filter by year.

**JSON path indexing**: `CREATE INDEX ON users ((data->>'zip_code'))` — index a specific JSON path.

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Enables index usage for expression-based queries | Expression must match exactly | Even whitespace differences cause mismatch
Simplifies application code | No partial index support with expressions | Must create separate partial index if needed

---

# Common Mistakes

**Expression mismatch**: Index on `LOWER(email)` but query uses `LCASE(email)`. Different function, index not used.

**Expression index on volatile function**: `CREATE INDEX ON users (random())` — useless because the value changes constantly.

---

# Related Knowledge Units

3.11 Partial indexes | 3.28 Sargability rule | 12.23 Expression/functional indexes
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

