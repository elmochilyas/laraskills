# 2-25 Touch Touch Owners

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-25 |
| Knowledge Unit Title | Touch Touch Owners |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 2.19 Model events | 2.3 Eager loading |
| Last Updated | 2026-06-02 |

## Overview

`touch()` updates the `updated_at` timestamp of the current model. `touchOwners()` cascades timestamp updates up the relationship chain (child update triggers parent `updated_at` update). Used for cache invalidation and change tracking.

---

## Core Concepts

- **touch()**: Sets `updated_at` to current time and saves. `$model->touch()`.
- **touchOwners()**: Calls `touch()` on parent models (belongsTo, morphTo relationships). Cascades up the chain.
- **Automatic touching**: `protected $touches = ['parent']` on the child model auto-touches the named relationship when the child is saved.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Cache invalidation via touch**: Cache key includes `updated_at` timestamp. Touching the model invalidates the cache.
- **Parent update on child change**: `protected $touches = ['post']` in Comment model. When a comment is created/updated/deleted, the parent post's `updated_at` is updated.


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
| 1 | touch causing unnecessary saves**: `touch()` triggers a database UPDATE even if the model hasn't changed. In high-frequency updates, this adds write load. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Cascading touch on deep hierarchies**: `$touches` on multiple levels creates a chain of UPDATE queries. Excessive on deeply nested relationships. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

