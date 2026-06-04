| Metadata | |
|---|---|
| KU ID | K002 |
| Subdomain | full-text-search-engines |
| Topic | Scout Database Engine |
| Source | Laravel Docs / Scout |
| Maturity | Stable |

## Overview

Scout's `database` engine performs search queries directly against the application's database using MySQL FULLTEXT indexes or PostgreSQL `tsvector`/`tsquery`. It requires no external search server, making it ideal for applications where search server infrastructure is not justified. Combined with the `SearchUsingFullText` and `SearchUsingPrefix` attributes, it provides effective full-text search for datasets up to ~50K records.

## Core Concepts

- **Database-Backed Search**: Uses MySQL FULLTEXT or PostgreSQL `tsvector` indexes via `MATCH ... AGAINST` or `tsvector` queries.
- **No External Server**: Searches happen in the same database as your application data.
- **SearchUsingFullText**: Attribute marking columns for FULLTEXT/tsvector search.
- **SearchUsingPrefix**: Attribute for prefix matching (`example%`) on identifier columns.
- **Fallback to LIKE**: If no FULLTEXT index is found, Scout falls back to `LIKE` queries.

## When To Use

- MySQL/PostgreSQL-based Laravel applications with <50K searchable records
- Prototyping before migrating to a dedicated search engine
- Applications where search server infrastructure cost or complexity is not justified
- Simple search needs — single collection, basic text matching
- Applications already on PostgreSQL (better FTS support than MySQL)

## When NOT To Use

- Datasets >100K records with high traffic (competing with OLTP resources)
- Applications needing typo tolerance, faceted search, or fuzzy matching
- High write throughput (FULLTEXT indexes add write overhead)
- Multi-language search requiring language-specific stemming
- When search server features (analytics, personalization) are required

## Best Practices

1. **Create FULLTEXT/GIN indexes** before using SearchUsingFullText attribute.
2. **Use Boolean Mode** (Scout default) to avoid MySQL's 50% threshold issue.
3. **Configure MySQL `innodb_ft_min_token_size`** or PostgreSQL `default_text_search_config` for your content.
4. **Combine FULLTEXT with B-tree indexes** on frequently filtered columns.
5. **Consider read replicas** for search-heavy workloads.

## Architecture Guidelines

- Set `SCOUT_DRIVER=database` in `.env`.
- Add `SearchUsingFullText` attribute to model columns that need full-text search.
- Add `SearchUsingPrefix` attribute for identifier columns (emails, SKUs).
- Create FULLTEXT indexes via Laravel migrations: `$table->fullText(['title', 'body'])`.
- PostgreSQL requires GIN indexes on `tsvector` columns.

## Performance Considerations

- FULLTEXT search is 10-100x faster than `LIKE` on >10K rows.
- FULLTEXT indexes add 30-50% overhead on insert/update operations.
- Without FULLTEXT index, Scout falls back to `LIKE` (100-1000x slower).
- Search queries compete with transactional queries for database resources.
- Read replicas offload search traffic from the primary database.

## Security Considerations

- MySQL FULLTEXT search is vulnerable to SQL injection if not parameterized (Scout handles this).
- Avoid exposing raw Boolean Mode operators to end users.
- Use Scout's `where()` for safe filtering.
- Monitor for computationally expensive wildcard queries.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| No FULLTEXT index created | Missing migration | LIKE fallback, slow | Add index in migration |
| Using Natural Language Mode | MySQL default | 50% threshold, zero results | Use Boolean Mode |
| Not configuring min token size | Default (3) acceptable? | Short terms not indexed | Set based on content |
| Expecting Algolia features | Underestimating limitations | Poor UX | Use dedicated engine |

## Anti-Patterns

- **Using database engine when search features are needed**: Switch to dedicated engine for typo tolerance, faceting.
- **Full-table LIKE scans**: Always ensure FULLTEXT indexes exist.
- **Mixing database engine with relationship filters**: Database engine does not support cross-model filtering like dedicated engines.

## Related Topics

- K015 (SearchUsingFullText attribute)
- K016 (SearchUsingPrefix attribute)
- K003 (Scout collection engine)

## AI Agent Notes

- Database engine is severely underutilized in the Laravel ecosystem.
- For <50K record apps, eliminates need for external search server.
- Use with MySQL Boolean Mode to avoid the 50% threshold issue.
- For agents: recommend as the starting point before jumping to dedicated search engines.

## Verification

- [ ] SCOUT_DRIVER=database configured
- [ ] FULLTEXT/GIN indexes created via migration
- [ ] SearchUsingFullText attribute applied
- [ ] Boolean Mode search returns expected results
- [ ] Performance measured against LIKE fallback
- [ ] Short word handling configured per database
