# 3-28 Sargability Rule - Decision Trees

## WHERE Date(col) vs Range Query

---

## Decision Context

Rewriting non-sargable date functions in WHERE clauses to enable index usage.

---

## Decision Criteria

* performance: range query uses index; function-wrapped column does not
* architectural: expression indexes can mitigate but are not needed with correct query
* maintainability: range patterns are straightforward

---

## Decision Tree

Query uses `WHERE DATE(col) = '2026-01-01'`?

↓

This is NOT sargable — index on col will NOT be used

↓

Rewrite options:

Option 1: Range query (best)

    `WHERE col >= '2026-01-01 00:00:00' AND col < '2026-01-02 00:00:00'`
    
    → Uses index on col
    → Returns same rows

Option 2: Laravel whereDate (convenient but NOT sargable)

    `Model::whereDate('created_at', '2026-01-01')` → generates `DATE(created_at) = ?`
    
    → Does NOT use index
    → Avoid for large tables

Option 3: whereBetween (sargable in Laravel)

    `->whereBetween('created_at', ['2026-01-01 00:00:00', '2026-01-01 23:59:59'])`
    
    → Uses index on created_at

---

## Rationale

When you write `WHERE DATE(col) = ?`, the database cannot use the index because the index stores raw column values, not `DATE(col)` values. Using the index would require computing DATE() for every row and comparing. Rewriting as a range query lets the database walk the B-Tree directly.

---

## Recommended Default

**Default:** Always write date filters as range queries (>= AND <), never as WHERE DATE(col) = ?
**Reason:** Range queries are sargable and use indexes. WHERE DATE(col) is the most common index-breaking pattern.

---

## Risks Of Wrong Choice

WHERE DATE(col) on large table: full table scan for every query, even with an index on the column. Using whereDate() in Laravel without realizing it generates DATE().

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design B-Tree Indexes for Equality and Range Queries

---

## LIKE '%search' vs Alternative Search Methods

---

## Decision Context

Choosing between non-sargable LIKE with leading wildcard and alternative search methods.

---

## Decision Criteria

* performance: LIKE '%value' cannot use B-Tree index; alternatives may use indexes
* architectural: depends on search requirements and database
* maintainability: different search approaches have different complexity

---

## Decision Tree

Query uses `LIKE '%search'` or `LIKE '%search%'`?

↓

This is NOT sargable — B-Tree index cannot be used

↓

What type of search do you need?

↓

Prefix search (`LIKE 'prefix%'`)?

YES → B-Tree index IS usable (range scan)

    ↓
    `WHERE col LIKE 'prefix%'` → uses index on col
    This IS sargable (the leading wildcard is the problem, not LIKE itself)

NO → Substring search (`LIKE '%substring%'` or `LIKE '%suffix'`)?

    YES → B-Tree index NOT usable
        
        ↓
        Options for indexable substring search:
        
        PostgreSQL:
        - pg_trgm GIN index → supports LIKE/ILIKE with wildcards
        `CREATE EXTENSION pg_trgm; CREATE INDEX ON table USING GIN (col gin_trgm_ops)`
        
        - Full-text search (tsvector) → for word-level search
        
        MySQL:
        - FULLTEXT index → for word-level search (not substring)
        
        - No good option for arbitrary substring search in MySQL
        → Consider dedicated search engine (Elasticsearch, Meilisearch)

---

## Rationale

`LIKE 'prefix%'` uses B-Tree range scan because the starting characters are known. `LIKE '%suffix'` and `LIKE '%any%'` cannot use B-Tree because the starting position is unknown. pg_trgm in PostgreSQL provides GIN-based trigram matching for these cases.

---

## Recommended Default

**Default:** Use `LIKE 'prefix%'` with B-Tree for prefix search; pg_trgm GIN for substring in PG; full-text for word search
**Reason:** Each approach is optimal for its use case. Avoid LIKE with leading wildcards on indexed columns.

---

## Risks Of Wrong Choice

LIKE '%value%' on large table without pg_trgm: guaranteed full table scan. Using pg_trgm for prefix-only queries: overkill — B-Tree is simpler and faster for prefix matching.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search
* Design B-Tree Indexes for Equality and Range Queries
