# Skill: Implement Full-Text Search Indexes

## Purpose

Implement full-text search indexes — MySQL `FULLTEXT` with `MATCH...AGAINST`, and PostgreSQL GIN on `tsvector` with `@@` operator — enabling natural language search with word stemming, stop words, and relevance ranking.

## When To Use

- Natural language search across text columns
- Search requiring word stemming, ranking, and stop word handling
- Boolean search with operators (+, -, *, "")
- Multi-column text search

## When NOT To Use

- Simple pattern matching (LIKE with prefix is fine with B-Tree)
- Exact match or simple equality (use B-Tree)
- Search on short strings with low information content

## Prerequisites

- Understanding of full-text search concepts (stemming, stop words, ranking)
- MySQL FULLTEXT index or PostgreSQL GIN/tsvector

## Inputs

- Text columns to search
- Search configuration (language, operator mode)
- Search query string

## Workflow

1. For MySQL: add FULLTEXT index, query with `WHERE MATCH(title, body) AGAINST('search terms' IN BOOLEAN MODE)`
2. For PostgreSQL: add generated tsvector column, GIN index, query with `WHERE tsv @@ to_tsquery('english', 'search & terms')`
3. Test ranking and relevance for the use case
4. Tune configuration (stop words, minimum word length)

## Validation Checklist

- [ ] FULLTEXT index on MySQL or GIN index on PostgreSQL
- [ ] Query uses the correct search operator (MATCH...AGAINST or @@)
- [ ] Search returns relevant results with proper ranking
- [ ] Boolean mode used when operators (+, -, *) are needed

## Common Mistakes

### Not using FULLTEXT index
LIKE with wildcards for text search performs full table scan. Use FULLTEXT (MySQL) or GIN on tsvector (PostgreSQL).

## Decision Points

### Full-text vs LIKE?
Full-text for natural language search with ranking. LIKE for simple substring matching (with pg_trgm for performance).

### MySQL FULLTEXT vs PostgreSQL tsvector?
Both are effective. PostgreSQL tsvector offers more control (dictionaries, custom configurations). MySQL FULLTEXT is simpler to set up.

## Performance Considerations

Full-text indexes are optimized for search but have write overhead. Generate tsvector columns (PostgreSQL) via triggers or generated columns to keep the index current.

## Security Considerations

Full-text search can expose data patterns. Ensure search is scoped to authorized data. Consider SQL injection in search queries — use parameterized queries.

## Related Rules

- Always index text columns used in full-text search
- Use generated columns for tsvector (PostgreSQL)
- Parameterize search queries

## Related Skills

- Design GIN Indexes for JSONB and Full-Text
- Design B-Tree Indexes for Equality and Range Queries
- Design GiST Indexes for Geospatial and Range Queries

## Success Criteria

- Full-text search returns relevant, ranked results
- Index supports the search queries (confirmed by EXPLAIN)
- Appropriate database-specific implementation chosen
- Search is performant at expected data volume
