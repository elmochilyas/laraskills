# 2-2 Relationship Types

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-2 |
| Knowledge Unit Title | Relationship Types |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.3 Eager loading | 2.6 Relationship existence filtering | 2.7 Relationship counting |
| Last Updated | 2026-06-02 |

## Overview

Eloquent relationship types define how models relate to each other in the database. Each type generates specific SQL join patterns and has different hydration and memory characteristics. Choosing the correct relationship type determines query efficiency, data loading strategy, and code clarity.

---

## Core Concepts

- **hasOne/hasMany**: Parent model "has" one or many child models. Child has FK to parent PK. `hasMany` generates `SELECT * FROM children WHERE parent_id IN (...)`.
- **belongsTo**: Child "belongs to" parent. Defines the FK on the child table. Inverse of `hasOne`/`hasMany`.
- **belongsToMany**: Many-to-many relationship via a pivot table. Generates INNER JOIN on pivot table.
- **hasManyThrough/hasOneThrough**: Access distant relations through an intermediate model. Generates multi-table JOIN.
- **morphMany/morphToMany**: Polymorphic relationships where a model belongs to multiple other model types. Uses a `morphable_type` and `morphable_id` column pair.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Prefer explicit inverse definitions**: Always define the `belongsTo` side explicitly. It enables eager loading from both directions and improves query flexibility.
- **belongsToMany with custom pivot**: Use `->withPivot('column')` to access additional pivot table columns. Avoid loading full pivot models when only timestamps are needed.
- **Polymorphic sparingly**: Polymorphic relationships complicate indexing (two-column index on type + id) and make schema evolution harder. Use only when genuinely needed.


## Architecture Guidelines

- | Relationship | Use Case | SQL Strategy |
- |-------------|----------|-------------|
- | hasMany | One-to-many (posts -> comments) | WHERE parent_id IN (...) |
- | belongsToMany | Many-to-many (users <-> roles) | JOIN pivot, JOIN target |
- | morphMany | Multiple model types share a child (posts/images, users/images) | WHERE type=?, parent_id IN (...) |


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
| 1 | Not defining the inverse relationship**: `Comment belongsTo Post` is not defined. You can't eager load `comment->post`. Always define both sides. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Polymorphic for simple cases**: Using `morphMany` when a `hasMany` with a dedicated FK column would work. Polymorphic adds complexity without benefit. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

