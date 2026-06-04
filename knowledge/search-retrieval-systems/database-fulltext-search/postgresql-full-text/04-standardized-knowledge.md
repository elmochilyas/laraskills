| Metadata | |
|---|---|
| Knowledge Unit ID | ku-02 |
| Subdomain | full-text-search-engines |
| Topic | PostgreSQL Full-Text Search |
| Source | PostgreSQL Docs / Laravel Scout |
| Maturity | Stable |

## Overview

PostgreSQL provides advanced full-text search via 	svector (document representation) and 	squery (query representation) types, combined with 	s_rank() for relevance ranking and 	s_headline() for result highlighting. GIN indexes accelerate tsvector searches. PostgreSQL's FTS offers configurable text search configurations (dictionaries, stemming, stop words) per language.

## Core Concepts

- **tsvector**: A sorted list of lexemes (normalized words) with positional information
- **tsquery**: A boolean query against tsvector using & (AND), | (OR), ! (NOT), <-> (followed by)
- **GIN Index**: Generalized Inverted Index for accelerating tsvector @@ tsquery operations
- **Text Search Configuration**: Language-specific dictionaries, stemmers, stop words
- **ts_rank / ts_rank_cd**: Relevance ranking functions (BM25-based)
- **ts_headline**: Snippet generation with search term highlighting

## When To Use

- PostgreSQL-based Laravel applications needing native full-text search
- Multi-language content (built-in language support per column)
- Applications requiring advanced phrase search (word1 <-> word2 for proximity)
- Combination with pgvector for hybrid keyword + vector search

## When NOT To Use

- Applications needing typo tolerance (requires pg_trgm extension)
- High-write tables (GIN index maintenance overhead)
- Need for faceted search or instant search-as-you-type
- Simple prefix matching only (LIKE with B-tree is more efficient)

## Best Practices

1. **Use generated tsvector columns** with GIN indexes for query-time performance.
2. **Specify the correct text search configuration** per column language.
3. **Use 	s_rank() with normalization** for consistent scoring across queries.
4. **Combine with GIN indexes** — without them, FTS performs sequential scans.
5. **Set default_text_search_config** in postgresql.conf for session defaults.
6. **Schedule REINDEX** for GIN indexes under heavy write load (index bloat).

## Architecture Guidelines

- Generated column: ALTER TABLE posts ADD search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED
- GIN index: CREATE INDEX posts_search_idx ON posts USING GIN(search_vector)
- Scout translates to 	o_tsvector(column) @@ plainto_tsquery(?) with 	s_rank() ordering
- Use websearch_to_tsquery() for safer user-facing query parsing

## Performance Considerations

- GIN indexes are read-optimized but slow writes (30-50% overhead)
- GIN index bloat from frequent updates — schedule periodic REINDEX
- 	s_rank() computation adds marginal cost per row
- Generated columns add write-time overhead but improve read performance
- Sequential scan without GIN on large tables is prohibitive

## Security Considerations

- PostgreSQL FTS is not directly vulnerable to SQL injection with parameterized queries
- Use websearch_to_tsquery() instead of 	o_tsquery() for user input to avoid complex query injection
- Generated tsvector columns avoid runtime computation overhead
- Monitor for expensive ranking queries on large result sets

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No GIN index created | Missing index step | Full sequential scan | Add GIN index after data load |
| Wrong text search configuration | English default assumed | Poor stemming for other languages | Specify per-column config |
| Not using generated columns | Runtime tsvector computation | Query-time overhead | Use generated columns |
| Ignoring GIN index bloat | No maintenance plan | Degraded query performance | Schedule periodic REINDEX |

## Anti-Patterns

- **Full sequential scan on tsvector**: Always pair @@ with GIN index
- **Using 	o_tsquery() with raw user input**: Use plainto_tsquery() or websearch_to_tsquery()
- **Same configuration for all languages**: Each column should specify its language
- **Ignoring dictionary management**: Custom dictionaries needed for domain-specific terms

## Examples

`php
// Migration
Schema::table('posts', function (Blueprint ) {
    ->fullText(['title', 'body']); // Laravel creates tsvector + GIN
});

// Model with SearchUsingFullText
class Post extends Model
{
    use Searchable;
    
    #[SearchUsingFullText(['title', 'body'])]
    public function toSearchableArray(): array
    {
        return ['title' => ->title, 'body' => ->body];
    }
}
`

## Related Topics

- K041 (pgvector extension)
- K045 (pgvector + FTS hybrid)
- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)

## AI Agent Notes

- PostgreSQL FTS is more capable than MySQL FULLTEXT (BM25, configurable dictionaries, phrase search)
- Combining with pgvector enables full hybrid search within single database
- Generated tsvector columns are preferred to runtime computation
- For agents: recommend for PostgreSQL apps needing robust FTS without separate engine

## Verification

- [ ] tsvector generated column created
- [ ] GIN index on tsvector column
- [ ] Search returns results with proper stemming
- [ ] Phrase search (<-> operator) works
- [ ] Text search configuration set per language
- [ ] REINDEX scheduled for index maintenance
