# 2-28 N Plus One Detection

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-28 |
| Knowledge Unit Title | N Plus One Detection |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.4 Lazy loading prevention | 4.13 N+1 detection and elimination | 4.27 Profiling tools |
| Last Updated | 2026-06-02 |

## Overview

N+1 detection tools identify repeated queries with identical structure but different parameter values. Laravel Telescope groups queries by request and highlights repeated patterns. Debugbar shows query count per request. Manual logging via `DB::listen` can alert on high query counts. Detection is the first step in eliminating N+1 problems.

---

## Core Concepts

- **Telescope**: Per-request query log with timing, duplicates detection, and relationship loading analysis.
- **Debugbar**: In-browser debug toolbar showing query count, time, and duplicates.
- **DB::listen**: Low-level query event listener. Can log, count, or alert on query patterns.
- **Pattern signature**: N+1 appears as N identical queries with different WHERE values: `SELECT * FROM comments WHERE post_id = 1`, `... WHERE post_id = 2`, etc.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Telescope for development**: Enable Telescope locally and in staging. Check the "Queries" tab for repeated query patterns.
- **Debugbar for quick inspection**: During development, Debugbar's query count shows immediately if an endpoint is over-fetching.
- **Custom middleware for production monitoring**: Count queries per request and log warnings when the count exceeds a threshold (e.g., 30 queries per request).


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
| 1 | Relying only on one tool**: Telescope catches what Debugbar misses and vice versa. Use multiple tools in different environments. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Ignoring production patterns**: N+1 that only appears at production data volumes won't show in development. Monitor query counts in production. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

