# 2-19 Model Events

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-19 |
| Knowledge Unit Title | Model Events |
| Difficulty Level | Foundation |
| Classification | I |
| Dependencies | 2.20 Hydration | 2.25 touch/touchOwners | 2.21 upsert |
| Last Updated | 2026-06-02 |

## Overview

Model events fire at specific points in the model lifecycle: retrieval, creation, update, save, delete, restore, and force delete. They enable side-effect logic (logging, cache invalidation, notifications) to be attached to model operations without cluttering controllers.

---

## Core Concepts

- **Event types**: `retrieved` (after DB read), `creating`/`created` (before/after INSERT), `updating`/`updated` (before/after UPDATE), `saving`/`saved` (before/after both INSERT and UPDATE), `deleting`/`deleted` (before/after DELETE), `trashed` (soft delete), `forceDeleted` (force delete).
- **Returning false**: In `creating`, `updating`, `saving`, `deleting`, returning `false` cancels the operation.
- **Observers**: Classes that group multiple model events. Registered in `AppServiceProvider::boot()`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Automatic slug generation**: `static::creating(fn($model) => $model->slug = Str::slug($model->title))`.
- **Cache invalidation**: `static::saved(fn($model) => Cache::forget("post:{$model->id}"))`.
- **Observer for cross-cutting concerns**: Logging, audit trails, notifications grouped in an Observer class.


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
| 1 | Performing heavy operations in events**: API calls, long computations, or queue dispatches inside model events — these block the HTTP response. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Model events not firing in bulk operations**: `User::query()->update(...)` does NOT fire model events. Only individual model `save()`, `update()`, `delete()` calls fire events. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

