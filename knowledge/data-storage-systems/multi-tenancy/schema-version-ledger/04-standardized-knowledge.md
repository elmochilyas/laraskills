# 5-19 Schema Version Ledger

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-19 |
| Knowledge Unit Title | Schema Version Ledger |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.9 Migration orchestration | 5.29 Tenant migration canary |
| Last Updated | 2026-06-02 |

## Overview

In multi-tenant systems (especially schema-per-tenant and DB-per-tenant), tenants may be at different migration versions. A schema version ledger tracks which migration batch each tenant has applied. Essential for differential migrations, rollback targeting, and auditing.

---

## Core Concepts

- **Central ledger table**: `tenant_schema_versions(tenant_id, batch, migration_name, applied_at)`. One row per applied migration per tenant.
- **Differential migration**: Compare tenant's applied version against current schema version. Apply missing migrations only.
- **Canary migration**: Apply migrations to a subset of tenants first. Monitor for errors. Then roll to remaining tenants.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Migration tracking in provisioning**: When provisioning a new tenant, record the current schema batch in the ledger. New tenants always start at latest schema.
- **Drift detection**: Daily check: tenants whose ledger version differs from latest. Flag for investigation or automated migration.


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
| 1 | Assuming all tenants are at the same schema version**: After partial rollouts, rollbacks, or failed migrations, tenants diverge. Always check the ledger before assuming schema state. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

