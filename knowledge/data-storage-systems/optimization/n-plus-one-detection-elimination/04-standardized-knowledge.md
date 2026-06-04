# 4-13 N Plus One Detection Elimination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Query Optimization Profiling |
| Knowledge Unit ID | 4-13 |
| Knowledge Unit Title | N Plus One Detection Elimination |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.3 Eager loading | 2.4 Lazy loading prevention | 2.7 Relationship counting | 2.28 N+1 detection via Telescope |
| Last Updated | 2026-06-02 |

## Overview

N+1 is the most common performance problem in Eloquent applications. It occurs when a relationship is lazy-loaded inside a loop, generating N+1 queries (1 for the parent, N for each child). Detection: look for repeated query patterns with different WHERE values. Elimination: eager loading with `with()`, `load()`, or `loadMissing()`.

---

## Core Concepts

- **Pattern**: 1 query + N queries (where N = number of parent rows).
- **Eager loading**: `Post::with('comments')` — 2 queries total (1 for posts, 1 for comments).
- **Hidden N+1**: In Blade views, API resources, accessors, policies — any place where relationship access happens outside the controller.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Enable preventLazyLoading**: Throw exceptions for lazy loading in non-production environments.
- **Query count middleware**: Log warnings when a request exceeds a query threshold.
- **Test assertions**: `DB::enableQueryLog(); $response = $this->get('/posts'); $this->assertLessThan(10, count(DB::getQueryLog()))`.
- **Use withCount for aggregates**: Never load a full collection to get a count. `Post::withCount('comments')`.


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
| 1 | N+1 in API resources/accessors**: A resource accesses `$this->author->name` without eager loading. The N+1 is invisible from the controller. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Blind eager loading**: `Post::with('comments', 'tags', 'author')` everywhere, even when the view only needs the author. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

