# 5-3 Database Per Tenant

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-3 |
| Knowledge Unit Title | Database Per Tenant |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.1 Shared-table | 5.2 Schema-per-tenant | 5.13 Tenant connection caching |
| Last Updated | 2026-06-02 |

## Overview

Each tenant gets their own database. Strongest isolation, simplest backup/restore per tenant, clearest billing attribution. Highest operational cost — N databases to manage, monitor, and migrate. Used for enterprise SaaS with compliance requirements or high-value tenants.

---

## Core Concepts

- **Full isolation**: Tenant A's data never touches Tenant B's database. No possibility of cross-tenant queries.
- **Connection management**: Each tenant has a separate database connection. Connection pooling per tenant or shared pool with dynamic database selection.
- **Operational overhead**: N databases × migrations, backups, monitoring, upgrades.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Dynamic connection**: `config(['database.connections.tenant.database' => 'tenant_'.$tenant->id])` — rebuild connection config per request.
- **Backup per tenant**: Each database independently backed up. Restore for a single tenant without affecting others.
- **Billing alignment**: Direct correlation between tenant and database — CPU, IOPS, storage costs track to the tenant.


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
| 1 | Creating too many connections**: N tenants = N database connections per PHP-FPM worker. Use a connection pool or limit concurrent tenants per server. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

