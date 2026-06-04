# 5-25 Tenant Bootstrapper Pattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-25 |
| Knowledge Unit Title | Tenant Bootstrapper Pattern |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.4 Tenant resolution | 5.6 Tenant middleware | 5.13 Connection caching |
| Last Updated | 2026-06-02 |

## Overview

The tenant bootstrapper pattern separates two database connection configurations: a central connection (for the tenants registry, plans, global config) and a tenant connection (for per-tenant data). The bootstrapper initializes the tenant connection after resolving the current tenant. This pattern is the foundation of all isolation models.

---

## Core Concepts

- **Central connection**: `config('database.connections.central')` — stores tenant registry (`tenants` table), global settings. Always available.
- **Tenant connection**: `config('database.connections.tenant')` — dynamically configured per request. Database/schema/connection string comes from the tenant record.
- **Bootstrapper class**: `TenantBootstrapper` — takes resolved tenant, configures tenant connection, purges stale connections, sets session variables (RLS).


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Central for cross-tenant ops**: Admin panel queries central database for tenant list, billing, usage. Tenant database for tenant-specific data.
- **Bootstrapper sequence**: IdentifyTenant middleware → TenantBootstrapper → configure tenant connection → app ready.
- **Connection purge on switch**: `DB::purge('tenant')` before reconfiguring. Prevents stale connection data.


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
| 1 | Using same connection for central and tenant data**: Without separation, global queries are tenant-scoped, or tenant queries are global. Two explicit connections prevent confusion. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

