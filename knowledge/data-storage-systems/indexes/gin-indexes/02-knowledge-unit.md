# Metadata

Domain: Data & Storage Systems
Subdomain: Indexing Strategy & Physical Design
Knowledge Unit: 3.4 GIN indexes (JSONB, arrays, full-text tsvector, trigrams)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

GIN (Generalized Inverted Index) maps each component value to containing rows. Designed for multi-valued data: JSONB documents, arrays, full-text search (tsvector), and trigram-based text search. Essential for PostgreSQL applications using JSONB columns, tag systems, or full-text search.

---

# Core Concepts

- **Inverted index**: Each distinct component value maps to a list of containing rows. Opposite of B-Tree (which maps each row to its position in a sorted order).
- **JSONB operators**: `@>` (contains), `?` (key exists), `?|` (any key), `?&` (all keys).
- **tsvector**: Full-text search document representation. GIN on tsvector enables fast `@@` (match) queries.
- **pg_trgm**: Trigram-based GIN index enables `LIKE '%value%'` and `ILIKE` searches without full table scan.

---

# Mental Models

GIN indexes are lookup tables for "what contains X?" For JSONB, "what rows have key 'email'?" For full-text, "what documents contain 'database'?" For arrays, "what rows contain value 5?"

---

# Internal Mechanics

- GIN stores (key, posting_list) pairs. key = a component value (JSONB key/value, array element, tsvector lexeme). posting_list = list of row TIDs containing that key.
- Index build time is proportional to the number of component values, which can be large for complex JSONB documents.
- GIN indexes can be large — the `gin_pending_list_limit` parameter controls memory usage during inserts.

---

# Patterns

**JSONB containment queries**: `WHERE data @> '{"status": "active"}'` — find rows where JSONB contains the specified structure.

**Array overlap**: `WHERE tags && ARRAY['laravel', 'php']` — find rows with any of the specified tags.

**Full-text search**: GIN on tsvector column for `WHERE tsv @@ to_tsquery('english', 'database & performance')`.

---

# Architectural Decisions

| Use Case | Index Type | Operators |
|---------|------------|-----------|
| JSONB key/value lookup | GIN | @>, ?, ?|, ?& |
| Array membership | GIN | &&, @>, <@ |
| Full-text search | GIN (on tsvector) | @@ |
| LIKE/ILIKE search | GIN (trgm) | LIKE, ILIKE, ~ |

---

# Tradeoffs

Benefit | Cost | Consequence
--------|-----|------------
Enables JSONB querying at database level | Large index size (2-3x data for complex JSON) | Storage planning required
Fast inverted lookups | Slower index updates (decompose/recompose) | Write-heavy JSONB columns suffer

---

# Common Mistakes

**Not specifying jsonb_path_ops**: `CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries. Only use default if you need `?`, `?|`, `?&` operators.

**GIN on frequently updated JSONB**: Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead.

---

# Related Knowledge Units

3.1 B-Tree | 12.2 GIN indexes on JSONB | 12.11 GIN index on tsvector | 12.33 Array columns and GIN indexing
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

