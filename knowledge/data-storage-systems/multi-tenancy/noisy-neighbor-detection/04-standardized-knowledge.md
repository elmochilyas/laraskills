# 5-15 Noisy Neighbor Detection

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-15 |
| Knowledge Unit Title | Noisy Neighbor Detection |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.1 Shared-table | 5.16 Per-tenant scaling |
| Last Updated | 2026-06-02 |

## Overview

Noisy neighbors are tenants consuming disproportionate resources (CPU, IOPS, memory, connections), degrading performance for other tenants on shared infrastructure. Detection requires per-tenant resource monitoring. Mitigation: tenant-level rate limiting, query timeout enforcement, resource quotas, and ultimately isolation escalation (dedicated resources).

---

## Core Concepts

- **Detection signals**: Per-tenant CPU, IOPS, connection count, query count per second, slow query count, response time deviation from platform average.
- **Mitigation tiers**: Rate limiting → query timeout → resource quota → dedicated instance → schema/DB-per-tenant.
- **Resource quota**: Max connections per tenant, max concurrent queries, max storage, max API requests per minute.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tenant-level rate limiter**: Laravel `RateLimiter::for('tenant', fn() => Limit::perMinute(1000)->by(tenant()->id))`. Per-tenant rate limit independent of per-user limits.
- **Slow query kill**: Kill queries running longer than N seconds per tenant. Prevents one tenant's bad query from blocking shared resources.
- **Automatic isolation escalation**: Monitor per-tenant resource usage. If a tenant exceeds thresholds for N consecutive minutes, flag for escalation to dedicated resources.


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
| 1 | Global rate limiting**: Rate limit applies to all tenants equally — a small tenant gets blocked because a large tenant consumed the global budget. Per-tenant limits are essential. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

