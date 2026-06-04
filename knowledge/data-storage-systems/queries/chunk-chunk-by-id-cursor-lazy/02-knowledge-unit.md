# Metadata

Domain: Data & Storage Systems
Subdomain: Eloquent ORM & Query Builder
Knowledge Unit: 2.23 chunk/chunkById/lazy/lazyById cursor processing
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Large dataset processing requires memory-efficient iteration strategies. `chunk`, `chunkById`, `cursor`, `lazy`, and `lazyById` provide different approaches to processing thousands to millions of Eloquent models without exhausting memory. Each has different memory profiles, stability characteristics, and use cases.

---

# Core Concepts

- **chunk($count, $callback)**: Loads $count models per chunk using OFFSET-based pagination. Risk: rows can be skipped or duplicated if modified during iteration.
- **chunkById($count, $callback)**: Uses a stable, ordered key (PK) for pagination. Safer than chunk because it doesn't rely on OFFSET.
- **cursor()**: PHP Generator that yields one model at a time from the database cursor. Lowest memory usage but holds the connection open.
- **lazy()**: Returns a LazyCollection. Like cursor but with collection methods.
- **lazyById()**: LazyCollection with stable key-based ordering (like chunkById).

---

# Mental Models

`get()` loads everything. `chunk` loads in pages. `cursor` streams one at a time. Choose based on: result set size, mutation risk during iteration, connection duration tolerance.

---

# Internal Mechanics

**chunk**: `LIMIT $count OFFSET $page * $count`. OFFSET increases with each chunk, causing the database to scan and discard rows.

**chunkById**: `WHERE id > ? ORDER BY id LIMIT $count`. Each chunk starts after the last row's ID. No scanning of discarded rows.

**cursor**: Uses `PDO::PGSQL` cursor (PostgreSQL) or buffered queries. Single query, streaming. Holds the connection open.

**lazy**: Wraps cursor in a LazyCollection with Enumerable methods (map, filter, reduce).

---

# Patterns

**Use chunkById for data migrations and backfills**: Stable ordering prevents missed or duplicate rows even if data is being modified during processing.

**Use cursor for memory-efficient exports**: Process millions of rows for CSV generation without holding all in memory.

**Use lazy for complex collection pipelines**: Chain `map`, `filter`, `reduce` on large datasets without loading all records.

---

# Method Comparison

| Method | Memory | Stable | Holds Connection | Best For |
|--------|--------|--------|-----------------|----------|
| get() | HIGH (all rows) | N/A | No | Small datasets |
| chunk() | MEDIUM (per page) | NO | No | Simple iteration on static data |
| chunkById() | MEDIUM (per page) | YES | No | Production data processing |
| cursor() | LOW (1 row) | YES | YES | Stream processing, exports |
| lazy() | LOW (1 row) | YES | YES | Collection pipelines on large data |

---

# Common Mistakes

**Using chunk on a table where rows are being modified**: Rows shift between chunks due to OFFSET. Use chunkById instead.

**Using cursor inside a queued job**: Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs.

**Not freeing cursor resources**: Cursor reads the entire result set. If an exception occurs mid-iteration, the cursor is not properly closed, potentially leaking resources.

---

# Related Knowledge Units

1.19 Data backfill strategies | 4.19 chunk method tradeoffs | 4.20 Memory optimization
## Ecosystem Usage

Laravel's Eloquent ORM is the dominant PHP ORM in the ecosystem. Community patterns are shared through Laracasts, Laravel News, and open-source packages. Features like eager loading and model events are used in virtually every Laravel project.

## Failure Modes

N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Performance Considerations

Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Production Considerations

Enable preventLazyLoading in production to catch N+1 issues early. Use Telescope or Debugbar to monitor query counts. Set strict mode to catch missing attributes. Configure query logging carefully as enableQueryLog retains queries in memory.

## Research Notes

Laravel 11 introduced new strict mode features. The once() method prevents duplicate relationship loads. Model casting to enums reduces validation code. The community trend is toward lighter models with dedicated action classes.

## Architectural Decisions

Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

## Tradeoffs

Benefit: Productivity via magic methods. Cost: Performance overhead vs raw SQL. Benefit: Relationship abstraction. Cost: N+1 risk if not careful. Benefit: Model events for business logic. Cost: Hidden side effects.

