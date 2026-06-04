# 5-17 Tenant Segmentation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-17 |
| Knowledge Unit Title | Tenant Segmentation |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.3 DB-per-tenant | 5.16 Per-tenant scaling |
| Last Updated | 2026-06-02 |

## Overview

Tenant segmentation groups tenants into tiers based on usage, revenue, or requirements. Each tier uses a different isolation model: free tier on shared-table, growth tier on schema-per-tenant, enterprise on dedicated databases. Tier assignment is dynamic — tenants can be promoted as they grow.

---

## Core Concepts

- **Tier-based isolation**: Free (shared-table, rate limited) → Pro (schema-per-tenant, higher limits) → Enterprise (DB-per-tenant, dedicated server).
- **Graduated isolation**: A tenant that stays within usage limits stays on shared infrastructure. Above 2x median → isolated. Above 10x → dedicated.
- **Tier assignment rules**: Based on monthly active users, storage used, API requests per day, or subscription plan.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Dynamic connection resolution**: `config(['database.connections.tenant.database' => tenant()->tier === 'enterprise' ? 'tenant_'.$tenant->id : 'shared'])` — connection config depends on tier.
- **Tier upgrade pipeline**: When tenant crosses tier threshold, queue provisioning for upgraded isolation. Downtime-free migration via replication.


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
| 1 | One-size-fits-all isolation**: All tenants on DB-per-tenant is expensive. All on shared-table is risky. Graduated isolation aligns cost with value. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

