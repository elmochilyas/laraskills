# 5-28 Deployment Stamp Pattern

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-28 |
| Knowledge Unit Title | Deployment Stamp Pattern |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.3 DB-per-tenant | 5.23 Multi-region placement | 5.16 Per-tenant scaling |
| Last Updated | 2026-06-02 |

## Overview

The deployment stamp pattern provisions a complete, independent copy of the infrastructure stack per tenant group (or enterprise tenant). Each stamp includes database, cache, queue, application servers, and load balancer. Used for maximum isolation, data residency compliance, and dedicated SLAs.

---

## Core Concepts

- **Full stack per stamp**: One stamp = 1+ app servers + 1 database + 1 cache + 1 queue + 1 load balancer. Completely independent of other stamps.
- **Tenant group assignment**: Enterprise tenants get a dedicated stamp. Groups of smaller tenants share a stamp (e.g., 50 tenants per stamp for medium tier).
- **Stamp deployment via IaC**: Terraform/Pulumi/Bicep modules define a stamp. Deploy new stamp = run IaC with new configuration.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Stamp sizing**: Determine max tenants per stamp based on expected load. Reserve 20% headroom for traffic spikes. When a stamp approaches capacity, split tenant group across two stamps.
- **Stamp distribution across regions**: Enterprise stamps can be deployed in the tenant's preferred region. Regional stamps for data residency.


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
| 1 | Under-provisioned stamp resources**: Each stamp needs enough headroom for traffic spikes. Under-provisioning causes noisy neighbor within the stamp. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

