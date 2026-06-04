# 4-14 Eager Loading Depth Governance

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-14 |
| Knowledge Unit Title | Eager Loading Depth Governance |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 2.5 Constrained eager loading | 4.21 Query shape discipline |
| Last Updated | 2026-06-02 |

## Overview

Deep eager loading chains (`with('a.b.c.d')`) generate complex multi-JOIN queries that can be slow and load excessive data. Governance: limit nesting depth, narrow columns per relationship, and distinguish list vs detail view loading.

---

## Core Concepts

- **Depth problem**: `with('user.profile.company.address')` generates up to 5 JOINs or separate WHERE IN queries. Risk of over-fetching.
- **Selective loading**: Not all relationships need all columns. `with('user:id,name')` limits columns.
- **List vs detail**: List views load minimal data. Detail views load full relationships. Use different resources or scopes.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Max 2 levels for list endpoints**: Only load relationships directly visible in the list. Detail endpoints can load deeper.
- **Narrow selects**: `with('comments:id,post_id,body')` — only load columns needed for display.
- **Scope-based relationship loading**: `scopeWithListRelations($q)` and `scopeWithDetailRelations($q)`.


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
| 1 | Blind `$model->load('allRelations')`**: Loading every relationship defined on the model regardless of what the endpoint needs. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | N+1 within eager loaded relationships**: `with('comments.likes')` loads both comments and likes in 2 queries. But `$post->comments->each(fn($c) => $c->likers->count())` triggers N+1 on the likes relationship. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

