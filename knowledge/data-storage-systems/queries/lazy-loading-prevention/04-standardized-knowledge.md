# 2-4 Lazy Loading Prevention

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-4 |
| Knowledge Unit Title | Lazy Loading Prevention |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 2.3 Eager loading | 4.13 N+1 detection and elimination | 2.28 N+1 detection via Telescope |
| Last Updated | 2026-06-02 |

## Overview

Laravel can throw an exception when lazy loading is detected via `Model::preventLazyLoading()`. This forces developers to explicitly eager load every accessed relationship, preventing N+1 queries from reaching production. The standard pattern is to enable prevention in non-production environments and log violations in production.

---

## Core Concepts

- **preventLazyLoading()**: When enabled, accessing a relationship that wasn't eager loaded throws a `LazyLoadingViolationException`.
- **Environment-specific**: Typically enabled for local/staging, disabled (with logging) for production.
- **handleLazyLoadingViolationUsing**: Custom handler that logs violations instead of throwing exceptions in production.
- **Per-model override**: `protected $preventLazyLoading = false` on specific models where lazy loading is acceptable (e.g., small lookup tables).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Standard boilerplate**: `Model::preventLazyLoading(! app()->isProduction())` in `AppServiceProvider::boot()`. Throws in local/staging, silently allows in production.
- **Production violation logging**: `Model::handleLazyLoadingViolationUsing(fn($model, $relation) => Log::warning(...))`. This captures N+1 patterns that only appear under production data volumes.
- **Opt-in for small tables**: On models backed by tiny tables (< 100 rows), set `$preventLazyLoading = false` since the N+1 cost is negligible.


## Architecture Guidelines

- | Setting | When | When Not |
- |---------|------|----------|
- | Throwing violations | Local dev, staging, CI | Production |
- | Logging violations | Production | Only if monitoring is absent |
- | Per-model opt-out | Tiny lookup models | Entity models with high query volume |


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
| 1 | Disabling globally for production without logging**: N+1 goes completely undetected. The app runs fine at low traffic but fails under load. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | Not enabling in CI**: CI passes even though the code has N+1. Violations are only caught locally (if at all). | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

