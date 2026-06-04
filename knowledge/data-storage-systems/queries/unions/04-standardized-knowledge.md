# 2-14 Unions

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-14 |
| Knowledge Unit Title | Unions |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.10 Query builder methods | 4.11 orWhere on composite index |
| Last Updated | 2026-06-02 |

## Overview

`union` and `unionAll` combine results from multiple queries into a single result set. `union` removes duplicates (adds a sort/distinct pass); `unionAll` keeps all rows. Useful for combining results from different tables with the same column structure or for OR conditions that should use separate indexes.

---

## Core Concepts

- **union**: Combines queries, removes duplicate rows (SORT + DISTINCT operation).
- **unionAll**: Combines queries, keeps all rows (faster, no dedup overhead).
- **Column compatibility**: All combined queries must return the same number of columns with compatible types.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **OR optimization**: Replace `where('a')->orWhere('b')` with two queries unioned — each can use its own index optimally.
- **Cross-table search**: Search `users.name` and `posts.title` in a single result set. Union the two queries.
- **Use unionAll when possible**: `unionAll` avoids the sort+distinct overhead of `union`. Only use `union` when duplicates must be eliminated.


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
| 1 | Using union when unionAll suffices**: The sort+distinct pass for `union` is expensive. If duplicates are impossible or acceptable, use `unionAll`. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | ORDER BY in individual queries**: ORDER BY inside a unioned query is only allowed with LIMIT. Order the entire union result with a final ORDER BY. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

