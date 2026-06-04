# 3-13 Full-Text Indexes - Decision Trees

## MySQL FULLTEXT vs PostgreSQL tsvector+GIN

---

## Decision Context

Choosing between MySQL FULLTEXT and PostgreSQL tsvector+GIN for full-text search based on database platform and search requirements.

---

## Decision Criteria

* performance: both use inverted indexes; PostgreSQL more configurable
* architectural: platform-dependent; migration cost
* maintainability: PostgreSQL needs generated tsvector column
* security: search may expose sensitive content

---

## Decision Tree

Need full-text search in MySQL?

YES → Use FULLTEXT index with MATCH...AGAINST

    ↓
    Simple search → `MATCH(title, body) AGAINST('search terms' IN BOOLEAN MODE)`
    Advanced relevance → Can use `WITH QUERY EXPANSION`
    
    ↓
    Limitation: single character set per FULLTEXT index

NO → Need full-text search in PostgreSQL?

    YES → Use GIN index on tsvector column
    
        ↓
        Add generated tsvector column:
        `ALTER TABLE articles ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED;`
        
        GIN index: `CREATE INDEX ON articles USING GIN (tsv)`
        
        Query: `WHERE tsv @@ to_tsquery('english', 'search & terms')`
        
        Sort by relevance: `ORDER BY ts_rank(tsv, to_tsquery('english', 'search & terms')) DESC`
    
    NO → Consider dedicated search (Elasticsearch, Meilisearch, Typesense)?

---

## Rationale

PostgreSQL's tsvector approach is more powerful (custom dictionaries, ranking functions, highlight support) but more complex to set up. MySQL's FULLTEXT is simpler but less configurable. For serious search needs, consider a dedicated search engine.

---

## Recommended Default

**Default:** PostgreSQL: tsvector+GIN for built-in search; MySQL: FULLTEXT for basic search
**Reason:** PostgreSQL's full-text search is more feature-rich. Both are sufficient for basic search requirements on existing database platforms.

---

## Risks Of Wrong Choice

LIKE '%search%' for full-text search: full table scan on large tables. Not using FULLTEXT/tsvector: poor search quality (no stemming, no ranking).

---

## Related Rules

* Rule 3: Write sargable WHERE conditions

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search

---

## Built-in Full-Text Search vs Dedicated Search Engine

---

## Decision Context

Choosing between database built-in full-text search (MySQL FULLTEXT, PostgreSQL tsvector) and a dedicated search engine (Elasticsearch, Meilisearch, Algolia).

---

## Decision Criteria

* performance: dedicated engines scale better for high-volume search
* architectural: separate infrastructure vs no additional dependency
* maintainability: dedicated engine adds ops complexity
* security: search engine may need separate access controls

---

## Decision Tree

Need search functionality?

↓

What's the search complexity?

↓

Simple keyword search on 1-2 text columns?

YES → Database full-text search is sufficient

    ↓
    < 1M rows? Database full-text works well
    > 1M rows? Still works but may need tuning

NO → Advanced search features needed?

    YES → Typo tolerance? Faceted search? Synonyms?
    
        YES → Consider dedicated search engine
            Elasticsearch, Meilisearch, Typesense, Algolia
        
        NO → Complex ranking/filtering?
        
            YES → Consider dedicated search engine
            
            NO → Database full-text search

NO → High query volume (> 1000 search requests/second)?

    YES → Consider dedicated search engine (offloads DB)
    
    NO → Database full-text search is sufficient

---

## Rationale

Database full-text search is simpler (no extra infrastructure) and works well for basic needs. Dedicated search engines handle advanced features (fuzzy matching, faceted search, ML-ranked results) and offload search traffic from the primary database.

---

## Recommended Default

**Default:** Start with database full-text search, switch to dedicated engine when needs grow
**Reason:** Database full-text is free, simple, and sufficient for most applications. Add complexity only when features or scale demand it.

---

## Risks Of Wrong Choice

Dedicated search engine for simple search: unnecessary ops burden, added latency for sync, cost. Database full-text for advanced search: poor search quality, missing features, DB CPU contention.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Design GIN Indexes for JSONB and Full-Text Search
