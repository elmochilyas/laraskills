# Skill: Design GIN Indexes for JSONB and Full-Text Search

## Purpose

Use PostgreSQL GIN indexes for multi-valued data — JSONB containment (`@>`), array overlap (`&&`), full-text search (`@@` on tsvector), and trigram-based LIKE searches (`pg_trgm`) — selecting appropriate operator classes for query patterns.

## When To Use

- JSONB containment queries (`WHERE data @> '{"status": "active"}'`)
- Array overlap/membership queries
- Full-text search on tsvector columns
- LIKE/ILIKE searches via pg_trgm extension

## When NOT To Use

- Simple equality or range queries (use B-Tree)
- Frequently updated JSONB columns (GIN write overhead is high)

## Prerequisites

- Understanding of inverted index structure
- PostgreSQL database with appropriate extensions (pg_trgm for trigram)

## Inputs

- Column type (JSONB, array, tsvector, text)
- Query operators (@>, ?, &&, @@, LIKE, ILIKE)
- Update frequency of indexed column

## Workflow

1. Identify the data type and query operators needed
2. For JSONB containment: use `jsonb_path_ops` operator class for best performance
3. For full-text: create generated tsvector column, GIN index on it
4. For trigram: `CREATE EXTENSION pg_trgm; CREATE INDEX ON table USING GIN (col gin_trgm_ops)`
5. Use appropriate operators in queries

## Validation Checklist

- [ ] jsonb_path_ops used for JSONB (unless ?/?|/?& operators are needed)
- [ ] Write-heavy JSONB columns evaluated for GIN maintenance overhead
- [ ] pg_trgm extension created for trigram-based GIN indexes
- [ ] Full-text search uses tsvector column, not raw text

## Common Failures

### Not specifying jsonb_path_ops
`CREATE INDEX ON data USING GIN (data)` uses default opclass. `jsonb_path_ops` is smaller and faster for containment queries.

### GIN on frequently updated JSONB
Each update requires decompressing and recompressing the posting list. Write-heavy JSONB columns should use B-Tree on specific paths instead.

## Decision Points

### GIN vs GiST for full-text?
GIN is faster for querying (up to 10x), slower to update. GiST is faster to update, slower to query.

### jsonb_path_ops vs default?
Use jsonb_path_ops for containment queries (`@>`). Use default if you need `?`, `?|`, `?&` operators.

## Performance Considerations

GIN indexes are larger than B-Tree but more efficient for multi-valued data. Write-heavy tables with GIN indexes need careful vacuum tuning.

## Security Considerations

GIN indexes on JSONB columns may expose data patterns in index size. Use RLS with aligned indexes for multi-tenant data isolation.

## Related Rules

- Use jsonb_path_ops for JSONB containment queries
- Avoid GIN on frequently updated JSONB columns
- Use pg_trgm for LIKE/ILIKE search performance

## Related Skills

- Design B-Tree Indexes for Equality and Range Queries
- Design GiST Indexes for Geospatial and Range Queries
- Apply Functional Expression Indexes

## Success Criteria

- GIN index correctly serves JSONB/array/tsvector queries
- Appropriate operator class selected for query pattern
- Write-heavy columns evaluated for GIN maintenance cost
- EXPLAIN confirms index usage
