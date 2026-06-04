# Metadata

**Domain:** Search & Retrieval Systems
**Subdomain:** Database Fulltext Search
**Knowledge Unit:** Scout Database Engine
**Generated:** 2026-06-03

---

# Decision Inventory

1. Database Engine vs Dedicated Search Engine
2. Full-Text vs LIKE/Prefix Search
3. Scout Database vs Collection Engine Selection

---

# Architecture-Level Decision Trees

## Database Engine vs Dedicated Search Engine

---

### Decision Context

When implementing Scout Database Engine, you must decide whether to use the built-in database full-text search or migrate to a dedicated search appliance.

### Decision Criteria

* architectural
* performance
* cost

### Decision Tree

Are your search needs limited to basic keyword matching across text columns?
|
YES -> Database full-text engine is sufficient
    |
    Which database does your application use?
    MySQL -> Use MySQL FULLTEXT indexes with MATCH...AGAINST
    PostgreSQL -> Use PostgreSQL FTS with tsvector/tsquery
    SQLite -> Use FTS5 virtual tables
    |
    Do you need relevance ranking, typo tolerance, or faceted search?
    NO -> Database engine is the right choice
    YES -> Consider migrating to dedicated search engine
NO -> Do you need instant search, typo tolerance, or vector search?
    YES -> Evaluate dedicated engines: Meilisearch, Typesense, or Algolia
    NO -> Scout's database/collection engines may still suffice

### Rationale

Database full-text search is zero-infrastructure and leverages existing PostgreSQL/MySQL capabilities. Dedicated engines provide better relevance, typo tolerance, and advanced features at the cost of additional infrastructure.

### Recommended Default

**Default:** Start with database full-text search; migrate to dedicated engine when advanced features are needed.
**Reason:** Minimal infrastructure overhead with a clear migration path.

### Risks Of Wrong Choice

- Dedicated engine for basic needs: unnecessary infrastructure cost and complexity
- Database engine for advanced search: poor relevance and limited features
- No proper indexing: full table scans and poor query performance

### Related Rules

- Follow Best Practices for Scout Database Engine

### Related Skills

- Configure and Implement Scout Database Engine

---

## Full-Text vs LIKE/Prefix Search

---

### Decision Context

When implementing Scout Database Engine, you must choose between SQL FULLTEXT indexes and simple LIKE/prefix searches for text matching.

### Decision Criteria

* performance
* accuracy

### Decision Tree

Do you need to search within words (middle of text), not just prefixes?
|
YES -> Use FULLTEXT index with MATCH...AGAINST (MySQL) or tsvector (PostgreSQL)
    |
    Is the search query user-facing (public search bar)?
    YES -> FULLTEXT search is the correct choice for UX
    NO -> FULLTEXT still preferred for non-prefix matching
NO -> Is prefix-only matching sufficient?
    YES -> LIKE 'prefix%' or WHERE col LIKE 'term%' is simpler
    NO -> FULLTEXT index is required for partial word matching
|
Do you need to rank results by relevance?
YES -> FULLTEXT with relevance scoring (MATCH...AGAINST IN BOOLEAN MODE)
NO -> LIKE queries are sufficient for simple matching

### Rationale

FULLTEXT indexes enable efficient word-level searches with relevance ranking that LIKE queries cannot provide. LIKE queries are only suitable for prefix matching on small datasets.

### Recommended Default

**Default:** Use FULLTEXT indexes for any user-facing search; LIKE for admin-only simple prefix filters.
**Reason:** Balances query performance with search quality.

### Risks Of Wrong Choice

- LIKE on large datasets: full table scans and poor performance
- FULLTEXT for simple prefix: unnecessary complexity

### Related Rules

- Follow Best Practices for Scout Database Engine

### Related Skills

- Configure and Implement Scout Database Engine

---

## Scout Database vs Collection Engine Selection

---

### Decision Context

When configuring Scout Database Engine with Laravel Scout, you must decide between the database engine and the collection engine.

### Decision Criteria

* performance
* architectural

### Decision Tree

Is your database PostgreSQL or MySQL (supports FULLTEXT indexes)?
|
YES -> Use Scout's database engine for true SQL FULLTEXT searching
    |
    Do you need cross-model or joined search results?
    NO -> Database engine handles single-model search well
    YES -> Consider collection engine or dedicated search
NO -> Is your database SQLite or another non-FULLTEXT backend?
    YES -> Scout's collection engine (in-memory filtering) is available
    |
    Is your dataset small (< 1000 records)?
    YES -> Collection engine is acceptable
    NO -> A dedicated search engine is strongly recommended

### Rationale

The database engine leverages native FULLTEXT indexes for efficient searching. The collection engine performs in-memory filtering and is only suitable for small datasets.

### Recommended Default

**Default:** Database engine for MySQL/PostgreSQL; dedicated engine for large datasets on SQLite.
**Reason:** Leverages database-native search capabilities where available.

### Risks Of Wrong Choice

- Collection engine on large datasets: memory exhaustion and slow queries
- Database engine without FULLTEXT index: poor performance

### Related Rules

- Follow Best Practices for Scout Database Engine

### Related Skills

- Configure and Implement Scout Database Engine

