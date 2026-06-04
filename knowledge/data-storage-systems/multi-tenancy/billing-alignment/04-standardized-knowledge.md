# 5-21 Billing Alignment

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-21 |
| Knowledge Unit Title | Billing Alignment |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.3 DB-per-tenant | 5.17 Tenant segmentation |
| Last Updated | 2026-06-02 |

## Overview

Billing alignment means resource costs are attributable to specific tenants. DB-per-tenant provides the clearest correlation: each database's CPU, IOPS, storage, and connection count map directly to a tenant. Shared-table requires estimated cost allocation via usage metrics (row count, query count, storage bytes).

---

## Core Concepts

- **Direct attribution (DB-per-tenant)**: Monitor per-database metrics (RDS CloudWatch DBPerfInsights). Costs map 1:1 to tenants. Precise billing.
- **Estimated attribution (shared-table)**: Proxy by storage (bytes per tenant), query count per tenant, API requests. Less precise but sufficient for tiered pricing.
- **Usage metering**: Track per-tenant API requests, storage used, compute time. Bill above plan limits.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tiered pricing with usage caps**: Tenant pays for tier (e.g., $99/month for 10GB, 100K requests). Overages billed by metered usage. DB cost is below tier price; margin covers shared infrastructure.
- **Cloud cost allocation tags**: Tag RDS instances, S3 buckets, cache clusters with `tenant_id`. AWS Cost Explorer attributes spend per tenant.


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
| 1 | Flat pricing regardless of usage**: Power users consume 100x resources of light users at same price. Margin erodes. Usage-based pricing aligns cost with revenue. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

