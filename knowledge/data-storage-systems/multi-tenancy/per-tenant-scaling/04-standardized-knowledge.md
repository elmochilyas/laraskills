# 5-16 Per Tenant Scaling

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-16 |
| Knowledge Unit Title | Per Tenant Scaling |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.15 Noisy neighbor | 5.17 Tenant segmentation |
| Last Updated | 2026-06-02 |

## Overview

Whale tenants (high-usage tenants) outgrow shared infrastructure and require dedicated resources. Scaling strategies: move tenant to a dedicated database server, dedicated schema with higher IOPS, dedicated queue worker, dedicated cache instance. Automated detection + migration pipeline prevents manual intervention for each whale tenant.

---

## Core Concepts

- **Whale detection**: Monitor per-tenant storage, query volume, IOPS, connection count. Flag tenants exceeding 2-3x platform median.
- **Isolation escalation path**: Shared-table → dedicated schema → dedicated DB server → dedicated server cluster.
- **Migration impact**: Moving a tenant to dedicated resources requires downtime or replication setup. Schedule during low-usage windows.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Multi-tier isolation model**: Tier 1 (free/startup) — shared table. Tier 2 (growth) — schema-per-tenant or dedicated DB. Tier 3 (enterprise) — dedicated server with SLA.
- **Automated whale promotion**: When tenant exceeds thresholds for 7 days, queue provisioning of dedicated resources. Notify tenant admin of upgrade.
- **Gradual resource increase**: Before full DB-per-tenant, first increase: dedicated connection pool, higher rate limits, priority queue.


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
| 1 | Treating all tenants equally**: One tenant at 10x the average consumption degrades experience for everyone. Whale tenants must pay more or move to dedicated resources. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

