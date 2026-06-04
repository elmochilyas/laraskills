# 5-29 Tenant Migration Canary

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-29 |
| Knowledge Unit Title | Tenant Migration Canary |
| Difficulty Level | Expert |
| Classification | E |
| Dependencies | 5.9 Migration orchestration | 5.19 Schema version ledger |
| Last Updated | 2026-06-02 |

## Overview

Canary rollout for tenant migrations: apply schema changes to a small subset of tenants first, monitor for errors, verify performance, then roll to remaining tenants. Priority ordering: internal/test tenants → low-usage tenants → medium tenants → enterprise (high-value) tenants last. Enables early detection of migration issues without impacting all tenants.

---

## Core Concepts

- **Canary group**: 5-10 test/internal tenants. Apply migration, run automated tests, monitor error rates.
- **Phased rollout**: Canary (5%) → Ring 1 (20%, low-usage) → Ring 2 (30%, medium) → Ring 3 (45%, enterprise). 15-minute cooldown between rings.
- **Rollback trigger**: Automated: if error rate increases by 2% after migration, halt rollout and roll back the last ring.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Tenant ring assignment**: Each tenant assigned to a deployment ring in the central database. Migrations are per-ring. Rings defined by tenant tier, usage, risk profile.
- **Migration window per ring**: Canary: any time. Ring 1-2: off-peak hours. Ring 3: scheduled maintenance window (enterprise SLA).


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
| 1 | Rolling migrations to all tenants simultaneously**: A bad migration corrupts all tenants' data. Canary rollout limits blast radius to a small subset. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

