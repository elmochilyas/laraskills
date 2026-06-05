# 5-1 Shared Table Single Db

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-1 |
| Knowledge Unit Title | Shared Table Single Db |
| Difficulty Level | Intermediate |
| Classification | I |
| Dependencies | 5.3 Database-per-tenant | 5.5 Eloquent global scopes |
| Related KUs | 5.2 Schema-per-tenant |
| Last Updated | 2026-06-02 |

## Overview

The shared-table model stores all tenants' data in the same database tables, distinguished by a `tenant_id` column. A global scope automatically filters by tenant on every query. Lowest operational cost but highest risk of cross-tenant data leaks. Most common approach for B2B SaaS starting out.

---

## Core Concepts

- **Single database, shared tables**: Every row has a `tenant_id`. Queries must always filter by it.
- **Global scope**: Eloquent `addGlobalScope` automatically adds `WHERE tenant_id = ?` to all queries.
- **Index requirement**: Composite index on `(tenant_id, ...)` for filtered columns. Without it, every query scans all tenants' data.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Default isolation strategy**: Start with shared-table for MVPs and early-stage SaaS. Migrate to higher isolation only when compliance or noise justifies the cost.
- **Tenant ID as partition key**: Index on `(tenant_id, created_at)` for tenant-scoped list queries.


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
| 1 | Missing index on tenant_id**: Without it, every tenant query performs a full table scan. As tenant count grows, performance degrades linearly. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

