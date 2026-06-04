# 2-15 Scopes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Eloquent Orm Query Builder |
| Knowledge Unit ID | 2-15 |
| Knowledge Unit Title | Scopes |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.5 Eloquent global scopes for tenant isolation | 2.10 Query builder methods |
| Last Updated | 2026-06-02 |

## Overview

Scopes encapsulate common query constraints into reusable methods. Global scopes apply to every query on a model (used for multi-tenancy). Local scopes are chainable methods called explicitly. Dynamic scopes accept parameters. Scopes centralize query logic and prevent scattered `where` clauses.

---

## Core Concepts

- **Global scopes**: Applied automatically to all queries on the model. Registered via `boot()` trait method or `addGlobalScope()`. Used for tenant isolation, soft delete filtering.
- **Local scopes**: `scopePopular($query)` called as `Model::popular()->get()`. Reusable query fragments.
- **Dynamic scopes**: Accept parameters: `scopeOfType($query, $type)` called as `Model::ofType('admin')->get()`.
- **Without global scopes**: `Model::withoutGlobalScope('scope_name')` or `Model::withoutGlobalScopes()` to bypass.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tenant isolation via global scope**: `addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id))` — applied to every query automatically.
- **Soft delete filtering**: Laravel's `SoftDeletes` trait registers a global scope `WHERE deleted_at IS NULL`.
- **Common filters as local scopes**: `scopeActive($q)`, `scopeRecent($q)`, `scopePublished($q)`.


## Architecture Guidelines

- | Scope Type | When | When Not |
- |-----------|------|----------|
- | Global | Always-on filters (tenancy, soft deletes) | Optional filters |
- | Local | Reusable query fragments | One-off query conditions |
- | Dynamic | Parameterized filters | Filters with many optional params |


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
| 1 | Bypassing global scopes accidentally**: Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | withoutGlobalScope in production code**: Used as a shortcut instead of designing the query correctly. Should be reviewed carefully. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

