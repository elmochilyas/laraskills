# 2-23 Chunk Chunk By Id Cursor Lazy

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-23 |
| Knowledge Unit Title | Chunk Chunk By Id Cursor Lazy |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 1.19 Data backfill strategies | 4.19 chunk method tradeoffs | 4.20 Memory optimization |
| Last Updated | 2026-06-02 |

## Overview

Large dataset processing requires memory-efficient iteration strategies. `chunk`, `chunkById`, `cursor`, `lazy`, and `lazyById` provide different approaches to processing thousands to millions of Eloquent models without exhausting memory. Each has different memory profiles, stability characteristics, and use cases.

---

## Core Concepts

- **chunk($count, $callback)**: Loads $count models per chunk using OFFSET-based pagination. Risk: rows can be skipped or duplicated if modified during iteration.
- **chunkById($count, $callback)**: Uses a stable, ordered key (PK) for pagination. Safer than chunk because it doesn't rely on OFFSET.
- **cursor()**: PHP Generator that yields one model at a time from the database cursor. Lowest memory usage but holds the connection open.
- **lazy()**: Returns a LazyCollection. Like cursor but with collection methods.
- **lazyById()**: LazyCollection with stable key-based ordering (like chunkById).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use chunkById for data migrations and backfills**: Stable ordering prevents missed or duplicate rows even if data is being modified during processing.
- **Use cursor for memory-efficient exports**: Process millions of rows for CSV generation without holding all in memory.
- **Use lazy for complex collection pipelines**: Chain `map`, `filter`, `reduce` on large datasets without loading all records.


## Architecture Guidelines

- Decision: Eloquent ORM vs Query Builder vs Raw SQL. Use Eloquent for standard CRUD. Use Query Builder for complex queries. Use Raw SQL for database-specific optimizations.

## Performance Considerations

- Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subquery selects in addSelect avoid N+1 count queries. lazy() and cursor() use generators to reduce memory for large result sets.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Using chunk on a table where rows are being modified**: Rows shift between chunks due to OFFSET. Use chunkById instead. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using cursor inside a queued job**: Holding the database cursor for a long time while other queue workers compete for connections. Use chunkById for queued jobs. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | Not freeing cursor resources**: Cursor reads the entire result set. If an exception occurs mid-iteration, the cursor is not properly closed, potentially leaking resources. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 4 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Eloquent Orm Query Builder
- **Closely Related**: Other KUs within Eloquent Orm Query Builder
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

