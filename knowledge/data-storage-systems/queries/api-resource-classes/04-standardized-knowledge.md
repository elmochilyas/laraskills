# 2-27 Api Resource Classes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-27 |
| Knowledge Unit Title | Api Resource Classes |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.18 Model serialization | 2.3 Eager loading |
| Last Updated | 2026-06-02 |

## Overview

API Resource classes provide a dedicated transformation layer between Eloquent models and JSON responses. They enable per-endpoint data shaping, conditional attribute inclusion, relationship loading, and pagination wrapping. Resources prevent the "one model serialization fits all endpoints" anti-pattern.

---

## Core Concepts

- **Resource class**: Extends `JsonResource`. Defines `toArray($request)` returning the data structure for the endpoint.
- **Resource collection**: `ResourceCollection` for paginated/sparse collections.
- **Conditional attributes**: `when($condition, $value)`, `whenLoaded('relation')`, `whenHas('column')`.
- **Pagination wrapping**: `PostResource::collection($posts)` wraps paginated results with meta information.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Narrow attribute selection**: Only include attributes the endpoint consumer needs. Don't expose internal columns.
- **Conditional relationship loading**: `'comments' => $this->whenLoaded('comments')` — only include if eager loaded.
- **Resource per endpoint**: Different resources for list vs detail views. List resources are sparse; detail resources are full.


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
| 1 | Accessor causing N+1**: A resource accesses `$this->someRelation->count()` which lazy loads the relation. Use `whenLoaded` or preload the relationship. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Including too many fields by default**: The resource includes all model attributes, exposing sensitive columns. Be explicit about included fields. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

