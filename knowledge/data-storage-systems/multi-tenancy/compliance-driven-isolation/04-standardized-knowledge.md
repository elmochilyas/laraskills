# 5-22 Compliance Driven Isolation

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-22 |
| Knowledge Unit Title | Compliance Driven Isolation |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.17 Tenant segmentation | 5.23 Multi-region placement |
| Last Updated | 2026-06-02 |

## Overview

Regulatory compliance (GDPR, HIPAA, SOC 2, PCI-DSS) may mandate specific tenant isolation levels. GDPR requires data separation and the right to deletion. HIPAA requires strict access controls and audit trails. SOC 2 requires logical access controls. The isolation model must satisfy the strictest regulation among tenants.

---

## Core Concepts

- **GDPR**: Right to deletion requires the ability to delete all data for a specific user/tenant. DB-per-tenant: drop the database. Shared-table: delete rows across all tables (harder).
- **HIPAA**: Requires audit of all PHI access. Per-tenant audit logs. BAA required with infrastructure providers.
- **SOC 2**: Logical access controls — tenant isolation via application and database. RBAC scoped to tenant. Regular penetration testing for cross-tenant access.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Isolation by regulation tier**: Shared-table for non-sensitive tenants. Schema-per-tenant for GDPR-only tenants. DB-per-tenant for HIPAA/PCI tenants. Compliance tier maps to isolation tier.
- **Audit trail per tenant**: Log every data access with tenant_id. Central audit log with tenant filter. Required for HIPAA and SOC 2.
- **Data residency**: For GDPR, EU tenant data must stay in EU region. DB-per-tenant enables region-specific placement.


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
| 1 | Single isolation for all tenants**: If 95% of tenants don't need HIPAA compliance, don't force them into DB-per-tenant. Map isolation to compliance requirement. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

