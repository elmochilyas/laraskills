# 5-27 Per Tenant Backups Restore

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-27 |
| Knowledge Unit Title | Per Tenant Backups Restore |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.3 DB-per-tenant | 5.10 Tenant lifecycle | 5.22 Compliance-driven isolation |
| Last Updated | 2026-06-02 |

## Overview

Per-tenant backup/restore is essential for DB-per-tenant isolation model and compliance (GDPR right to deletion, customer data export). Each tenant's database is backed up independently. Restore for one tenant doesn't affect others. Snapshots, pg_dump per database, or automated backup scheduling per tenant.

---

## Core Concepts

- **Snapshot per database**: RDS automated snapshots per DB instance. For multi-tenant (shared DB), this backs up all tenants together — not per-tenant.
- **Per-tenant dump**: `pg_dump -d tenant_db_name` or `mysqldump tenant_db_name`. Individual backup files. Restorable independently.
- **GDPR delete**: For shared-table, deleting tenant data means `DELETE FROM orders WHERE tenant_id = ?` across all tables. For DB-per-tenant, drop the entire database.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Backup schedule per tier**: Enterprise tenants (DB-per-tenant): hourly snapshots, 30-day retention. Standard tenants: daily snapshots, 7-day retention.
- **Self-service restore**: Enterprise tenants can trigger restore from UI. Standard tenants require support ticket.


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
| 1 | Using only shared database snapshots**: Snapshot contains all tenants' data. Restoring for one tenant requires restoring all tenants. Use per-tenant dumps for independent restore. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

