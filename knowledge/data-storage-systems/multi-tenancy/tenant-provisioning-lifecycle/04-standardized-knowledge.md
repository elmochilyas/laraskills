# 5-10 Tenant Provisioning Lifecycle

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-10 |
| Knowledge Unit Title | Tenant Provisioning Lifecycle |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.9 Migration orchestration | 5.27 Per-tenant backups |
| Last Updated | 2026-06-02 |

## Overview

Tenant lifecycle management covers creating a new tenant (provisioning database/schema, running migrations, seeding default data), ongoing maintenance, and eventual deactivation/archival/deletion. A robust provisioning pipeline is essential for self-service signup flows.

---

## Core Concepts

- **Provisioning steps**: Create tenant record in central DB. Create schema/database per isolation model. Run migrations. Seed default data. Initialize queues, storage, cache prefixes.
- **Async provisioning**: Queue the provisioning job for faster signup response. Tenant marked as "provisioning" until complete.
- **Deactivation**: Soft-disable tenant (set `active=false`). Queries still work but app rejects requests. Enables reactivation.
- **Archival**: Export tenant data to cold storage. Drop schema/database. Re-import on reactivation.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Provisioning pipeline**: Job chain: `CreateTenant → RunMigrations → SeedDefaults → InitializeIntegrations`. Each step runs as separate queued job.
- **Deletion gate**: Confirm deletion twice. Provide data export before permanent delete. Soft-delete with 30-day grace period.


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
| 1 | Synchronous provisioning**: User signs up, waits 30s for migrations and seeding. Queue provisioning; show "setting up your workspace" screen. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | No archival before deletion**: Accidental permanent delete without backup. Always archive before delete. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

