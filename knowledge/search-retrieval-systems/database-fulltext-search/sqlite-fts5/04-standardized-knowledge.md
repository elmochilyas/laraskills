| Metadata | |
|---|---|
| Knowledge Unit ID | ku-03 |
| Subdomain | full-text-search-engines |
| Topic | SQLite FTS5 |
| Source | SQLite Docs / Laravel |
| Maturity | Stable |

## Overview

SQLite provides FTS5 (Full-Text Search version 5) as a virtual table module for full-text indexing and search. FTS5 supports BM25 ranking, prefix queries, tokenizers, and content sync tables. While not natively supported by Laravel Scout's database engine (which targets MySQL/PostgreSQL), SQLite FTS5 is valuable for local-first, embedded, and testing scenarios.

## Core Concepts

- **FTS5 Virtual Table**: A virtual table that provides full-text search capabilities
- **BM25 Ranking**: Built-in BM25 relevance scoring (predecessor to BM25F)
- **Tokenizers**: Built-in (unicode61, ascii, porter) and custom tokenizer support
- **Content Tables**: External content tables for syncing with source data
- **Prefix Indexes**: Configure prefix lengths for prefix search optimization

## When To Use

- SQLite-based local/desktop applications
- Testing and development environments
- Embedded systems and IoT applications
- Offline-first Laravel applications using SQLite

## When NOT To Use

- Production Laravel applications on MySQL/PostgreSQL
- High-concurrency write workloads (SQLite is single-writer)
- Datasets > 100K records requiring complex queries
- Applications needing real-time sync with external data sources

## Best Practices

1. **Use external content tables** to keep FTS index in sync with source data.
2. **Configure appropriate tokenizer** for your content language.
3. **Set prefix indexes** for columns needing prefix search.
4. **Use MATCH for queries** and ank for ordering.
5. **Rebuild FTS index** after batch data changes.

## Architecture Guidelines

- FTS5 tables live alongside application tables in same SQLite database
- External content tables: CREATE VIRTUAL TABLE posts_fts USING fts5(content=posts, title, body)
- Triggers keep FTS in sync with source data
- Not applicable for Scout's database engine (MySQL/PostgreSQL only)

## Performance Considerations

- FTS5 performs well up to ~100K documents
- Index build time is linear with document count
- BM25 ranking is computed at query time
- Prefix indexes add to index size but speed prefix queries
- Memory usage scales with index size

## Security Considerations

- FTS5 is not directly exposed to user input if using parameterized queries
- MATCH expressions can be expensive on large datasets
- SQLite databases with FTS5 tables require additional backup consideration

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not using external content | Separate data management | Data sync complexity | Use content=source_table |
| Wrong tokenizer for language | Default assumption | Poor stemming/stop words | Configure per content type |
| No triggers for sync | Assuming auto-sync | Stale FTS index | Add INSERT/UPDATE/DELETE triggers |
| Building FTS on huge dataset | Not considering limits | Slow performance | Use dedicated engine for >100K |

## Anti-Patterns

- **Using FTS5 for production Laravel on MySQL/PostgreSQL**: Not applicable
- **Re-creating FTS table on every deploy**: Use external content for persistence
- **Not having backup strategy for FTS indexes**: Rebuild from source data if lost

## Examples

`sql
-- Create FTS5 virtual table
CREATE VIRTUAL TABLE posts_fts USING fts5(
    title, body, content=posts, tokenize='porter unicode61'
);

-- Sync trigger
CREATE TRIGGER posts_ai AFTER INSERT ON posts BEGIN
    INSERT INTO posts_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;

-- Search query
SELECT * FROM posts_fts WHERE posts_fts MATCH 'search terms' ORDER BY rank;
`

## Related Topics

- K002 (Scout database engine)
- K015 (SearchUsingFullText attribute)

## AI Agent Notes

- SQLite FTS5 is niche for Laravel (most apps use MySQL/PostgreSQL)
- Valuable for testing, embedded, and offline-first Laravel apps
- Not supported by Laravel Scout, requires raw SQL queries
- For agents: mention as alternative for non-standard deployment scenarios

## Verification

- [ ] FTS5 virtual table created
- [ ] External content table configured
- [ ] Sync triggers set up (INSERT/UPDATE/DELETE)
- [ ] Search with BM25 ranking works
- [ ] Tokenizer configured for content language
- [ ] Performance tested with expected dataset size
