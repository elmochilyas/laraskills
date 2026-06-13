# 2-3 Eager Loading

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-3 |
| Knowledge Unit Title | Eager Loading |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | None |
| Last Updated | 2026-06-02 |

## Overview

Eager loading solves the N+1 query problem by loading related models in a single query. Laravel provides `with()` (query-time), `load()` (collection-time), and `loadMissing()` (conditional) with dot notation for nested relationships. Eager loading is the most impactful optimization for Eloquent performance.

---

## Core Concepts

- **`with('relation')`**: Eager loads the relationship as part of the parent query. Single query for the relationship, not N queries.
- **`load('relation')`**: Eager loads on an already-hydrated collection. Useful when you need to conditionally load after the initial query.
- **`loadMissing('relation')`**: Load only if not already loaded. Prevents redundant relationship loading in deep call stacks.
- **Dot notation**: `with('author.profile')` eager loads `author` and then `author.profile` through nested relationships.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Always eager load for list endpoints**: Any endpoint that returns a collection of parent models with relationship access must eager load.
- **Narrow eager loading**: Specify columns: `with('author:id,name')` to avoid transferring unnecessary columns from the related table.
- **Conditional loading with loadMissing**: In reusable components (resources, accessors), use `loadMissing` so the relationship is loaded only once regardless of how many times it's accessed.


## Architecture Guidelines

- | Method | When | When Not |
- |--------|------|----------|
- | with() | Initial query | Already have collection |
- | load() | After query, conditional | Before query (use with()) |
- | loadMissing() | Shared components, reusable views | Always need fresh load |


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
| 1 | Blind eager loading**: `Post::with(['comments', 'tags', 'author', 'author.profile'])` on a list endpoint where only the author name is displayed. Over-hydration: loading data that's never used. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not narrowing columns**: `with('comments')` selects all columns from comments table. Use `with('comments:id,post_id,body')` to reduce data transfer. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- N+1 query problems occur when relationships are lazy-loaded in loops. Mass assignment vulnerabilities arise when fillable/guarded are misconfigured. Serialization failures happen when models with relationships are queued without proper eager loading. Memory exhaustion occurs with chunking without chunkById.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Eloquent Orm Query Builder
- **Closely Related**: Other KUs within Eloquent Orm Query Builder
- **Closely Related**: 2.4 Lazy loading prevention
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

