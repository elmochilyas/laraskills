# 5-2 Schema Per Tenant

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-2 |
| Knowledge Unit Title | Schema Per Tenant |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.3 Database-per-tenant | 5.9 Migration orchestration |
| Related KUs | 5.1 Shared-table |
| Last Updated | 2026-06-02 |

## Overview

Schema-per-tenant uses a single database server with separate schemas (PostgreSQL) or table prefixes (MySQL) per tenant. All tenants share the same connection pool but their data is physically separated at the schema level. Medium isolation, moderate operational complexity.

---

## Core Concepts

- **PostgreSQL schemas**: `CREATE SCHEMA tenant_123;` Each tenant's tables are created inside their schema. `SET search_path TO tenant_123;` isolates queries.
- **MySQL table prefixes**: `tenant_123_orders` vs `tenant_456_orders`. Same database, different table names. Less elegant than PostgreSQL schemas.
- **Connection switching**: Laravel `config(['database.connections.tenant.database' => 'tenant_'.$id])` — rebind connection on the fly.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration per schema**: Loop through tenants, run migrations against each schema. `artisan migrate --path=... --database=tenant` with dynamic config.
- **Search path approach (PostgreSQL)**: One connection, SET search_path per tenant. No connection switching overhead.


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
| 1 | Schema-per-tenant on MySQL**: MySQL schemas are equivalent to databases. Schema-per-tenant on MySQL means database-per-tenant. PostgreSQL is the right engine for true schema-per-tenant. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

