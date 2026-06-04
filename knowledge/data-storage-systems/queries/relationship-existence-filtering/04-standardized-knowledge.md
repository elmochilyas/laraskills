# 2-6 Relationship Existence Filtering

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-6 |
| Knowledge Unit Title | Relationship Existence Filtering |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 4.24 Join optimization | 2.7 Relationship counting |
| Last Updated | 2026-06-02 |

## Overview

`whereHas` filters the parent query based on conditions on related models. It generates a correlated `EXISTS` subquery. While expressive, `whereHas` on large tables or with deeply nested closures can be expensive. Understanding when to use `whereHas` vs a JOIN approach is critical for query performance.

---

## Core Concepts

- **whereHas('relation', closure)**: Filters parents that have at least one matching related record. SQL: `WHERE EXISTS (SELECT 1 FROM related WHERE parent_id = parents.id AND ...)`.
- **whereDoesntHave('relation')**: Filters parents that have no matching related records.
- **orWhereHas**: OR combination with existing WHERE conditions.
- **Nested whereHas**: `whereHas('comments.user', fn($q) => ...)` — filters by nested relationship conditions.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Use whereHas for semantic filtering**: "Find posts with comments from active users." Expresses the filter condition naturally.
- **Use JOIN for performance-critical filters**: When `whereHas` appears in a hot endpoint (dashboard, list API), rewrite as a JOIN for better performance. The JOIN approach avoids the per-row EXISTS evaluation.
- **Avoid deep nesting**: `whereHas('a.b.c', fn($q) => ...)` generates deeply nested subqueries. Consider rewriting as multiple `whereHas` calls or a JOIN chain.


## Architecture Guidelines

- | Method | When | Performance |
- |--------|------|-------------|
- | whereHas | Simple filters, moderate table sizes | EXISTS subquery per parent row |
- | JOIN | Performance-critical, large tables | Single query, index-friendly |
- | Nested whereHas | Deep relationship filters | Complex query plan |


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
| 1 | orWhereHas without grouping**: `->where('status', 'active')->orWhereHas('comments')` — the OR applies to the entire WHERE clause, potentially returning unexpected results. Use a closure group. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Repeated whereHas for the same relation**: Calling `whereHas('comments', ...)` and later `whereHas('comments', ...)` in the same query generates two identical subqueries. Combine constraints in a single closure. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

