# 5-5 Eloquent Global Scopes

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-5 |
| Knowledge Unit Title | Eloquent Global Scopes |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.1 Shared-table | 5.12 withoutGlobalScope guardrails | 2.5 Global/local scopes |
| Last Updated | 2026-06-02 |

## Overview

Eloquent global scopes automatically inject `WHERE tenant_id = ?` into every query for a model. Implemented via `addGlobalScope` or a `Bootable` trait. The foundation of shared-table tenant isolation. Every model that should be tenant-scoped must apply the scope.

---

## Core Concepts

- **addGlobalScope**: `protected static function booted() { static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id)); }` — applied to all queries on this model.
- **Bootable trait**: Reusable trait `TenantScoped` that applies the scope and defines `tenant_id` column.
- **withoutGlobalScope**: `Model::withoutGlobalScope('tenant')->get()` — bypasses the scope. Use carefully.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **TenantScoped trait**: In `App\Traits\TenantScoped` — adds global scope, defines `scopeForTenant`, provides `isTenantScoped()` check.
- **BelongsToTenant relationship**: Define `tenant()` relationship on scoped models. Enables `$model->tenant` access.


## Architecture Guidelines

- Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Performance Considerations

- Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | Forgetting the scope on new models**: Every new tenant-scoped model must use the trait. One unscoped model = cross-tenant data leak. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Multi Tenancy Architecture
- **Closely Related**: Other KUs within Multi Tenancy Architecture
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

