# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.1 B-Tree index structure and when it applies (equality, range, sort)
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

B-Tree (balanced tree) indexes are the default and most common index type in both MySQL and PostgreSQL. They organize data in a sorted tree structure enabling fast lookups (O(log n)) for equality, range, prefix, and sorted access. Understanding B-Tree structure is essential for composite index design, covering index strategies, and query plan analysis.

---

# Core Concepts

- **Structure**: Balanced tree with root, internal nodes, and leaf pages. Each node contains sorted key values and pointers.
- **Lookup types**: Equality (`WHERE id = 5`), Range (`WHERE id > 100`), Prefix (`WHERE name LIKE 'Jon%'`), Sort (`ORDER BY name`).
- **Leaf pages**: Contain the actual index entries and pointers to heap tuples (PostgreSQL) or clustered index entries (MySQL InnoDB).
- **Clustered vs non-clustered**: InnoDB's primary key is a clustered index (data stored with index). Secondary indexes point to PK. PostgreSQL uses heap with separate index entries pointing to TIDs.

---

# Mental Models

A B-Tree is a sorted copy of the indexed column(s). Finding data in a B-Tree takes as many steps as the tree depth (typically 3-4 levels for millions of rows). Scanning from one leaf to the next is efficient for range queries.

---

# Internal Mechanics

- Each node contains (key, pointer) pairs. Searching starts at root, follows pointers based on key comparison.
- Leaf nodes are linked for efficient range scans.
- InnoDB stores the entire row in the leaf of the clustered index (PK). Secondary indexes store PK value as the pointer.
- PostgreSQL stores (key, TID) in leaf pages. TID points to the heap page where the row lives.

---

# Patterns

**B-Tree for most indexes**: Default choice for equality and range queries on scalar data. Supports ORDER BY without extra sort.

**Index for ORDER BY**: If the ORDER BY column is the leading column of a B-Tree index and the WHERE conditions are on earlier columns, the result is already in sorted order.

**Prefix matching**: `LIKE 'prefix%'` uses B-Tree range scan. `LIKE '%suffix'` does not.

---

# Architectural Decisions

| Query Type | B-Tree Suitable | Alternative |
|-----------|----------------|-------------|
| WHERE id = ? | YES | Hash (PG) |
| WHERE col > ? | YES | — |
| ORDER BY col | YES | — |
| LIKE 'prefix%' | YES | Full-text |
| JSONB containment | NO | GIN |
| Spatial query | NO | GiST (PG), R-Tree (MySQL) |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
O(log n) lookup time | Write amplification on INSERT/UPDATE | Each write updates all B-Tree indexes
Range scan from sorted leaf chain | Storage overhead (~2x the indexed data) | Larger than data size for wide indexes

---

# Common Mistakes

**Indexing low-cardinality columns alone**: An index on `status` (with only 3 distinct values) is rarely used by the optimizer — scanning 33% of a table is cheaper than the index.

**Assuming B-Tree for text search**: `LIKE '%value%'` cannot use B-Tree range scan. It falls back to full table scan.

---

# Related Knowledge Units

3.8 Composite/compound indexes | 3.10 Covering indexes | 3.21 Index management in migrations
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

