# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.8 Composite/compound indexes: leftmost prefix rule, column ordering
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Composite indexes index multiple columns in a defined order (left to right). The leftmost prefix rule determines which query patterns the index can serve: queries must reference a leftmost subset of the indexed columns. Column ordering within a composite index is the most impactful index design decision.

---

# Core Concepts

- **Leftmost prefix**: Index on `(a, b, c)` serves queries on `(a)`, `(a, b)`, and `(a, b, c)`. Does NOT serve queries on `(b)`, `(c)`, or `(b, c)`.
- **Sort order**: The index is sorted by column a first, then within equal a values by column b, then within equal b values by column c.
- **Skip scan (PostgreSQL)**: Can use index for non-leading column if there are few distinct values in leading columns. MySQL 8.0.13+ supports similar functionality.

---

# Mental Models

A composite index is like a phone book sorted by (Last Name, First Name). You can look up "Smith, John" efficiently. You can also look up all "Smiths". You CANNOT efficiently look up all "Johns" without knowing the last name.

---

# Patterns

**Equality first, range after**: Columns used in `=` conditions should come before columns used in range/order conditions. `WHERE a = 1 AND b > 5` benefits from index `(a, b)` — jump to a=1, scan b range within it.

**High cardinality first**: Put columns with more distinct values first to maximize early pruning.

**Covering index**: Add all columns used in SELECT to the index (via INCLUDE) to enable index-only scans.

---

# Architectural Decisions

| Query Pattern | Index Order | Rationale |
|--------------|------------|-----------|
| WHERE a = ? AND b = ? | (a, b) | Both equality, order doesn't matter much |
| WHERE a = ? AND b > ? | (a, b) | Equality first, range second |
| WHERE a = ? ORDER BY b | (a, b) | Index provides sorted output |
| WHERE b = ? | (b) only | Leftmost prefix means (a, b) won't help |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Single index serves multiple query patterns | Wrong column order renders index useless for some queries | EXPLAIN verification required
More efficient than multiple single-column indexes | Larger than single-column index | Storage vs query performance tradeoff

---

# Common Mistakes

**Wrong column order**: Index `(status, created_at)` but the query filters by `created_at` first. The index is not used. Place the most selective equality column first.

**Indexing all queryable columns in one index**: A 6-column composite index where only the first 2 columns serve the query. Remaining columns add maintenance cost without benefit.

**Not verifying index usage**: Adding a composite index without running EXPLAIN. The optimizer may not use it as expected.

---

# Related Knowledge Units

3.1 B-Tree | 3.9 Composite index best practices | 3.10 Covering indexes | 3.18 Composite index selectivity
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

