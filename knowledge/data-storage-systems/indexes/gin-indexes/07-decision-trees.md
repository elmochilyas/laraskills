# 3-4 GIN Indexes - Decision Trees

## GIN Operator Class Selection: jsonb_path_ops vs Default

---

## Decision Context

Choosing between the default GIN operator class and `jsonb_path_ops` for JSONB indexing in PostgreSQL.

---

## Decision Criteria

* performance: jsonb_path_ops is smaller and faster for containment (`@>`)
* architectural: default supports key-existence operators (`?`, `?|`, `?&`)
* maintainability: cannot change opclass without rebuilding index
* security: none

---

## Decision Tree

Indexing a JSONB column with GIN?

↓

What operators will you use?

↓

Only `@>` (containment queries)?

YES → Use `jsonb_path_ops` opclass

    ↓
    CREATE INDEX ON data USING GIN (data jsonb_path_ops)
    
    ↓
    2-4x faster for @> queries, 40-50% smaller index

NO → Need `?`, `?|`, or `?&` (key existence operators)?

    YES → Use default opclass
    
        ↓
        CREATE INDEX ON data USING GIN (data)
        
        ↓
        Supports all JSONB operators, but larger and slower for `@>`
    
    NO → Use jsonb_path_ops (safe default)

---

## Rationale

The `jsonb_path_ops` operator class stores hashes of (key, value) pairs rather than storing keys separately. This makes the index smaller and containment lookups faster, but sacrifices support for key-existence checks.

---

## Recommended Default

**Default:** `jsonb_path_ops` if only `@>` is used; default if `?`/`?|`/`?&` are needed
**Reason:** Most JSONB queries use containment. jsonb_path_ops is 2-4x faster and 40-50% smaller for the most common use case.

---

## Risks Of Wrong Choice

Default opclass when only `@>` is needed: wasted storage and slower queries. jsonb_path_ops when key-existence is needed: those queries will be slow or require full table scan.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search

---

## GIN vs B-Tree for JSONB Data

---

## Decision Context

Choosing between a GIN index on the entire JSONB column and a B-Tree index on a specific JSONB path, based on update frequency.

---

## Decision Criteria

* performance: GIN has high write overhead, B-Tree on paths is lighter
* architectural: GIN indexes entire document, B-Tree targets specific paths
* maintainability: GIN needs vacuum maintenance, B-Tree on paths is simpler
* security: none

---

## Decision Tree

Need to query a JSONB column?

↓

How frequently is the JSONB column updated?

↓

High update frequency (many UPDATEs per minute)?

YES → Avoid GIN on the entire column

    ↓
    B-Tree on specific JSONB path instead
    
    Create a generated column for the frequently-queried path, then B-Tree index it
    
    ↓
    ALTER TABLE data ADD COLUMN status VARCHAR GENERATED ALWAYS AS (data->>'status') STORED;
    CREATE INDEX ON data (status);

NO → Low update frequency or append-only?

    YES → GIN on entire JSONB column is acceptable
    
        ↓
        CREATE INDEX ON data USING GIN (data jsonb_path_ops)

---

## Rationale

GIN indexes have high write amplification because each update requires decompressing and recompressing posting lists. For write-heavy JSONB columns, extracting the queried path to a generated column with a B-Tree index is much more efficient.

---

## Recommended Default

**Default:** B-Tree on generated column for write-heavy JSONB; GIN for read-heavy or append-only
**Reason:** Most applications update JSONB columns and benefit from the lighter maintenance of B-Tree indexes on extracted paths.

---

## Risks Of Wrong Choice

GIN on frequently updated JSONB: severe write throughput degradation, VACUUM pressure, index bloat. B-Tree on paths when full JSONB searches are needed: those searches will not use the index.

---

## Related Rules

* Rule 1: Avoid over-indexing write-heavy tables

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search
* Design B-Tree Indexes for Equality and Range Queries

---

## GIN vs pg_trgm for Text Search

---

## Decision Context

Choosing between a full-text search (tsvector + GIN) and a trigram-based GIN index (pg_trgm) for text matching in PostgreSQL.

---

## Decision Criteria

* performance: tsvector for word-level, trigram for substring
* architectural: tsvector needs generated column, trigram works on raw text
* maintainability: tsvector needs update trigger/hook
* security: none

---

## Decision Tree

Need text search in PostgreSQL?

↓

Do you need word-level search with stemming, ranking, and language support?

YES → Use tsvector + GIN

    ↓
    Add a generated tsvector column
    Create GIN index
    Use @@ operator with to_tsquery()
    Supports ranking with ts_rank()

NO → Do you need substring/LIKE/ILIKE/patterns (%value%)?

    YES → Use pg_trgm GIN index
    
        ↓
        CREATE EXTENSION pg_trgm;
        CREATE INDEX ON table USING GIN (col gin_trgm_ops)
        
        ↓
        Supports LIKE, ILIKE, ~ (regex) with trigram matching
        No stemming or language support
    
    NO → B-Tree with LIKE 'prefix%' (B-Tree range scan)

---

## Rationale

tsvector+GIN is designed for language-aware full-text search (stemming, stop words, ranking, phrase matching). pg_trgm is for simple substring matching (e.g., "find users whose name contains 'jo'"). They serve different use cases and can even be combined.

---

## Recommended Default

**Default:** tsvector + GIN for full-text search; pg_trgm for substring/LIKE search
**Reason:** Each is optimized for its specific use case. tsvector provides language-aware search; pg_trgm provides fast wildcard matching.

---

## Risks Of Wrong Choice

tsvector for LIKE '%value%': tsvector doesn't support substring matching, queries would be slow. pg_trgm for full-text search: no stemming, no ranking, poor recall/relevance.

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search
* Design B-Tree Indexes for Equality and Range Queries
