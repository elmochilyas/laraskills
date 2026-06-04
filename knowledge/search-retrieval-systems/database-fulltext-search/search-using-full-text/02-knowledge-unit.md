# Knowledge Unit: SearchUsingFullText Attribute

## Metadata

- **ID:** K015
- **Subdomain:** Full-Text Search Engines
- **Source:** Laravel Docs / Scout
- **Maturity:** Stable
- **Laravel Relevance:** MySQL/PostgreSQL FTS optimization

## Executive Summary

The `SearchUsingFullText` attribute (introduced in Laravel 11) allows Scout's database engine to use database-native full-text indexes (`FULLTEXT` in MySQL, `tsvector`/GIN in PostgreSQL) for specific model columns instead of the default LIKE query. This dramatically improves search performance and relevance for the database engine.

## Core Concepts

- **Column-Level Optimization**: Applied to individual model properties to indicate which columns have FULLTEXT/GIN indexes.
- **Database-Specific Behavior**: MySQL uses `MATCH ... AGAINST`, PostgreSQL uses `to_tsvector() @@ to_tsquery()`.
- **Prerequisite**: The target column must have a FULLTEXT index (MySQL) or a GIN index on the tsvector expression (PostgreSQL).
- **Scout's Database Engine**: Only effective when using the `database` Scout driver.

## Internal Mechanics

When Scout's database engine builds the search query, it checks for models with the `SearchUsingFullText` attribute on their properties. For attributed columns, it generates `MATCH(column) AGAINST(? IN BOOLEAN MODE)` (MySQL) or `to_tsvector(column) @@ plainto_tsquery(?)` (PostgreSQL) instead of `column LIKE ?`.

## Patterns

- **Apply to text-heavy columns**: `body`, `description`, `content` — columns users search against most.
- **Combine with SearchUsingPrefix**: Use FullText for body text, Prefix for IDs and codes.
- **Create matching indexes**: Always ensure the database has the appropriate index before adding the attribute.

## Architectural Decisions

The attribute-based approach was chosen over configuration arrays because it keeps search optimization co-located with model property definitions, making it easier to reason about which columns use which search strategy.

## Tradeoffs

- Full-text search is faster and more relevant than LIKE, but requires index maintenance overhead.
- FULLTEXT/GIN indexes increase write time and storage.
- MySQL's FULLTEXT has a default 3-character minimum and stopword list.
- PostgreSQL's tsvector requires choosing a text search configuration (language).

## Performance Considerations

- Full-text search is 10-100x faster than LIKE on indexed columns with >10K rows.
- FULLTEXT/GIN indexes are read-optimized but slow down writes (30-50% overhead on insert/update).
- Without the attribute and matching index, the database engine falls back to LIKE scans.

## Production Considerations

- **Create the FULLTEXT/GIN index before** adding the attribute. Otherwise, queries fail.
- **MySQL**: Ensure `innodb_ft_min_token_size` is configured for your use case (default 3).
- **PostgreSQL**: Use generated tsvector columns with GIN indexes for query-time performance.
- **Monitor index bloat**: GIN indexes can bloat under heavy write load. Schedule REINDEX.

## Common Mistakes

- Adding the attribute without creating the database index first — queries error.
- Using with MySQL NATURAL LANGUAGE MODE (50% threshold issue) — use BOOLEAN MODE (Scout handles this).
- Not rebuilding the index after changing `innodb_ft_min_token_size`.
- On PostgreSQL, not specifying the correct text search configuration for the column's language.

## Failure Modes

- Missing index → query error or silent fallback to LIKE depending on MySQL/PostgreSQL version.
- MySQL 50% threshold → zero results for common terms in NATURAL LANGUAGE MODE.
- PostgreSQL GIN index bloat → slowing queries over time without REINDEX maintenance.

## Ecosystem Usage

Recommended for any production use of Scout's database engine with text-heavy search columns.

## Related Knowledge Units

- K002 (Scout database engine)
- K016 (SearchUsingPrefix attribute)
- K003 (Scout collection engine)

## Research Notes

Sources: Laravel 11.x+ docs, MySQL FULLTEXT docs, PostgreSQL FTS docs. The attribute was introduced alongside `SearchUsingPrefix` to address the database engine's biggest weakness — the default LIKE-based search. Using these two attributes correctly makes the database engine viable for production use.


## Mental Models

- **Library Index Cards**: Full-text search is like having index cards for every word in every book. You find documents instantly by looking up words in the card catalog.

