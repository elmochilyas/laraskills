# 5-7 Tenant Aware Queue Jobs

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-7 |
| Knowledge Unit Title | Tenant Aware Queue Jobs |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.8 Tenant-aware commands | 5.11 Cross-tenant leak prevention |
| Last Updated | 2026-06-02 |

## Overview

Queue jobs must know which tenant they belong to. Tenant ID is serialized into the job payload. On `handle()`, the tenant context is re-bound before business logic runs. Without this, queued tasks run in the wrong tenant context or no context at all.

---

## Core Concepts

- **Serialized tenant ID**: `public $tenantId` on the job class. Serialized when pushed to queue, deserialized when handled.
- **Context rebind**: `handle()` reads `$this->tenantId`, sets `app(CurrentTenant::class)`, reconfigures connection. Business logic then runs in correct context.
- **Horizon tags**: Tag jobs with tenant ID for per-tenant monitoring. `$this->tags = ['tenant:'.$this->tenantId]`.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **TenantAware job base class**: Abstract job with `$tenantId` property and `rebindTenantContext()` method. All tenant-aware jobs extend it.
- **queue:work per tenant (high isolation)**: Separate `horizon` instances per tenant queue. Each worker configured for one tenant.


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
| 1 | Forgetting to rebind context**: Job runs but queries are unscoped or in wrong database. Hardest-to-detect cross-tenant leak. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

