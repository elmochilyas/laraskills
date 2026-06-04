# 2-29 Query Logging

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-29 |
| Knowledge Unit Title | Query Logging |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 4.27 Profiling tools | 2.28 N+1 detection via Telescope |
| Last Updated | 2026-06-02 |

## Overview

`DB::listen` captures every query executed, providing SQL, bindings, execution time, and connection name. `enableQueryLog` stores queries in memory for later retrieval. These are the foundational tools for Laravel query debugging and performance analysis.

---

## Core Concepts

- **DB::listen(closure)**: Event listener that fires for every query. Access SQL, bindings, time, connection name.
- **enableQueryLog() / getQueryLog()**: Stores queries in memory. Use `getQueryLog()` to retrieve array of all queries executed.
- **disableQueryLog()**: Turn off logging. Prevents memory growth in long-running processes.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Slow query alert**: `DB::listen(fn($q) => $q->time > 100 && Log::warning(...))` — log queries exceeding 100ms.
- **Test assertions**: `DB::enableQueryLog(); // execute; $this->assertCount(2, DB::getQueryLog())` — assert query count in tests.
- **Long-running process cleanup**: `DB::disableQueryLog()` after collecting needed queries to prevent unbounded memory growth.


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
| 1 | Leaving query logging enabled in production**: `getQueryLog()` stores all queries in memory per request. On high-traffic endpoints, this exhausts PHP memory. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Using getQueryLog() without disableQueryLog()**: Queries accumulate. After retrieving, call `disableQueryLog()` to clear. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

