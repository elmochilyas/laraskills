# 4-22 Eloquent Anti Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-22 |
| Knowledge Unit Title | Eloquent Anti Patterns |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.6 Relationship existence filtering | 2.8 Subquery selects |
| Last Updated | 2026-06-02 |

## Overview

Common Eloquent anti-patterns that degrade query performance: deeply nested `whereHas` chains, broad `orWhereHas` without proper indexing, sorting by related columns (requires JOIN or subquery), polymorphic filters on large tables, and repeated aggregate subqueries in paginated queries.

---

## Core Concepts

- **Nested whereHas**: `whereHas('a.b.c.d')` generates deeply nested EXISTS subqueries. Consider JOIN or denormalization.
- **Poly filters**: `where('type', 'Post')->orWhere('type', 'Video')` on polymorphic columns — the two-type query can't use a simple index.
- **Repeated aggregates**: `Post::withCount('comments')->withCount('likes')->withCount('shares')` — three separate subqueries in SELECT.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replace deep whereHas with JOIN**: Convert nested EXISTS to JOIN for better performance on large tables.
- **Index polymorphic columns**: Composite index on `(morphable_type, morphable_id)` for polymorphic queries.
- **Consolidate aggregates**: Use `addSelect` with subqueries instead of multiple `withCount` calls.


## Architecture Guidelines

- Query cache for read-heavy low-write workloads. Materialized views for complex aggregations. Read replicas for reporting offload.

## Performance Considerations

- EXPLAIN ANALYZE reveals actual execution times vs estimates. Index scan vs sequential scan depends on table statistics. Join order in multi-table queries affects performance.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Sorting by related column**: `Post::orderBy('author.name')` — requires JOIN or subquery. Add a denormalized column if this is a hot query. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Missing indexes cause full table scans on large tables. Implicit type conversion prevents index usage. OR conditions break composite index leftmost prefix rules. LIKE leading wildcards prevent index usage.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Query Optimization Profiling
- **Closely Related**: Other KUs within Query Optimization Profiling
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

