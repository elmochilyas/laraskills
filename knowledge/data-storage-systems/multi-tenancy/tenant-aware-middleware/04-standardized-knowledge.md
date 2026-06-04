# 5-6 Tenant Aware Middleware

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-6 |
| Knowledge Unit Title | Tenant Aware Middleware |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.4 Tenant resolution | 5.5 Global scopes | 5.13 Connection caching |
| Last Updated | 2026-06-02 |

## Overview

Tenant-aware middleware runs early in the request lifecycle to resolve the tenant, set the current tenant context, and configure the database connection. Middleware is the correct place for tenant initialization — before controllers, services, or models run.

---

## Core Concepts

- **IdentifyTenant middleware**: Extracts tenant identifier from subdomain/domain/header. Looks up tenant in central database. Sets `app(CurrentTenant::class)`.
- **SetTenantConnection middleware**: For schema-per-tenant or DB-per-tenant: updates database config (`config(['database.connections.tenant.database' => ...])`), clears connection (`DB::purge('tenant')`), reconnects.
- **Middleware order**: `IdentifyTenant` runs before `SetTenantConnection`, which runs before `StartSession` and `Authenticate`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Singleton CurrentTenant**: A simple data object holding `id`, `name`, `connection`, `config`. Set once by middleware, read anywhere via `app(CurrentTenant::class)`.
- **Skip middleware for public routes**: Tenant middleware should not apply to login, registration, or webhook routes.


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
| 1 | Resolving tenant in boot method**: Tenant resolution in `AppServiceProvider::boot()` runs before request context is available. Middleware is the correct place. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

