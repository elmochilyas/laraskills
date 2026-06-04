# 2-7 Relationship Counting

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-7 |
| Knowledge Unit Title | Relationship Counting |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 4.15 SQL-side vs collection-side aggregation | 2.5 Constrained eager loading |
| Last Updated | 2026-06-02 |

## Overview

Relationship aggregate methods load computed values (count, sum, avg, min, max, exists) as attributes on the parent model without hydrating the related models. This is the most impactful memory optimization in Eloquent — it replaces loading entire collections (thousands of models) with a single scalar value per parent.

---

## Core Concepts

- **withCount('relation')**: Adds `{relation}_count` attribute. SQL: `SELECT parent.*, (SELECT COUNT(*) FROM related WHERE ...) AS comments_count`.
- **withSum/Max/Min/Avg**: Same pattern, different aggregate functions. Adds `{relation}_sum_{column}` attribute.
- **withExists**: Adds `{relation}_exists` boolean. SQL: `EXISTS (SELECT 1 FROM ...)`.
- **Closure constraints**: All methods accept closures for filtered aggregates: `withCount(['comments' => fn($q) => $q->where('approved', true)])`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always use withCount instead of loading relationships for counts**: `Post::withCount('comments')` instead of `Post::with('comments')` then `$post->comments->count()`.
- **Use withSum for aggregation**: `Order::withSum('items', 'price')` instead of loading order items and summing in PHP.
- **Filtered aggregates for dashboards**: `User::withCount(['posts' => fn($q) => $q->where('published', true)])` — count only published posts.


## Architecture Guidelines

- | Method | When | When Not |
- |--------|------|----------|
- | withCount | Need just the count | Need the actual related models |
- | withSum | Need sum of a related column | Need full related data |
- | withExists | Need boolean existence check | Need the count |


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
| 1 | Loading full relationship just for count**: `$post->comments` loads all Comment models, then `->count()` on the collection. Wastes memory on large comment sets. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not constraining aggregates**: `withCount('comments')` counts ALL comments. If the endpoint only needs approved comments, use the closure form. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

