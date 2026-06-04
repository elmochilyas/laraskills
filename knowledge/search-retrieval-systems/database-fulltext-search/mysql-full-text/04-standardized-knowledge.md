| Metadata | |
|---|---|
| Knowledge Unit ID | ku-01 |
| Subdomain | full-text-search-engines |
| Topic | MySQL Full-Text Search |
| Source | MySQL Docs / Laravel Scout |
| Maturity | Stable |

## Overview

MySQL FULLTEXT indexes enable full-text search directly in the database using MATCH ... AGAINST syntax. Scout's database engine leverages these indexes when the SearchUsingFullText attribute is applied to model columns. MySQL supports Boolean Mode (with +/- operators), Natural Language Mode (relevance-based), and Query Expansion. Default minimum word length is 3 characters.

## Core Concepts

- **FULLTEXT Index**: Special index type on CHAR/VARCHAR/TEXT columns for word-based search
- **Boolean Mode**: Supports +word (must include), -word (must exclude), * (wildcard)
- **Natural Language Mode**: Relevance-based sorting using TF-IDF; 50% threshold rule
- **Query Expansion**: Automatically adds related terms from top result documents
- **50% Threshold**: In Natural Language Mode, terms in >50% of rows return zero results

## When To Use

- MySQL-based Laravel applications with <50K records
- Prototyping before migrating to dedicated search engine
- Applications where search server infrastructure is not justified
- Hybrid with Scout for low-complexity search needs

## When NOT To Use

- >100K records with high traffic (competes with OLTP resources)
- Applications needing typo tolerance, faceted search, or fuzzy matching
- High write throughput (FULLTEXT indexes add write overhead)
- Multi-language search needing language-specific stemming

## Best Practices

1. **Always create FULLTEXT indexes** before using SearchUsingFullText attribute.
2. **Use Boolean Mode** (Scout's default) to avoid the 50% threshold issue.
3. **Configure innodb_ft_min_token_size** for your content (default 3 may be too high for code/search terms).
4. **Use SearchUsingPrefix** for identifier columns (SKUs, emails) alongside FULLTEXT.
5. **Monitor index bloat** on high-write tables.

## Architecture Guidelines

- Create FULLTEXT indexes via migrations: $table->fullText(['title', 'body']);
- Scout translates Model::search() to MATCH(columns) AGAINST(? IN BOOLEAN MODE)
- Combine FULLTEXT with B-tree indexes on frequently filtered columns
- Consider read replicas for search-heavy workloads
- Falls back to LIKE if no FULLTEXT index on the column

## Performance Considerations

- FULLTEXT search is 10-100x faster than LIKE on >10K rows
- FULLTEXT indexes add 30-50% overhead on insert/update
- Without FULLTEXT index, Scout falls back to LIKE scans (100-1000x slower)
- Search queries compete with transactional queries for database resources

## Security Considerations

- MySQL FULLTEXT search is vulnerable to SQL injection if not using parameterized queries (Scout handles this)
- Avoid exposing raw Boolean Mode operators to end users
- Use Scout's where() for safe filtering
- Monitor for computationally expensive wildcard queries

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No FULLTEXT index created | Missing migration step | Falls back to LIKE, slow performance | Add index in migration |
| Using Natural Language Mode by default | Default MySQL behavior | 50% threshold causes zero results | Use Boolean Mode |
| Not configuring min token size | Default size (3) acceptable? | Short terms not indexed | Set based on content type |
| Mixing FULLTEXT and non-FULLTEXT columns in search | Not using SearchUsingFullText | Like fallback on some columns | Attribute all searchable columns |

## Anti-Patterns

- **Full-table scans**: Searching without indexes on large tables
- **Re-indexing FULLTEXT unnecessarily**: MySQL manages index automatically
- **Expecting Algolia/Meilisearch features**: MySQL has no built-in typo tolerance, faceting, or personalization
- **Using LIKE for production search**: 100-1000x slower than FULLTEXT

## Examples

`php
// Migration
Schema::table('posts', function (Blueprint ) {
    ->fullText(['title', 'body']);
});

// Model
class Post extends Model
{
    use Searchable;
    
    #[SearchUsingFullText(['title', 'body'])]
    protected function searchableAttributes(): array
    {
        return ['title', 'body', 'author'];
    }
}
`

## Related Topics

- K002 (Scout database engine)
- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)

## AI Agent Notes

- MySQL FULLTEXT is severely underutilized in Laravel ecosystem
- For sub-50K record apps, eliminates need for external search server
- Boolean Mode avoids the 50% threshold pitfall that catches many developers
- For agents: recommend as starting point before jumping to dedicated engines

## Verification

- [ ] FULLTEXT index created via migration
- [ ] SearchUsingFullText attribute applied to model
- [ ] Boolean Mode search returns expected results
- [ ] Performance measured against LIKE fallback
- [ ] Short word handling configured (innodb_ft_min_token_size)
- [ ] 50% threshold behavior understood
