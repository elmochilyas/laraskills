# 5-11 Cross Tenant Data Leak Prevention

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-11 |
| Knowledge Unit Title | Cross Tenant Data Leak Prevention |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.5 Global scopes | 5.12 withoutGlobalScope guardrails |
| Last Updated | 2026-06-02 |

## Overview

Cross-tenant data leaks are the most serious security vulnerability in multi-tenant systems. Prevention requires multiple layers: automated tests that verify tenant isolation, code review checklists for any scope bypass, and access control gating for `withoutGlobalScope`. Every new feature and every query must be assumed to leak until proven isolated.

---

## Core Concepts

- **Isolation tests**: Create two tenants with overlapping data. Assert Tenant A can never access Tenant B's data through any endpoint or command.
- **Scope bypass audit**: Every `withoutGlobalScope()` call must be reviewed and justified. Tag with a reason comment.
- **Penetration testing**: Automated cross-tenant access attempts. Try tenant_id manipulation in requests, headers, parameters.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **TenantPair test helper**: Creates two tenants with deliberately similar data (same names, dates, statuses). Tests that all endpoints return only current tenant's data.
- **withoutGlobalScope gate**: Custom macro that logs the caller and reason. CI enforces that every bypass has an associated issue number.


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
| 1 | Assuming global scope covers all queries**: Raw queries, query builder without model, and relationship queries may bypass scopes. Test every data access path. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
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

