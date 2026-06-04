# 2-30 Strict Mode

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-30 |
| Knowledge Unit Title | Strict Mode |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.17 Casts | 2.24 replicate, fill, forceFill | 2.18 Model serialization |
| Last Updated | 2026-06-02 |

## Overview

Laravel strict mode enables guardrails that prevent silent data loss and debugging frustration. `preventSilentlyDiscardingAttributes` throws an exception when mass-assignment discards unfillable attributes. `preventAccessingMissingAttributes` throws when accessing attributes not loaded or set. These catch bugs during development that would otherwise cause subtle production issues.

---

## Core Concepts

- **preventSilentlyDiscardingAttributes**: When mass-assigning, unfillable attributes are silently dropped. This mode throws an exception instead.
- **preventAccessingMissingAttributes**: Accessing a non-existent attribute returns null. This mode throws an exception instead.
- **Environment-specific**: Enable in local/staging/CI. Disable in production (or log instead of throw).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Enable in development**: `Model::preventSilentlyDiscardingAttributes()` and `Model::preventAccessingMissingAttributes()` in `AppServiceProvider::boot()` for non-production.
- **Log in production**: Use `Model::handleMissingAttributeAccessUsing(fn($model, $key) => Log::warning(...))` to catch issues without breaking production.


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
| 1 | Not enabling in development**: Developers write code that accesses `$model->statues` instead of `$model->status`. Returns null. Bug is discovered only when the wrong value reaches the database. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Enabling with throwing in production**: User-facing exceptions for missing attributes. Use logging handler in production. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

