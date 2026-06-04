# Decision Trees for 4-9 Like Leading Wildcard

## Metadata

| Field | Value |
|-------|-------|
| ID | 4-9 |
| Title | Like Leading Wildcard |
| Decision Type | Query Optimization Profiling |

## Decision Inventory

- D1: LIKE pattern type → optimization strategy
- D2: Full-text search vs pg_trgm vs external search
- D3: When to accept full table scan

## Architecture-Level Decision Trees

### D1: LIKE pattern type → optimization strategy

**Decision Context**: Determine whether a LIKE query can use B-Tree index or needs alternative.

**Criteria**:
- Wildcard position (leading, trailing, both)
- Column type and size
- Query frequency

**Tree**:
```
Is the wildcard only trailing?
├── Yes (LIKE 'prefix%')
│   └── B-Tree index works (range scan)
└── No (LIKE '%suffix' or '%middle%')
    └── Is full-text search an option?
        ├── Yes → Use FULLTEXT/MATCH or tsvector @@
        └── No → pg_trgm or external search engine
```

**Rationale**: Trailing wildcard is sargable — B-Tree treats it as a range. Leading wildcard requires alternative indexing strategy.

**Default**: Trailing wildcard uses B-Tree; leading wildcard uses full-text index.

**Risks**: Full-text search has different semantics than LIKE (stemming, stop words). Verify correctness.

**Related Rules/Skills**: 3-13 (full-text indexes), 3-28 (sargability rule)

---

### D2: Full-text search vs pg_trgm vs external search

**Decision Context**: Choose the appropriate search technology for leading wildcard queries.

**Criteria**:
- Database (MySQL vs PostgreSQL)
- Search complexity
- Infrastructure budget
- Latency requirements

**Tree**:
```
Which database?
├── PostgreSQL
│   ├── Need substring/typo-tolerant search?
│   │   ├── Yes → pg_trgm (GIN trigram index)
│   │   └── No → GIN tsvector @@ tsquery
│   └── Need full-featured search?
│       └── External (Meilisearch, Algolia, Typesense)
└── MySQL
    ├── Need leading wildcard on small text?
    │   └── FULLTEXT MATCH...AGAINST (Boolean mode)
    └── Complex search across multiple columns/tables?
        └── External search engine via Laravel Scout
```

**Rationale**: PostgreSQL's pg_trgm enables `ILIKE '%search%'` with index support — unique to PostgreSQL. MySQL FULLTEXT works for natural language but not arbitrary substring matching.

**Default**: PostgreSQL → pg_trgm for `%search%`; MySQL → FULLTEXT for natural language; Scout for complex search.

**Risks**: pg_trgm index size scales with text length. External search adds infrastructure complexity.

**Related Rules/Skills**: 2-29 (Laravel Scout integration), 12-6 (full-text search tsvector)

---

### D3: When to accept full table scan

**Decision Context**: Determine when leading wildcard LIKE is acceptable despite full scan.

**Criteria**:
- Table size
- Query frequency
- Data staleness tolerance

**Tree**:
```
Is the table small (< 10k rows)?
├── Yes → Acceptable (full scan is fast enough)
└── No
    └── Is the query very infrequent (< 100x/day)?
        ├── Yes → Acceptable if response time budget allows
        └── No → Must optimize
```

**Rationale**: Full scans on small tables are negligible. Infrequent queries on medium tables may be acceptable during low-load periods.

**Default**: Optimize all leading wildcard queries on tables > 10k rows with frequency > 100/day.

**Risks**: As table grows, previously acceptable queries degrade silently.

**Related Rules/Skills**: 4-7 (sargable vs non-sargable)

---
