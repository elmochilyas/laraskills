# 5-23 Multi Region Tenant Placement

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-23 |
| Knowledge Unit Title | Multi Region Tenant Placement |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.10 Tenant provisioning | 5.22 Compliance-driven isolation |
| Last Updated | 2026-06-02 |

## Overview

Multi-region tenant placement ensures tenant data resides in a specific geographic region to satisfy data residency laws (GDPR, LGPD, CCPA, PIPL). Each region has independent infrastructure (database, storage, cache). Tenant provisioning creates resources in the required region. Cross-region data transfer is restricted or prohibited.

---

## Core Concepts

- **Region assignment**: Tenant signup captures region requirement (based on IP, billing address, or tenant selection). Provisioning pipeline creates resources in that region's infrastructure.
- **Regional infrastructure**: Per-region database cluster, S3 bucket, cache, queue. Independent failure domains.
- **Cross-region restrictions**: Block cross-region queries. Use CDC (Kafka MirrorMaker) for global analytics if needed.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Region-aware connection resolution**: `config(['database.connections.tenant.database' => $tenant->region.'_'.$tenant->id])` — region prefix in database name. Route to correct cluster.
- **Latency-optimized routing**: Route users to nearest region for read. Writes always go to home region. Replicate reads cross-region.


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
| 1 | Single-region deployment for global SaaS**: GDPR fine of 4% of global revenue for storing EU data outside EU. Multi-region is not optional for EU customers. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

