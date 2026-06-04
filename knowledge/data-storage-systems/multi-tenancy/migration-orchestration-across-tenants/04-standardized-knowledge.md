# 5-9 Migration Orchestration Across Tenants

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-9 |
| Knowledge Unit Title | Migration Orchestration Across Tenants |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.2 Schema-per-tenant | 5.3 Database-per-tenant | 11.14 Multi-DB migration strategies |
| Last Updated | 2026-06-02 |

## Overview

Running migrations across tenants is the primary operational challenge of multi-tenant systems. For shared-table: run once. For schema-per-tenant: loop schemas, run per schema. For database-per-tenant: loop databases, run per database. The orchestration strategy determines deployment complexity, downtime risk, and rollback capability.

---

## Core Concepts

- **Shared-table**: Standard migrations. Run once. Central `migrations` table. No orchestration required.
- **Schema-per-tenant**: N migration runs per deployment. Each schema has its own `migrations` table. Loop all schemas; run `migrate` for each.
- **Database-per-tenant**: N database connections. Each database has its own `migrations` table. Largest orchestration overhead.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Central migration tracker**: Single table tracks which migration batch each tenant has applied. Enables differential migration (only apply pending migrations per tenant).
- **Batch size control**: Process tenants in batches of 10-20 to control database load. Between batches, wait for replication lag to settle.
- **Rollback strategy**: Per-tenant rollback. If migration fails on tenant 50/1000, roll back that tenant only. Log the gap, fix and re-run.


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
| 1 | Synchronous full-tenant migration**: Running migrations for all 2000 tenants sequentially in one request. Use batched background jobs. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | No migration version tracking per tenant**: Can't tell which tenants are behind. Always store `tenant_id + migration_batch` in a central log. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 3 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

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

