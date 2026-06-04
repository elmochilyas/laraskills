# Knowledge Unit: Scout Database Engine (MySQL/PostgreSQL FTS)

## Metadata

- **ID:** K002
- **Subdomain:** Full-Text Search Engines
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** Low-complexity search, no external deps

## Executive Summary

Scout's database engine leverages MySQL FULLTEXT indexes and PostgreSQL `tsvector`/`tsquery` to perform full-text search directly on the database without requiring an external search server. It is the simplest Scout driver — no server setup, no API keys, no queue workers required. Best suited for applications with <50K records and straightforward search needs.

## Core Concepts

- **No External Dependency**: Searches are executed against the application's existing database. No separate search server.
- **Database-Native FTS**: Uses MySQL `MATCH ... AGAINST` or PostgreSQL `@@ tsquery` operators.
- **LIKE Fallback**: By default, performs LIKE queries on all searchable columns. The `SearchUsingFullText` and `SearchUsingPrefix` attributes optimize this.
- **Index Requirements**: MySQL requires FULLTEXT indexes. PostgreSQL requires GIN indexes on tsvector columns.

## Internal Mechanics

The database engine adapter constructs SQL queries combining the search term with model WHERE clauses. For MySQL, it generates `MATCH(columns) AGAINST(? IN BOOLEAN MODE)`. For PostgreSQL, it uses `to_tsvector(column) @@ plainto_tsquery(?)`. Results are ordered by relevance (MySQL's default TF-IDF or PostgreSQL's `ts_rank`).

## Patterns

- **Small to medium datasets**: <50K records, simple search needs.
- **Development/staging**: No search server setup needed for dev environments.
- **Prototyping**: Quick search implementation before migrating to dedicated engine.
- **Combined with attributes**: Use `SearchUsingFullText` and `SearchUsingPrefix` to optimize specific columns.

## Architectural Decisions

Scout includes the database engine as a first-class driver (not a community package) because it provides a zero-infrastructure path to search. Teams can start with it and switch to a dedicated engine by changing `SCOUT_DRIVER`.

## Tradeoffs

| Factor | Database Engine | Dedicated Engine |
|---|---|---|
| Infrastructure | None | Search server (self-hosted or cloud) |
| Scale limit | ~50K-100K records | Millions |
| Relevance tuning | Limited (TF-IDF/BM25) | Extensive (ranking rules, custom) |
| Typo tolerance | None (unless using pg_trgm) | Built-in |
| Faceting | Manual (GROUP BY) | Built-in |
| Performance under load | Competes with OLTP resources | Isolated |

## Performance Considerations

- FULLTEXT/GIN indexes are fast for search (10-100ms on 1M rows) but slower than dedicated engines.
- GIN indexes increase write overhead (30-50% slower inserts).
- LIKE-based fallback is 100-1000x slower than FTS on large tables.
- Database engine queries compete with application OLTP for database CPU and I/O.

## Production Considerations

- **Create FULLTEXT/GIN indexes** before using the database engine.
- **Monitor database load** — search queries compete with transactional queries.
- **Consider read replicas** for search-heavy workloads.
- **Use `SearchUsingFullText`** attribute to avoid LIKE fallback performance.
- **Cannot use `shouldBeSearchable()`** — the database engine searches the table directly.

## Common Mistakes

- Using the database engine with >100K records and high traffic.
- Not creating FULLTEXT/GIN indexes — falls back to LIKE scans.
- Expecting typo tolerance or fuzzy matching (PostgreSQL `pg_trgm` can help but requires separate setup).
- Not considering the performance impact on database query load.

## Failure Modes

- **Full table scans**: Missing FULLTEXT index leads to seq scans — 2-10 seconds on 1M rows.
- **Database CPU saturation**: Heavy search load competes with transactional workload.
- **MySQL 50% threshold**: Terms appearing in >50% of rows return zero results in NATURAL LANGUAGE MODE.

## Ecosystem Usage

Used in development environments and small production applications. A common starting point that teams graduate from as they scale.

## Related Knowledge Units

- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)
- K001 (Searchable trait)

## Research Notes

Sources: Laravel Scout docs, MySQL FTS docs, PostgreSQL FTS docs. The database engine is severely underutilized — for small datasets it eliminates significant operational complexity. MySQL uses TF-IDF, PostgreSQL uses BM25 ranking. PostgreSQL offers more configurable tokenization and stemming via text search configurations.


## Mental Models

- **Central Switchboard**: Laravel Scout is like a switchboard operator — you tell it which model to search and which engine to use, and it connects them without you handling the wiring.
- **Adapter Pattern**: Scout is the universal power outlet adapter. Your application speaks one language (Scout), and Scout translates to whatever search engine you plug in.

