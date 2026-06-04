# 2-24 Replicate Fill Force Fill

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-24 |
| Knowledge Unit Title | Replicate Fill Force Fill |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.16 Accessors and mutators | 2.17 Casts |
| Last Updated | 2026-06-02 |

## Overview

`replicate` creates a new unsaved model with the same attributes. `fill` mass-assigns attributes (respecting $fillable). `forceFill` bypasses $fillable protection. `forceCreate` creates a model without mass-assignment protection. These control how model attributes are populated and saved.

---

## Core Concepts

- **replicate(array $except)**: Clones the model without its primary key. Excludes specified attributes (timestamps).
- **fill(array $data)**: Mass-assigns attributes. Only attributes in `$fillable` array can be set.
- **forceFill(array $data)**: Mass-assigns all attributes, bypassing `$fillable` guard.
- **forceCreate(array $data)**: `create()` that bypasses `$fillable`. Use carefully.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Replicate for duplicate content**: Copy a post as a draft: `$post->replicate(['published_at'])->save()`.
- **forceFill for internal operations**: Admin panel updates, system-generated attributes.


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
| 1 | Using forceFill with user input**: Bypassing `$fillable` with user-supplied data allows mass-assignment of any attribute. Only use `forceFill` with trusted data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Replicate doesn't copy relationships**: Only the model's direct attributes are copied. Related records must be replicated separately. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

