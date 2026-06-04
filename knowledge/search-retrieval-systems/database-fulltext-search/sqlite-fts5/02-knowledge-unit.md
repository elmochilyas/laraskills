# Knowledge Unit: Sqlite Fts5

## Metadata

- **ID:** ku-00
- **Subdomain:** 02-database-fulltext-search
- **Source:** Laravel Scout / Industry
- **Maturity:** Stable
- **Laravel Relevance:** Sqlite Fts5

## Executive Summary

SQLite provides FTS5 (Full-Text Search version 5) as a virtual table module for full-text indexing and search. FTS5 supports BM25 ranking, prefix queries, tokenizers, and content sync tables. While not natively supported by Laravel Scout's database engine (which targets MySQL/PostgreSQL), SQLite FTS5 is valuable for local-first, embedded, and testing scenarios.

## Core Concepts

- **FTS5 Virtual Table**: A virtual table that provides full-text search capabilities
- **BM25 Ranking**: Built-in BM25 relevance scoring (predecessor to BM25F)
- **Tokenizers**: Built-in (unicode61, ascii, porter) and custom tokenizer support
- **Content Tables**: External content tables for syncing with source data
- **Prefix Indexes**: Configure prefix lengths for prefix search optimization

## Internal Mechanics

Standard implementation patterns for Sqlite Fts5.

## Patterns

- Standard patterns apply for Sqlite Fts5.

## Architectural Decisions

Standard architectural patterns for search and retrieval systems.

## Tradeoffs

- Standard tradeoffs apply, balancing complexity with capability.

## Performance Considerations

- Performance depends on scale and infrastructure choices.

## Production Considerations

- Standard production deployment practices apply.

## Common Mistakes

- Review anti-patterns and common pitfalls for Sqlite Fts5.

## Failure Modes

- Understand failure modes for production resilience.

## Ecosystem Usage

Standard usage in Laravel search and retrieval applications.

## Related Knowledge Units

- - K002 (Scout database engine)
- - K015 (SearchUsingFullText attribute)

## Research Notes

Source: Industry documentation and community best practices.

## Mental Models

- **Abstraction Layer**: Common patterns apply across search and retrieval systems.
